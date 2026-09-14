/**
 * migrateGameState
 * -----------------
 * Hook للترحيل بين إصدارات Save Schema. لا توجد خطوات ترحيل فعلية بعد
 * (لأن schemaVersion الحالي هو الأول)، لكن الآلية جاهزة وموصولة بالكامل
 * ضمن Boot Flow، بحيث تُبنى خطوات الترحيل الفعلية لاحقًا هنا فقط،
 * دون الحاجة لتعديل BootOrchestrator.
 *
 * كل خطوة تُسجَّل بمفتاح = رقم الإصدار المصدر (from)، وتُحوّل الحالة
 * إلى الإصدار الذي يليه مباشرة. الترحيل عبر إصدارات متعددة يتم بتطبيق
 * الخطوات تتابعيًا: v1→v2، ثم v2→v3، وهكذا.
 */

const migrationSteps = new Map([
  // مثال توضيحي لشكل خطوة مستقبلية (غير مفعّلة الآن):
  // [1, (state) => ({ ...state, someNewField: defaultValue })],
]);

/**
 * @param {object} state الحالة المحفوظة كما وُجدت
 * @param {number} fromVersion الإصدار الذي حُفظت به
 * @param {number} toVersion الإصدار الحالي المطلوب الوصول إليه
 * @returns {object} حالة متوافقة مع toVersion
 */
export function migrateGameState(state, fromVersion, toVersion) {
  if (fromVersion === toVersion) {
    return state;
  }

  if (fromVersion > toVersion) {
    console.warn(
      `[Migration] الحفظ المحلي بإصدار (${fromVersion}) أحدث من إصدار المحرك الحالي (${toVersion}). ` +
        'سيتم استخدام الحالة كما هي دون تعديل، وقد يسبب هذا سلوكًا غير متوقع.'
    );
    return state;
  }

  let current = state;
  let version = fromVersion;

  while (version < toVersion) {
    const step = migrationSteps.get(version);
    if (!step) {
      console.warn(
        `[Migration] لا توجد خطوة ترحيل مسجّلة من v${version} إلى v${version + 1}. ` +
          'تم إيقاف الترحيل عند هذه النقطة والإبقاء على باقي الحقول كما هي.'
      );
      break;
    }
    current = step(current);
    version += 1;
  }

  return { ...current, schemaVersion: version };
}

/**
 * لتسجيل خطوة ترحيل جديدة مستقبلًا من خارج هذا الملف عند الحاجة الفعلية.
 * @param {number} fromVersion
 * @param {(state: object) => object} stepFn
 */
export function registerMigrationStep(fromVersion, stepFn) {
  if (migrationSteps.has(fromVersion)) {
    throw new Error(`[Migration] توجد خطوة ترحيل مسجّلة مسبقًا من v${fromVersion}.`);
  }
  migrationSteps.set(fromVersion, stepFn);
}
