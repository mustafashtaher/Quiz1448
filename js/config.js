const APP_CONFIG = Object.freeze({
  API_URL: 'https://script.google.com/macros/s/AKfycbzcDzZG-atgNy5fgu24pEP_ynwA_9_qAnBSl5_qtSMPAPPflCu8TQYEsfqMe98e2IJi/exec',
  WORKSHOP_NAME: 'Istifada1448H TaweeliyaNikat RasailShareefa',
  SESSION_KEY: 'istifada_presenter_session',
  REQUEST_TIMEOUT: 30000,
  AUDIENCE_PDF_URL: 'https://1drv.ms/b/c/28e5e52a0eeb6cb1/IQDGgpzUGbYfQoYiuIYehG0MAbbKWSB_8dLEFJLYznMmcvU?e=a6X5Ry'
});

/* Shared presenter controls. These run from config.js on both pages so they do not
   depend on the minified presenter bundle being edited. */
document.addEventListener('DOMContentLoaded', () => {
  const day = document.querySelector('#day-select');
  const group = document.querySelector('#group-select');
  const addOptions = (select, values) => {
    if (!select || select.options.length > 0) return;
    values.forEach(value => {
      const option = document.createElement('option');
      option.value = value; option.textContent = value === 'ALL' ? 'All groups' : value;
      select.appendChild(option);
    });
  };
  addOptions(day, ['1', '2', '3', '4', '5']);
  addOptions(group, ['ALL', 'A', 'B', 'C', 'D']);

  const dashboard = document.querySelector('#dashboard-view');
  if (!dashboard || document.querySelector('#audience-pdf-settings')) return;
  const panel = document.createElement('section');
  panel.id = 'audience-pdf-settings';
  panel.className = 'card audience-pdf-card';
  panel.innerHTML = `<div class="section-heading"><div><span class="step">PDF</span><h2>Audience PDF</h2></div></div>
    <p>Set the public PDF link shown in the audience view. No PDF upload is used.</p>
    <div class="audience-pdf-toolbar">
      <label class="audience-pdf-url-label" for="audience-pdf-url">PDF link</label>
      <input id="audience-pdf-url" class="audience-pdf-url-input" type="url" value="${APP_CONFIG.AUDIENCE_PDF_URL}" placeholder="https://...">
      <button id="save-audience-pdf" class="audience-pdf-button" type="button">Save PDF link</button>
      <span id="audience-pdf-save-status" class="audience-pdf-status"></span>
    </div>`;
  dashboard.appendChild(panel);
  panel.querySelector('#save-audience-pdf').addEventListener('click', async () => {
    const input = panel.querySelector('#audience-pdf-url');
    const status = panel.querySelector('#audience-pdf-save-status');
    const url = input.value.trim();
    if (!/^https:\/\//i.test(url)) { status.textContent = 'Enter a valid HTTPS link.'; return; }
    try {
      status.textContent = 'Saving…';
      if (!window.API || !API.saveSettings) throw new Error('Settings API is unavailable.');
      await API.saveSettings({ Audience_PDF_URL: url, audiencePdfUrl: url }, sessionStorage.getItem(APP_CONFIG.SESSION_KEY));
      status.textContent = 'Saved. Refresh the audience view to load the new PDF.';
    } catch (error) { status.textContent = error.message || 'Could not save PDF link.'; }
  });
});
