import test from 'node:test';
import assert from 'node:assert/strict';
import { ChatGPTError } from '@siwc/local';
import { chatgptProvider, responseRequest, safeChatGPTError } from '../lib/chatgpt.js';
import { providerFor } from '../lib/ollama.js';
import { credentialEncryption } from '../lib/chatgpt-credentials.js';

const request = {
  model: 'chatgpt:account-model', format: 'json',
  messages: [{ role: 'system', content: 'Character: Ada. Bible: the key is blue.' },
    { role: 'user', content: 'Story so far: the door opened.' },
    { role: 'assistant', content: 'Who is there?' }, { role: 'user', content: 'Continue in past tense.' }],
  options: { temperature: 0.7, top_p: 0.9, num_predict: 4000, num_ctx: 32000 },
};

test('subscription routing is separate from both API keys and Ollama', () => {
  assert.equal(providerFor(request.model, { cloud: { apiKey: 'never-use' } }).id, 'chatgpt');
  assert.equal(providerFor('local-model', {}).id, 'ollama');
});

test('Responses preserves system guidance and ordered story history; omits unsupported knobs', () => {
  const body = responseRequest(request);
  assert.equal(body.model, 'account-model');
  assert.match(body.instructions, /Character: Ada/);
  assert.match(body.instructions, /Return only valid JSON/);
  assert.deepEqual(body.input, request.messages.slice(1));
  assert.deepEqual(Object.keys(body).sort(), ['input', 'instructions', 'model']);
  assert.equal(request.options.num_predict, 4000);
});

test('model discovery uses subscription namespace and account display names', async () => {
  const provider = chatgptProvider({ listModels: async () => [{ slug: 'account-model', displayName: 'Available model' }] });
  assert.deepEqual(await provider.listModels(), [{ name: 'chatgpt:account-model', displayName: 'Available model',
    where: 'subscription', providerLabel: 'ChatGPT (Subscription)' }]);
});

test('planning buffers completed Responses; writing converts deltas and completion to NDJSON', async () => {
  const provider = chatgptProvider({ streamResponse: async (body) => {
    assert.deepEqual(body.input, request.messages.slice(1));
    body.onDelta?.('Once '); body.onDelta?.('upon a time.');
    return { text: '{"summary":"A story"}' };
  } });
  assert.equal(await provider.chatOnce(request), '{"summary":"A story"}');
  const events = (await new Response(await provider.chatStream(request)).text()).trim().split('\n').map(JSON.parse);
  assert.deepEqual(events.map((e) => e.message?.content || ''), ['Once ', 'upon a time.', '']);
  assert.equal(events.at(-1).done, true);
});

for (const code of ['subscription_sharing_usage_limit_exceeded', 'refresh_token_expired', 'response_incomplete', 'stream_interrupted']) {
  test(`${code}: partial output never receives success; safe diagnostics and usage action survive`, async () => {
    const failure = new ChatGPTError(code, 'Reconnect or manage usage.', false, 429, { requestId: 'req-test' });
    const provider = chatgptProvider({ streamResponse: async (body) => { body.onDelta?.('Partial'); throw failure; } });
    await assert.rejects(provider.chatOnce(request), (e) => e === failure);
    const events = (await new Response(await provider.chatStream(request)).text()).trim().split('\n').map(JSON.parse);
    assert.equal(events.some((e) => e.done === true), false);
    assert.equal(events.at(-1).chatgpt.code, code);
    assert.equal(events.at(-1).chatgpt.requestId, 'req-test');
    assert.match(events.at(-1).error, /https:\/\/chatgpt.com\/settings\/usage/);
  });
}

test('cancelling the consumer aborts its subscription request', async () => {
  let aborted;
  const finished = new Promise((resolve) => { aborted = resolve; });
  const provider = chatgptProvider({ streamResponse: ({ signal }) => new Promise((resolve) => {
    signal.addEventListener('abort', () => { aborted(); resolve({ text: '' }); });
  }) });
  const stream = await provider.chatStream(request);
  await stream.cancel(); await finished;
});

test('unknown errors cannot leak tokens or request contents', () => {
  assert.equal(JSON.stringify(safeChatGPTError(new Error('private-token manuscript'))).includes('private-token'), false);
});

test('Windows DPAPI round trip encrypts credentials without an application key', { skip: process.platform !== 'win32' }, async () => {
  assert.equal(await credentialEncryption.isAvailable(), true);
  const plaintext = 'synthetic-access-token and synthetic-refresh-token';
  const ciphertext = await credentialEncryption.encrypt(plaintext);
  assert.equal(ciphertext.includes(Buffer.from('synthetic-access-token')), false);
  assert.equal(await credentialEncryption.decrypt(ciphertext), plaintext);
  await assert.rejects(credentialEncryption.decrypt(Buffer.from('invalid ciphertext')));
});
