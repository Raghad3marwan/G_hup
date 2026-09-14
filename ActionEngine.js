/**
 * ActionEngine
 * ------------
 * ينفّذ قائمة Actions بالترتيب، عبر Handlers مسجّلة لكل نوع (registerActionType).
 * كل Handler يستقبل (params, context) ويُحدّث الحالة حصرًا عبر
 * context.stateManager.setState(...) — لا تعديل مباشر لأي كائن حالة من خارج هذا المسار.
 *
 * في Foundation نسجّل فعلين عامّين لا يفترضان وجود أي Domain:
 *   setFlag { key, value }  → يكتب في state.flags
 *   log     { message }     → طباعة تشخيصية فقط (لا يُعدّل الحالة)
 * بقية الـ Actions (revealEvidence, unlockQuestion...) تُسجَّل لاحقًا من كل Domain
 * عند بنائه، دون أي تعديل على هذا الملف.
 */

export class ActionEngine {
  #handlers;

  constructor() {
    this.#handlers = new Map();
    this.#registerBuiltins();
  }

  /**
   * @param {string} type
   * @param {(params: object, context: { stateManager: object, eventBus: object, caseData: object }) => void} handlerFn
   */
  registerActionType(type, handlerFn) {
    if (this.#handlers.has(type)) {
      throw new Error(`[ActionEngine] نوع الفعل "${type}" مسجّل مسبقًا.`);
    }
    this.#handlers.set(type, handlerFn);
  }

  /**
   * @param {object|object[]} actions فعل واحد أو مصفوفة أفعال
   * @param {{ stateManager: object, eventBus: object, caseData: object }} context
   */
  execute(actions, context) {
    const list = Array.isArray(actions) ? actions : [actions];
    for (const action of list) {
      const handler = this.#handlers.get(action.type);
      if (!handler) {
        console.warn(`[ActionEngine] نوع فعل غير مسجّل: "${action.type}". تم تجاوزه.`);
        continue;
      }
      handler(action.params || {}, context);
    }
  }

  #registerBuiltins() {
    this.registerActionType('setFlag', (params, { stateManager }) => {
      stateManager.setState((state) => ({
        ...state,
        flags: { ...state.flags, [params.key]: params.value },
      }));
    });

    this.registerActionType('log', (params) => {
      // فعل تشخيصي فقط، مفيد لاختبار أن Rule Engine يعمل من طرف لطرف.
      console.log(`[Rule:log] ${params.message ?? ''}`);
    });
  }
}
