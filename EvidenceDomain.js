/** EvidenceDomain — حالة الأدلة العامة مستقلة عن محتوى القضية. */
export function getEvidence(caseData, evidenceId) {
  return (caseData?.evidence || []).find((item) => item.id === evidenceId) || null;
}

export function discoverEvidence({ evidenceId, source = null, caseData, stateManager, eventBus }) {
  const evidence = getEvidence(caseData, evidenceId);
  if (!evidence) return null;
  const now = Date.now();
  stateManager.setState((state) => {
    const current = state.evidenceState?.[evidenceId] || {};
    return { ...state, evidenceState: { ...(state.evidenceState || {}), [evidenceId]: {
      ...current, discovery: 'discovered', discoveredAt: current.discoveredAt || now,
      discoveredFrom: current.discoveredFrom || source, examination: current.examination || 'unexamined',
      analysis: current.analysis || 'none', flags: current.flags || {}, locked: !!current.locked,
    }}};
  });
  eventBus?.emit('evidence:discovered', { evidenceId, source });
  return evidence;
}

export function examineEvidence({ evidenceId, caseData, stateManager, eventBus }) {
  const evidence = getEvidence(caseData, evidenceId);
  if (!evidence) return null;
  const state = stateManager.getState()?.evidenceState?.[evidenceId];
  if (!state || state.discovery !== 'discovered') return null;
  stateManager.setState((game) => ({ ...game, evidenceState: { ...game.evidenceState, [evidenceId]: {
    ...game.evidenceState[evidenceId], examination: 'examined', examinedAt: game.evidenceState[evidenceId].examinedAt || Date.now(),
    analysis: evidence.analysis?.required && game.evidenceState[evidenceId].analysis === 'none' ? 'needs_analysis' : game.evidenceState[evidenceId].analysis,
  }}}));
  eventBus?.emit('evidence:examined', { evidenceId });
  return evidence;
}

export function requestEvidenceAnalysis({ evidenceId, caseData, stateManager, eventBus }) {
  const evidence = getEvidence(caseData, evidenceId);
  const current = stateManager.getState()?.evidenceState?.[evidenceId];
  if (!evidence?.analysis?.required || current?.examination !== 'examined') return false;
  stateManager.setState((game) => ({ ...game, evidenceState: { ...game.evidenceState, [evidenceId]: {
    ...game.evidenceState[evidenceId], analysis: 'queued', queuedAt: Date.now(),
  }}}));
  eventBus?.emit('evidence:analysisRequested', { evidenceId, analysisType: evidence.analysis.type || 'generic' });
  return true;
}


/** يسجل أن اللاعب فتح نتيجة فنية مكتملة فعليًا. */
export function readEvidenceResult({ evidenceId, caseData, stateManager, eventBus, now = Date.now() }) {
  const evidence = getEvidence(caseData, evidenceId);
  const current = stateManager.getState()?.evidenceState?.[evidenceId];
  if (!evidence || current?.analysis !== 'analyzed') return false;
  if (current.resultReadAt) return true;
  stateManager.setState((game) => ({ ...game, evidenceState: { ...(game.evidenceState || {}), [evidenceId]: { ...game.evidenceState[evidenceId], resultReadAt: now } } }));
  eventBus?.emit('evidence:resultRead', { evidenceId });
  return true;
}
