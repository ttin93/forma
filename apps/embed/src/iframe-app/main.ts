import { evaluate } from '@forma/configurator-engine';
import type { ConfiguratorSchema, Step, EvaluateResult, PricingBreakdownItem } from '@forma/types';
import { fetchConfigurator, submitLead, type ConfiguratorResponse } from './api';
import { initBridge, postToHost, onMessage } from './bridge';
import { saveState, loadState, clearState, getSessionId } from './storage';
import { renderField, formatPrice } from './render';

// ── URL params ────────────────────────────────────────────────
const params = new URLSearchParams(location.search);
const parentOrigin = params.get('parentOrigin') ?? '*';
const host = params.get('host') ?? location.hostname;
const pathParts = location.pathname.replace(/^\/+/, '').split('/');
const configId = pathParts.find(p => p && p !== 'iframe' && p !== 'v') ?? params.get('config') ?? '';

// ── App state ─────────────────────────────────────────────────
let schema: ConfiguratorSchema | null = null;
let configData: ConfiguratorResponse | null = null;
let state: Record<string, unknown> = {};
let currentStepIndex = 0;
let evalResult: EvaluateResult | null = null;
let submitting = false;
let submitError: string | null = null;

// ── DOM refs ──────────────────────────────────────────────────
const app = document.getElementById('app')!;

