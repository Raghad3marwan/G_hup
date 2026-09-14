import { iconMarkup } from './icons/icons.js';
import { startLabJob, reconcileLabJobsRuntime } from '../engine/domains/lab/LabDomain.js';
import { readEvidenceResult } from '../engine/domains/evidence/EvidenceDomain.js';

export function renderLabWorkspace(workspaceEl, { caseData, stateManager, eventBus }) {
  let selectedId = stateManager.getState()?.navigation?.activeLabEvidenceId || null;
  let timer = null;

  workspaceEl.innerHTML = `
    <section class="jn-lab jn-anim-section-enter">
      <header class="jn-lab__header">
        <div>
          <span class="jn-lab__eyebrow jn-mono">FORENSIC LAB / ACTIVE QUEUE</span>
          <h1>المختبر</h1>
          <p>طلبات التحليل التي أرسلتها من ملف الأدلة تظهر هنا. تبدأ النتائج بعد تشغيل الفحص المخبري.</p>
        </div>
        <div class="jn-lab__summary" data-role="summary"></div>
      </header>
      <div class="jn-lab__layout">
        <aside class="jn-lab-queue" data-role="queue"></aside>
        <main class="jn-lab-workbench" data-role="workbench"></main>
      </div>
    </section>`;

  const queueEl = workspaceEl.querySelector('[data-role="queue"]');
  const workbenchEl = workspaceEl.querySelector('[data-role="workbench"]');
  const summaryEl = workspaceEl.querySelector('[data-role="summary"]');

  function submittedEvidence() {
    const states = stateManager.getState()?.evidenceState || {};
    return (caseData?.evidence || []).filter((e) => ['queued', 'analyzing', 'analyzed'].includes(states[e.id]?.analysis));
  }

  function saveSelection() {
    stateManager.setState((state) => ({
      ...state,
      navigation: { ...state.navigation, activeLabEvidenceId: selectedId },
    }));
  }

  function render() {
    reconcileLabJobsRuntime({ caseData, stateManager, eventBus });
    const items = submittedEvidence();
    if (!selectedId || !items.some((e) => e.id === selectedId)) selectedId = items[0]?.id || null;

    const state = stateManager.getState();
    const queued = items.filter((e) => state.evidenceState?.[e.id]?.analysis === 'queued').length;
    const analyzing = items.filter((e) => state.evidenceState?.[e.id]?.analysis === 'analyzing').length;
    const completed = items.filter((e) => state.evidenceState?.[e.id]?.analysis === 'analyzed').length;
    summaryEl.innerHTML = `
      <div><strong class="jn-mono">${String(queued).padStart(2, '0')}</strong><span>بانتظار البدء</span></div>
      <div><strong class="jn-mono">${String(analyzing).padStart(2, '0')}</strong><span>قيد التحليل</span></div>
      <div><strong class="jn-mono">${String(completed).padStart(2, '0')}</strong><span>مكتمل</span></div>`;

    queueEl.innerHTML = `
      <div class="jn-lab-queue__heading"><span class="jn-mono">LAB REQUESTS</span><strong>طلبات التحليل</strong></div>
      ${items.length ? items.map((e) => queueCard(e)).join('') : emptyQueue()}`;

    queueEl.querySelectorAll('[data-lab-evidence-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedId = btn.dataset.labEvidenceId;
        saveSelection();
        render();
      });
    });

    renderWorkbench(items.find((e) => e.id === selectedId));
  }

  function queueCard(e) {
    const es = stateManager.getState()?.evidenceState?.[e.id] || {};
    const job = stateManager.getState()?.labJobs?.[e.id];
    const active = e.id === selectedId ? 'is-active' : '';
    const remaining = es.analysis === 'analyzing' && job ? formatRemaining(job.completesAt - Date.now()) : '';
    return `
      <button class="jn-lab-request ${active}" data-lab-evidence-id="${escA(e.id)}">
        <span class="jn-lab-request__ref jn-mono">${esc(e.reference || e.id)}</span>
        <span class="jn-lab-request__icon">${iconMarkup('lab')}</span>
        <span class="jn-lab-request__body"><strong>${esc(e.title)}</strong><small>${esc(analysisLabel(e.analysis?.type))}</small></span>
        <span class="jn-lab-request__state">${esc(labStateLabel(es.analysis))}${remaining ? ` · <b class="jn-mono">${remaining}</b>` : ''}</span>
      </button>`;
  }

  function renderWorkbench(e) {
    if (!e) {
      workbenchEl.innerHTML = `
        <div class="jn-lab-empty">
          <span class="jn-lab-empty__icon">${iconMarkup('lab')}</span>
          <span class="jn-mono">NO LAB REQUESTS</span>
          <h2>لا توجد طلبات تحليل حتى الآن</h2>
          <p>افحص دليلًا قابلًا للتحليل داخل قسم الأدلة ثم أرسله للمختبر.</p>
        </div>`;
      return;
    }

    const es = stateManager.getState()?.evidenceState?.[e.id] || {};
    const job = stateManager.getState()?.labJobs?.[e.id] || null;
    const analysis = e.analysis || {};

    if (es.analysis === 'queued') {
      workbenchEl.innerHTML = `
        <article class="jn-lab-sheet jn-lab-sheet--request">
          ${paperHeader(e, 'LAB REQUEST / PENDING')}
          <div class="jn-lab-request-form">
            <div><span>نوع الفحص</span><strong>${esc(analysisLabel(analysis.type))}</strong></div>
            <div><span>الدليل</span><strong>${esc(e.reference || e.id)} · ${esc(e.title)}</strong></div>
            <div><span>المدة التجريبية</span><strong>${esc(formatDuration(analysis.durationMs || 15000))}</strong></div>
            <div><span>الحالة</span><strong>جاهز لبدء التحليل</strong></div>
          </div>
          <div class="jn-lab-protocol">
            <span class="jn-mono">LAB PROTOCOL</span>
            <h3>إجراء التحليل</h3>
            <p>${esc(analysis.protocol || 'سيتم تشغيل الفحص المخبري المناسب لهذا الدليل دون تغيير محتواه الأصلي.')}</p>
          </div>
          <div class="jn-lab-actions"><button class="jn-btn jn-btn--primary" data-action="start-lab">بدء التحليل</button><small>يمكنك مغادرة المختبر والعودة لاحقًا؛ التوقيت يستمر.</small></div>
        </article>`;
      workbenchEl.querySelector('[data-action="start-lab"]')?.addEventListener('click', () => {
        startLabJob({ evidenceId: e.id, caseData, stateManager, eventBus });
        render();
      });
      return;
    }

    if (es.analysis === 'analyzing' && job) {
      const progress = progressPercent(job.startedAt, job.completesAt, Date.now());
      workbenchEl.innerHTML = `
        <article class="jn-lab-sheet jn-lab-sheet--active">
          ${paperHeader(e, 'ANALYSIS IN PROGRESS')}
          <div class="jn-lab-active-status">
            <div class="jn-lab-active-status__seal">${iconMarkup('lab')}</div>
            <div><span class="jn-mono">PROCESSING</span><h3>التحليل قيد التنفيذ</h3><p>${esc(analysis.activeMessage || 'يُرجى عدم إعادة إرسال الدليل. النتيجة ستظهر تلقائيًا عند اكتمال الإجراء.')}</p></div>
            <strong class="jn-lab-countdown jn-mono" data-role="countdown">${formatRemaining(job.completesAt - Date.now())}</strong>
          </div>
          <div class="jn-lab-progress"><i style="width:${progress}%"></i></div>
          <div class="jn-lab-timing"><span>بدأ الفحص <b class="jn-mono">${formatClock(job.startedAt)}</b></span><span>الاكتمال المتوقع <b class="jn-mono">${formatClock(job.completesAt)}</b></span></div>
          <div class="jn-lab-leave-note">يمكنك متابعة التحقيق في الأقسام الأخرى. سيستمر التحليل في الخلفية.</div>
        </article>`;
      return;
    }

    if (es.analysis === 'analyzed') {
      const result = analysis.result || {};
      workbenchEl.innerHTML = `
        <article class="jn-lab-sheet jn-lab-sheet--result">
          ${paperHeader(e, 'FORENSIC RESULT / COMPLETE')}
          <div class="jn-lab-result-stamp">اكتمل التحليل</div>
          <section class="jn-lab-result-summary"><span class="jn-mono">RESULT SUMMARY</span><h3>${esc(result.title || 'نتيجة التحليل')}</h3><p>${esc(result.summary || 'اكتمل التحليل ولم تُسجّل بيانات إضافية في النموذج التجريبي.')}</p></section>
          ${result.findings?.length ? `<section class="jn-lab-findings"><span class="jn-mono">TECHNICAL FINDINGS</span><h3>النتائج الفنية</h3><ul>${result.findings.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
          ${result.investigatorNote ? `<section class="jn-lab-investigator-note"><strong>ملاحظة للمحقق</strong><p>${esc(result.investigatorNote)}</p></section>` : ''}
          <div class="jn-lab-actions">${!es.resultReadAt ? `<button class="jn-btn jn-btn--primary" data-action="acknowledge-result">اعتماد قراءة النتيجة</button>` : `<span class="jn-evidence-checked">✓ تمت قراءة النتيجة</span>`}${result.document ? `<button class="jn-btn jn-btn--ghost" data-action="open-full-result">فتح التقرير الكامل</button>` : ''}</div>
          ${es.resultReadAt ? `<div class="jn-lab-leave-note">تم اعتماد النتيجة. قد تكون مواد جديدة متاحة الآن في قسم الأدلة.</div>` : `<div class="jn-lab-leave-note">مهم: مشاهدة ملخص النتيجة لا تكفي لتسجيلها ضمن تقدم التحقيق؛ اعتمد القراءة بعد مراجعتها.</div>`}
          <footer class="jn-lab-report-footer"><span class="jn-mono">${esc(e.reference || e.id)}</span><span>تقرير تجريبي لتطوير المحرك</span></footer>
        </article>`;
      workbenchEl.querySelector('[data-action="acknowledge-result"]')?.addEventListener('click', () => {
        readEvidenceResult({ evidenceId: e.id, caseData, stateManager, eventBus });
        render();
      });
      workbenchEl.querySelector('[data-action="open-full-result"]')?.addEventListener('click', () => {
        readEvidenceResult({ evidenceId: e.id, caseData, stateManager, eventBus });
        openResultDocument(result.document, e.title);
        render();
      });
      return;
    }

    workbenchEl.innerHTML = `<div class="jn-lab-empty"><h2>تعذّر تحديد حالة التحليل</h2></div>`;
  }

  function tick() {
    const before = stateManager.getState()?.evidenceState?.[selectedId]?.analysis;
    const changed = reconcileLabJobsRuntime({ caseData, stateManager, eventBus });
    const after = stateManager.getState()?.evidenceState?.[selectedId]?.analysis;
    if (changed || before !== after) {
      render();
      return;
    }
    const job = stateManager.getState()?.labJobs?.[selectedId];
    const countdown = workbenchEl.querySelector('[data-role="countdown"]');
    if (countdown && job?.status === 'analyzing') {
      countdown.textContent = formatRemaining(job.completesAt - Date.now());
      const bar = workbenchEl.querySelector('.jn-lab-progress i');
      if (bar) bar.style.width = `${progressPercent(job.startedAt, job.completesAt, Date.now())}%`;
    }
  }

  render();
  timer = window.setInterval(tick, 500);
  return () => { if (timer) window.clearInterval(timer); };
}

function openResultDocument(doc, title) {
  if (!doc) return;
  const modal = document.createElement('div');
  modal.className = 'jn-document-lightbox';
  modal.innerHTML = `<div class="jn-document-lightbox__bar"><strong>${esc(title)}</strong><button data-close aria-label="إغلاق">×</button></div><div class="jn-document-lightbox__scroll"><div class="jn-formal-document">${renderResultDocumentMarkup(doc)}</div></div>`;
  document.body.appendChild(modal);
  const close = () => { document.removeEventListener('keydown', key); modal.remove(); };
  const key = (ev) => { if (ev.key === 'Escape') close(); };
  modal.querySelector('[data-close]').onclick = close;
  modal.addEventListener('click', (ev) => { if (ev.target === modal) close(); });
  document.addEventListener('keydown', key);
}

function renderResultDocumentMarkup(doc = {}) {
  const meta = Object.entries(doc.meta || {}).map(([k,v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  const sections = (doc.sections || []).map((s) => `<section class="jn-formal-document__section"><h3>${esc(s.title)}</h3>${Array.isArray(s.body)?`<ul>${s.body.map((x)=>`<li>${esc(x)}</li>`).join('')}</ul>`:`<p>${esc(s.body||'')}</p>`}</section>`).join('');
  return `<header class="jn-formal-document__head"><span class="jn-mono">${esc(doc.kindLabel||'JINAYAT / FICTIONAL DOCUMENT')}</span><h2>${esc(doc.title||'مستند')}</h2>${doc.reportNumber?`<strong class="jn-mono">${esc(doc.reportNumber)}</strong>`:''}${doc.disclaimer?`<p>${esc(doc.disclaimer)}</p>`:''}</header>${meta?`<dl class="jn-formal-document__meta">${meta}</dl>`:''}${sections}${doc.examiner?`<footer class="jn-formal-document__sign"><span>الفاحص / المحرر</span><strong>${esc(doc.examiner)}</strong>${doc.signatureLabel?`<em>${esc(doc.signatureLabel)}</em>`:''}</footer>`:''}`;
}

function paperHeader(e, eyebrow) {
  return `<header class="jn-lab-sheet__header"><div><span class="jn-mono">${esc(eyebrow)}</span><h2>${esc(e.title)}</h2><p>${esc(e.reference || e.id)} · ${esc(analysisLabel(e.analysis?.type))}</p></div><span class="jn-lab-sheet__mark jn-mono">JNY/LAB</span></header>`;
}

function emptyQueue() {
  return `<div class="jn-lab-queue-empty"><span>${iconMarkup('lab')}</span><strong>السجل فارغ</strong><p>لا تظهر هنا إلا الأدلة التي أُرسلت من قسم الأدلة.</p></div>`;
}

function analysisLabel(type) {
  return ({
    digital_forensics: 'تحليل جنائي رقمي',
    mobile_forensics: 'استخراج بيانات الهاتف',
    fingerprint: 'تحليل بصمات',
    dna: 'تحليل DNA',
    toxicology: 'تحليل سموم',
    trace: 'تحليل آثار دقيقة',
    A01_medical_review: 'A01 · مراجعة طبية شرعية موسعة',
    A02_operational_match: 'A02 · مطابقة الأثر الطبي التشغيلي',
    generic: 'فحص مخبري',
  }[type] || 'فحص مخبري');
}
function labStateLabel(state) { return ({ queued: 'بانتظار البدء', analyzing: 'قيد التحليل', analyzed: 'اكتمل' }[state] || 'غير محدد'); }
function formatDuration(ms) { const sec = Math.max(1, Math.round(ms / 1000)); return sec < 60 ? `${sec} ثانية` : `${Math.round(sec / 60)} دقيقة`; }
function formatRemaining(ms) { const s = Math.max(0, Math.ceil(ms / 1000)); const m = Math.floor(s / 60); const r = s % 60; return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`; }
function formatClock(ts) { try { const d=new Date(ts); let h=d.getHours(); const period=h<12?'صباحًا':'مساءً'; h=h%12||12; return `${h}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')} ${period}`; } catch { return '—'; } }
function progressPercent(startedAt, completesAt, now) { const total = Math.max(1, completesAt - startedAt); return Math.max(0, Math.min(100, ((now - startedAt) / total) * 100)); }
function esc(v = '') { const d = document.createElement('div'); d.textContent = String(v); return d.innerHTML; }
function escA(v = '') { return esc(v).replace(/"/g, '&quot;'); }
