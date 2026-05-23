/**
 * embed.js — runs on the manufacturer's host page.
 * Pasted as: <script async src="https://cdn.forma.studio/embed.js"
 *              data-config="cfg_01HXYZ..." data-host="sunpergola.si"></script>
 */
(function () {
  // Locate the script tag that loaded this file.
  // Works sync AND async because we search all matching scripts.
  const scripts = document.querySelectorAll<HTMLScriptElement>('script[data-config]');
  const scriptEl = scripts[scripts.length - 1];
  if (!scriptEl) return;

  // Derive app origin from where embed.js was served (falls back to same origin).
  const CDN = scriptEl.src ? new URL(scriptEl.src).origin : window.location.origin;

  const configId = scriptEl.dataset.config?.trim() ?? '';
  if (!configId) return;

  const dataHost = scriptEl.dataset.host?.trim() ?? window.location.hostname;
  const minHeight = parseInt(scriptEl.dataset.minHeight ?? '720', 10) || 720;
  const maxHeight = parseInt(scriptEl.dataset.maxHeight ?? '0', 10) || Infinity;
  const enableEvents = scriptEl.dataset.events === 'true';

  const parentOrigin = window.location.origin;
  const iframeSrc =
    `${CDN}/i/${encodeURIComponent(configId)}` +
    `?host=${encodeURIComponent(dataHost)}` +
    `&parentOrigin=${encodeURIComponent(parentOrigin)}`;

  // ── Find or create target container ──────────────────────────────────
  let container: HTMLElement | null = null;
  let el = scriptEl.nextElementSibling;
  while (el) {
    if (el instanceof HTMLElement && /^forma-/i.test(el.id)) {
      container = el;
      break;
    }
    el = el.nextElementSibling;
  }

  // ── Build the iframe ──────────────────────────────────────────────────
  const iframe = document.createElement('iframe');
  iframe.src = iframeSrc;
  iframe.title = 'Product Configurator';
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('allowtransparency', 'true');
  iframe.setAttribute('frameborder', '0');
  iframe.style.cssText =
    `display:block;width:100%;height:${minHeight}px;border:0;` +
    `overflow:hidden;transition:height .2s ease;`;

  if (container) {
    container.appendChild(iframe);
  } else {
    // Fallback: insert right after the script tag
    if (scriptEl.parentNode) {
      scriptEl.parentNode.insertBefore(iframe, scriptEl.nextSibling);
    }
  }

  // ── postMessage bridge (iframe → host) ───────────────────────────────
  window.addEventListener('message', (evt) => {
    if (evt.source !== iframe.contentWindow) return;
    if (!evt.data || typeof evt.data.type !== 'string') return;
    if (!evt.data.type.startsWith('__forma:')) return;

    const { type, payload } = evt.data as { type: string; payload: unknown };

    switch (type) {
      case '__forma:resize': {
        const h = payload && typeof (payload as Record<string, unknown>).height === 'number'
          ? (payload as { height: number }).height
          : minHeight;
        iframe.style.height = Math.min(h, maxHeight === Infinity ? h : maxHeight) + 'px';
        break;
      }
      case '__forma:ready':
        break;

      default: {
        // Forward as CustomEvent on the container (or document)
        const eventName = type.replace('__forma:', 'forma:');
        const target = container ?? document;
        target.dispatchEvent(
          new CustomEvent(eventName, { detail: payload, bubbles: true, composed: true }),
        );
        break;
      }
    }
  });

  // ── Host → iframe bridge (only if data-events="true") ─────────────────
  if (enableEvents && container) {
    const relay = (formaType: string) => (evt: Event) => {
      iframe.contentWindow?.postMessage(
        { type: `__forma:${formaType}`, payload: (evt as CustomEvent).detail },
        CDN,
      );
    };
    container.addEventListener('forma:set-prefill', relay('set-prefill'));
    container.addEventListener('forma:set-locale', relay('set-locale'));
    container.addEventListener('forma:reset', relay('reset'));
    container.addEventListener('forma:goto', relay('goto'));
  }
})();