// ── Helpers ───────────────────────────────────────────────────
function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function svgCheck(): string {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>`;
}

// ── Sizing ────────────────────────────────────────────────────
const ro = new ResizeObserver(() => {
  postToHost('__forma:resize', { height: document.body.scrollHeight });
});
ro.observe(document.body);

// ── Render: loading / error ───────────────────────────────────

function renderLoading(): void {
  app.innerHTML = '';
  const d = el('div', 'loading');
  d.innerHTML = '<div class="spinner"></div><p>Loading…</p>';
  app.appendChild(d);
}

function renderError(message: string): void {
  app.innerHTML = '';
  const d = el('div', 'error-screen');
  d.innerHTML = `<div class="error-icon">!</div><p>${message}</p>`;
  app.appendChild(d);
  postToHost('__forma:error', { code: 'LOAD_ERROR', message });
}

// ── Render: stepper ───────────────────────────────────────────

function renderStepper(steps: Step[]): HTMLElement {
  const stepper = el('div', 'stepper');

  steps.forEach((step, i) => {
    if (i > 0) {
      const conn = el('div', `stepper-connector${i <= currentStepIndex ? ' done' : ''}`);
      stepper.appendChild(conn);
    }
    const s = el('div', `stepper-step${i < currentStepIndex ? ' done' : i === currentStepIndex ? ' active' : ''}`);
    const num = el('div', 'stepper-num');
    num.innerHTML = i < currentStepIndex ? svgCheck() : String(i + 1);
    const label = el('span', 'stepper-label', step.label);
    s.append(num, label);
    stepper.appendChild(s);
  });

  return stepper;
}

// ── Render: pricing sidebar ───────────────────────────────────

function buildPricingSidebar(result: EvaluateResult, schemaCurrency: string): HTMLElement {
  const sidebar = el('div', 'configurator-sidebar');
  const { pricing, score } = result;

  // Total
  const titleEl = el('div', 'sidebar-title', 'Estimated price');
  const total = el('div', 'pricing-total', formatPrice(pricing.total, pricing.currency || schemaCurrency));
  const vat = el('div', 'pricing-vat', pricing.vat > 0 ? `incl. ${formatPrice(pricing.vat, pricing.currency || schemaCurrency)} VAT` : 'excl. VAT');
  sidebar.append(titleEl, total, vat);

  // Breakdown
  if (pricing.breakdown.length > 0) {
    const bd = el('div', 'pricing-breakdown');
    for (const item of pricing.breakdown) {
      const row = el('div', `pricing-row${item.kind === 'discount' ? ' discount' : ''}`);
      const lbl = el('span', 'pricing-row-label', item.label);
      const amt = el('span', 'pricing-row-amount');
      amt.textContent = (item.kind === 'discount' ? '−' : '') + formatPrice(Math.abs(item.amount), pricing.currency || schemaCurrency);
      row.append(lbl, amt);
      bd.appendChild(row);
    }
    // Subtotal row
    const sub = el('div', 'pricing-subtotal');
    sub.innerHTML = `<span>Total</span><span class="pricing-subtotal-amount">${formatPrice(pricing.total, pricing.currency || schemaCurrency)}</span>`;
    bd.appendChild(sub);
    sidebar.appendChild(bd);
  }

  // Score
  if (score.total > 0) {
    const badge = el('div', 'score-badge');
    const lbl = el('span', 'score-label', 'Lead score');
    const val = el('span', 'score-value', String(score.total));
    badge.append(lbl, val);
    if (score.hot) badge.appendChild(el('span', 'hot-badge', 'HOT'));
    sidebar.appendChild(badge);
  }

  return sidebar;
}

// ── Render: step ─────────────────────────────────────────────

function renderStep(): void {
  if (!schema || !evalResult) return;
  submitError = null;

  const steps = evalResult.visibleSteps;
  const step = steps[currentStepIndex];
  if (!step) return;

  const isLast = currentStepIndex === steps.length - 1;
  const fields = evalResult.visibleFields[step.id] ?? [];

  app.innerHTML = '';

  // ── Stepper ───────────────────────────────────────
  app.appendChild(renderStepper(steps));

  // ── Body (main + sidebar) ─────────────────────────
  const body = el('div', 'configurator-body');

  // Main content
  const main = el('div', 'configurator-main');

  // Submit error banner
  if (submitError) {
    const errEl = el('div', 'submit-error', submitError);
    main.appendChild(errEl);
  }

  // Step header
  const header = el('div', 'step-header');
  const title = el('h2', 'step-title', step.label);
  header.appendChild(title);
  if (step.description) header.appendChild(el('p', 'step-desc', step.description));
  main.appendChild(header);

  // Fields
  const fieldsEl = el('div', 'fields');
  for (const field of fields) {
    const fieldEl = renderField(field, state[field.id], (value) => {
      state[field.id] = value;
      saveState(configId, state);
      runEvaluate();
      updatePricingSidebar();
      updatePriceFooter();
      postPriceToHost();
    });

    if (field.required) {
      const req = el('span', 'req', ' *');
      const labelWrap = fieldEl.querySelector('.f-label');
      if (labelWrap) labelWrap.appendChild(req);
    }

    const errMsg = evalResult.errors[field.id];
    if (errMsg && state[field.id] !== undefined) {
      fieldEl.appendChild(el('span', 'field-error', errMsg));
    }

    fieldsEl.appendChild(fieldEl);
  }
  main.appendChild(fieldsEl);

  body.appendChild(main);

  // Pricing sidebar (only show if there's pricing data)
  if (evalResult.pricing.total > 0 || evalResult.pricing.breakdown.length > 0) {
    body.appendChild(buildPricingSidebar(evalResult, schema.currency));
  }

  app.appendChild(body);

  // ── Sticky footer ─────────────────────────────────
  const footer = el('div', 'footer');

  const priceEl = el('div', 'price-display');
  priceEl.id = 'price-display';
  const priceLabel = el('span', 'price-label', 'Estimated price');
  const priceVal = el('span', 'price-val', formatPrice(evalResult.pricing.total, evalResult.pricing.currency || schema.currency));
  const priceVat = el('span', 'price-vat', evalResult.pricing.vat > 0 ? `incl. VAT` : '');
  priceEl.append(priceLabel, priceVal, priceVat);

  const nav = el('div', 'nav');
  if (currentStepIndex > 0) {
    const back = el('button', 'btn btn-ghost', '← Back');
    back.addEventListener('click', () => {
      currentStepIndex--;
      runEvaluate();
      renderStep();
      postToHost('__forma:step-changed', { stepIndex: currentStepIndex, stepId: steps[currentStepIndex]?.id });
    });
    nav.appendChild(back);
  }

  const nextBtn = el('button', 'btn btn-primary', isLast ? 'Get my quote →' : 'Continue →');
  nextBtn.addEventListener('click', () => {
    if (submitting) return;
    if (isLast) {
      handleSubmit();
    } else {
      currentStepIndex++;
      runEvaluate();
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

  requestAnimationFrame(() => {
    postToHost('__forma:resize', { height: document.body.scrollHeight });
  });
}

// ── Render: success ───────────────────────────────────────────

function renderSuccess(leadRef: string): void {
  app.innerHTML = '';

  // Try to find customer name in state
  const customerName = (state['name'] || state['first_name'] || state['full_name'] || state['ime'] || '') as string;
  const greeting = customerName ? `Thanks, ${customerName.split(' ')[0]}.` : 'Thank you!';
  const totalPrice = evalResult ? formatPrice(evalResult.pricing.total, evalResult.pricing.currency || schema!.currency) : '';

  const screen = el('div', 'success-screen');

  const icon = el('div', 'success-icon');
  icon.innerHTML = svgCheck();
  screen.appendChild(icon);

  const titleEl = el('h2', 'success-title', greeting);
  screen.appendChild(titleEl);

  const sub = el('p', 'success-sub', "Your quote request has been received. We'll get back to you with a personalised quote.");
  screen.appendChild(sub);

  const ref = el('div', 'success-ref', `Ref: ${leadRef}`);
  screen.appendChild(ref);

  if (totalPrice) {
    const card = el('div', 'success-card');
    const cardHeader = el('div', 'success-card-header', 'Your estimate');
    const cardBody = el('div', 'success-card-body');
    const totalEl = el('div', 'success-total', totalPrice);
    const totalLabel = el('div', 'success-total-label', 'Estimated price · subject to final survey');
    cardBody.append(totalEl, totalLabel);
    card.append(cardHeader, cardBody);
    screen.appendChild(card);
  }

  const actions = el('div', 'success-actions');
  const shareBtn = el('button', 'btn btn-ghost');
  shareBtn.textContent = 'Share configuration';
  shareBtn.addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({ title: schema?.name ?? 'My configuration', url: location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(location.href).catch(() => {});
      shareBtn.textContent = 'Link copied!';
      setTimeout(() => { shareBtn.textContent = 'Share configuration'; }, 2000);
    }
  });
  actions.appendChild(shareBtn);
  screen.appendChild(actions);

  const stepsGrid = el('div', 'success-steps');
  const nextSteps = [
    { n: '01', title: 'Review your design', desc: 'Our team will review your configuration and prepare a personalised quote.' },
    { n: '02', title: 'Receive your quote', desc: 'You\'ll receive a detailed PDF quote by email within 1 business day.' },
    { n: '03', title: 'Free consultation', desc: 'Book a free 15-minute call to discuss your project and any customisations.' },
  ];
  for (const s of nextSteps) {
    const card = el('div', 'success-step-card');
    card.innerHTML = `<div class="success-step-num">${s.n}</div><div class="success-step-title">${s.title}</div><div class="success-step-desc">${s.desc}</div>`;
    stepsGrid.appendChild(card);
  }
  screen.appendChild(stepsGrid);

  app.appendChild(screen);

  postToHost('__forma:submitted', { leadRef });

  requestAnimationFrame(() => {
    postToHost('__forma:resize', { height: document.body.scrollHeight });
  });
}

// ── Live updates ──────────────────────────────────────────────

function updatePricingSidebar(): void {
  if (!evalResult || !schema) return;
  const sidebar = document.querySelector<HTMLElement>('.configurator-sidebar');
  if (sidebar) {
    const newSidebar = buildPricingSidebar(evalResult, schema.currency);
    sidebar.replaceWith(newSidebar);
  }
}

function updatePriceFooter(): void {
  if (!evalResult || !schema) return;
  const priceVal = document.querySelector('#price-display .price-val');
  const priceVat = document.querySelector('#price-display .price-vat');
  if (priceVal) {
    priceVal.textContent = formatPrice(evalResult.pricing.total, evalResult.pricing.currency || schema.currency);
  }
  if (priceVat) {
    priceVat.textContent = evalResult.pricing.vat > 0 ? 'incl. VAT' : '';
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

  const honeypot = (document.querySelector<HTMLInputElement>('[name="company_address_2"]'))?.value ?? '';
  if (honeypot) return;

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
      setTimeout(() => { location.href = result.redirectUrl!; }, 2500);
    }
  } catch (err) {
    submitting = false;
    submitError = err instanceof Error ? err.message : 'Submission failed. Please try again.';
    renderStep();
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
  const steps = evalResult?.visibleSteps ?? schema?.steps ?? [];
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

  if (configData.branding.primary) {
    document.documentElement.style.setProperty('--c-primary', configData.branding.primary);
  }
  if (configData.branding.font) {
    document.documentElement.style.setProperty('--c-font', `"${configData.branding.font}", sans-serif`);
  }
  document.title = schema.name;

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
