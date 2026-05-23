/**
 * postMessage bridge — iframe side.
 * Only posts to parentOrigin, only accepts from parentOrigin.
 */

let _parentOrigin = '*';

export function initBridge(parentOrigin: string): void {
  _parentOrigin = parentOrigin || '*';
}

type MessageHandler = (payload: unknown) => void;
const _handlers = new Map<string, MessageHandler>();

window.addEventListener('message', (evt) => {
  if (_parentOrigin !== '*' && evt.origin !== _parentOrigin) return;
  if (!evt.data || typeof evt.data.type !== 'string') return;
  if (!evt.data.type.startsWith('__forma:')) return;

  const handler = _handlers.get(evt.data.type as string);
  handler?.(evt.data.payload);
});

export function onMessage(type: string, handler: MessageHandler): void {
  _handlers.set(type, handler);
}

export function postToHost(type: string, payload?: unknown): void {
  parent.postMessage({ type, payload }, _parentOrigin);
}
