export function renderCaseFileWorkspace(workspaceEl, { caseData }) {
  const f = caseData?.caseFile || {};
  const objectives = f.objectives || [];
  const briefing = f.briefing || f.summary || '';
  const facts = f.initialFacts || [];
  workspaceEl.innerHTML = `<section class="jn-casefile jn-anim-section-enter">
    <header class="jn-casefile__header"><span class="jn-mono">CASE FILE / ${esc(f.fileNumber||'—')}</span><h1>${esc(caseData?.meta?.title||'ملف القضية')}</h1><p>${esc(f.classification||'')}</p></header>
    <div class="jn-casefile__grid">
      <article class="jn-paper jn-casefile__paper"><div class="jn-casefile__stamp">ملف مُعاد فتحه</div><h2>إحاطة القضية</h2><p>${esc(briefing)}</p>
        <dl class="jn-casefile__facts">
          ${row('رقم الملف',f.fileNumber)}${row('الموقع',f.location)}${row('التصنيف الأولي',f.initialClassification)}${row('حالة الملف',f.status)}${row('وقت العثور',f.foundAt)}
        </dl>
      </article>
      <aside class="jn-casefile__side">
        ${facts.length?`<section class="jn-paper jn-paper--clean"><span class="jn-mono">INITIAL RECORD</span><h3>المعطيات المثبتة عند الاستلام</h3><ul>${facts.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`:''}
        ${objectives.length?`<section class="jn-paper jn-paper--clean"><span class="jn-mono">ASSIGNMENT</span><h3>مهمة المحقق</h3><ol>${objectives.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></section>`:''}
        ${f.warning?`<section class="jn-casefile__warning">${esc(f.warning)}</section>`:''}
      </aside>
    </div>
  </section>`;
}
function row(label,value){return value?`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`:''}
function esc(v=''){const d=document.createElement('div');d.textContent=String(v);return d.innerHTML;}
