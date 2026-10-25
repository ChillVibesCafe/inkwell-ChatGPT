import path from 'node:path';
import { createChatGPT, ChatGPTError, CHATGPT_USAGE_URL } from '@siwc/local';
import { credentialEncryption } from './chatgpt-credentials.js';
import { BOOKS_DIR } from './store.js';

export { CHATGPT_USAGE_URL };
export const CHATGPT_PREFIX = 'chatgpt:';
export const isChatGPTModel = (model) => typeof model === 'string' && model.startsWith(CHATGPT_PREFIX);
let runtime;
export function chatgptClient() {
  return runtime ??= createChatGPT({
    appName: 'Inkwell', appId: 'inkwell', sendHostId: true, redirectPort: 0,
    storageDir: path.resolve(path.dirname(BOOKS_DIR), '.chatgpt'), credentialEncryption,
  });
}

export function safeChatGPTError(error) {
  const detail = error instanceof ChatGPTError ? error.toJSON()
    : { code: 'connection_error', message: 'ChatGPT could not complete the request. Check the connection and try again.', retryable: true };
  return { ...detail, message: `${detail.message} Manage usage: ${CHATGPT_USAGE_URL}` };
}

// Keep the complete existing context: system prompts become Responses instructions;
// user/assistant history remains ordered input. No stored server-side conversation.
export function responseRequest({ model, messages, format }) {
  const instructions = messages.filter((m) => m.role === 'system').map((m) => m.content);
  if (format === 'json') instructions.push('Return only valid JSON, without Markdown fences or surrounding prose.');
  return {
    model: model.slice(CHATGPT_PREFIX.length),
    instructions: instructions.join('\n\n'),
    input: messages.filter((m) => m.role !== 'system').map(({ role, content }) => ({ role, content })),
  };
}

export function chatgptProvider(client = chatgptClient()) {
  return {
    id: 'chatgpt',
    async health() { try { return (await client.getSession()).sharing; } catch { return false; } },
    async listModels() {
      return (await client.listModels()).map((m) => ({ name: CHATGPT_PREFIX + m.slug,
        displayName: m.displayName, where: 'subscription', providerLabel: 'ChatGPT (Subscription)' }));
    },
    async chatOnce(request) {
      return (await client.streamResponse(responseRequest(request))).text;
    },
    async chatStream(request) {
      const controller = new AbortController();
      const encoder = new TextEncoder();
      let cancelled = false;
      return new ReadableStream({
        start(stream) {
          const send = (value) => { if (!cancelled) stream.enqueue(encoder.encode(JSON.stringify(value) + '\n')); };
          client.streamResponse({ ...responseRequest(request), signal: controller.signal,
            onDelta: (content) => send({ message: { role: 'assistant', content }, done: false }),
          }).then(() => { send({ done: true }); }).catch((e) => {
            send({ error: safeChatGPTError(e).message, chatgpt: safeChatGPTError(e) });
          }).finally(() => { if (!cancelled) stream.close(); });
        },
        cancel() { cancelled = true; controller.abort(); },
      });
    },
  };
}
