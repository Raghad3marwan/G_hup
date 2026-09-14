/**
 * RuleEngine
 * ----------
 * الغراء الذي يربط بين EventBus + ConditionEngine + ActionEngine + قواعد CASE_DATA
 * (البند 7 من Architecture Plan: Condition / Action / Event Architecture).
 *
 * ملاحظة تنفيذية: هذا الملف لم يُطلب صراحةً كعنصر منفصل في قائمة Foundation،
 * لكنه ضروري ليكون لدى "محرك شروط/أفعال/أحداث" معنى فعليًا قابلًا للتشغيل
 * بدل ثلاث وحدات منفصلة بلا وصل بينها. تفصيل هذا القرار مذكور في ملخص التسليم.
 *
 * شكل Rule داخل CASE_DATA.rules:
 *   { id, trigger, conditions?: ConditionNode, actions: Action[] }
 *
 * الفهرسة تتم حسب trigger عند التحميل (registerRules) بدل مسح خطي لكل الأحداث،
 * تحسبًا لتضخم عدد القواعد لاحقًا (خطر معماري وارد في القسم 22 من الخطة).
 */

export class RuleEngine {
  #eventBus;
  #conditionEngine;
  #actionEngine;
  #rulesByTrigger; // Map<triggerName, Rule[]>
  #unsubscribers;
  #context; // { stateManager, caseData } - يُضبط عبر attachContext بعد Boot

  constructor({ eventBus, conditionEngine, actionEngine }) {
    this.#eventBus = eventBus;
    this.#conditionEngine = conditionEngine;
    this.#actionEngine = actionEngine;
    this.#rulesByTrigger = new Map();
    this.#unsubscribers = [];
    this.#context = null;
  }

  /**
   * يسجّل مجموعة قواعد (عادة من caseData.rules) ويربطها بـ EventBus.
   * يُستدعى مرة واحدة بعد تحميل CASE_DATA في Boot.
   * @param {object[]} rules
   */
  registerRules(rules = []) {
    for (const rule of rules) {
      if (!this.#rulesByTrigger.has(rule.trigger)) {
        this.#rulesByTrigger.set(rule.trigger, []);
      }
      this.#rulesByTrigger.get(rule.trigger).push(rule);
    }

    for (const triggerName of this.#rulesByTrigger.keys()) {
      const unsub = this.#eventBus.on(triggerName, (payload) =>
        this.#handleTrigger(triggerName, payload)
      );
      this.#unsubscribers.push(unsub);
    }
  }

  /**
   * إزالة كل الاشتراكات والقواعد المسجّلة وسياق القضية السابق.
   * يجب استدعاؤها قبل كل registerRules() جديد (يفعل BootOrchestrator هذا
   * تلقائيًا في بداية كل Boot) — تمنع تكرار تنفيذ نفس القاعدة عدة مرات
   * إذا شُغِّل Boot أكثر من مرة في نفس الجلسة على نفس RuleEngine/EventBus.
   */
  dispose() {
    this.#unsubscribers.forEach((unsub) => unsub());
    this.#unsubscribers = [];
    this.#rulesByTrigger.clear();
    this.#context = null;
  }

  #handleTrigger(triggerName, payload) {
    if (!this.#context) {
      console.warn(
        `[RuleEngine] تم إطلاق "${triggerName}" قبل attachContext(). تم تجاهل القواعد المرتبطة به.`
      );
      return;
    }
    const rules = this.#rulesByTrigger.get(triggerName) || [];
    for (const rule of rules) {
      const context = {
        state: this.#context.stateManager.getState(),
        caseData: this.#context.caseData,
      };
      const passed = this.#conditionEngine.evaluate(rule.conditions, context);
      if (!passed) continue;

      this.#actionEngine.execute(rule.actions, {
        stateManager: this.#context.stateManager,
        eventBus: this.#eventBus,
        caseData: this.#context.caseData,
      });
    }
  }

  /**
   * يجب استدعاؤها بعد Boot لتزويد RuleEngine بمرجع stateManager/caseData الحاليين.
   * (تُفصَل عن الـ constructor لأن caseData/stateManager غير جاهزين إلا بعد
   * اكتمال مراحل Boot الأولى — انظر BootOrchestrator).
   */
  attachContext({ stateManager, caseData }) {
    this.#context = { stateManager, caseData };
  }
}
