import { iconMarkup } from './icons/icons.js';
import { getInterrogationDefinition, getInterrogationState, getAvailableQuestions, getAvailableConfrontations, askQuestion, confrontWithEvidence } from '../engine/domains/interrogation/InterrogationDomain.js';
import { evaluateProgressCondition } from '../engine/core/progression/ProgressionEngine.js';

const ROLE_LABELS = { victim: 'الضحية' };
function publicRoleLabel(person){
  if (person.publicRoleLabel) return person.publicRoleLabel;
  if (person.role === 'victim') return 'الضحية';
  return person.identity?.occupation || 'ملف شخص';
}
function archiveStatus(person){ return person.role === 'victim' ? 'الضحية' : (person.identity?.occupation || 'ملف شخص'); }

export function renderPeopleWorkspace(workspaceEl, { caseData, stateManager, eventBus }) {
  const people = (caseData?.people || []).filter((p) => !p.unlockWhen || evaluateProgressCondition(p.unlockWhen, stateManager.getState()));
  workspaceEl.innerHTML = '';

  const root = document.createElement('section');
  root.className = 'jn-people jn-anim-section-enter';
  root.innerHTML = `
    <div class="jn-people__context">
      <div><span class="jn-mono">PERSON ARCHIVE</span><h1>أرشيف الأشخاص</h1></div>
      <p>ملفات الأشخاص المرتبطين بالقضية. افتح أي ملف لمراجعة بياناته.</p>
    </div>
    <div class="jn-people__layout">
      <aside class="jn-person-archive" aria-label="أرشيف الأشخاص">
        <div class="jn-person-archive__header"><span>الملفات</span><span class="jn-mono">${String(people.length).padStart(2,'0')}</span></div>
        <div class="jn-person-archive__stack" data-role="archive-list"></div>
      </aside>
      <div class="jn-dossier-workspace" data-role="dossier"></div>
    </div>`;
  workspaceEl.appendChild(root);

  const list = root.querySelector('[data-role="archive-list"]');
  const dossier = root.querySelector('[data-role="dossier"]');
  const state = stateManager.getState();
  let activeId = state?.navigation?.activePersonId || people[0]?.id || null;
  let activeTab = state?.navigation?.activeDossierTab || 'profile';

  for (const person of people) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'jn-person-file';
    button.dataset.personId = person.id;
    button.innerHTML = `
      <span class="jn-person-file__tab"></span>
      <span class="jn-person-file__photo" aria-hidden="true">${person.image ? `<img src="${escA(person.image)}" alt="">` : (person.initials || '—')}</span>
      <span class="jn-person-file__meta">
        <strong>${esc(person.name)}</strong>
        <span>${esc(publicRoleLabel(person))}</span>
        <span class="jn-mono">${esc(person.fileNumber || person.id)}</span>
      </span>
      <span class="jn-person-file__status">${esc(archiveStatus(person))}</span>`;
    button.addEventListener('click', () => selectPerson(person.id));
    list.appendChild(button);
  }

  function selectPerson(id) {
    activeId = id;
    activeTab = 'profile';
    stateManager.setState((s) => ({...s, navigation:{...s.navigation, activePersonId:id, activeDossierTab:'profile'}}));
    render();
    root.classList.add('is-dossier-open');
  }

  function selectTab(tabId) {
    activeTab = tabId;
    stateManager.setState((s) => ({...s, navigation:{...s.navigation, activeDossierTab:tabId}}));
    renderDossier();
  }

  function render() {
    list.querySelectorAll('.jn-person-file').forEach((el) => {
      const active = el.dataset.personId === activeId;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-current', active ? 'true' : 'false');
    });
    renderDossier();
  }

  function renderDossier() {
    const person = people.find((p) => p.id === activeId);
    if (!person) {
      dossier.innerHTML = '<div class="jn-dossier-empty">اختر ملفًا من الأرشيف لفتحه.</div>';
      return;
    }
    const tabs = (person.dossierTabs || defaultTabs(person))
      .filter((t) => t.enabled !== false)
      .filter((t) => !(t.id === 'interrogation' && person.capabilities?.interrogation === false))
      .filter((t) => !(t.id === 'reports' && !(person.reports?.length)));
    if (!tabs.some(t => t.id === activeTab)) activeTab = tabs[0]?.id || 'profile';
    dossier.innerHTML = `
      <button class="jn-dossier__mobile-back" type="button" data-role="back">${iconMarkup('close')} <span>العودة إلى الأرشيف</span></button>
      <article class="jn-dossier">
        <div class="jn-dossier__folder-back" aria-hidden="true"></div>
        <div class="jn-dossier__sheet-layer jn-dossier__sheet-layer--one" aria-hidden="true"></div>
        <div class="jn-dossier__sheet-layer jn-dossier__sheet-layer--two" aria-hidden="true"></div>
        <header class="jn-dossier__header">
          <div class="jn-dossier__classification">
            <span class="jn-mono">JNY / PERSON FILE</span>
            <span class="jn-reference-number">${esc(person.fileNumber || person.id)}</span>
          </div>
          <div class="jn-dossier__identity">
            <div class="jn-dossier__portrait">
              <span class="jn-paperclip" aria-hidden="true"></span>
              ${person.image ? `<img class="jn-dossier__portrait-image" src="${escA(person.image)}" alt="صورة ملف ${escA(person.name)}">` : `<div class="jn-dossier__portrait-placeholder">${person.initials || '—'}</div>`}
              <span class="jn-mono">PORTRAIT / FILE</span>
            </div>
            <div class="jn-dossier__title">
              <span>ملف شخص</span>
              <h2>${esc(person.name)}</h2>
              <p>${esc(person.subtitle || publicRoleLabel(person))}</p>
            </div>
            <div class="jn-stamp jn-stamp--accent">${esc(person.role === 'victim' ? 'الضحية' : 'ملف شخص')}</div>
          </div>
        </header>
        <nav class="jn-dossier-tabs" aria-label="أقسام ملف الشخص">
          ${tabs.map(t => `<button type="button" data-tab="${esc(t.id)}" class="jn-dossier-tab ${t.id===activeTab?'is-active':''}">${esc(t.label)}</button>`).join('')}
        </nav>
        <div class="jn-dossier__paper" data-role="tab-content">${renderTab(person, activeTab, { caseData, stateManager })}</div>
      </article>`;

    dossier.querySelector('[data-role="back"]').addEventListener('click', () => root.classList.remove('is-dossier-open'));
    dossier.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => selectTab(btn.dataset.tab)));
    if (activeTab === 'interrogation') bindInterrogation(person);
  }

  function bindInterrogation(person) {
    const wrap = dossier.querySelector('[data-role="interrogation-live"]');
    if (!wrap) return;
    wrap.querySelectorAll('[data-question-id]').forEach((btn) => btn.addEventListener('click', () => {
      askQuestion({ personId: person.id, questionId: btn.dataset.questionId, caseData, stateManager, eventBus }); renderDossier();
    }));
    wrap.querySelectorAll('[data-confrontation-id]').forEach((btn) => btn.addEventListener('click', () => {
      const card=btn.closest('[data-confront-card]');
      const evidenceIds=[...card.querySelectorAll('input[data-confront-evidence]:checked')].map(x=>x.value);
      confrontWithEvidence({ personId:person.id, confrontationId:btn.dataset.confrontationId, evidenceIds, caseData, stateManager, eventBus }); renderDossier();
    }));
    // Backward compatible single-evidence UI used by older placeholder cases.
    let selectedEvidenceId = wrap.querySelector('[data-role="confront-evidence"]')?.value || '';
    const select = wrap.querySelector('[data-role="confront-evidence"]');
    select?.addEventListener('change', () => { selectedEvidenceId = select.value; });
    wrap.querySelector('[data-action="confront"]')?.addEventListener('click', () => {
      if (!selectedEvidenceId) return;
      confrontWithEvidence({ personId: person.id, evidenceId: selectedEvidenceId, caseData, stateManager, eventBus }); renderDossier();
    });
  }

  render();
  if (activeId && window.matchMedia('(min-width: 641px)').matches) root.classList.add('is-dossier-open');
}

