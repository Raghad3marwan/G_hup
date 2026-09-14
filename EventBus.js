/**
 * EventBus
 * --------
 * ناقل أحداث داخلي بسيط (Pub/Sub) يربط بين الأقسام دون اقتران مباشر بينها،
 * ويُستخدم من RuleEngine كمصدر Triggers للقواعد المعرّفة في CASE_DATA.
 */

export class EventBus {
  #handlers;

  constructor() {
    this.#handlers = new Map(); // eventName -> Set<handler>
  }

  /**
   * @param {string} eventName
   * @param {(payload: any) => void} handler
   * @returns {() => void} دالة لإلغاء الاشتراك
   */
  on(eventName, handler) {
    if (!this.#handlers.has(eventName)) {
      this.#handlers.set(eventName, new Set());
    }
    this.#handlers.get(eventName).add(handler);
    return () => this.off(eventName, handler);
  }

  off(eventName, handler) {
    this.#handlers.get(eventName)?.delete(handler);
  }

  /**
   * إصدار حدث. يُنفَّذ كل المستمعين بشكل متزامن بالترتيب الذي اشتركوا فيه.
   * @param {string} eventName
   * @param {any} payload
   */
  emit(eventName, payload) {
    const set = this.#handlers.get(eventName);
    if (!set) return;
    // ننسخ المجموعة قبل التكرار حتى لا تتأثر بأي on()/off() يحدث أثناء التنفيذ.
    for (const handler of [...set]) {
      handler(payload);
    }
  }
}
