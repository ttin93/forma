import type { Field, Option, SwatchOption, ImageOption } from '@forma/types';

type ChangeHandler = (value: unknown) => void;

// ── Helpers ──────────────────────────────────────────────────
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function labelEl(text: string, help?: string): HTMLElement {
  const wrap = el('div', 'f-label-wrap');
  const l = el('span', 'f-label', text);
  wrap.appendChild(l);
  if (help) {
    const h = el('span', 'f-help', help);
    wrap.appendChild(h);
  }
  return wrap;
}

// ── Field renderers ──────────────────────────────────────────

function renderNumberSlider(field: Extract<Field, { type: 'number-slider' }>, value: unknown, onChange: ChangeHandler): HTMLElement {
  const v = typeof value === 'number' ? value : field.default;
  const wrap = el('div', 'f-field');
  wrap.appendChild(labelEl(field.label, field.help));

  const row = el('div', 'f-slider-row');
  const input = el('input');
  input.type = 'range';
  input.min = String(field.min);
  input.max = String(field.max);
  input.step = String(field.step);
  input.value = String(v);
  input.className = 'f-slider';

  const display = el('span', 'f-slider-val', `${v} ${field.unit}`);

  input.addEventListener('input', () => {
    display.textContent = `${input.value} ${field.unit}`;
    onChange(parseFloat(input.value));
  });

  row.append(input, display);
  wrap.appendChild(row);
  return wrap;
}

function renderNumberInput(field: Extract<Field, { type: 'number-input' }>, value: unknown, onChange: ChangeHandler): HTMLElement {
  const v = typeof value === 'number' ? value : (field.default ?? '');
  const wrap = el('div', 'f-field');
  wrap.appendChild(labelEl(field.label, field.help));

  const row = el('div', 'f-input-row');
  const input = el('input');
  input.type = 'number';
  if (field.min !== undefined) input.min = String(field.min);
  if (field.max !== undefined) input.max = String(field.max);
  if (field.step !== undefined) input.step = String(field.step);
  input.value = String(v);
  input.className = 'f-input';
  if (field.unit) {
    const unit = el('span', 'f-unit', field.unit);
    row.append(input, unit);
  } else {
    row.appendChild(input);
  }
  input.addEventListener('change', () => onChange(parseFloat(input.value)));
  wrap.appendChild(row);
  return wrap;
}

function renderText(field: Extract<Field, { type: 'text' | 'email' | 'phone' }>, value: unknown, onChange: ChangeHandler): HTMLElement {
  const v = typeof value === 'string' ? value : '';
  const wrap = el('div', 'f-field');
  wrap.appendChild(labelEl(field.label, field.help));

  const input = el('input');
  input.type = field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text';
  input.value = v;
  input.className = 'f-input';
  if ('maxLength' in field && field.maxLength) input.maxLength = field.maxLength;
  input.addEventListener('input', () => onChange(input.value));
  wrap.appendChild(input);
  return wrap;
}

function renderSelect(field: Extract<Field, { type: 'select' }>, value: unknown, onChange: ChangeHandler): HTMLElement {
  const v = typeof value === 'string' ? value : (field.default ?? '');
  const wrap = el('div', 'f-field');
  wrap.appendChild(labelEl(field.label, field.help));

  const select = el('select', 'f-select');
  const blank = el('option', undefined, 'Select…');
  blank.value = '';
  select.appendChild(blank);

  for (const opt of field.options) {
    const o = el('option', undefined, opt.label);
    o.value = opt.id;
    if (opt.id === v) o.selected = true;
    select.appendChild(o);
  }
  select.addEventListener('change', () => onChange(select.value));
  wrap.appendChild(select);
  return wrap;
}

