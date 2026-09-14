/**
 * StateManager
 * ------------
 * المصدر الوحيد للحقيقة بخصوص GameState أثناء التشغيل (Runtime).
 *
 * قواعد الاستخدام:
 * - لا يُعدَّل الكائن المُرجَع من getState() مباشرة من الخارج. أي تعديل
 *   يجب أن يمر عبر setState()/replaceState() حتى تُطلق إشعارات التغيير بشكل موثوق.
 * - StateManager نفسه "غبي": لا يعرف شيئًا عن معنى الحقول، فقط يخزّن وينشر التغييرات.
 *   المنطق (شروط/أفعال) يعيش في ConditionEngine/ActionEngine، وليس هنا.
 */

export class StateManager {
  #state;
  #listeners;

  constructor(initialState = null) {
    this.#state = initialState;
    this.#listeners = new Set();
  }

  /** إرجاع الحالة الحالية (قراءة فقط بالاتفاق، وليس بالإنفاذ التقني في هذه المرحلة). */
  getState() {
    return this.#state;
  }

  /**
   * استبدال الحالة بالكامل (يُستخدم عند New Game أو بعد Load/Migrate/Reconcile في Boot).
   */
  replaceState(newState) {
    this.#state = newState;
    this.#notify();
  }

  /**
   * تحديث جزئي عبر دالة (updater) تستقبل الحالة الحالية وتُرجع حالة جديدة.
   * هذا هو المسار الوحيد الذي يجب أن يستخدمه ActionEngine لتعديل الحالة.
   *
   * @param {(currentState: object) => object} updaterFn
   */
  setState(updaterFn) {
    const next = updaterFn(this.#state);
    if (next === undefined) {
      throw new Error(
        '[StateManager] updaterFn يجب أن يُرجع الحالة الجديدة (ولو كانت نفس الكائن)، لا "undefined".'
      );
    }
    this.#state = next;
    this.#notify();
  }

  /**
   * الاشتراك في تغييرات الحالة (تُستخدم لاحقًا من طبقة العرض للتحديث التفاعلي).
   * @param {(state: object) => void} listener
   * @returns {() => void} دالة لإلغاء الاشتراك
   */
  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #notify() {
    for (const listener of this.#listeners) {
      listener(this.#state);
    }
  }
}