function defaultTabs(person){
  const tabs = [{id:'profile',label:'الملف الشخصي'}];
  if (person?.medicalFile) tabs.push({id:'medical',label:'السجل الطبي'});
  if (person?.capabilities?.interrogation !== false) tabs.push({id:'interrogation',label:'الاستجواب'});
  tabs.push({id:'timeline',label:'الخط الزمني'}, {id:'relations',label:'العلاقات'});
  if (person?.reports?.length) tabs.push({id:'reports',label:'التقارير والمرفقات'});
  return tabs;
}

function renderTab(person, tab, ctx = {}) {
  if (tab === 'profile') return renderProfile(person);
  if (tab === 'medical') return renderMedicalFile(person);
  if (tab === 'reports') return renderReports(person, ctx);
  if (tab === 'interrogation') return renderInterrogation(person, ctx);
  if (tab === 'timeline') return renderTimeline(person, ctx);
  if (tab === 'relations') return renderRelations(person, ctx);
  return sheet('الملف','FILE','لا تتوفر بيانات لهذا التبويب.');
}


function renderProfile(person) {
  const legacy = person.profile || [];
  const identity = person.identity || {};
  const physical = person.physical || {};
  const background = person.background || {};
  const personality = person.personality || {};
  const possessions = person.possessions || [];
  const conduct = person.legalBehavioralRecord || {};

  const identityRows = compactRows([
    ['الاسم الكامل', person.name],
    ['العمر', identity.age],
    ['الجنس', identity.sex],
    ['المهنة', identity.occupation],
    ['جهة العمل', identity.employer],
    ['الحالة الاجتماعية', identity.maritalStatus],
    ['مكان الإقامة', identity.residence],
    ['رقم الملف', person.fileNumber || person.id]
  ]);
  const physicalRows = compactRows([
    ['الطول', physical.height],
    ['البنية', physical.build],
    ['لون البشرة', physical.skinTone],
    ['لون العينين', physical.eyeColor],
    ['لون الشعر', physical.hairColor],
    ['علامات مميزة', physical.distinguishingMarks]
  ]);
  const backgroundRows = compactRows([
    ['الطبيعة العامة', personality.summary || background.nature],
    ['السمات الملحوظة', listText(personality.traits)],
    ['العادات ذات الصلة', listText(background.habits)],
    ['الوضع المالي', background.financialStatus],
    ['وسيلة النقل', background.vehicle],
    ['ملاحظات خلفية', background.notes]
  ]);

  const conductRows = compactRows([
    ['السوابق الجنائية', listText(conduct.criminalHistory)],
    ['المخالفات المرورية', listText(conduct.trafficViolations)],
    ['الحوادث المرورية', listText(conduct.trafficIncidents)],
    ['بلاغات / قضايا سابقة', listText(conduct.priorReports)],
    ['مخالفات مهنية أو إدارية', listText(conduct.professionalViolations)]
  ]);
  const behaviorSources = conduct.behavioralSources || [];

  return `<div class="jn-dossier-sheet">
    <div class="jn-dossier-sheet__heading"><span>البيانات الشخصية</span><span class="jn-mono">REC / ${esc(person.id)}</span></div>
    ${renderRecordSection('الهوية والبيانات الأساسية','IDENTITY', identityRows.length ? identityRows : legacy.map(f=>[f.label,f.value]))}
    ${physicalRows.length ? renderRecordSection('الوصف الجسدي','PHYSICAL',physicalRows) : ''}
    ${backgroundRows.length ? renderRecordSection('الخلفية والسمات','BACKGROUND',backgroundRows) : ''}
    ${conductRows.length ? renderRecordSection('السجل النظامي','LEGAL / TRAFFIC',conductRows) : ''}
    ${behaviorSources.length ? `<section class="jn-record-section"><div class="jn-record-section__head"><strong>معلومات سلوكية من مصادر</strong><span class="jn-mono">BEHAVIOR / SOURCED</span></div><div class="jn-behavior-source-list">${behaviorSources.map(item=>`<article><strong>${esc(item.observation || item.text || '')}</strong>${item.source?`<p>المصدر: ${esc(item.source)}</p>`:''}${item.date?`<small>${esc(item.date)}</small>`:''}</article>`).join('')}</div></section>` : ''}
    ${possessions.length ? `<section class="jn-record-section"><div class="jn-record-section__head"><strong>الممتلكات والمقتنيات ذات الصلة</strong><span class="jn-mono">PROPERTY</span></div><div class="jn-property-list">${possessions.map(item=>`<article><strong>${esc(item.name || item.label || item)}</strong>${item.description?`<p>${esc(item.description)}</p>`:''}${item.relevance?`<small>${esc(item.relevance)}</small>`:''}</article>`).join('')}</div></section>` : ''}
    <div class="jn-dossier-attachments"><div><span>مرفقات</span><strong>${person.attachmentsCount ?? 0}</strong></div><div><span>حالة الملف</span><strong>${esc(person.statusLabel || 'مفتوح')}</strong></div></div>
  </div>`;
}

