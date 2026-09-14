/**
 * sections.config.js
 * --------------------
 * تعريف الأقسام الرئيسية لـNavigation + Workspace Placeholder في هذه المرحلة.
 * هذا التكوين مؤقت خاص بـShell (Placeholder UI)، وليس CASE_DATA — لا علاقة
 * له بمحتوى أي قضية فعلية. لاحقًا (المرحلة الثالثة فصاعدًا) قد تتقاطع بعض
 * هذه المعرّفات مع أسماء أقسام حقيقية، لكن هذا الملف يبقى مسؤولية Shell فقط.
 */

export const SECTIONS = [
  { id: 'caseFile', label: 'ملف القضية', icon: 'caseFile', description: 'مقدمة القضية، رقم الملف، والمستندات الأولية.' },
  { id: 'crimeScene', label: 'مسرح الجريمة', icon: 'crimeScene', description: 'فحص المشهد واكتشاف التفاصيل تدريجيًا.' },
  { id: 'evidence', label: 'الأدلة', icon: 'evidence', description: 'كل دليل مكتشف بحالته ومصدره.' },
  { id: 'people', label: 'الأشخاص', icon: 'people', description: 'أرشيف الأشخاص وملفاتهم (Dossier).' },
  { id: 'lab', label: 'المختبر', icon: 'lab', description: 'تحاليل زمنية وتقارير فنية.' },
  { id: 'board', label: 'لوحة التحقيق', icon: 'board', description: 'الربط بين الأدلة والأشخاص والأحداث.' },
  { id: 'deduction', label: 'الاستنتاج', icon: 'deduction', description: 'الأسئلة الختامية وتقرير التحقيق النهائي.' },
];

export const GLOBAL_TOOLS = [
  { id: 'notebook', label: 'دفتر الملاحظات', icon: 'notebook' },
  { id: 'hints', label: 'التلميحات', icon: 'hints' },
  { id: 'notifications', label: 'الإشعارات', icon: 'notifications' },
];
