import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const appRoot = fileURLToPath(new URL('..', import.meta.url));
async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function stop(child) {
  if (child.exitCode !== null) return;
  const exited = new Promise(resolve => child.once('exit', resolve));
  child.kill();
  await exited;
}
function launch(root, port, host) {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: appRoot, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: String(port), INKWELL_HOST: host, INKWELL_BOOKS: path.join(root, 'books') },
  });
  let output = '';
  child.stdout.on('data', value => { output += value; });
  child.stderr.on('data', value => { output += value; });
  return { child, output: () => output };
}

test('HTTP boundary, path validation, asset isolation and local persistence', { timeout: 25000 }, async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'inkwell-http-security-'));
  const port = await freePort();
  const run = launch(root, port, '127.0.0.1');
  t.after(async () => {
    await stop(run.child);
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.match(path.basename(root), /^inkwell-http-security-/);
    await fs.rm(root, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let n = 0; n < 100; n++) {
    if (run.child.exitCode !== null) throw new Error(run.output());
    try { if ((await fetch(base + '/api/settings')).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.equal(ready, true, 'Isolated server did not start: ' + run.output());
  const json = (method, body, extra = {}) => ({ method, headers: { 'Content-Type': 'application/json', Origin: base, ...extra }, body: JSON.stringify(body) });
  const rebound = await new Promise((resolve, reject) => {
    const req = http.get(base + '/api/books', { headers: { Host: `attacker.invalid:${port}` } }, res => { res.resume(); resolve(res.statusCode); });
    req.on('error', reject);
  });
  assert.equal(rebound, 403);
  assert.equal((await fetch(base + '/api/books', json('POST', {}, { Origin: 'https://attacker.invalid' }))).status, 403);
  assert.equal((await fetch(base + '/api/settings/reset', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' })).status, 403);
  assert.equal((await fetch(base + '/api/books', { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
  const created = await fetch(base + '/api/books', json('POST', { title: 'Synthetic HTTP fixture' }));
  assert.equal(created.status, 200);
  const book = await created.json();
  assert.equal((await fetch(base + '/api/books/' + book.id + '/notes', json('PUT', { notes: 'Synthetic persistent note' }))).status, 200);
  assert.equal((await (await fetch(base + '/api/books/' + book.id)).json()).notes, 'Synthetic persistent note');
  assert.equal(await fs.readFile(path.join(root, 'books', book.id, 'notes.md'), 'utf8'), 'Synthetic persistent note');
  await fs.mkdir(path.join(root, 'sentinel'));
  await fs.writeFile(path.join(root, 'sentinel', 'marker'), 'Synthetic marker');
  for (const id of ['..%5csentinel', '..%2fsentinel', 'C%3asentinel']) {
    const response = await fetch(base + '/api/books/' + id, { method: 'DELETE' });
    assert.equal(response.status, 400);
  }
  assert.equal(await fs.readFile(path.join(root, 'sentinel', 'marker'), 'utf8'), 'Synthetic marker');
  assert.equal((await fetch(base + '/api/books/' + book.id + '/outline', json('PUT', { chapters: [{ id: '../../../sentinel' }] }))).status, 400);
  const upload = (mime, bytes) => fetch(base + '/api/books/' + book.id + '/assets?name=synthetic.png', { method: 'POST', headers: { Origin: base, 'Content-Type': mime }, body: bytes });
  assert.equal((await upload('image/svg+xml', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')).status, 415);
  assert.equal((await upload('image/png', '<html><script>alert(1)</script></html>')).status, 415);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6M3sAAAAASUVORK5CYII=', 'base64');
  const uploaded = await upload('image/png', png);
  assert.equal(uploaded.status, 200);
  const asset = await uploaded.json();
  const raw = await fetch(base + '/api/books/' + book.id + '/assets/' + asset.id + '/raw');
  assert.equal(raw.status, 200);
  assert.equal(raw.headers.get('x-content-type-options'), 'nosniff');
  assert.match(raw.headers.get('content-security-policy') || '', /sandbox/);
  assert.deepEqual(Buffer.from(await raw.arrayBuffer()), png);
});

test('unsupported LAN binding is rejected before listening', { timeout: 10000 }, async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'inkwell-http-security-'));
  const run = launch(root, await freePort(), '0.0.0.0');
  t.after(async () => { await stop(run.child); assert.match(path.basename(root), /^inkwell-http-security-/); await fs.rm(root, { recursive: true, force: true }); });
  const exit = await new Promise(resolve => { run.child.once('exit', resolve); });
  assert.notEqual(exit, 0);
  assert.match(run.output(), /loopback|LAN hosting requires authentication/i);
});
