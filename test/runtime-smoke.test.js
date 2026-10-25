import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import { spawn } from 'node:child_process';
import JSZip from 'jszip';

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function fixture(t, prelude = '') {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'inkwell-runtime-smoke-'));
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  let child;
  const stop = async () => {
    if (!child) return;
    const current = child; child = null;
    if (current.exitCode !== null) return;
    const exited = new Promise((resolve) => current.once('exit', resolve));
    current.kill();
    let timer;
    try { await Promise.race([exited, new Promise((_, reject) => { timer = setTimeout(() => { current.kill('SIGKILL'); reject(new Error('Server did not stop')); }, 5000); })]); }
    finally { clearTimeout(timer); }
  };
  t.after(async () => {
    await stop();
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.match(path.basename(root), /^inkwell-runtime-smoke-/);
    await fs.rm(root, { recursive: true, force: true });
  });
  const start = async () => {
    const args = prelude ? ['--import', 'data:text/javascript;base64,' + Buffer.from(prelude).toString('base64'), 'server.js'] : ['server.js'];
    child = spawn(process.execPath, args, { cwd: process.cwd(),
      env: { ...process.env, PORT: String(port), INKWELL_HOST: '127.0.0.1', INKWELL_BOOKS: path.join(root, 'books') },
      windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (data) => { output += data; });
    child.stderr.on('data', (data) => { output += data; });
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw new Error(`Server exited: ${output}`);
      try { if ((await fetch(base + '/api/settings', { signal: AbortSignal.timeout(1000) })).ok) return; } catch {}
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error(`Server startup timed out: ${output}`);
  };
  const json = async (route, method = 'GET', body) => {
    const response = await fetch(base + '/api' + route, { method, headers: { 'Content-Type': 'application/json', Origin: base },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(12000) });
    assert.equal(response.ok, true, `${route}: HTTP ${response.status}`);
    return response.json();
  };
  return { base, port, start, stop, json };
}

test('isolated manuscript, settings, image and font storage survive EPUB export and restart', async (t) => {
  const app = await fixture(t);
  await app.start();
  const meta = await app.json('/books', 'POST', { title: 'Synthetic Runtime Book', author: 'Fixture Author' });
  const book = `/books/${meta.id}`;
  await app.json(book + '/bible', 'PUT', { characters: [{ name: 'Synthetic Ada' }], runningSummary: 'Synthetic memory.' });
  await app.json(book + '/outline', 'PUT', { chapters: [{ id: 'chapter-fixture', title: 'Synthetic Chapter', beats: ['Find the key'] }] });
  await app.json(book + '/chapters/chapter-fixture', 'PUT', { content: 'Synthetic prose: Ada opened the blue door.' });
  await app.json(book + '/notes', 'PUT', { notes: 'Synthetic author notes.' });
  const design = await app.json(book + '/design');
  await app.json(book + '/design', 'PUT', design);
  await app.json('/settings', 'PUT', { generation: { temperature: 0.61, num_ctx: 16384 } });
  const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8ioAAAAASUVORK5CYII=', 'base64');
  // A synthetic signature fixture checks storage, not font rendering/validity.
  const font = Buffer.concat([Buffer.from('wOF2'), Buffer.alloc(44)]);
  const uploaded = [];
  for (const [kind, mime, bytes, name] of [['image', 'image/png', image, 'fixture.png'], ['font', 'font/woff2', font, 'fixture.woff2']]) {
    const response = await fetch(app.base + '/api' + book + `/assets?kind=${kind}&name=${name}`, {
      method: 'POST', headers: { 'Content-Type': mime, Origin: app.base }, body: bytes,
    });
    assert.equal(response.ok, true, `${kind}: HTTP ${response.status}`);
    const asset = await response.json(); uploaded.push({ asset, bytes });
    const raw = await fetch(app.base + '/api' + book + `/assets/${asset.id}/raw`);
    assert.deepEqual(Buffer.from(await raw.arrayBuffer()), bytes);
    assert.equal(raw.headers.get('x-content-type-options'), 'nosniff');
  }
  const before = await app.json(book);
  assert.equal(before.outline.chapters[0].content, 'Synthetic prose: Ada opened the blue door.');
  assert.equal(before.assets.length, 2);
  const response = await fetch(app.base + '/api' + book + '/export.epub');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/epub+zip');
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.subarray(0, 2).toString(), 'PK');
  const zip = await JSZip.loadAsync(bytes);
  assert.equal(await zip.file('mimetype').async('string'), 'application/epub+zip');
  const textFiles = Object.values(zip.files).filter((entry) => /\.(xhtml|opf|xml)$/.test(entry.name));
  const markup = (await Promise.all(textFiles.map((entry) => entry.async('string')))).join('\n');
  assert.match(markup, /Synthetic Runtime Book/);
  assert.match(markup, /Ada opened the blue door/);
  const settings = await app.json('/settings');
  await app.stop();
  const probe = net.createServer();
  await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(app.port, '127.0.0.1', resolve); });
  await new Promise((resolve) => probe.close(resolve));
  await app.start();
  assert.deepEqual(await app.json(book), before);
  assert.deepEqual(await app.json('/settings'), settings);
  for (const { asset, bytes: expected } of uploaded) {
    const raw = await fetch(app.base + '/api' + book + `/assets/${asset.id}/raw`);
    assert.deepEqual(Buffer.from(await raw.arrayBuffer()), expected);
  }
});

test('stalled Ollama discovery returns the available cloud and subscription catalog within a bound', async (t) => {
  const prelude = `
    import { existsSync } from 'node:fs';
    import { pathToFileURL } from 'node:url';
    import path from 'node:path';
    if (existsSync('lib/chatgpt.js')) {
      const { chatgptClient } = await import(pathToFileURL(path.resolve('lib/chatgpt.js')));
      Object.assign(chatgptClient(), { getSession: async () => ({ sharing: true }),
        listModels: async () => [{ slug: 'subscription-fixture', displayName: 'Fixture subscription' }] });
    }
    globalThis.fetch = async (url, options = {}) => {
      if (url.endsWith('/api/tags')) return new Promise((resolve, reject) => {
        options.signal?.addEventListener('abort', () => reject(options.signal.reason), { once: true });
      });
      if (url === 'https://fixture.invalid/v1/models') return Response.json({ data: [{ id: 'cloud-fixture' }] });
      throw new Error('Unexpected fixture transport');
    };
  `;
  const app = await fixture(t, prelude);
  await app.start();
  await app.json('/settings', 'PUT', { cloud: { enabled: true, service: 'openai', apiKey: 'synthetic-key', baseUrl: 'https://fixture.invalid/v1' } });
  const began = Date.now();
  const result = await app.json('/models');
  assert.ok(Date.now() - began < 11000, 'catalog must remain available with a stalled local provider');
  assert.equal(typeof result.errors.local, 'string');
  assert.ok(result.models.some((model) => model.name === 'cloud:cloud-fixture'));
  try { await fs.access('lib/chatgpt.js'); }
  catch { return; }
  assert.ok(result.models.some((model) => model.name === 'chatgpt:subscription-fixture'));
});
