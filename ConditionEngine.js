/**
 * ConditionEngine
 * ---------------
 * يفسّر شجرة شروط (ConditionNode) دون معرفة مسبقة بمحتوى أي قضية.
 * كل نوع شرط "ورقة" (leaf) يُسجَّل في Registry خارجي عبر registerConditionType،
 * بحيث تستطيع الـ Domains (لاحقًا) إضافة أنواع شروط خاصة بها (evidenceFound،
 * questionAnswered...) دون تعديل هذا الملف.
 *
 * شكل ConditionNode:
 *   عقدة مركّبة:  { type: "all" | "any" | "not", nodes: ConditionNode[] }
 *   عقدة ورقة:    { type: "<اسم-مسجّل>", ...params }
 *
 * في Foundation نسجّل فقط شرطين عامّين لا يعتمدان على أي Domain:
 *   flagTrue   { key }         → state.flags[key] === true
 *   flagEquals { key, value }  → state.flags[key] === value
 * هذا يكفي لاختبار المحرك نفسه دون افتراض وجود نظام أدلة/أشخاص بعد.
 */

export class ConditionEngine {
  #leafEvaluators;

  constructor() {
    this.#leafEvaluators = new Map();
    this.#registerBuiltins();
  }

  /**
   * @param {string} type
   * @param {(params: object, context: { state: object, caseData: object }) => boolean} evaluatorFn
   */
  registerConditionType(type, evaluatorFn) {
    if (this.#leafEvaluators.has(type)) {
      throw new Error(`[ConditionEngine] نوع الشرط "${type}" مسجّل مسبقًا.`);
    }
    this.#leafEvaluators.set(type, evaluatorFn);
  }

  /**
   * @param {object} node ConditionNode أو null/undefined (تُعامل كـ "صحيح دائمًا")
   * @param {{ state: object, caseData: object }} context
   * @returns {boolean}
   */
  evaluate(node, context) {
    if (!node) return true; // غياب شرط = لا قيد

    switch (node.type) {
      case 'all':
        return (node.nodes || []).every((n) => this.evaluate(n, context));
      case 'any':
        return (node.nodes || []).some((n) => this.evaluate(n, context));
      case 'not':
        // ندعم صيغتين: { type:"not", node } أو { type:"not", nodes:[single] }
        if (node.node) return !this.evaluate(node.node, context);
        return !(node.nodes || []).every((n) => this.evaluate(n, context));
      default: {
        const evaluator = this.#leafEvaluators.get(node.type);
        if (!evaluator) {
          console.warn(
            `[ConditionEngine] نوع شرط غير مسجّل: "${node.type}". سيُعامَل كـ "false" احترازيًا.`
          );
          return false;
        }
        return Boolean(evaluator(node, context));
      }
    }
  }

  #registerBuiltins() {
    this.registerConditionType('flagTrue', (params, { state }) => {
      return Boolean(state?.flags?.[params.key]) === true;
    });

    this.registerConditionType('flagEquals', (params, { state }) => {
      return state?.flags?.[params.key] === params.value;
    });
  }
}
