(() => {
  const MAX_FILE_SIZE = 25 * 1024 * 1024;
  function addPresenterPdfPanel() {
    const dashboard = document.getElementById('dashboard-view');
    if (!dashboard || document.getElementById('presenter-pdf-card')) return;
    const card = document.createElement('section');
    card.id = 'presenter-pdf-card'; card.className = 'card audience-pdf-card';
    card.innerHTML = `<div class="section-heading"><div><span class="step">PDF</span><h2>Present a PDF to the audience</h2></div></div><p>Choose a PDF to preview it on this presenter device. To display it on another audience device, host the file or provide it through your presentation setup.</p><div class="audience-pdf-toolbar"><label class="audience-pdf-upload"><span>Upload PDF</span><input id="presenter-pdf-file" type="file" accept="application/pdf,.pdf"></label><button id="presenter-pdf-prev" class="audience-pdf-button" type="button" disabled>Previous</button><span class="audience-pdf-page"><input id="presenter-pdf-page" type="number" min="1" value="1" disabled><span>/</span><span id="presenter-pdf-total">—</span></span><button id="presenter-pdf-next" class="audience-pdf-button" type="button" disabled>Next</button><button id="presenter-pdf-zoom-out" class="audience-pdf-button" type="button">−</button><span id="presenter-pdf-zoom">115%</span><button id="presenter-pdf-zoom-in" class="audience-pdf-button" type="button">+</button><span id="presenter-pdf-status" class="audience-pdf-status">No PDF selected</span></div><div id="presenter-pdf-stage" class="audience-pdf-stage empty"><span id="presenter-pdf-name">Choose a PDF to begin</span><canvas id="presenter-pdf-canvas" class="audience-pdf-canvas"></canvas></div>`;
    dashboard.appendChild(card); bindPresenterPdf();
  }
  function bindPresenterPdf() {
    const script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => { pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; initViewer(); }; document.head.appendChild(script);
  }
  function initViewer() {
    const s = { pdf:null,page:1,total:0,scale:1.15,busy:false,pending:null };
    const $ = id => document.getElementById(id); const status = (x,e=false) => { $('presenter-pdf-status').textContent=x; $('presenter-pdf-status').classList.toggle('error',e); };
    const controls = () => { $('presenter-pdf-prev').disabled=!s.pdf||s.page<=1; $('presenter-pdf-next').disabled=!s.pdf||s.page>=s.total; $('presenter-pdf-page').disabled=!s.pdf; $('presenter-pdf-page').value=s.page; $('presenter-pdf-total').textContent=s.total||'—'; $('presenter-pdf-zoom').textContent=`${Math.round(s.scale*100)}%`; };
    const render = async n => { if(!s.pdf)return; if(s.busy){s.pending=n;return;} s.busy=true; try { const p=await s.pdf.getPage(n), v=p.getViewport({scale:s.scale}), c=$('presenter-pdf-canvas'), x=c.getContext('2d'), d=window.devicePixelRatio||1; c.width=v.width*d;c.height=v.height*d;c.style.width=`${v.width}px`;c.style.height=`${v.height}px`;await p.render({canvasContext:x,viewport:v,transform:d!==1?[d,0,0,d,0,0]:null}).promise;s.page=n;$('presenter-pdf-stage').classList.remove('empty');status(`Showing page ${n} of ${s.total}`);controls(); } catch(e){status(`Could not render PDF: ${e.message}`,true);} finally{s.busy=false;if(s.pending){const n2=s.pending;s.pending=null;render(n2);}}};
    $('presenter-pdf-file').addEventListener('change', async e => { const f=e.target.files[0];e.target.value='';if(!f)return;if(f.type!=='application/pdf'&&!f.name.toLowerCase().endsWith('.pdf'))return status('Please choose a PDF file.',true);if(f.size>MAX_FILE_SIZE)return status('Please choose a PDF smaller than 25 MB.',true);try{status('Loading PDF…');s.pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;s.page=1;s.total=s.pdf.numPages;$('presenter-pdf-name').textContent=f.name;controls();render(1);}catch(e2){status(`Could not load PDF: ${e2.message}`,true);}});
    $('presenter-pdf-prev').onclick=()=>render(s.page-1);$('presenter-pdf-next').onclick=()=>render(s.page+1);$('presenter-pdf-page').onchange=e=>render(Math.max(1,Math.min(s.total,Number(e.target.value)||1)));$('presenter-pdf-zoom-out').onclick=()=>{s.scale=Math.max(.6,s.scale-.15);controls();render(s.page);};$('presenter-pdf-zoom-in').onclick=()=>{s.scale=Math.min(2.5,s.scale+.15);controls();render(s.page);};controls();
  }
  document.addEventListener('DOMContentLoaded', () => { const observer = new MutationObserver(addPresenterPdfPanel); observer.observe(document.body,{childList:true,subtree:true}); addPresenterPdfPanel(); });
})();