function renderMedicalFile(person) {
  const m = person.medicalFile;
  if (!m) return sheet('السجل الطبي','MEDICAL','لا يوجد سجل طبي مرفق بهذا الملف.');
  const rows = compactRows([
    ['فصيلة الدم', m.bloodType],
    ['الحالة الصحية العامة', m.generalHealth],
    ['أمراض مزمنة', listText(m.chronicConditions)],
    ['حساسيات', listText(m.allergies)],
    ['أدوية منتظمة', listText(m.medications)],
    ['إصابات أو عمليات سابقة', listText(m.history)],
    ['اضطرابات / رُهاب موثق', listText(m.phobias)],
    ['قيود جسدية أو نفسية ذات صلة', listText(m.limitations)]
  ]);
  const notes = m.notes || [];
  return `<div class="jn-dossier-sheet jn-medical-file">
    <div class="jn-dossier-sheet__heading"><span>السجل الطبي</span><span class="jn-mono">MED / ${esc(person.fileNumber || person.id)}</span></div>
    <div class="jn-medical-file__notice">هذا السجل يعرض فقط المعلومات الموثقة داخل بيانات القضية. وجود حالة طبية لا يثبت وحده أي استنتاج جنائي.</div>
    ${renderRecordSection('ملخص الحالة','MEDICAL SUMMARY',rows)}
    ${notes.length ? `<section class="jn-record-section"><div class="jn-record-section__head"><strong>ملاحظات موثقة</strong><span class="jn-mono">NOTES</span></div><ul class="jn-medical-notes">${notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul></section>`:''}
    ${m.source ? `<div class="jn-medical-source"><span>مصدر السجل</span><strong>${esc(m.source)}</strong>${m.recordDate?`<small>${esc(m.recordDate)}</small>`:''}</div>`:''}
  </div>`;
}

function renderRecordSection(title, code, rows) {
  if (!rows?.length) return '';
  return `<section class="jn-record-section"><div class="jn-record-section__head"><strong>${esc(title)}</strong><span class="jn-mono">${esc(code)}</span></div><dl class="jn-person-facts">${rows.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl></section>`;
}
function compactRows(rows){ return rows.filter(([,v]) => v !== undefined && v !== null && String(v).trim() !== ''); }
function listText(value){ return Array.isArray(value) ? value.filter(Boolean).join('، ') : (value || ''); }

function renderReports(person, { caseData } = {}) {
  const reports = person.reports || [];
  const evidence = caseData?.evidence || [];
  return `<div class="jn-dossier-sheet"><div class="jn-dossier-sheet__heading"><span>التقارير والمرفقات</span><span class="jn-mono">REPORTS / ATTACHMENTS</span></div><div class="jn-document-stack">${reports.map((r,idx)=>{ const ev=evidence.find(e=>e.id===r.evidenceId); return `<div class="jn-document-slip"><span class="jn-mono">${esc(r.code || `DOC / ${String(idx+1).padStart(2,'0')}`)}</span><strong>${esc(r.title)}</strong><small>${ev ? esc(ev.subtitle || ev.title) : 'مرفق موثق في ملف الشخص'}</small></div>`; }).join('')}</div></div>`;
}
function renderTimeline(person, { stateManager } = {}) {
  const game = stateManager?.getState?.() || {};
  const items = (person.timeline || []).filter(i => !i.unlockWhen || evaluateProgressCondition(i.unlockWhen, game));
  return `<div class="jn-dossier-sheet"><div class="jn-dossier-sheet__heading"><span>الخط الزمني</span><span class="jn-mono">TIMELINE</span></div><div class="jn-person-timeline">${items.length ? items.map(i=>`<div class="jn-person-timeline__item"><time>${esc(i.time)}</time><p>${esc(i.text)}</p></div>`).join('') : '<p class="jn-text-muted-on-paper">لا توجد نقاط زمنية موثقة متاحة في هذه المرحلة.</p>'}</div></div>`;
}
function renderRelations(person, { stateManager } = {}) {
  const game = stateManager?.getState?.() || {};
  const items = (person.relations || []).filter(i => !i.unlockWhen || evaluateProgressCondition(i.unlockWhen, game));
  return `<div class="jn-dossier-sheet"><div class="jn-dossier-sheet__heading"><span>العلاقات</span><span class="jn-mono">RELATIONS</span></div><div class="jn-person-relations">${items.length ? items.map(i=>`<article><strong>${esc(i.target)}</strong><span>${esc(i.type)}</span><p>${esc(i.detail)}</p></article>`).join('') : '<p class="jn-text-muted-on-paper">لا توجد علاقات موثقة متاحة في هذه المرحلة.</p>'}</div></div>`;
}

function sheet(title, code, text){ return `<div class="jn-dossier-sheet"><div class="jn-dossier-sheet__heading"><span>${title}</span><span class="jn-mono">${code}</span></div><p>${text}</p></div>`; }
function esc(v=''){ const d=document.createElement('div'); d.textContent=String(v); return d.innerHTML; }


function renderInterrogation(person, { caseData, stateManager } = {}) {
  const def = getInterrogationDefinition(caseData, person.id);
  if (!def) return sheet('الاستجواب','INTERVIEW','لا توجد جلسة استجواب معرفة لهذا الشخص في بيانات القضية.');
  const game = stateManager.getState();
  const iState = getInterrogationState(game, person.id);
  const available = getAvailableQuestions({ personId: person.id, caseData, state: game });
  const discoveredEvidence = (caseData?.evidence || []).filter((e) => game?.evidenceState?.[e.id]?.discovery === 'discovered');
  const transcript = iState.transcript || [];

  return `<div class="jn-dossier-sheet jn-interrogation-live" data-role="interrogation-live">
    <div class="jn-dossier-sheet__heading"><span>الاستجواب</span><span class="jn-mono">INTERVIEW / LIVE</span></div>
    <div class="jn-interrogation-header">
      <div><h3>${esc(def.heading || `استجواب ${person.name}`)}</h3><p>${esc(def.intro || 'اختر سؤالًا لبدء الاستجواب.')}</p></div>
      <div class="jn-interrogation-stat"><strong>${String(transcript.filter(x=>x.type==='question_answer').length).padStart(2,'0')}</strong><span>أسئلة موثقة</span></div>
    </div>
    <div class="jn-interrogation-grid">
      <section class="jn-interrogation-panel">
        <div class="jn-interrogation-panel__title"><span>الأسئلة المتاحة</span><span class="jn-mono">AVAILABLE</span></div>
        ${available.length ? `<div class="jn-question-list">${available.map((q,idx)=>`<button type="button" class="jn-interview-question" data-question-id="${escA(q.id)}"><span>${String(idx+1).padStart(2,'0')}</span><strong>${esc(q.text)}</strong><small>طرح السؤال</small></button>`).join('')}</div>` : `<div class="jn-interrogation-empty">لا توجد أسئلة جديدة متاحة الآن. قد تظهر أسئلة أخرى بعد اكتشاف دليل أو تقدم التحقيق.</div>`}

        <div class="jn-confront-box">
          <div class="jn-interrogation-panel__title"><span>مقارنة رواية بالمواد</span><span class="jn-mono">CONFRONT</span></div>
          ${renderConfrontationControls(person, def, game, discoveredEvidence)}
        </div>
      </section>

      <section class="jn-transcript-paper">
        <div class="jn-transcript-paper__head"><div><span class="jn-mono">OFFICIAL INTERVIEW LOG</span><h3>محضر الاستجواب</h3></div><span class="jn-transcript-file">${esc(person.fileNumber || person.id)}</span></div>
        ${transcript.length ? `<div class="jn-transcript-list">${transcript.map((item,idx)=>renderTranscriptItem(item,idx)).join('')}</div>` : `<div class="jn-transcript-empty"><span class="jn-mono">NO STATEMENT RECORDED</span><p>لم يتم طرح أي سؤال بعد. سيُبنى المحضر من الأسئلة التي يختارها المحقق فعليًا.</p></div>`}
      </section>
    </div>
  </div>`;
}

function renderConfrontationControls(person, def, game, discoveredEvidence) {
  const available=getAvailableConfrontations({personId:person.id,caseData:{interrogations:{[person.id]:def}},state:game});
  const multi=available.filter(c=>Array.isArray(c.requiredEvidenceIds));
  if(multi.length){
    return `<p>اختر الرواية ثم حدد المواد التي تختبرها. المواد غير الكافية لا تكشف الحل ولا تستهلك فرصة.</p><div class="jn-confront-narratives">${multi.map(c=>`<section class="jn-confront-narrative" data-confront-card><strong>${esc(c.label||c.id)}</strong>${c.prompt?`<p>${esc(c.prompt)}</p>`:''}<div class="jn-confront-evidence-grid">${discoveredEvidence.map(e=>`<label><input type="checkbox" data-confront-evidence value="${escA(e.id)}"><span>${esc(e.reference||e.id)} · ${esc(e.shortTitle||e.title)}</span></label>`).join('')}</div><button type="button" class="jn-btn jn-btn--ghost" data-confrontation-id="${escA(c.id)}">مقارنة الرواية</button></section>`).join('')}</div>`;
  }
  return discoveredEvidence.length ? `<p>اختر دليلًا مكتشفًا واعرضه على الشخص. اختيار دليل غير مناسب لن يكشف لك الحل.</p><div class="jn-confront-controls"><select data-role="confront-evidence" aria-label="اختر دليلًا"><option value="">— اختر دليلًا —</option>${discoveredEvidence.map(e=>`<option value="${escA(e.id)}">${esc(e.reference || e.id)} · ${esc(e.title)}</option>`).join('')}</select><button type="button" class="jn-btn jn-btn--ghost" data-action="confront">مواجهة بالدليل</button></div>` : `<p class="jn-text-muted-on-paper">لا توجد أدلة مكتشفة يمكن استخدامها في المواجهة بعد.</p>`;
}

function renderTranscriptItem(item, idx) {
  if (item.type === 'confrontation') {
    return `<article class="jn-transcript-entry jn-transcript-entry--confront ${item.success?'is-success':''}"><div class="jn-transcript-entry__meta"><span class="jn-mono">${String(idx+1).padStart(2,'0')}</span><strong>مواجهة بالدليل</strong></div><p class="jn-transcript-question">تم عرض: ${esc(item.evidenceTitle || item.evidenceId)}</p><p class="jn-transcript-answer">${esc(item.response)}</p><small>${item.success ? 'تم توثيق تغير في الإفادة' : 'لم تنتج مواجهة موثقة'}</small></article>`;
  }
  return `<article class="jn-transcript-entry"><div class="jn-transcript-entry__meta"><span class="jn-mono">${String(idx+1).padStart(2,'0')}</span><strong>سؤال / إجابة</strong></div><p class="jn-transcript-question">س: ${esc(item.question)}</p><p class="jn-transcript-answer">ج: ${esc(item.answer)}</p></article>`;
}

function escA(v=''){ return esc(v).replace(/"/g,'&quot;'); }