function renderRadio(field: Extract<Field, { type: 'radio' }>, value: unknown, onChange: ChangeHandler): HTMLElement {
  const v = typeof value === 'string' ? value : (field.default ?? '');
  const wrap = el('div', 'f-field');
  wrap.appendChild(labelEl(field.label, field.help));

  const grid = el('div', 'f-radio-grid');
  const cols = field.columns ?? 2;
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  for (const opt of field.options) {
    const btn = el('button', `f-radio-btn${v === opt.id ? ' active' : ''}`);
    const name = el('span', 'f-radio-name', opt.label);
    btn.appendChild(name);
    if (opt.sublabel) btn.appendChild(el('span', 'f-radio-sub', opt.sublabel));
    btn.addEventListener('click', () => {
      grid.querySelectorAll('.f-radio-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(opt.id);
    });
    grid.appendChild(btn);
  }
  wrap.appendChild(grid);
  return wrap;
}

function renderSwatch(field: Extract<Field, { type: 'swatch' }>, value: unknown, onChange: ChangeHandler): HTMLElement {
  const v = typeof value === 'string' ? value : (field.default ?? '');
  const wrap = el('div', 'f-field');
  wrap.appendChild(labelEl(field.label, field.help));

  const row = el('div', 'f-swatches');
  for (const opt of (field.options as SwatchOption[])) {
    const btn = el('button', `f-swatch${v === opt.id ? ' active' : ''}`);
    btn.style.background = opt.color;
    btn.title = opt.label;
    btn.setAttribute('aria-label', opt.label);
    btn.addEventListener('click', () => {
      row.querySelectorAll('.f-swatch').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(opt.id);
    });
    row.appendChild(btn);
  }

  const selectedLabel = el('span', 'f-swatch-name');
  const currentOpt = (field.options as SwatchOption[]).find(o => o.id === v);
  selectedLabel.textContent = currentOpt?.label ?? '';
  wrap.append(row, selectedLabel);
  return wrap;
}

function renderCheckbox(field: Extract<Field, { type: 'checkbox' }>, value: unknown, onChange: ChangeHandler): HTMLElement {
  const v = typeof value === 'boolean' ? value : (field.default ?? false);
  const wrap = el('label', 'f-field f-checkbox-wrap');

  const cb = el('input');
  cb.type = 'checkbox';
  cb.className = 'f-checkbox';
  cb.checked = v;
  cb.addEventListener('change', () => onChange(cb.checked));

  const text = el('span', 'f-checkbox-label', field.label);
  if (field.help) text.title = field.help;
  wrap.append(cb, text);
  return wrap;
}

function renderQuantity(field: Extract<Field, { type: 'quantity' }>, value: unknown, onChange: ChangeHandler): HTMLElement {
  let v = typeof value === 'number' ? value : (field.default ?? 0);
  const min = field.min ?? 0;
  const max = field.max ?? 99;

  const wrap = el('div', 'f-field');
  wrap.appendChild(labelEl(field.label, field.help));

  const stepper = el('div', 'f-stepper');
  const dec = el('button', 'f-stepper-btn', '−');
  const count = el('span', 'f-stepper-count', String(v));
  const inc = el('button', 'f-stepper-btn', '+');

  const update = (next: number) => {
    v = next;
    count.textContent = String(v);
    dec.disabled = v <= min;
    inc.disabled = v >= max;
    onChange(v);
  };

  dec.addEventListener('click', () => update(Math.max(min, v - 1)));
  inc.addEventListener('click', () => update(Math.min(max, v + 1)));
  update(v); // set initial disabled states

  stepper.append(dec, count, inc);
  wrap.appendChild(stepper);
  return wrap;
}

function renderImagePick(field: Extract<Field, { type: 'image-pick' }>, value: unknown, onChange: ChangeHandler): HTMLElement {
  const v = typeof value === 'string' ? value : (field.default ?? '');
  const wrap = el('div', 'f-field');
  wrap.appendChild(labelEl(field.label, field.help));

  const grid = el('div', 'f-img-grid');
  for (const opt of (field.options as ImageOption[])) {
    const btn = el('button', `f-img-btn${v === opt.id ? ' active' : ''}`);
    const img = el('img');
    img.src = opt.imageUrl;
    img.alt = opt.label;
    img.loading = 'lazy';
    const caption = el('span', 'f-img-caption', opt.label);
    btn.append(img, caption);
    btn.addEventListener('click', () => {
      grid.querySelectorAll('.f-img-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(opt.id);
    });
    grid.appendChild(btn);
  }
  wrap.appendChild(grid);
  return wrap;
}

function renderMultiSelect(field: Extract<Field, { type: 'multi-select' }>, value: unknown, onChange: ChangeHandler): HTMLElement {
  const v: string[] = Array.isArray(value) ? value as string[] : (field.default ?? []);
  const selected = new Set(v);

  const wrap = el('div', 'f-field');
  wrap.appendChild(labelEl(field.label, field.help));

  const list = el('div', 'f-multi');
  for (const opt of (field.options as Option[])) {
    const label = el('label', `f-multi-opt${selected.has(opt.id) ? ' checked' : ''}`);
    const cb = el('input');
    cb.type = 'checkbox';
    cb.checked = selected.has(opt.id);
    cb.addEventListener('change', () => {
      if (cb.checked) {
        selected.add(opt.id);
        label.classList.add('checked');
      } else {
        selected.delete(opt.id);
        label.classList.remove('checked');
      }
      onChange(Array.from(selected));
    });
    label.append(cb, el('span', undefined, opt.label));
    list.appendChild(label);
  }
  wrap.appendChild(list);
  return wrap;
}

function renderDate(field: Extract<Field, { type: 'date' }>, value: unknown, onChange: ChangeHandler): HTMLElement {
  const v = typeof value === 'string' ? value : '';
  const wrap = el('div', 'f-field');
  wrap.appendChild(labelEl(field.label, field.help));

  const input = el('input');
  input.type = 'date';
  input.value = v;
  input.className = 'f-input';
  if (field.min) input.min = field.min;
  if (field.max) input.max = field.max;
  input.addEventListener('change', () => onChange(input.value));
  wrap.appendChild(input);
  return wrap;
}

// ── Public entry point ────────────────────────────────────────

export function renderField(field: Field, value: unknown, onChange: ChangeHandler): HTMLElement {
  switch (field.type) {
    case 'number-slider': return renderNumberSlider(field, value, onChange);
    case 'number-input':  return renderNumberInput(field, value, onChange);
    case 'text':
    case 'email':
    case 'phone':         return renderText(field as Extract<Field, { type: 'text' | 'email' | 'phone' }>, value, onChange);
    case 'select':        return renderSelect(field, value, onChange);
    case 'radio':         return renderRadio(field, value, onChange);
    case 'swatch':        return renderSwatch(field, value, onChange);
    case 'checkbox':      return renderCheckbox(field, value, onChange);
    case 'quantity':      return renderQuantity(field, value, onChange);
    case 'image-pick':    return renderImagePick(field, value, onChange);
    case 'multi-select':  return renderMultiSelect(field, value, onChange);
    case 'date':          return renderDate(field, value, onChange);
    default: {
      const d = el('div', 'f-field');
      d.textContent = `Field type "${(field as Field).type}" not supported`;
      return d;
    }
  }
}

export function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
