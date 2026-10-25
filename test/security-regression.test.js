import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { localListenHost, localApiRequest } from '../lib/http-security.js';

test('loopback boundary rejects LAN, rebound hosts, cross-site forms and origins', () => {
  assert.equal(localListenHost(''), '127.0.0.1');
  assert.throws(() => localListenHost('0.0.0.0'));
  function request(overrides = {}) {
    let status = 200, passed = false;
    const req = { socket: { remoteAddress: '127.0.0.1', localPort: 4321 }, headers: { host: '127.0.0.1:4321' }, method: 'GET', ...overrides };
    const res = { status(value) { status = value; return this; }, json() {}, setHeader() {} };
    localApiRequest(req, res, () => { passed = true; });
    return { status, passed };
  }
  assert.equal(request().passed, true);
  for (const headers of [{ host: 'evil.invalid:4321' }, { host: 'localhost:9999' }, { host: 'localhost:4321', origin: 'https://evil.invalid' }, { host: 'localhost:4321', 'sec-fetch-site': 'cross-site' }, { host: 'localhost:4321', 'content-type': 'text/plain' }]) {
    assert.equal(request({ method: 'POST', headers }).status, 403);
  }
  assert.equal(request({ socket: { remoteAddress: '192.0.2.1', localPort: 4321 } }).status, 403);
});

test('storage blocks traversal and descendant junctions, permits configured root junction', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'inkwell-storage-security-'));
  const books = path.join(root, 'books');
  process.env.INKWELL_BOOKS = books;
  const store = await import('../lib/store.js?storage-security');
  try {
    const book = await store.createBook({ title: 'Synthetic fixture' });
    await store.saveOutline(book.id, { chapters: [{ id: 'ch-1' }] });
    await store.saveChapter(book.id, 'ch-1', 'Synthetic text');
    assert.equal((await store.getBook(book.id)).outline.chapters[0].content, 'Synthetic text');
    for (const invalid of ['..', '../outside', '..\\outside', 'C:outside', 'CON', '', 'trailing.']) {
      await assert.rejects(store.deleteBook(invalid));
      await assert.rejects(store.saveChapter(book.id, invalid, 'blocked'));
      await assert.rejects(store.saveOutline(book.id, { chapters: [{ id: invalid || '../escape' }] }));
    }
    await t.test('junction boundaries and configured root junction', async (t) => {
    const manifestDir = path.join(books, book.id, 'assets');
    await fs.mkdir(manifestDir);
    await fs.writeFile(path.join(manifestDir, 'index.json'), JSON.stringify([{ id: 'img-unsafe', file: '../../../escape.md' }]));
    await assert.rejects(store.getAsset(book.id, 'img-unsafe'));
    await assert.rejects(store.deleteAsset(book.id, 'img-unsafe'));
    await fs.rm(manifestDir, { recursive: true });
    const outside = path.join(root, 'outside');
    await fs.mkdir(outside);
    await fs.writeFile(path.join(outside, 'sentinel.md'), 'Synthetic sentinel');
    try { await fs.symlink(outside, path.join(books, 'linked'), process.platform === 'win32' ? 'junction' : 'dir'); }
    catch (error) { if (!['EPERM', 'EACCES'].includes(error.code)) throw error; t.skip('OS denied junction creation; requires a host with link permissions.'); return; }
    await assert.rejects(store.saveNotes('linked', 'blocked'));
    await assert.rejects(store.deleteBook('linked'));
    const chapters = path.join(books, book.id, 'chapters');
    await fs.rename(chapters, chapters + '-saved');
    await fs.symlink(outside, chapters, process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(store.readChapter(book.id, 'sentinel'));
    await assert.rejects(store.saveChapter(book.id, 'sentinel', 'blocked'));
    await fs.unlink(chapters);
    await fs.rename(chapters + '-saved', chapters);

    await fs.symlink(outside, path.join(books, book.id, 'assets'), process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(store.addAsset(book.id, { mime: 'image/png', buffer: Buffer.from('test') }));
    assert.equal(await fs.readFile(path.join(outside, 'sentinel.md'), 'utf8'), 'Synthetic sentinel');
    const real = path.join(root, 'real-books');
    await fs.rename(books, real);
    await fs.symlink(real, books, process.platform === 'win32' ? 'junction' : 'dir');
    await store.saveChapter(book.id, 'ch-2', 'Through configured root junction');
    assert.equal(await store.readChapter(book.id, 'ch-2'), 'Through configured root junction');
    });
  } finally {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.match(path.basename(root), /^inkwell-storage-security-/);
    await fs.rm(root, { recursive: true, force: true });
  }
});
