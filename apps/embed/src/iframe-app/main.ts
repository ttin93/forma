import { evaluate } from '@forma/configurator-engine';
import type { ConfiguratorSchema, Step, EvaluateResult } from '@forma/types';
import { fetchConfigurator, submitLead, type ConfiguratorResponse } from './api';
import { initBridge, postToHost, onMessage } from './bridge';
import { saveState, loadState, clearState, getSessionId } from './storage';
import { renderField, formatPrice } from './render';

// ── URL params ────────────────────────────────────────────────
const params = new URLSearchParams(location.search);
const parentOrigin = params.get('parentOrigin') ?? '*';
const host = params.get('host') ?? location.hostname;
// pathname: /iframe/{configId}/v/{versionId} or just /{configId}
const pathParts = location.pathname.replace(/^\/+/, '').split('/');
// Support: /iframe/cfg_xxx or /cfg_xxx
const configId = pathParts.find(p => p && p !== 'iframe' && p !== 'v') ?? params.get('config') ?? '';

// ── App state ─────────────────────────────────────────────────
let schema: ConfiguratorSchema | null = null;
let configData: ConfiguratorResponse | null = null;
let state: Record<string, unknown> = {};
let currentStepIndex = 0;
let evalResult: EvaluateResult | null = null;
let submitting = false;

// ── DOM refs ──────────────────────────────────────────────────
const app = document.getElementById('app')!;

// ── Helpers ───────────────────────────────────────────────────
function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function setRoot(): void {
  app.innerHTML = '';
}

// ── Sizing ────────────────────────────────────────────────────
const ro = new ResizeObserver(() => {
  postToHost('__forma:resize', { height: document.body.scrollHeight });
});
ro.observe(document.body);

// ── Render functions ──────────────────────────────────────────

function renderLoading(): void {
  setRoot();
  const d = el('div', 'loading');
  d.innerHTML = '<div class="spinner"></div><p>Loading…</p>';
  app.appendChild(d);
}

function renderError(message: string): void {
  setRoot();
  const d = el('div', 'error-screen');
  d.innerHTML = `<div class="error-icon">!</div><p>${message}</p>`;
  app.appendChild(d);
  postToHost('__forma:error', { code: 'LOAD_ERROR', message });
}

function renderSuccess(leadRef: string): void {
  setRoot();
  const d = el('div', 'success-screen');
  d.innerHTML = `
    <div class="success-check">✓</div>
    <h2>Enquiry received</h2>
    <p>Your reference: <strong>${leadRef}</strong></p>
    <p class="success-sub">We'll get back to you shortly with a personalised quote.</p>
  `;
  app.appendChild(d);
  postToHost('__forma:submitted', { leadRef });
}

function getCurrentVisibleSteps(): Step[] {
  return evalResult?.visibleSteps ?? schema?.steps ?? [];
}

function renderStep(): void {
  if (!schema || !evalResult) return;

  const steps = getCurrentVisibleSteps();
  const step = steps[currentStepIndex];
  if (!step) return;

  const isLast = currentStepIndex === steps.length - 1;
  const fields = evalResult.visibleFields[step.id] ?? [];

  setRoot();

  // ── Progress ──────────────────────────────────────────
  const progress = el('div', 'progress');
  const pct = steps.length > 1 ? ((currentStepIndex + 1) / steps.length) * 100 : 100;
  const bar = el('div', 'progress-bar');
  const fill = el('div', 'progress-fill');
  fill.style.width = `${pct}%`;
  bar.appendChild(fill);
  const label = el('span', 'progress-label', `Step ${currentStepIndex + 1} of ${steps.length}`);
  progress.append(label, bar);
  app.appendChild(progress);

  // ── Step header ───────────────────────────────────────
  const header = el('div', 'step-header');
  const title = el('h2', 'step-title', step.label);
  header.appendChild(title);
  if (step.description) header.appendChild(el('p', 'step-desc', step.description));
  app.appendChild(header);

  // ── Fields ────────────────────────────────────────────
  const fieldsEl = el('div', 'fields');
  for (const field of fields) {
    const fieldEl = renderField(field, state[field.id], (value) => {
      state[field.id] = value;
      saveState(configId, state);
      runEvaluate();
      updatePriceDisplay();
      postPriceToHost();
    });

    // Mark required
    if (field.required) {
      const req = el('span', 'req', ' *');
      const labelWrap = fieldEl.querySelector('.f-label');
      if (labelWrap) labelWrap.appendChild(req);
    }

    // Validation error
    const errMsg = evalResult.errors[field.id];
    if (errMsg && state[field.id] !== undefined) {
      const errEl = el('span', 'field-error', errMsg);
      fieldEl.appendChild(errEl);
    }

    fieldsEl.appendChild(fieldEl);
  }
  app.appendChild(fieldsEl);

  // ── Price + nav footer ────────────────────────────────
  const footer = el('div', 'footer');

  const priceEl = el('div', 'price-display');
  const priceLabel = el('span', 'price-label', 'Estimated price');
  const priceVal = el('span', 'price-val', formatPrice(evalResult.pricing.total, evalResult.pricing.currency));
  priceEl.id = 'price-display';
  priceEl.append(priceLabel, priceVal);

  const nav = el('div', 'nav');
  if (currentStepIndex > 0) {
    const back = el('button', 'btn btn-ghost', '← Back');
    back.addEventListener('click', () => {
      currentStepIndex--;
      renderStep();
      postToHost('__forma:step-changed', { stepIndex: currentStepIndex, stepId: steps[currentStepIndex]?.id });
    });
    nav.appendChild(back);
  }

  const nextBtn = el('button', 'btn btn-primary', isLast ? 'Get my quote →' : 'Next →');
  nextBtn.addEventListener('click', () => {
    if (isLast) {
      handleSubmit();
    } else {
      currentStepIndex++;
      renderStep();
      postToHost('__forma:step-changed', { stepIndex: currentStepIndex, stepId: steps[currentStepIndex]?.id });
    }
  });
  if (submitting) {
    nextBtn.disabled = true;
    nextBtn.textContent = 'Sending…';
  }
  nav.appendChild(nextBtn);

  footer.append(priceEl, nav);
  app.appendChild(footer);

  // Notify host of height after paint
  requestAnimationFrame(() => {
    postToHost('__forma:resize', { height: document.body.scrollHeight });
  });
}

