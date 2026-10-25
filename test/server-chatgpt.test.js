import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('HTTP subscription controls, context, streaming, and local-only access coexist with API providers', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'inkwell-chatgpt-test-'));
  const listener = net.createServer();
  await new Promise((resolve) => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  const callsFile = path.join(root, 'calls.jsonl');
  const prelude = `
    import fs from 'node:fs/promises';
    import { chatgptClient } from ${JSON.stringify(new URL('../lib/chatgpt.js', import.meta.url).href)};
    import { ChatGPTError } from ${JSON.stringify(import.meta.resolve('@siwc/local'))};
    let connected = true;
    Object.assign(chatgptClient(), {
      getSession: async () => ({status:connected?'connected':'disconnected',sharing:connected,profileId:'profile-1',identity:{email:'test@example.invalid'}}),
      listProfiles: async () => [{id:'profile-1',label:'Connection 1'}],
      listModels: async () => [{slug:'account-model',displayName:'Account model'}],
      signIn: async () => { connected = true; return {status:'connected',sharing:true}; },
      selectProfile: async () => ({status:'connected',sharing:true}),
      disconnect: async () => {connected=false;},
      streamResponse: async (body) => {
        if (!connected) throw new ChatGPTError('sign_in_required','Sign in again.');
        await fs.appendFile(${JSON.stringify(callsFile)},JSON.stringify(body)+'\\n');
        if (body.input.some(m=>m.content.includes('FAIL_TEST'))) throw new ChatGPTError('subscription_sharing_usage_limit_exceeded','Usage limit reached.',false,429);
        body.onDelta?.('A blue key.');
        return {text:'{"questions":[]}'};
      }
    });
    globalThis.fetch = async (url) => {
      if(url.endsWith('/api/tags')) return Response.json({models:[{name:'local-model'}]});
      throw new Error('Unexpected API-key inference');
    };
  `;
  const child = spawn(process.execPath, ['--import', 'data:text/javascript;base64,' + Buffer.from(prelude).toString('base64'), 'server.js'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    env: { ...process.env, PORT: String(port), INKWELL_HOST: '127.0.0.1', INKWELL_BOOKS: path.join(root, 'books') },
    windowsHide: true, stdio: 'pipe',
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  t.after(async () => {
    const stopped = child.exitCode !== null ? Promise.resolve() : new Promise((resolve) => child.once('exit', resolve));
    child.kill(); await stopped;
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.match(path.basename(root), /^inkwell-chatgpt-test-/);
    await fs.rm(root, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { ready = (await fetch(base + '/api/settings')).ok; } catch {}
    if (ready || child.exitCode !== null) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.equal(ready, true, output);
  const post = (route, body = {}, headers = {}) => fetch(base + '/api' + route, { method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base, ...headers }, body: JSON.stringify(body) });
  assert.equal((await fetch(base + '/')).ok, true);
  const session = await (await fetch(base + '/api/chatgpt/session')).json();
  assert.equal(session.session.identity.email, 'test@example.invalid');
  assert.equal(JSON.stringify(session).includes('accessToken'), false);
  const models = await (await fetch(base + '/api/models')).json();
  assert.deepEqual(models.models.map((m) => m.name), ['local-model', 'chatgpt:account-model']);
  assert.equal((await post('/chatgpt/sign-in', {}, { Origin: 'https://attacker.invalid' })).status, 403);
  assert.equal((await post('/chatgpt/sign-in')).status, 400);
  assert.equal((await post('/chatgpt/sign-in', { privacyAcknowledged: false })).status, 400);
  const reboundStatus = await new Promise((resolve, reject) => {
    const req = http.request(base + '/api/chatgpt/disconnect', { method: 'POST', headers: { Host: 'attacker.invalid' } },
      (res) => { res.resume(); resolve(res.statusCode); });
    req.on('error', reject); req.end();
  });
  assert.equal(reboundStatus, 403);
  assert.equal((await post('/write', { model: 'chatgpt:account-model' }, { Origin: 'https://attacker.invalid' })).status, 403);
  assert.equal((await post('/plan/interview', { model: 'chatgpt:account-model', premise: 'A mystery in a library.' })).ok, true);
  const generated = await post('/write', {
    model: 'chatgpt:account-model', meta: { title: 'Keys', pov: 'third', tense: 'past' },
    bible: { characters: [{ name: 'Ada', description: 'A librarian' }], runningSummary: 'Ada found a blue key.' },
    chapter: { title: 'The lock', beats: ['Open the door'] }, priorText: 'The key turned.',
    instruction: 'Continue the mystery.', action: 'continue',
  });
  const events = (await generated.text()).trim().split('\n').map(JSON.parse);
  assert.equal(events[0].message.content, 'A blue key.');
  assert.equal(events.at(-1).done, true);
  const calls = (await fs.readFile(callsFile, 'utf8')).trim().split('\n').map(JSON.parse);
  const writing = JSON.stringify(calls[1]);
  for (const content of ['Ada', 'blue key', 'The lock', 'Open the door', 'The key turned.']) assert.ok(writing.includes(content), content);
  assert.equal(calls[1].model, 'account-model');
  assert.equal(calls[1].input.some((m) => m.role === 'system'), false);
  const summaryBody = { model: 'chatgpt:account-model', newChapterText: 'A fictional test chapter.', background: true };
  assert.equal((await post('/summary', summaryBody)).status, 403);
  assert.equal((await fs.readFile(callsFile, 'utf8')).trim().split('\n').length, calls.length);
  assert.equal((await post('/summary', { ...summaryBody, background: false })).ok, true);
  const preferences = await fetch(base + '/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ chatgpt: { allowBackgroundSummaries: true } }) });
  assert.equal(preferences.ok, true);
  assert.equal((await post('/summary', summaryBody)).ok, true);
  const failed = await post('/plan/interview', { model: 'chatgpt:account-model', premise: 'FAIL_TEST' });
  assert.equal(failed.status, 429);
  assert.equal((await failed.json()).chatgpt.code, 'subscription_sharing_usage_limit_exceeded');
  await post('/chatgpt/disconnect');
  const disconnected = await post('/plan/interview', { model: 'chatgpt:account-model', premise: 'A story' });
  assert.equal((await disconnected.json()).chatgpt.code, 'sign_in_required');
  assert.equal((await post('/chatgpt/sign-in', { privacyAcknowledged: true })).ok, true);
});
