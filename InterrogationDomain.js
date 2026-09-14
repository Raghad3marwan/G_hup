/**
 * InterrogationDomain — data-driven questions and evidence confrontations.
 * Backward compatible with single evidenceId confrontations; also supports
 * requiredEvidenceIds + allowedSupportingIds for narrative-vs-material comparison.
 */
export function getInterrogationDefinition(caseData, personId) {
  return caseData?.interrogations?.[personId] || null;
}
export function getInterrogationState(state, personId) {
  return state?.interrogationState?.[personId] || { askedQuestionIds: [], transcript: [], confrontationAttempts: [], successfulConfrontationIds: [] };
}
export function conditionMet(condition, state) {
  if (!condition) return true;
  switch (condition.type) {
    case 'evidenceFound': return state?.evidenceState?.[condition.evidenceId]?.discovery === 'discovered';
    case 'evidenceExamined': return state?.evidenceState?.[condition.evidenceId]?.examination === 'examined';
    case 'evidenceAnalyzed': return state?.evidenceState?.[condition.evidenceId]?.analysis === 'analyzed';
    case 'evidenceResultRead': return !!state?.evidenceState?.[condition.evidenceId]?.resultReadAt;
    case 'questionAnswered': return Object.values(state?.interrogationState || {}).some((x) => (x?.askedQuestionIds || []).includes(condition.questionId));
    case 'personQuestionAnswered': return (state?.interrogationState?.[condition.personId]?.askedQuestionIds || []).includes(condition.questionId);
    case 'confrontationSucceeded': return Object.values(state?.interrogationState || {}).some((x) => (x?.successfulConfrontationIds || []).includes(condition.confrontationId));
    case 'flagTrue': return state?.flags?.[condition.key] === true;
    case 'flagEquals': return state?.flags?.[condition.key] === condition.value;
    case 'puzzleSolved': return state?.puzzleState?.[condition.puzzleId]?.solved === true;
    case 'all': return (condition.nodes || []).every((node) => conditionMet(node, state));
    case 'any': return (condition.nodes || []).some((node) => conditionMet(node, state));
    case 'not': return !conditionMet(condition.node || (condition.nodes || [])[0], state);
    default: return true;
  }
}
export function getAvailableQuestions({ personId, caseData, state }) {
  const def=getInterrogationDefinition(caseData,personId); if(!def)return[]; const current=getInterrogationState(state,personId);
  return (def.questions||[]).filter(q=>!(current.askedQuestionIds||[]).includes(q.id)&&conditionMet(q.unlockWhen,state));
}
export function getAvailableConfrontations({ personId, caseData, state }) {
  const def=getInterrogationDefinition(caseData,personId); if(!def)return[];
  return (def.confrontations||[]).filter(c=>conditionMet(c.unlockWhen,state));
}
export function askQuestion({ personId, questionId, caseData, stateManager, eventBus, now=Date.now() }) {
  const def=getInterrogationDefinition(caseData,personId); const question=def?.questions?.find(q=>q.id===questionId); if(!question)return false;
  const available=getAvailableQuestions({personId,caseData,state:stateManager.getState()}); if(!available.some(q=>q.id===questionId))return false;
  stateManager.setState(game=>{const current=getInterrogationState(game,personId);return{...game,interrogationState:{...(game.interrogationState||{}),[personId]:{...current,askedQuestionIds:[...(current.askedQuestionIds||[]),questionId],transcript:[...(current.transcript||[]),{id:`q:${questionId}:${now}`,type:'question_answer',createdAt:now,questionId,question:question.text,answer:question.answer}]}}}});
  eventBus?.emit('interrogation:questionAnswered',{personId,questionId}); return true;
}
function validateEvidenceSet(confrontation, selectedIds) {
  const required=confrontation.requiredEvidenceIds || (confrontation.evidenceId ? [confrontation.evidenceId] : []);
  const supporting=confrontation.allowedSupportingIds || [];
  const selected=new Set(selectedIds || []);
  if(!required.every(id=>selected.has(id))) return false;
  if(confrontation.rejectDisallowed !== false){const allowed=new Set([...required,...supporting]);for(const id of selected)if(!allowed.has(id))return false;}
  return required.length>0;
}
export function confrontWithEvidence({ personId, evidenceId=null, evidenceIds=null, confrontationId=null, caseData, stateManager, eventBus, now=Date.now() }) {
  const def=getInterrogationDefinition(caseData,personId); if(!def)return{ok:false,success:false};
  const game=stateManager.getState(); const selected=[...new Set((evidenceIds?.length?evidenceIds:[evidenceId]).filter(Boolean))];
  if(!selected.length || selected.some(id=>game?.evidenceState?.[id]?.discovery!=='discovered'))return{ok:false,success:false};
  let confrontation=null;
  if(confrontationId) confrontation=(def.confrontations||[]).find(c=>c.id===confrontationId&&conditionMet(c.unlockWhen,game));
  else confrontation=(def.confrontations||[]).find(c=>conditionMet(c.unlockWhen,game)&&validateEvidenceSet(c,selected));
  const success=!!confrontation && validateEvidenceSet(confrontation,selected);
  const titles=selected.map(id=>(caseData?.evidence||[]).find(e=>e.id===id)?.title||id);
  const response=success?confrontation.response:(def.wrongConfrontationResponse||'لا يغيّر هذا الدليل الإفادة الحالية. لا توجد مواجهة قابلة للتوثيق هنا.');
  stateManager.setState(state=>{const current=getInterrogationState(state,personId);const successIds=current.successfulConfrontationIds||[];return{...state,interrogationState:{...(state.interrogationState||{}),[personId]:{...current,confrontationAttempts:[...(current.confrontationAttempts||[]),{evidenceIds:selected,evidenceId:selected[0]||null,confrontationId:success?confrontation.id:null,success,createdAt:now}],successfulConfrontationIds:success&&!successIds.includes(confrontation.id)?[...successIds,confrontation.id]:successIds,transcript:[...(current.transcript||[]),{id:`c:${selected.join('+')}:${now}`,type:'confrontation',createdAt:now,evidenceIds:selected,evidenceId:selected[0]||null,evidenceTitle:titles.join(' + '),success,response}]}} ,flags:success&&confrontation?.setFlag?{...(state.flags||{}),[confrontation.setFlag]:true}:(state.flags||{})}});
  eventBus?.emit(success?'interrogation:confrontSucceeded':'interrogation:confrontFailed',{personId,evidenceIds:selected,confrontationId:success?confrontation.id:null});
  return{ok:true,success};
}