function updatePriceDisplay(): void {
  if (!evalResult) return;
  const priceVal = document.querySelector('#price-display .price-val');
  if (priceVal) {
    priceVal.textContent = formatPrice(evalResult.pricing.total, evalResult.pricing.currency);
  }
}

function postPriceToHost(): void {
  if (!evalResult) return;
  postToHost('__forma:price', {
    total: evalResult.pricing.total,
    currency: evalResult.pricing.currency,
  });
}

function runEvaluate(): void {
  if (!schema) return;
  evalResult = evaluate(schema, state);
}

// ── Submission ────────────────────────────────────────────────

async function handleSubmit(): Promise<void> {
  if (!schema || !configData || submitting) return;

  // Honeypot check (field rendered in DOM but tabindex=-1, name="company_address_2")
  const honeypot = (document.querySelector<HTMLInputElement>('[name="company_address_2"]'))?.value ?? '';
  if (honeypot) return; // silently drop

  submitting = true;
  renderStep();

  try {
    const result = await submitLead({
      configId,
      version: configData.version,
      state,
      meta: {
        host,
        path: window.location.pathname,
        referrer: document.referrer,
      },
      sessionId: getSessionId(),
      honeypot,
    });

    clearState(configId);
    renderSuccess(result.leadRef);

    if (result.redirectUrl) {
      postToHost('__forma:exit', { savedAt: new Date().toISOString() });
      setTimeout(() => { location.href = result.redirectUrl!; }, 2000);
    }
  } catch (err) {
    submitting = false;
    renderStep();
    const errBanner = el('div', 'submit-error', (err instanceof Error ? err.message : 'Submission failed. Please try again.'));
    app.insertBefore(errBanner, app.firstChild);
  }
}

// ── Host → iframe messages ────────────────────────────────────

onMessage('__forma:set-prefill', (payload) => {
  const vals = (payload as { values: Record<string, unknown> })?.values;
  if (vals) {
    Object.assign(state, vals);
    runEvaluate();
    renderStep();
  }
});

onMessage('__forma:reset', () => {
  state = {};
  currentStepIndex = 0;
  clearState(configId);
  runEvaluate();
  renderStep();
});

onMessage('__forma:goto', (payload) => {
  const stepId = (payload as { stepId: string })?.stepId;
  const steps = getCurrentVisibleSteps();
  const idx = steps.findIndex(s => s.id === stepId);
  if (idx >= 0) {
    currentStepIndex = idx;
    renderStep();
  }
});

// ── Boot ──────────────────────────────────────────────────────

async function boot(): Promise<void> {
  initBridge(parentOrigin);
  renderLoading();

  if (!configId) {
    renderError('Missing configurator ID');
    return;
  }

  try {
    configData = await fetchConfigurator(configId);
  } catch (err) {
    renderError(err instanceof Error ? err.message : 'Failed to load configurator');
    return;
  }

  schema = configData.schema;

  // Apply branding
  if (configData.branding.primary) {
    document.documentElement.style.setProperty('--c-primary', configData.branding.primary);
  }
  if (configData.branding.font) {
    document.documentElement.style.setProperty('--c-font', `"${configData.branding.font}", sans-serif`);
  }
  document.title = schema.name;

  // Restore or initialise state
  state = loadState(configId) ?? {};

  runEvaluate();
  renderStep();

  postToHost('__forma:ready', { height: document.body.scrollHeight });
  postPriceToHost();
}

boot().catch(err => {
  renderError('Unexpected error');
  console.error('[forma]', err);
});
