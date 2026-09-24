const Utils = (() => {
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const setMessage = (el, text, type='info') => { if (!el) return; el.textContent = text || ''; el.className = `message ${type} ${text ? '' : 'hidden'}`; };
  const busy = (button, value, label='Working…') => { if (!button) return; if (value) { button.dataset.label=button.textContent; button.textContent=label; button.disabled=true; } else { button.textContent=button.dataset.label || button.textContent; button.disabled=false; } };
  const show = el => el?.classList.remove('hidden'); const hide = el => el?.classList.add('hidden');
  const formatDate = v => v ? new Date(v).toLocaleString() : '—';
  const query = new URLSearchParams(location.search);
  return { $, $$, escape, setMessage, busy, show, hide, formatDate, query };
})();
