import assert from 'node:assert/strict';
import { StateManager } from '../engine/core/state/StateManager.js';
import { reconcileGameState } from '../engine/core/state/reconcileGameState.js';
import { startLabJob, completeLabJob } from '../engine/domains/lab/LabDomain.js';

const caseData = {
  evidence: [{
    id: 'ev1', reference: 'EV-1', title: 'جهاز',
    analysis: { required: true, type: 'digital_forensics', durationMs: 5000, result: { title: 'نتيجة' } }
  }]
};
const baseState = {
  evidenceState: { ev1: { discovery: 'discovered', examination: 'examined', analysis: 'queued' } },
  labJobs: {}, notifications: [], navigation: {}
};
const sm = new StateManager(baseState);
const events = [];
const eventBus = { emit(name, payload) { events.push([name, payload]); } };

assert.equal(startLabJob({ evidenceId: 'ev1', caseData, stateManager: sm, eventBus, now: 1000 }), true);
assert.equal(sm.getState().evidenceState.ev1.analysis, 'analyzing');
assert.equal(sm.getState().labJobs.ev1.startedAt, 1000);
assert.equal(sm.getState().labJobs.ev1.completesAt, 6000);
assert.equal(completeLabJob({ evidenceId: 'ev1', caseData, stateManager: sm, eventBus, now: 5999 }), false);
assert.equal(completeLabJob({ evidenceId: 'ev1', caseData, stateManager: sm, eventBus, now: 6000 }), true);
assert.equal(sm.getState().evidenceState.ev1.analysis, 'analyzed');
assert.equal(sm.getState().labJobs.ev1.status, 'completed');
assert.equal(sm.getState().notifications.length, 1);
assert.equal(sm.getState().labJobs.ev1.applied, true);

// Simulate a saved game re-opened after the expected completion time.
const saved = {
  evidenceState: { ev1: { discovery: 'discovered', examination: 'examined', analysis: 'analyzing' } },
  labJobs: { ev1: { evidenceId: 'ev1', status: 'analyzing', startedAt: 1000, completesAt: 6000, applied: false } },
  notifications: []
};
const reconciled = reconcileGameState(saved, caseData, { now: 9000 });
assert.equal(reconciled.evidenceState.ev1.analysis, 'analyzed');
assert.equal(reconciled.labJobs.ev1.status, 'completed');
assert.equal(reconciled.notifications.length, 1);

console.log('Lab Domain ✓ PASSED');
