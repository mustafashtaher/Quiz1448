(() => {
  const state = { pdf: null, page: 1, total: 0, scale: 1.15, rendering: false, pending: null, objectUrl: null };

  function el(id) { return document.getElementById(id); }
  function status(message, error = false) {
    const node = el('audience-pdf-status');
    if (node) { node.textContent = message; node.classList.toggle('error', error); }
  }
  function updateControls() {
    const hasPdf = Boolean(state.pdf);
    el('audience-pdf-prev').disabled = !hasPdf || state.page <= 1;
    el('audience-pdf-next').disabled = !hasPdf || state.page >= state.total;
    el('audience-pdf-page').disabled = !hasPdf;
    el('audience-pdf-page').value = state.page;
    el('audience-pdf-page').max = state.total || 1;
    el('audience-pdf-total').textContent = state.total || '—';
    el('audience-pdf-zoom').textContent = `${Math.round(state.scale * 100)}%`;
  }
  async function renderPage(number) {
    if (!state.pdf) return;
    if (state.rendering) { state.pending = number; return; }
    state.rendering = true;
    try {
      const page = await state.pdf.getPage(number);
      const viewport = page.getViewport({ scale: state.scale });
      const canvas = el('audience-pdf-canvas');
      const context = canvas.getContext('2d', { alpha: false });
      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      await page.render({ canvasContext: context, viewport, transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null }).promise;
      state.page = number;
      el('audience-pdf-stage').classList.remove('empty');
      status(`Showing page ${number} of ${state.total}`);
      updateControls();
    } catch (error) {
      status(`Could not render PDF: ${error.message}`, true);
    } finally {
      state.rendering = false;
      if (state.pending !== null) { const next = state.pending; state.pending = null; renderPage(next); }
    }
  }
  async function loadPdf(file) {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      status('Please choose a PDF file.', true); return;
    }
    if (file.size > 25 * 1024 * 1024) {
      status('Please choose a PDF smaller than 25 MB.', true); return;
    }
    try {
      status('Loading PDF…');
      if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
      state.objectUrl = URL.createObjectURL(file);
      const task = pdfjsLib.getDocument({ url: state.objectUrl, disableAutoFetch: true, disableStream: true });
      state.pdf = await task.promise;
      state.page = 1; state.total = state.pdf.numPages;
      el('audience-pdf-name').textContent = file.name;
      updateControls();
      await renderPage(1);
    } catch (error) {
      state.pdf = null; state.total = 0; updateControls();
      status(`Could not load PDF: ${error.message}`, true);
    }
  }
  function goToPage(number) {
    const next = Math.max(1, Math.min(state.total, Number(number) || 1));
    if (state.pdf) renderPage(next);
  }
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof pdfjsLib === 'undefined') { status('PDF viewer library could not be loaded.', true); return; }
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    el('audience-pdf-file').addEventListener('change', event => { loadPdf(event.target.files[0]); event.target.value = ''; });
    el('audience-pdf-prev').addEventListener('click', () => goToPage(state.page - 1));
    el('audience-pdf-next').addEventListener('click', () => goToPage(state.page + 1));
    el('audience-pdf-page').addEventListener('change', event => goToPage(event.target.value));
    el('audience-pdf-zoom-out').addEventListener('click', () => { state.scale = Math.max(.6, state.scale - .15); updateControls(); renderPage(state.page); });
    el('audience-pdf-zoom-in').addEventListener('click', () => { state.scale = Math.min(2.5, state.scale + .15); updateControls(); renderPage(state.page); });
    updateControls();
  });
})();
