import test from 'node:test';
import assert from 'node:assert/strict';
import { providerFor } from '../lib/ollama.js';

// Synthetic transport fixtures: no network, account, API key or manuscript access.
for (const service of ['ollama', 'openai', 'anthropic']) {
  test(`${service} preserves routing, story context, sampling and streamed prose`, async (t) => {
    const messages = [{ role: 'system', content: 'Synthetic story bible: Ada keeps the key.' },
      { role: 'user', content: 'Synthetic chapter: open the door.' }];
    const calls = [];
    const originalFetch = globalThis.fetch;
    t.after(() => { globalThis.fetch = originalFetch; });
    globalThis.fetch = async (url, init = {}) => {
      const body = init.body ? JSON.parse(init.body) : {};
      calls.push({ url, body, headers: init.headers });
      if (url.endsWith('/models')) return Response.json({ data: [{ id: 'fixture-model' }] });
      if (url.endsWith('/api/tags')) return Response.json({ models: [{ name: 'fixture-model' }] });
      const local = url.endsWith('/api/chat');
      const anthropic = url.endsWith('/messages');
      if (body.stream) {
        if (local) return new Response('{"message":{"content":"The door opened."},"done":true}\n');
        const event = anthropic
          ? { type: 'content_block_delta', delta: { type: 'text_delta', text: 'The door opened.' } }
          : { choices: [{ delta: { content: 'The door opened.' } }] };
        return new Response(`data: ${JSON.stringify(event)}\n\ndata: [DONE]\n\n`);
      }
      return Response.json(local ? { message: { content: 'The door opened.' } }
        : anthropic ? { content: [{ type: 'text', text: 'The door opened.' }] }
        : { choices: [{ message: { content: 'The door opened.' } }] });
    };
    const settings = { cloud: { enabled: true, service, apiKey: 'synthetic-key', baseUrl: 'https://fixture.invalid/v1' } };
    const model = service === 'ollama' ? 'fixture-model' : 'cloud:fixture-model';
    const provider = providerFor(model, settings);
    assert.equal(provider.id, service);
    const request = { model, messages, format: 'json', options: { temperature: 0.7, top_p: 0.9, num_predict: 99 } };
    assert.equal(await provider.chatOnce(request), 'The door opened.');
    const events = (await new Response(await provider.chatStream(request)).text()).trim().split('\n').map(JSON.parse);
    assert.equal(events.filter((e) => e.message).map((e) => e.message.content).join(''), 'The door opened.');
    assert.equal(events.at(-1).done, true);
    assert.equal((await provider.listModels()).length, 1);
    assert.equal(await provider.health(), true);
    for (const { body } of calls.filter((c) => c.body.model)) {
      assert.equal(body.model, 'fixture-model');
      assert.equal(body.temperature ?? body.options.temperature, 0.7);
      assert.equal(body.top_p ?? body.options.top_p, 0.9);
      if (service === 'anthropic') {
        assert.equal(body.system, messages[0].content);
        assert.deepEqual(body.messages, messages.slice(1));
      } else assert.deepEqual(body.messages, messages);
      if (service !== 'ollama') assert.equal(body.max_tokens, 99);
      else assert.equal(body.options.num_predict, 99);
    }
    if (service !== 'ollama') assert.equal(JSON.stringify(calls).includes('chatgpt:'), false);
  });
}
