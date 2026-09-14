/**
 * ProgressionEngine
 * -----------------
 * طبقة عامة صغيرة لتحويل شروط Case Data إلى تقدم متدرج دون Hardcode لقضية بعينها.
 * - evidence.unlockWhen: يكشف مادة عندما تتحقق شروطها.
 * - derivedFacts[].when: يسجل حقيقة مشتقة كـ flag ويضيفها إلى الدفتر مرة واحدة.
 * كل الحقائق Monotonic: إذا تحققت لا تُسحب لاحقًا.
 */
export function evaluateProgressCondition(c, s) {
  if (!c) return true;
  if (c.type === 'all') return (c.nodes || []).every((x) => evaluateProgressCondition(x, s));
  if (c.type === 'any') return (c.nodes || []).some((x) => evaluateProgressCondition(x, s));
  if (c.type === 'not') return !evaluateProgressCondition(c.node || (c.nodes || [])[0], s);
  if (c.type === 'flagTrue') return !!s?.flags?.[c.key];
  if (c.type === 'flagEquals') return s?.flags?.[c.key] === c.value;
  if (c.type === 'evidenceFound') return s?.evidenceState?.[c.evidenceId]?.discovery === 'discovered';
  if (c.type === 'evidenceExamined') return s?.evidenceState?.[c.evidenceId]?.examination === 'examined';
  if (c.type === 'evidenceAnalyzed') return s?.evidenceState?.[c.evidenceId]?.analysis === 'analyzed' || s?.labJobs?.[c.evidenceId]?.status === 'completed';
  if (c.type === 'evidenceResultRead') return !!s?.evidenceState?.[c.evidenceId]?.resultReadAt;
  if (c.type === 'questionAnswered') return Object.values(s?.interrogationState || {}).some((x) => (x?.askedQuestionIds || []).includes(c.questionId));
  if (c.type === 'personQuestionAnswered') return (s?.interrogationState?.[c.personId]?.askedQuestionIds || []).includes(c.questionId);
  if (c.type === 'confrontationSucceeded') return Object.values(s?.interrogationState || {}).some((x) => (x?.successfulConfrontationIds || []).includes(c.confrontationId));
  if (c.type === 'contradictionRevealed') return !!s?.contradictionState?.[c.contradictionId]?.revealed;
  if (c.type === 'puzzleSolved') return !!s?.puzzleState?.[c.puzzleId]?.solved;
  return false;
}

export function synchronizeCaseProgress({ caseData, stateManager, now = Date.now() }) {
  const current = stateManager.getState();
  let draft = current;
  let changed = false;

  // A few passes allow one newly derived fact to unlock the next material in the same sync.
  for (let pass = 0; pass < 8; pass += 1) {
    let passChanged = false;
    const evidenceState = { ...(draft.evidenceState || {}) };
    const flags = { ...(draft.flags || {}) };
    const automaticFacts = [...(draft.notes?.automaticFacts || [])];

    for (const evidence of (caseData?.evidence || [])) {
      const st = evidenceState[evidence.id] || {};
      const shouldReveal = evidence.initiallyAvailable === true || (evidence.unlockWhen && evaluateProgressCondition(evidence.unlockWhen, draft));
      if (shouldReveal && st.discovery !== 'discovered') {
        evidenceState[evidence.id] = {
          ...st,
          discovery: 'discovered',
          discoveredAt: st.discoveredAt || now,
          discoveredFrom: st.discoveredFrom || { type: evidence.initiallyAvailable ? 'caseFile' : 'progression' },
          examination: st.examination || 'unexamined',
          analysis: st.analysis || 'none',
          flags: st.flags || {},
          locked: false,
        };
        passChanged = true;
      }
    }

    const stateAfterEvidence = { ...draft, evidenceState };
    for (const fact of (caseData?.derivedFacts || [])) {
      if (flags[fact.id]) continue;
      if (!evaluateProgressCondition(fact.when, { ...stateAfterEvidence, flags })) continue;
      flags[fact.id] = true;
      if (fact.text && !automaticFacts.some((x) => x.id === `fact:${fact.id}`)) {
        automaticFacts.push({ id: `fact:${fact.id}`, text: fact.text, createdAt: now, source: fact.id });
      }
      passChanged = true;
    }

    if (!passChanged) break;
    draft = {
      ...draft,
      evidenceState,
      flags,
      notes: { ...(draft.notes || {}), automaticFacts },
    };
    changed = true;
  }

  if (changed) stateManager.replaceState(draft);
  return changed;
}

export function installProgressionSync({ caseData, stateManager }) {
  let syncing = false;
  const sync = () => {
    if (syncing) return;
    syncing = true;
    try { synchronizeCaseProgress({ caseData, stateManager }); }
    finally { syncing = false; }
  };
  sync();
  const unsub = stateManager.subscribe(sync);
  return () => unsub?.();
}
