import { registerReconciler } from '../../core/state/reconcileGameState.js';

const DOMAIN_NAME = 'lab';

export function getAnalysisDefinition(caseData, evidenceId) {
  const evidence = (caseData?.evidence || []).find((item) => item.id === evidenceId);
  if (!evidence?.analysis?.required) return null;
  return { evidence, analysis: evidence.analysis };
}

export function startLabJob({ evidenceId, caseData, stateManager, eventBus, now = Date.now() }) {
  const def = getAnalysisDefinition(caseData, evidenceId);
  const evidenceState = stateManager.getState()?.evidenceState?.[evidenceId];
  if (!def || evidenceState?.analysis !== 'queued') return false;

  const durationMs = Math.max(1000, Number(def.analysis.durationMs || 15000));
  const startedAt = now;
  const completesAt = startedAt + durationMs;

  stateManager.setState((state) => ({
    ...state,
    labJobs: {
      ...(state.labJobs || {}),
      [evidenceId]: {
        evidenceId,
        analysisType: def.analysis.type || 'generic',
        status: 'analyzing',
        startedAt,
        completesAt,
        completedAt: null,
        applied: false,
      },
    },
    evidenceState: {
      ...(state.evidenceState || {}),
      [evidenceId]: {
        ...state.evidenceState[evidenceId],
        analysis: 'analyzing',
        analysisStartedAt: startedAt,
        analysisCompletesAt: completesAt,
      },
    },
  }));

  eventBus?.emit('lab:analysisStarted', { evidenceId, startedAt, completesAt });
  return true;
}

export function completeLabJob({ evidenceId, caseData, stateManager, eventBus, now = Date.now() }) {
  const def = getAnalysisDefinition(caseData, evidenceId);
  const job = stateManager.getState()?.labJobs?.[evidenceId];
  if (!def || !job || job.status === 'completed' || now < job.completesAt) return false;

  const result = def.analysis.result || {};
  const notificationId = `lab-complete:${evidenceId}:${job.startedAt}`;

  stateManager.setState((state) => {
    const currentJob = state.labJobs?.[evidenceId];
    if (!currentJob || currentJob.status === 'completed') return state;

    const alreadyNotified = (state.notifications || []).some((n) => n.id === notificationId);
    return {
      ...state,
      labJobs: {
        ...(state.labJobs || {}),
        [evidenceId]: {
          ...currentJob,
          status: 'completed',
          completedAt: now,
          applied: true,
        },
      },
      evidenceState: {
        ...(state.evidenceState || {}),
        [evidenceId]: {
          ...state.evidenceState[evidenceId],
          analysis: 'analyzed',
          analyzedAt: now,
          analysisResultAvailable: true,
        },
      },
      notifications: alreadyNotified ? (state.notifications || []) : [
        ...(state.notifications || []),
        {
          id: notificationId,
          type: 'lab_result',
          createdAt: now,
          read: false,
          title: 'اكتملت نتيجة التحليل',
          message: `${def.evidence.reference || evidenceId} · ${def.evidence.title}`,
          evidenceId,
        },
      ],
    };
  });

  eventBus?.emit('lab:analysisCompleted', { evidenceId, result });
  eventBus?.emit('notification:created', { type: 'lab_result', evidenceId });
  return true;
}

export function reconcileLabJobsRuntime({ caseData, stateManager, eventBus, now = Date.now() }) {
  const jobs = stateManager.getState()?.labJobs || {};
  let changed = false;
  for (const [evidenceId, job] of Object.entries(jobs)) {
    if (job?.status === 'analyzing' && Number(job.completesAt) <= now) {
      changed = completeLabJob({ evidenceId, caseData, stateManager, eventBus, now }) || changed;
    }
  }
  return changed;
}

function reconcileLabState(state, caseData, now) {
  const labJobs = { ...(state.labJobs || {}) };
  const evidenceState = { ...(state.evidenceState || {}) };
  const notifications = [...(state.notifications || [])];
  let changed = false;

  for (const [evidenceId, job] of Object.entries(labJobs)) {
    if (!job || job.status !== 'analyzing' || Number(job.completesAt) > now) continue;
    const def = getAnalysisDefinition(caseData, evidenceId);
    if (!def) continue;

    labJobs[evidenceId] = { ...job, status: 'completed', completedAt: now, applied: true };
    evidenceState[evidenceId] = {
      ...(evidenceState[evidenceId] || {}),
      analysis: 'analyzed',
      analyzedAt: now,
      analysisResultAvailable: true,
    };

    const notificationId = `lab-complete:${evidenceId}:${job.startedAt}`;
    if (!notifications.some((n) => n.id === notificationId)) {
      notifications.push({
        id: notificationId,
        type: 'lab_result',
        createdAt: now,
        read: false,
        title: 'اكتملت نتيجة التحليل',
        message: `${def.evidence.reference || evidenceId} · ${def.evidence.title}`,
        evidenceId,
      });
    }
    changed = true;
  }

  return changed ? { ...state, labJobs, evidenceState, notifications } : state;
}

// Static ES modules are evaluated once per page, so this registration is stable during runtime.
registerReconciler(DOMAIN_NAME, reconcileLabState);

/**
 * Keeps timed lab jobs completing while the player is browsing other sections.
 * The interval only reconciles timestamp-based jobs; it does not alter case logic.
 */
export function installLabRuntimeWatcher({ caseData, stateManager, eventBus, intervalMs = 500 }) {
  const timer = window.setInterval(() => {
    reconcileLabJobsRuntime({ caseData, stateManager, eventBus });
  }, Math.max(250, intervalMs));
  return () => window.clearInterval(timer);
}
