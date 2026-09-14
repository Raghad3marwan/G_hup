import { discoverEvidence } from './evidence/EvidenceDomain.js';

/**
 * PuzzleDomain
 * ------------
 * محرك ألغاز عام لا يعرف محتوى أي قضية. التعريفات كلها تأتي من Case Data.
 * الأنواع المدعومة: keypad, combinationDial, text_password, sequenceClick.
 */
export function getPuzzle(caseData, puzzleId) {
  return (caseData?.puzzles || []).find((p) => p.id === puzzleId) || null;
}

export function getPuzzleState(state, puzzleId) {
  return state?.puzzleState?.[puzzleId] || { attempts: 0, solved: false, solvedAt: null };
}

export function isPuzzleSolved(state, puzzleId) {
  return !!getPuzzleState(state, puzzleId).solved;
}

export function submitPuzzle({ puzzleId, answer, caseData, stateManager, eventBus, now = Date.now() }) {
  const puzzle = getPuzzle(caseData, puzzleId);
  if (!puzzle) return { ok: false, reason: 'missing' };

  const current = getPuzzleState(stateManager.getState(), puzzleId);
  if (current.solved) return { ok: true, correct: true, alreadySolved: true };

  const correct = validateAnswer(puzzle, answer);
  stateManager.setState((state) => ({
    ...state,
    puzzleState: {
      ...(state.puzzleState || {}),
      [puzzleId]: {
        ...getPuzzleState(state, puzzleId),
        attempts: (getPuzzleState(state, puzzleId).attempts || 0) + 1,
        solved: correct,
        solvedAt: correct ? now : null,
        lastAttemptAt: now,
      },
    },
  }));

  if (!correct) {
    eventBus?.emit('puzzle:failed', { puzzleId });
    return { ok: true, correct: false };
  }

  applySuccessEffects({ puzzle, caseData, stateManager, eventBus, now });
  eventBus?.emit('puzzle:solved', { puzzleId });
  return { ok: true, correct: true };
}

export function validateAnswer(puzzle, answer) {
  const expected = puzzle?.solution;
  switch (puzzle?.type) {
    case 'keypad':
      return String(answer ?? '') === String(expected ?? '');
    case 'text_password': {
      const actualText = String(answer ?? '').trim();
      const expectedText = String(expected ?? '').trim();
      return puzzle.caseSensitive ? actualText === expectedText : actualText.toLocaleLowerCase() === expectedText.toLocaleLowerCase();
    }
    case 'combinationDial': {
      const actual = Array.isArray(answer) ? answer.map(Number) : [];
      const wanted = Array.isArray(expected) ? expected.map(Number) : [];
      return actual.length === wanted.length && actual.every((v, i) => v === wanted[i]);
    }
    case 'sequenceClick': {
      const actual = Array.isArray(answer) ? answer.map(String) : [];
      const wanted = Array.isArray(expected) ? expected.map(String) : [];
      return actual.length === wanted.length && actual.every((v, i) => v === wanted[i]);
    }
    default:
      return false;
  }
}

function applySuccessEffects({ puzzle, caseData, stateManager, eventBus, now }) {
  for (const effect of puzzle.successEffects || []) {
    if (effect.type === 'revealEvidence' && effect.evidenceId) {
      discoverEvidence({
        evidenceId: effect.evidenceId,
        source: { type: 'puzzle', puzzleId: puzzle.id },
        caseData,
        stateManager,
        eventBus,
      });
    } else if (effect.type === 'setFlag' && effect.key) {
      stateManager.setState((state) => ({ ...state, flags: { ...(state.flags || {}), [effect.key]: effect.value ?? true } }));
    } else if (effect.type === 'unlockDocument' && effect.documentId) {
      stateManager.setState((state) => ({
        ...state,
        documentState: {
          ...(state.documentState || {}),
          [effect.documentId]: { ...(state.documentState?.[effect.documentId] || {}), locked: false, unlockedAt: now },
        },
      }));
    } else if (effect.type === 'pushNotification') {
      stateManager.setState((state) => ({
        ...state,
        notifications: [
          ...(state.notifications || []),
          { id: `puzzle:${puzzle.id}:${now}:${Math.random().toString(36).slice(2,7)}`, title: effect.title || 'تم فتح عنصر جديد', message: effect.message || '', createdAt: now, read: false, targetSection: effect.targetSection || null },
        ],
      }));
    }
  }
}
