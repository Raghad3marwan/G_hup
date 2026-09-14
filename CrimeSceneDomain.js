/**
 * CrimeSceneDomain — منطق عام لمسرح الجريمة.
 * لا يعرف شيئًا عن محتوى القضية؛ يتعامل فقط مع sceneId/hotspotId من CaseData.
 */
export function interactHotspot({ sceneId, hotspotId, caseData, stateManager, eventBus }) {
  const scene = (caseData.crimeScenes || []).find((item) => item.id === sceneId);
  if (!scene) throw new Error(`[CrimeSceneDomain] مشهد غير موجود: ${sceneId}`);
  const hotspot = (scene.hotspots || []).find((item) => item.id === hotspotId);
  if (!hotspot) throw new Error(`[CrimeSceneDomain] نقطة غير موجودة: ${hotspotId}`);

  const now = Date.now();
  stateManager.setState((state) => {
    const crimeSceneState = state.crimeSceneState || {};
    const sceneState = crimeSceneState[sceneId] || { visited: true, discoveredHotspots: {} };
    return {
      ...state,
      crimeSceneState: {
        ...crimeSceneState,
        [sceneId]: {
          ...sceneState,
          visited: true,
          discoveredHotspots: {
            ...(sceneState.discoveredHotspots || {}),
            [hotspotId]: { discovered: true, discoveredAt: sceneState.discoveredHotspots?.[hotspotId]?.discoveredAt || now },
          },
        },
      },
    };
  });

  eventBus?.emit('crimeScene:hotspotInteracted', { sceneId, hotspotId, type: hotspot.type, targetRef: hotspot.targetRef || null });
  return hotspot;
}

export function markSceneVisited({ sceneId, stateManager }) {
  stateManager.setState((state) => ({
    ...state,
    crimeSceneState: {
      ...(state.crimeSceneState || {}),
      [sceneId]: {
        ...(state.crimeSceneState?.[sceneId] || {}),
        visited: true,
        discoveredHotspots: state.crimeSceneState?.[sceneId]?.discoveredHotspots || {},
      },
    },
  }));
}
