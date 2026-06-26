const COPILOT_ID_ATTR = 'data-browser-copilot-id';

function isVisible(el) {
  const style = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return style && style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
}

function labelFor(el) {
  const aria = el.getAttribute('aria-label');
  if (aria) return aria.trim();
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const text = labelledBy.split(/\s+/).map(id => document.getElementById(id)?.innerText || '').join(' ').trim();
    if (text) return text;
  }
  if (el.id) {
    const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (label?.innerText) return label.innerText.trim();
  }
  const parentLabel = el.closest('label');
  if (parentLabel?.innerText) return parentLabel.innerText.trim();
  return '';
}

function roleFor(el) {
  if (el.getAttribute('role')) return el.getAttribute('role');
  const tag = el.tagName.toLowerCase();
  if (tag === 'button') return 'button';
  if (tag === 'a') return 'link';
  if (tag === 'select') return 'combobox';
  if (tag === 'textarea') return 'textbox';
  if (tag === 'input') {
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    if (['button', 'submit', 'reset'].includes(type)) return 'button';
    if (type === 'checkbox') return 'checkbox';
    if (type === 'radio') return 'radio';
    return 'textbox';
  }
  return tag;
}

function shortText(el) {
  const value = ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) ? el.value : '';
  const text = (el.innerText || el.textContent || value || el.getAttribute('title') || el.getAttribute('placeholder') || '').replace(/\s+/g, ' ').trim();
  return text.slice(0, 120);
}

function cssPath(el) {
  if (el.id) return `#${CSS.escape(el.id)}`;
  const parts = [];
  let cur = el;
  while (cur && cur.nodeType === Node.ELEMENT_NODE && parts.length < 5) {
    let part = cur.tagName.toLowerCase();
    if (cur.classList.length) part += '.' + [...cur.classList].slice(0, 2).map(c => CSS.escape(c)).join('.');
    const parent = cur.parentElement;
    if (parent) {
      const siblings = [...parent.children].filter(c => c.tagName === cur.tagName);
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(cur) + 1})`;
    }
    parts.unshift(part);
    cur = parent;
  }
  return parts.join(' > ');
}

function observePage() {
  const selector = [
    'a[href]', 'button', 'input:not([type="hidden"])', 'textarea', 'select',
    '[role="button"]', '[role="link"]', '[contenteditable="true"]'
  ].join(',');
  const elements = [...document.querySelectorAll(selector)].filter(isVisible).slice(0, 120);
  const items = elements.map((el, idx) => {
    const id = `e${idx + 1}`;
    el.setAttribute(COPILOT_ID_ATTR, id);
    const rect = el.getBoundingClientRect();
    return {
      id,
      tag: el.tagName.toLowerCase(),
      role: roleFor(el),
      label: labelFor(el),
      text: shortText(el),
      placeholder: el.getAttribute('placeholder') || '',
      name: el.getAttribute('name') || '',
      type: el.getAttribute('type') || '',
      href: el.getAttribute('href') || '',
      selector: cssPath(el),
      rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) }
    };
  });
  return {
    title: document.title,
    url: location.href,
    bodyTextPreview: document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 1200),
    elements: items
  };
}

function findTarget(action) {
  if (action.targetId) return document.querySelector(`[${COPILOT_ID_ATTR}="${CSS.escape(action.targetId)}"]`);
  if (action.selector) return document.querySelector(action.selector);
  return null;
}

function setNativeValue(el, value) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, 'value');
  desc?.set?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

async function runAction(action) {
  const type = action.type;
  if (type === 'wait') {
    await new Promise(resolve => setTimeout(resolve, Number(action.ms || 800)));
    return { ok: true, message: `wait ${action.ms || 800}ms` };
  }
  if (type === 'scroll') {
    window.scrollBy({ top: Number(action.y || action.deltaY || 500), left: Number(action.x || 0), behavior: 'smooth' });
    return { ok: true, message: 'scrolled' };
  }
  if (type === 'open_url') {
    location.href = action.url;
    return { ok: true, message: `open ${action.url}` };
  }
  if (type === 'extract') {
    return { ok: true, message: document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 3000) };
  }

  const el = findTarget(action);
  if (!el) return { ok: false, message: `target not found: ${action.targetId || action.selector || ''}` };
  el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
  await new Promise(resolve => setTimeout(resolve, 250));

  if (type === 'click') {
    el.click();
    return { ok: true, message: `clicked ${action.targetId || action.selector}` };
  }
  if (type === 'input') {
    el.focus();
    if (el.isContentEditable) {
      el.textContent = action.text || '';
      el.dispatchEvent(new InputEvent('input', { bubbles: true, data: action.text || '' }));
    } else {
      setNativeValue(el, action.text || '');
    }
    return { ok: true, message: `input ${action.targetId || action.selector}` };
  }
  if (type === 'select') {
    el.value = action.value || action.text || '';
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, message: `selected ${el.value}` };
  }
  return { ok: false, message: `unknown action: ${type}` };
}

async function runActions(actions = []) {
  const results = [];
  for (const action of actions) results.push(await runAction(action));
  return { results, observation: observePage() };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message?.type === 'OBSERVE_PAGE') sendResponse({ ok: true, observation: observePage() });
    else if (message?.type === 'RUN_ACTIONS') sendResponse({ ok: true, ...(await runActions(message.actions || [])) });
    else sendResponse({ ok: false, error: 'unknown message type' });
  })().catch(error => sendResponse({ ok: false, error: String(error?.message || error) }));
  return true;
});
