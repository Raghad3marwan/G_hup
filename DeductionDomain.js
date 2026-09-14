export function isDeductionUnlocked(config, state) {
  return evaluateDeductionCondition(config?.unlockWhen, state);
}

export function submitDeduction({ config, stateManager, answers }) {
  const currentState = stateManager.getState();
  if (config?.submitWhen && !evaluateDeductionCondition(config.submitWhen, currentState)) {
    return { ok: false, reason: 'submit_locked' };
  }
  const questions = config?.questions || [];
  const complete = questions.every((q) => isCompleteAnswer(q, answers?.[q.id]));
  if (!complete) return { ok: false, reason: 'incomplete' };

  const correct = questions.every((q) => isQuestionCorrect(q, answers?.[q.id]));
  stateManager.setState((s) => ({
    ...s,
    deductionState: {
      ...(s.deductionState || {}),
      answers: { ...(answers || {}) },
      attempts: (s.deductionState?.attempts || 0) + 1,
      completed: correct,
      submittedAt: Date.now(),
    },
  }));
  return { ok: true, correct };
}

export function isQuestionCorrect(question, actual) {
  if (question?.type === 'compound') {
    if (!actual || typeof actual !== 'object' || Array.isArray(actual)) return false;
    return (question.fields || []).every((field) =>
      isQuestionCorrect(
        { ...field, correctAnswer: question.correctAnswer?.[field.id] ?? field.correctAnswer },
        actual[field.id]
      )
    );
  }
  return sameAnswer(actual, question?.correctAnswer, question?.type, question?.validation);
}

export function validateMultipleAnswer(actual, expected = [], policy = null) {
  if (!Array.isArray(actual)) return false;
  const selected = new Set(actual);
  const baseline = Array.isArray(expected) ? expected : [];

  // Backward compatible default: exact unordered equality.
  if (!policy) {
    if (selected.size !== baseline.length) return false;
    return baseline.every((id) => selected.has(id));
  }

  const requiredAll = policy.requiredAll || baseline;
  const anyOfGroups = policy.anyOf || policy.requiredAnyGroups || [];
  const allowedSupporting = policy.allowedSupporting || [];
  const explicitlyAllowed = policy.allowed || [];

  if (!requiredAll.every((id) => selected.has(id))) return false;
  if (!anyOfGroups.every((group) => Array.isArray(group) && group.some((id) => selected.has(id)))) return false;

  if (policy.rejectDisallowed !== false) {
    const allowed = new Set([
      ...requiredAll,
      ...anyOfGroups.flat(),
      ...allowedSupporting,
      ...explicitlyAllowed,
    ]);
    for (const id of selected) if (!allowed.has(id)) return false;
  }

  return selected.size > 0;
}

function isCompleteAnswer(question, actual) {
  if (question?.type === 'compound') {
    if (!actual || typeof actual !== 'object' || Array.isArray(actual)) return false;
    return (question.fields || []).every((field) => isCompleteAnswer(field, actual[field.id]));
  }
  if (question?.type === 'multiple_choice' || question?.type === 'evidence_multiple' || question?.type === 'sequence') {
    return Array.isArray(actual) && actual.length > 0;
  }
  return actual !== undefined && actual !== null && actual !== '';
}

function sameAnswer(actual, expected, type, validation) {
  if (type === 'multiple_choice' || type === 'evidence_multiple') {
    return validateMultipleAnswer(actual, expected, validation);
  }
  if (type === 'sequence') {
    return Array.isArray(actual) && Array.isArray(expected) && actual.length === expected.length && actual.every((v, i) => v === expected[i]);
  }
  return actual === expected;
}

export function evaluateDeductionCondition(c, s) {
  if (!c) return true;
  if (c.type === 'all') return (c.nodes || []).every((x) => evaluateDeductionCondition(x, s));
  if (c.type === 'any') return (c.nodes || []).some((x) => evaluateDeductionCondition(x, s));
  if (c.type === 'not') return !evaluateDeductionCondition(c.node || (c.nodes || [])[0], s);
  if (c.type === 'flagTrue') return !!s?.flags?.[c.key];
  if (c.type === 'flagEquals') return s?.flags?.[c.key] === c.value;
  if (c.type === 'evidenceFound') return s?.evidenceState?.[c.evidenceId]?.discovery === 'discovered';
  if (c.type === 'evidenceExamined') return s?.evidenceState?.[c.evidenceId]?.examination === 'examined';
  if (c.type === 'evidenceAnalyzed') return s?.evidenceState?.[c.evidenceId]?.analysis === 'analyzed' || s?.labJobs?.[c.evidenceId]?.status === 'completed';
  if (c.type === 'evidenceResultRead') return !!s?.evidenceState?.[c.evidenceId]?.resultReadAt;
  if (c.type === 'questionAnswered') return Object.values(s?.interrogationState || {}).some((x) => (x?.askedQuestionIds || []).includes(c.questionId));
  if (c.type === 'personQuestionAnswered') return (s?.interrogationState?.[c.personId]?.askedQuestionIds || []).includes(c.questionId);
  if (c.type === 'confrontationSucceeded') return Object.values(s?.interrogationState || {}).some((x) => (x?.successfulConfrontationIds || []).includes(c.confrontationId));
  if (c.type === 'puzzleSolved') return !!s?.puzzleState?.[c.puzzleId]?.solved;
  return false;
}
