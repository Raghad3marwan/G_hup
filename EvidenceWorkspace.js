import { iconMarkup } from './icons/icons.js';
import { examineEvidence, requestEvidenceAnalysis, readEvidenceResult } from '../engine/domains/evidence/EvidenceDomain.js';

export function renderEvidenceWorkspace(workspaceEl, { caseData, stateManager, eventBus }) {
  const allEvidence = caseData?.evidence || [];
  const families = caseData?.evidenceFamilies || [];
  let selectedFamilyId = stateManager.getState()?.navigation?.activeEvidenceFamilyId || null;
  let selectedId = stateManager.getState()?.navigation?.activeEvidenceId || null;

  workspaceEl.innerHTML = `<section class="jn-evidence jn-anim-section-enter">
    <header class="jn-evidence__header"><div><span class="jn-evidence__eyebrow jn-mono">EVIDENCE ARCHIVE / LIVE</span><h1>الأدلة</h1><p>تظهر العائلات الرئيسية هنا، بينما تبقى المرفقات الداخلية محافظة على أرقامها المرجعية للتحقيق.</p></div><div class="jn-evidence__count" data-role="evidence-count"></div></header>
    <div class="jn-evidence__layout"><aside class="jn-evidence-archive" data-role="archive"></aside><main class="jn-evidence-file" data-role="file"></main></div>
  </section>`;
  const archive = workspaceEl.querySelector('[data-role="archive"]');
  const file = workspaceEl.querySelector('[data-role="file"]');
  const count = workspaceEl.querySelector('[data-role="evidence-count"]');

  function discoveredItems() {
    const states = stateManager.getState()?.evidenceState || {};
    return allEvidence.filter((e) => states[e.id]?.discovery === 'discovered');
  }
  function familyFor(e) { return e.familyId || 'unfiled'; }
  function visibleFamilies(items) {
    if (!families.length) return [{ id:'all', reference:'EVIDENCE', title:'كل الأدلة', description:'المواد المكتشفة في الملف.' }];
    const ids = new Set(items.map(familyFor));
    return families.filter((f) => f.initiallyVisible || ids.has(f.id));
  }
  function familyItems(familyId, items) {
    return familyId === 'all' ? items : items.filter((e) => familyFor(e) === familyId);
  }

  function render() {
    const items = discoveredItems();
    const vf = visibleFamilies(items);
    if (!selectedFamilyId || !vf.some((f) => f.id === selectedFamilyId)) selectedFamilyId = vf[0]?.id || null;
    const inFamily = familyItems(selectedFamilyId, items);
    if (!selectedId || !inFamily.some((e) => e.id === selectedId)) selectedId = inFamily[0]?.id || null;
    count.innerHTML = `<span class="jn-mono">${String(vf.length).padStart(2,'0')}</span><small>عائلات متاحة</small>`;
    archive.innerHTML = `<div class="jn-evidence-archive__label"><span class="jn-mono">EVIDENCE FAMILIES</span><strong>فهرس الأدلة</strong></div>${vf.length ? vf.map((f) => familyCard(f, items)).join('') : `<div class="jn-evidence-empty"><span>${iconMarkup('evidence')}</span><strong>لا توجد مواد متاحة بعد</strong><p>ابدأ بملف القضية ومسرح الجريمة.</p></div>`}`;
    archive.querySelectorAll('[data-family-id]').forEach((btn) => btn.addEventListener('click', () => { selectedFamilyId = btn.dataset.familyId; selectedId = null; saveSelection(); render(); }));
    renderFamily(vf.find((f) => f.id === selectedFamilyId), inFamily);
  }

  function saveSelection() {
    stateManager.setState((s) => ({...s, navigation:{...s.navigation, activeEvidenceFamilyId:selectedFamilyId, activeEvidenceId:selectedId}}));
  }

  function familyCard(f, items) {
    const members = familyItems(f.id, items);
    const analyzed = members.filter((e) => stateManager.getState()?.evidenceState?.[e.id]?.analysis === 'analyzed').length;
    return `<button class="jn-evidence-card jn-evidence-family-card ${f.id===selectedFamilyId?'is-active':''}" data-family-id="${escA(f.id)}"><span class="jn-evidence-card__ref jn-mono">${esc(f.reference||f.id)}</span><span class="jn-evidence-card__icon">${iconMarkup('evidence')}</span><span class="jn-evidence-card__body"><strong>${esc(f.title)}</strong><small>${members.length} مرفقات متاحة${analyzed?` · ${analyzed} نتائج`:''}</small></span></button>`;
  }

  function renderFamily(family, items) {
    if (!family) { file.innerHTML = `<div class="jn-evidence-file__blank"><span class="jn-mono">NO EVIDENCE</span><h2>لا توجد عائلة مفتوحة</h2></div>`; return; }
    const selected = items.find((e) => e.id === selectedId);
    file.innerHTML = `<section class="jn-evidence-family"><header class="jn-evidence-family__head"><span class="jn-mono">${esc(family.reference||family.id)}</span><h2>${esc(family.title)}</h2><p>${esc(family.description||'')}</p></header><div class="jn-evidence-family__docs" data-role="family-docs">${items.map((e) => documentTab(e)).join('') || '<p class="jn-evidence-family__empty">لم تصل مرفقات هذه العائلة بعد.</p>'}</div><div data-role="selected-document"></div></section>`;
    file.querySelectorAll('[data-evidence-id]').forEach((btn) => btn.addEventListener('click', () => { selectedId = btn.dataset.evidenceId; saveSelection(); renderFamily(family, items); }));
    renderFile(file.querySelector('[data-role="selected-document"]'), selected);
  }

  function documentTab(e) {
    const s = stateManager.getState()?.evidenceState?.[e.id] || {};
    return `<button type="button" class="jn-evidence-doc-tab ${e.id===selectedId?'is-active':''}" data-evidence-id="${escA(e.id)}"><span class="jn-mono">${esc(e.reference||e.id)}</span><strong>${esc(e.shortTitle||e.title)}</strong><small>${esc(stateLabel(s))}</small></button>`;
  }

  function renderFile(target, e) {
    if (!e) { target.innerHTML = `<div class="jn-evidence-file__blank"><span class="jn-mono">SELECT ATTACHMENT</span><h2>اختر مرفقًا لعرضه</h2></div>`; return; }
    const s = stateManager.getState()?.evidenceState?.[e.id] || {};
    const examined = s.examination === 'examined';
    const analyzed = s.analysis === 'analyzed';
    const doc = analyzed && e.analysis?.result?.document ? e.analysis.result.document : e.document;
    const docAllowed = !e.documentAvailableAfterAnalysis || analyzed;
    target.innerHTML = `<article class="jn-evidence-dossier"><div class="jn-evidence-dossier__top"><div><span class="jn-mono">EVIDENCE / ${esc(e.reference||e.id)}</span><h2>${esc(e.title)}</h2><p>${esc(e.subtitle||typeLabel(e.type))}</p></div><span class="jn-evidence-stamp">${esc(stateLabel(s))}</span></div>
      <div class="jn-evidence-dossier__grid"><div class="jn-evidence-preview">${preview(e, doc, docAllowed)}${(e.image || (doc && docAllowed))?`<button class="jn-evidence-preview__open" data-action="open-full">فتح بحجم كامل</button>`:''}</div><div class="jn-evidence-meta"><dl><div><dt>الرقم المرجعي</dt><dd class="jn-mono">${esc(e.reference||'—')}</dd></div><div><dt>المصدر</dt><dd>${esc(e.source||e.foundAt||'مسجل في ملف التحقيق')}</dd></div><div><dt>التصنيف</dt><dd>${esc(typeLabel(e.type))}</dd></div><div><dt>الحالة</dt><dd>${esc(stateLabel(s))}</dd></div></dl></div></div>
      <section class="jn-evidence-observation"><span class="jn-mono">INITIAL OBSERVATION</span><h3>ما يراه المحقق</h3><p>${esc(e.initialObservation||'تم تسجيل المادة ضمن التحقيق.')}</p></section>
      ${examined && e.examination ? `<section class="jn-evidence-findings"><span class="jn-mono">EXAMINATION NOTES</span><h3>بعد القراءة / الفحص</h3><p>${esc(e.examination?.finding||'تمت مراجعة المادة.')}</p>${e.examination?.details?.length ? `<ul>${e.examination.details.map((x)=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}</section>`:''}
      ${analyzed && e.analysis?.result ? renderAnalysisResult(e.analysis.result) : ''}
      <div class="jn-evidence-actions">${!examined ? `<button class="jn-btn jn-btn--primary" data-action="examine">قراءة / فحص المرفق</button>` : `<span class="jn-evidence-checked">✓ تمت المراجعة</span>`}${examined && e.analysis?.required && !['queued','analyzing','analyzed'].includes(s.analysis) ? `<button class="jn-btn jn-btn--ghost" data-action="analysis">إرسال للفحص الفني</button>`:''}${s.analysis==='queued'?`<span class="jn-evidence-queued">بانتظار بدء الفحص</span>`:''}${s.analysis==='analyzing'?`<span class="jn-evidence-queued">قيد الفحص الفني</span>`:''}${analyzed && e.analysis?.result && !s.resultReadAt ? `<button class="jn-btn jn-btn--primary" data-action="read-result">اعتماد قراءة النتيجة</button>` : ''}${analyzed && s.resultReadAt ? `<span class="jn-evidence-checked">✓ تمت قراءة النتيجة</span>` : ''}</div></article>`;
    target.querySelector('[data-action="open-full"]')?.addEventListener('click', () => {
      if (!examined) examineEvidence({evidenceId:e.id,caseData,stateManager,eventBus});
      if (analyzed && e.analysis?.result && !s.resultReadAt) readEvidenceResult({evidenceId:e.id,caseData,stateManager,eventBus});
      doc && docAllowed ? openDocument(doc, e.title) : openImageLightbox(e);
      render();
    });
    target.querySelector('[data-action="examine"]')?.addEventListener('click', () => { examineEvidence({evidenceId:e.id,caseData,stateManager,eventBus}); render(); });
    target.querySelector('[data-action="analysis"]')?.addEventListener('click', () => { requestEvidenceAnalysis({evidenceId:e.id,caseData,stateManager,eventBus}); render(); });
    target.querySelector('[data-action="read-result"]')?.addEventListener('click', () => { readEvidenceResult({evidenceId:e.id,caseData,stateManager,eventBus}); render(); });
  }

  function renderAnalysisResult(result) {
    return `<section class="jn-evidence-findings jn-analysis-result"><span class="jn-mono">TECHNICAL RESULT</span><h3>${esc(result.title||'نتيجة الفحص')}</h3><p>${esc(result.summary||'')}</p>${result.findings?.length?`<ul>${result.findings.map((x)=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${result.investigatorNote?`<p class="jn-analysis-result__note">${esc(result.investigatorNote)}</p>`:''}</section>`;
  }

  function openDocument(doc, title) {
    const modal = document.createElement('div');
    modal.className = 'jn-document-lightbox';
    modal.innerHTML = `<div class="jn-document-lightbox__bar"><strong>${esc(title)}</strong><button data-close aria-label="إغلاق">×</button></div><div class="jn-document-lightbox__scroll"><div class="jn-formal-document">${renderDocumentMarkup(doc)}</div></div>`;
    document.body.appendChild(modal);
    const close = () => { document.removeEventListener('keydown', key); modal.remove(); };
    const key = (ev) => { if (ev.key === 'Escape') close(); };
    modal.querySelector('[data-close]').onclick = close;
    modal.addEventListener('click', (ev) => { if (ev.target === modal) close(); });
    document.addEventListener('keydown', key);
  }

  function openImageLightbox(e) {
    const images = (e.images?.length ? e.images : [e.image]).filter(Boolean); if (!images.length) return;
    let i=0; const modal=document.createElement('div'); modal.className='jn-evidence-lightbox';
    modal.innerHTML=`<div class="jn-evidence-lightbox__bar"><strong>${esc(e.title)}</strong><span data-role="counter"></span><button data-close aria-label="إغلاق">×</button></div><div class="jn-evidence-lightbox__stage"><button data-prev aria-label="السابق">‹</button><img data-full alt="${escA(e.alt||e.title)}"><button data-next aria-label="التالي">›</button></div>`;
    document.body.appendChild(modal); const img=modal.querySelector('[data-full]'),counter=modal.querySelector('[data-role="counter"]');
    const show=()=>{img.src=images[i];counter.textContent=images.length>1?`${i+1} / ${images.length}`:'';modal.querySelector('[data-prev]').hidden=images.length<2;modal.querySelector('[data-next]').hidden=images.length<2};
    const close=()=>{document.removeEventListener('keydown',key);modal.remove()}; const key=ev=>{if(ev.key==='Escape')close();if(ev.key==='ArrowLeft'){i=(i+1)%images.length;show()}if(ev.key==='ArrowRight'){i=(i-1+images.length)%images.length;show()}};
    modal.querySelector('[data-close]').onclick=close;modal.addEventListener('click',ev=>{if(ev.target===modal)close()});modal.querySelector('[data-prev]').onclick=()=>{i=(i-1+images.length)%images.length;show()};modal.querySelector('[data-next]').onclick=()=>{i=(i+1)%images.length;show()};document.addEventListener('keydown',key);show();
  }

  render();
}

function preview(e, doc, docAllowed) {
  if (e.image) return `<img src="${escA(e.image)}" alt="${escA(e.alt||e.title)}">`;
  if (doc && docAllowed) return `<div class="jn-document-preview"><span class="jn-mono">${esc(doc.reportNumber||e.reference||'DOCUMENT')}</span><strong>${esc(doc.title||e.title)}</strong><p>${esc(doc.preview||doc.subtitle||'مستند موثق داخل الملف. افتحه بالحجم الكامل للقراءة.')}</p></div>`;
  const labels={physical_evidence:'PHYSICAL',phone:'DIGITAL',document:'DOCUMENT',photo_evidence:'PHOTO',camera:'CCTV',digital_log:'LOG',forensic_report:'FORENSIC'};
  return `<div class="jn-evidence-preview__placeholder"><span>${iconMarkup('evidence')}</span><strong class="jn-mono">${labels[e.type]||'EVIDENCE'}</strong><small>${e.documentAvailableAfterAnalysis?'النتيجة ستظهر بعد الفحص الفني':'لا أصل بصري نهائي بعد'}</small></div>`;
}

function renderDocumentMarkup(doc={}) {
  const meta = Object.entries(doc.meta || {}).map(([k,v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  const sections = (doc.sections || []).map((s) => `<section class="jn-formal-document__section"><h3>${esc(s.title)}</h3>${Array.isArray(s.body)?`<ul>${s.body.map((x)=>`<li>${esc(x)}</li>`).join('')}</ul>`:`<p>${esc(s.body||'')}</p>`}</section>`).join('');
  return `<header class="jn-formal-document__head"><span class="jn-mono">${esc(doc.kindLabel||'JINAYAT / FICTIONAL DOCUMENT')}</span><h2>${esc(doc.title||'مستند')}</h2>${doc.reportNumber?`<strong class="jn-mono">${esc(doc.reportNumber)}</strong>`:''}${doc.disclaimer?`<p>${esc(doc.disclaimer)}</p>`:''}</header>${meta?`<dl class="jn-formal-document__meta">${meta}</dl>`:''}${sections}${doc.examiner?`<footer class="jn-formal-document__sign"><span>الفاحص / المحرر</span><strong>${esc(doc.examiner)}</strong>${doc.signatureLabel?`<em>${esc(doc.signatureLabel)}</em>`:''}</footer>`:''}`;
}
function typeLabel(t){return ({physical_evidence:'دليل مادي',phone:'هاتف / دليل رقمي',document:'مستند',photo_evidence:'دليل مصور',digital_device:'جهاز رقمي',camera:'كاميرا / تسجيل',digital_log:'سجل رقمي',forensic_report:'تقرير فني / شرعي'}[t]||'دليل');}
function stateLabel(s){if(s.analysis==='analyzed')return'نتيجة مكتملة';if(s.analysis==='analyzing')return'قيد الفحص';if(s.analysis==='queued')return'بانتظار الفحص';if(s.analysis==='needs_analysis')return'جاهز للإرسال';if(s.examination==='examined')return'تمت القراءة';return'متاح';}
function esc(v=''){const d=document.createElement('div');d.textContent=String(v);return d.innerHTML;} function escA(v=''){return esc(v).replace(/"/g,'&quot;');}
