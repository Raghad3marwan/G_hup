window.CASE_DATA = {
  meta: {
    id: 'case-natural-death',
    caseNumber: 'JNY-ND-001',
    title: 'الموت الذي بدا طبيعيًا',
    schemaVersion: 1,
    releaseLabel: 'CASE BUILD 1 · SOURCE LOCKED'
  },

  caseFile: {
    fileNumber: 'JNY-ND-001',
    classification: 'وفاة غير متوقعة داخل جناح تعافٍ قصير — سبب الوفاة قيد التحقق',
    location: 'جناح تعافٍ قصير داخل مركز خاص · غرفة 02',
    initialClassification: 'وفاة قد تبدو طبيعية مبدئيًا بسبب عامل صحي سابق',
    status: 'تحقيق مفتوح',
    foundAt: '22:20',
    briefing: 'عُثر على جوليان غير مستجيب داخل غرفة 02. الغرفة مرتبة ولا يظهر اقتحام أو سرقة أو صراع واضح. توجد حالة صحية سابقة تجعل تفسيرًا طبيعيًا ممكنًا في البداية، لكن الملف يحتاج إلى فحص طبي وتشغيلي مستقل قبل اعتماد أي استنتاج.',
    initialFacts: [
      'غرفة 02 في منتصف الجناح، وبابها لا يسجل الداخلين إلكترونيًا.',
      'لا توجد كاميرا داخل الغرفة ولا كاميرا ترى بابها مباشرة.',
      'الكاميرات C01 وC02 وC03 تعمل بصورة طبيعية.',
      'آخر متابعة موثوقة لجوليان كانت عند 21:12، ووقت اكتشاف الحالة 22:20.'
    ],
    objectives: [
      'حدد هل تفسر الحالة الصحية السابقة الوفاة أم لا.',
      'افصل بين المخالفات الجانبية وبين ما يثبت سبب الوفاة والمسؤول عنها.',
      'اختبر الروايات بالأدلة المستقلة دون اعتبار أي شخص مذنبًا مسبقًا.'
    ],
    warning: 'الاستجوابات والمواجهات داعمة للتحقيق وليست شرطًا لفتح بوابة الاستنتاج النهائي.'
  },

  people: [
    {
      id:'julian', fileNumber:'P-001', name:'جوليان', initials:'ج', role:'victim', publicRoleLabel:'مدير مالي تنفيذي', statusLabel:'ملف الضحية', image:'./cases/case-natural-death/assets/people/julian.svg',
      capabilities:{interrogation:false}, subtitle:'52 عامًا · مدير مالي تنفيذي', attachmentsCount:2,
      identity:{age:'52 عامًا',sex:'ذكر',occupation:'مدير مالي تنفيذي',employer:'المركز الخاص'},
      personality:{summary:'إداري دقيق كان يجري مراجعة مالية داخلية.',traits:['منظم','دقيق']},
      timeline:[
        {time:'19:10',text:'في غرفة 02 وحالته مستقرة.'},{time:'19:35',text:'يتجه إلى تعليق اعتماد مجموعة فواتير للمراجعة صباحًا.'},{time:'19:52',text:'يتسلم مستندًا ماليًا من لينا.'},{time:'21:12',text:'آخر متابعة موثوقة: واعٍ ومتجاوب.'},{time:'22:20',text:'عُثر عليه غير مستجيب وبدأت إجراءات الطوارئ.'}
      ], relations:[]
    },
    {
      id:'elias', fileNumber:'P-002', name:'إلياس', initials:'إ', role:'person', publicRoleLabel:'مدير تشغيل المركز', statusLabel:'ملف شخص', image:'./cases/case-natural-death/assets/people/elias.svg',
      capabilities:{interrogation:true}, subtitle:'46 عامًا · مدير تشغيل المركز', attachmentsCount:1,
      identity:{age:'46 عامًا',sex:'ذكر',occupation:'مدير تشغيل المركز',employer:'المركز الخاص'},
      personality:{summary:'مدير تشغيل عملي ورسمي، وتُفحص روايته بالمواد التشغيلية المستقلة.',traits:['عملي','رسمي']},timeline:[],relations:[]
    },
    {
      id:'mira', fileNumber:'P-003', name:'ميرا', initials:'م', role:'person', publicRoleLabel:'مشرفة الرعاية الليلية', statusLabel:'ملف شخص', image:'./cases/case-natural-death/assets/people/mira.svg',
      capabilities:{interrogation:true}, subtitle:'38 عامًا · مشرفة الرعاية الليلية', attachmentsCount:1,
      identity:{age:'38 عامًا',sex:'أنثى',occupation:'مشرفة الرعاية الليلية',employer:'المركز الخاص'},
      personality:{summary:'مشرفة رعاية ليلية؛ يجب فصل أي تقصير مهني عن سبب الوفاة.',traits:['مهنية','متعبة تحت الضغط']},timeline:[],relations:[]
    },
    {
      id:'adam', fileNumber:'P-004', name:'آدم', initials:'آ', role:'person', publicRoleLabel:'مسؤول الأنظمة', statusLabel:'ملف شخص', image:'./cases/case-natural-death/assets/people/adam.svg',
      capabilities:{interrogation:true}, subtitle:'34 عامًا · مسؤول الأنظمة', attachmentsCount:1,
      identity:{age:'34 عامًا',sex:'ذكر',occupation:'مسؤول الأنظمة',employer:'المركز الخاص'},
      personality:{summary:'مسؤول تقني، ويحتاج حذف ملف إعداد إلى تفسير مستقل عن الوفاة.',traits:['تقني','حذر']},timeline:[],relations:[]
    },
    {
      id:'lina', fileNumber:'P-005', name:'لينا', initials:'ل', role:'person', publicRoleLabel:'منسقة الملفات', statusLabel:'ملف شخص', image:'./cases/case-natural-death/assets/people/lina.svg',
      capabilities:{interrogation:true}, subtitle:'31 عامًا · منسقة الملفات', attachmentsCount:1,
      identity:{age:'31 عامًا',sex:'أنثى',occupation:'منسقة الملفات',employer:'المركز الخاص'},
      personality:{summary:'منسقة ملفات ارتبط مسارها بوصول مستند مالي إلى جوليان.',traits:['إدارية','متحفظة']},timeline:[],relations:[]
    },
    {
      id:'nader', fileNumber:'P-006', name:'نادر', initials:'ن', role:'person', publicRoleLabel:'مسؤول الخدمات والمخزون', statusLabel:'ملف شخص', image:'./cases/case-natural-death/assets/people/nader.svg',
      capabilities:{interrogation:true}, subtitle:'42 عامًا · مسؤول الخدمات والمخزون', attachmentsCount:1,
      identity:{age:'42 عامًا',sex:'ذكر',occupation:'مسؤول الخدمات والمخزون',employer:'المركز الخاص'},
      personality:{summary:'حركة ليلية عبر ممر الخدمة تحتاج مطابقة مع السجلات والكاميرات.',traits:['هادئ','عملي']},timeline:[],relations:[]
    },
    {
      id:'salim', fileNumber:'P-007', name:'سليم', initials:'س', role:'person', publicRoleLabel:'مسؤول الاستقبال والأمن الليلي', statusLabel:'ملف شخص', image:'./cases/case-natural-death/assets/people/salim.svg',
      capabilities:{interrogation:true}, subtitle:'45 عامًا · مسؤول الاستقبال والأمن الليلي', attachmentsCount:1,
      identity:{age:'45 عامًا',sex:'ذكر',occupation:'مسؤول الاستقبال والأمن الليلي',employer:'المركز الخاص'},
      personality:{summary:'مسؤول استقبال ليلي؛ زاوية الاستقبال لا ترى باب غرفة 02 مباشرة.',traits:['يقظ','متحفظ']},timeline:[],relations:[]
    }
  ],

  evidenceFamilies: [
    {id:'E01',reference:'E01',title:'مسرح الواقعة',description:'مخطط غرفة 02 والجناح.',initiallyVisible:true},
    {id:'E02',reference:'E02',title:'التقرير الطبي الأولي',description:'تقرير الاستجابة والفحص الأول.'},
    {id:'E03',reference:'E03',title:'المراجعة الطبية الشرعية',description:'نتيجة المراجعة الطبية الموسعة.'},
    {id:'E04',reference:'E04',title:'سجل الرعاية والتدقيق',description:'سجل المتابعة مع سجل النظام.'},
    {id:'E05',reference:'E05',title:'سجلات الوصول',description:'بوابات مناطق الموظفين.'},
    {id:'E06',reference:'E06',title:'السجل التشغيلي',description:'سجل نظام الخدمة.'},
    {id:'E07',reference:'E07',title:'الكاميرات',description:'لقطات C01 وC02 وC03.'},
    {id:'E08',reference:'E08',title:'المستند المالي',description:'ملفات جوليان والفواتير.'},
    {id:'E09',reference:'E09',title:'الأثر الطبي التشغيلي',description:'خطة الرعاية مع جرد/وصول مستقل.'},
    {id:'E10',reference:'E10',title:'الدليل الرابط',description:'مطابقة مستقلة بين الزمن والوصول والأثر التشغيلي.'},
    {id:'E11',reference:'E11',title:'ملف آدم المحذوف',description:'استعادة تقنية لملف الإعداد.'}
  ],

  evidence: [
    {
      id:'E01',familyId:'E01',reference:'E01',title:'مسرح الواقعة',shortTitle:'مسرح الواقعة',type:'document',initiallyAvailable:true,
      subtitle:'مخطط غرفة 02 والجناح',foundAt:'غرفة 02 · جناح التعافي',
      initialObservation:'غرفة مرتبة، لا اقتحام ولا صراع ظاهر ولا سرقة. يظهر المخطط السرير والطاولة والكرسي والحمام والباب ونقطة الاستدعاء والممر.',
      examination:{finding:'المشهد لا يقدم سبب وفاة عنيفًا ظاهرًا.',details:['باب غرفة 02 لا يسجل الداخلين إلكترونيًا.','لا توجد كاميرا داخل الغرفة ولا كاميرا ترى بابها مباشرة.','المشهد وحده لا يثبت أن الوفاة طبيعية ولا يحدد شخصًا.']},analysis:{required:false},
      document:{kindLabel:'JINAYAT / SCENE RECORD',title:'محضر معاينة غرفة 02',reportNumber:'E01',preview:'الغرفة مرتبة إجمالًا ولا يظهر اقتحام أو صراع ظاهر.',sections:[{title:'المعاينة',body:['لا اقتحام ظاهر.','لا سرقة ظاهرة.','لا صراع ظاهر.','باب الغرفة بلا سجل دخول إلكتروني.']},{title:'حدود المعاينة',body:'غياب العلامات الظاهرة لا يثبت أن الوفاة طبيعية.'}]}
    },
    {
      id:'E02',familyId:'E02',reference:'E02',title:'التقرير الطبي الأولي',shortTitle:'التقرير الطبي الأولي',type:'forensic_report',
      unlockWhen:{type:'evidenceExamined',evidenceId:'E01'},subtitle:'تقرير الاستجابة والفحص الأول',foundAt:'ملف الاستجابة الطبية',
      initialObservation:'وفاة غير متوقعة مع عامل صحي سابق يجعل سببًا طبيعيًا ممكنًا مبدئيًا، ولا إصابة خارجية تفسر الوفاة.',
      examination:{finding:'التفسير الطبيعي كان ممكنًا مبدئيًا فقط.',details:['لا يثبت التقرير قتلًا.','لا يحدد مسؤولًا.','بعد قراءة التقرير يمكن طلب A01: مراجعة طبية شرعية موسعة.']},
      analysis:{required:true,type:'A01_medical_review',durationMs:5000,protocol:'A01 · مراجعة طبية شرعية موسعة للنتائج المسجلة دون عرض جرعات أو خطوات تنفيذية.',activeMessage:'تُراجع المعطيات الطبية المسجلة بصورة موسعة.',result:{title:'A01 · اكتملت المراجعة الطبية الشرعية',summary:'النتائج المجمعة لا تتوافق مع الحالة الصحية السابقة وحدها.',findings:['توجد دلائل على تثبيط وعي شديد غير مفسر بخطة الرعاية.','توجد دلالة على حدث قاتل ثانوي أثناء العجز.','النتيجة لا تحدد المسؤول ولا تعرض جرعات أو طريقة تنفيذ.'],investigatorNote:'أصبح E03 متاحًا كالتقرير النهائي بعد اعتماد قراءة هذه النتيجة.'}}
    },
    {
      id:'E03',familyId:'E03',reference:'E03',title:'المراجعة الطبية الشرعية',shortTitle:'التقرير النهائي',type:'forensic_report',
      unlockWhen:{type:'evidenceResultRead',evidenceId:'E02'},subtitle:'التقرير النهائي',foundAt:'نتيجة A01',
      initialObservation:'النتائج مجتمعة لا تتوافق مع الحالة السابقة وحدها؛ توجد دلائل على تثبيط وعي شديد غير مفسر بخطة الرعاية مع حدث قاتل ثانوي أثناء العجز.',
      examination:{finding:'الوفاة لا تفسر طبيعيًا وحدها.',details:['لا يحدد التقرير المسؤول.','لا يعرض جرعات أو طريقة تنفيذ.']},analysis:{required:false}
    },
    {
      id:'E04',familyId:'E04',reference:'E04',title:'سجل الرعاية والتدقيق',shortTitle:'سجل الرعاية والتدقيق',type:'digital_log',
      unlockWhen:{type:'evidenceExamined',evidenceId:'E02'},subtitle:'سجل المتابعة + سجل النظام',foundAt:'نظام الرعاية',
      initialObservation:'متابعة 21:12 موثوقة. إدخال 22:05 أُنشئ فعليًا بعد الاكتشاف وعدلته ميرا.',
      examination:{finding:'ميرا أخفت تقصيرًا مهنيًا وأن بعض الأعراض أضيفت لاحقًا.',details:['لا يثبت أن ميرا سببت الوفاة.','وقت الإنشاء الحقيقي محفوظ في سجل التدقيق.']},analysis:{required:false}
    },
    {
      id:'E05',familyId:'E05',reference:'E05',title:'سجلات الوصول',shortTitle:'سجلات الوصول',type:'digital_log',
      unlockWhen:{type:'evidenceExamined',evidenceId:'E01'},subtitle:'بوابات مناطق الموظفين',foundAt:'نظام البوابات الداخلية',
      initialObservation:'تثبت السجلات عبور أشخاص إلى نطاقات داخلية، ولا يوجد سجل لباب غرفة 02.',
      examination:{finding:'السجلات تثبت إمكانية الوصول إلى النطاق، لا دخول غرفة جوليان.',details:['لا يوجد سجل إلكتروني لباب غرفة 02.','وجود شخص في النطاق لا يثبت دخوله الغرفة.']},analysis:{required:false}
    },
    {
      id:'E06',familyId:'E06',reference:'E06',title:'السجل التشغيلي',shortTitle:'السجل التشغيلي',type:'digital_log',
      unlockWhen:{type:'evidenceExamined',evidenceId:'E05'},subtitle:'نظام الخدمة',foundAt:'نظام الخدمة',
      initialObservation:'المهمة التي يقول إلياس إنه نفذها لم تسجل في وقت روايته؛ الحدث المرتبط بها وقع لاحقًا.',
      examination:{finding:'رواية إلياس الزمنية لا تطابق النظام المستقل.',details:['هذا لا يثبت أنه كان داخل غرفة جوليان.','كسر الرواية وحده لا يكفي لإسناد الوفاة.']},analysis:{required:false}
    },
    {
      id:'E07',familyId:'E07',reference:'E07',title:'الكاميرات',shortTitle:'الكاميرات C01–C03',type:'camera',
      unlockWhen:{type:'evidenceExamined',evidenceId:'E05'},subtitle:'C01 وC02 وC03',foundAt:'نظام المراقبة',
      initialObservation:'لا كاميرا ترى باب غرفة 02. اللقطات تستبعد لينا في جزء جوهري، تفسر حركة نادر، وتكشف غياب سليم عن الاستقبال.',
      examination:{finding:'اللقطات تضيق الفرص وتختبر بعض الروايات لكنها لا تصور الجريمة.',details:['لا توجد كاميرا داخل غرفة 02.','لا توجد كاميرا ترى باب غرفة 02 مباشرة.']},analysis:{required:false}
    },
    {
      id:'E08',familyId:'E08',reference:'E08',title:'المستند المالي',shortTitle:'المستند المالي',type:'document',
      unlockWhen:{type:'personQuestionAnswered',personId:'lina',questionId:'Q-L01'},subtitle:'ملفات جوليان والفواتير',foundAt:'مسار ملفات جوليان / لينا',
      initialObservation:'فواتير أعلى من حجم الخدمة المثبت تشغيليًا، وصلاحيات إلياس مرتبطة بالعقود، وجوليان كان متجهًا لتعليقها للمراجعة.',
      examination:{finding:'يوجد دافع واقعي واتجاه للمراجعة نحو نطاق مسؤولية إلياس.',details:['المستند المالي لا يثبت القتل.','هذا المسار داعم وليس شرطًا لفتح G01.']},analysis:{required:false}
    },
    {
      id:'E09',familyId:'E09',reference:'E09',title:'الأثر الطبي التشغيلي',shortTitle:'الأثر الطبي التشغيلي',type:'forensic_report',
      unlockWhen:{type:'all',nodes:[{type:'evidenceExamined',evidenceId:'E03'},{type:'evidenceExamined',evidenceId:'E05'}]},subtitle:'خطة الرعاية + جرد/وصول مستقل',foundAt:'مطابقة الرعاية مع الجرد والوصول',
      initialObservation:'عدم تطابق بين خطة جوليان الموثقة والأثر الطبي الذي كشفته المراجعة، والوصول للمصدر ذي الصلة محدود.',
      examination:{finding:'ما حدث لا ينسجم مع خطة الرعاية ودائرة الوصول محدودة.',details:['لا يحدد إلياس وحده.','لا يعرض جرعات.','بعد القراءة يمكن طلب A02: مطابقة الأثر الطبي التشغيلي مع الوصول والزمن.']},
      analysis:{required:true,type:'A02_operational_match',durationMs:5000,protocol:'A02 · مطابقة مستقلة بين الأثر الطبي التشغيلي والوصول والزمن دون كتابة اسم الجاني في النتيجة.',activeMessage:'تُجرى المطابقة المستقلة بين الزمن والوصول والأثر التشغيلي.',result:{title:'A02 · اكتملت المطابقة المستقلة',summary:'ظهرت مطابقة ذات قيمة بين الفترة الحرجة والوصول والأثر التشغيلي.',findings:['المطابقة متوافقة مع سجل الوصول ومع انهيار رواية المهمة التشغيلية.','النتيجة لا تكتب اسم الجاني ولا تكفي منفردة لتفسير الدافع.'],investigatorNote:'بعد اعتماد النتيجة ومع قراءة E06 يصبح E10 متاحًا.'}}
    },
    {
      id:'E10',familyId:'E10',reference:'E10',title:'الدليل الرابط',shortTitle:'الدليل الرابط',type:'forensic_report',
      unlockWhen:{type:'all',nodes:[{type:'evidenceResultRead',evidenceId:'E09'},{type:'evidenceExamined',evidenceId:'E06'}]},subtitle:'مطابقة مستقلة بين الزمن والوصول والأثر التشغيلي',foundAt:'نتيجة A02 + السجل التشغيلي',
      initialObservation:'دليل مستقل يربط عنصرًا من نطاق سيطرة إلياس بالفترة الحرجة ويتوافق مع سجل وصوله وانهيار رواية المهمة.',
      examination:{finding:'عند جمعه مع بقية CORE يربط إلياس بالفعل في الفترة الحرجة.',details:['لا يكفي منفردًا لتفسير الدافع.','لا يفسر تزوير ميرا.']},analysis:{required:false}
    },
    {
      id:'E11',familyId:'E11',reference:'E11',title:'ملف آدم المحذوف',shortTitle:'ملف آدم المحذوف',type:'digital_log',
      unlockWhen:{type:'personQuestionAnswered',personId:'adam',questionId:'Q-A01'},subtitle:'استعادة تقنية',foundAt:'استعادة تقنية بعد استجواب آدم',
      initialObservation:'الملف يخص إعدادًا تقنيًا غير مصرح به سابقًا ولا يغير سجلات الرعاية أو الوصول المتعلقة بالوفاة.',
      examination:{finding:'حذف آدم تستر على مخالفة منفصلة.',details:['لا يثبت براءته وحده.','يفصل الحذف عن آلية الوفاة.']},analysis:{required:false}
    }
  ],

  documents: [],
  crimeScenes: [
    {
      id:'scene-room-02',name:'غرفة 02 والجناح',reference:'SCN-01',image:'./cases/case-natural-death/assets/crime-scenes/room-02.svg',
      alt:'مخطط مرجعي لغرفة 02 والجناح',description:'غرفة جوليان في منتصف الجناح. المخطط يوضح حدود الرؤية والمسافات التقريبية دون إضافة كاميرا أو سجل دخول غير موجودين في المصدر.',
      hotspots:[
        {id:'hs-room',type:'scene_detail',x:27,y:45,size:12,title:'غرفة 02',description:'الغرفة مرتبة إجمالًا: لا اقتحام، لا سرقة، لا صراع ظاهر.',targetRef:'E01'},
        {id:'hs-door',type:'scene_detail',x:45,y:67,size:8,title:'باب غرفة 02',description:'لا يسجل الداخلين إلكترونيًا، ولا توجد كاميرا ترى الباب مباشرة.'},
        {id:'hs-followup',type:'scene_detail',x:58,y:57,size:8,title:'محطة المتابعة',description:'تبعد نحو 7–9 أمتار عن غرفة 02، وترى جزءًا من الممر فقط ولا ترى داخل الغرفة.'},
        {id:'hs-reception',type:'scene_detail',x:58,y:34,size:8,title:'الاستقبال',description:'يبعد نحو 14–17 مترًا، وزاوية الممر تحجب باب غرفة 02 عن الرؤية المباشرة.'}
      ]
    }
  ],

  interrogations: {
    elias:{
      heading:'استجواب إلياس',intro:'الاستجواب داعم؛ الحقيقة الأساسية يجب أن تأتي من الدليل المستقل.',wrongConfrontationResponse:'هذا الدليل لا يناقض هذه الإجابة مباشرة.',
      questions:[
        {id:'Q-E01',text:'أين كنت بين 21:20 و21:45؟',answer:'كنت أتعامل مع مشكلة تشغيلية في منطقة الخدمة.'},
        {id:'Q-E02',text:'هل كنت تعلم بمراجعة جوليان للفواتير؟',answer:'كنت أعلم أنه يراجع مصروفات عامة فقط.'},
        {id:'Q-E03',text:'هل دخلت غرفة جوليان؟',answer:'لا أتذكر أنني دخلتها تلك الليلة.'}
      ],
      confrontations:[{id:'C02',label:'اختبار رواية المهمة التشغيلية',prompt:'قارن رواية إلياس عن مهمته بالسجل التشغيلي.',evidenceId:'E06',unlockWhen:{type:'all',nodes:[{type:'personQuestionAnswered',personId:'elias',questionId:'Q-E01'},{type:'evidenceExamined',evidenceId:'E06'}]},response:'قد أكون أخطأت في ترتيب الوقت؛ كانت الليلة مزدحمة.'}]
    },
    mira:{
      heading:'استجواب ميرا',intro:'افصل بين التقصير المهني وبين سبب الوفاة.',wrongConfrontationResponse:'هذا الدليل لا يناقض هذه الإجابة مباشرة.',
      questions:[{id:'Q-M01',text:'هل أجريت متابعة 22:05؟',answer:'نعم، وسجلتها لاحقًا بسبب ضغط العمل.'},{id:'Q-M02',text:'لماذا تغيرت صياغة حالة جوليان؟',answer:'كتبت ما تذكرته بعد الطوارئ.'}],
      confrontations:[{id:'C01',label:'اختبار متابعة 22:05',prompt:'قارن إفادة ميرا بسجل الرعاية والتدقيق.',evidenceId:'E04',unlockWhen:{type:'all',nodes:[{type:'personQuestionAnswered',personId:'mira',questionId:'Q-M01'},{type:'evidenceExamined',evidenceId:'E04'}]},response:'تعترف أنها لم تدخل في الموعد وأضافت الملاحظة خوفًا من المساءلة.'}]
    },
    adam:{
      heading:'استجواب آدم',intro:'تحقق من صلة الملف المحذوف بالوفاة قبل البناء عليه.',wrongConfrontationResponse:'هذا الدليل لا يناقض هذه الإجابة مباشرة.',
      questions:[{id:'Q-A01',text:'لماذا حذفت ملف إعداد النظام؟',answer:'كان ملفًا قديمًا وغير مستخدم.'},{id:'Q-A02',text:'هل عدلت سجلات الدخول أو الرعاية؟',answer:'لا.'}],
      confrontations:[{id:'C03',label:'اختبار سبب حذف الملف',prompt:'واجه آدم بنتيجة الاستعادة التقنية.',evidenceId:'E11',unlockWhen:{type:'all',nodes:[{type:'personQuestionAnswered',personId:'adam',questionId:'Q-A01'},{type:'evidenceExamined',evidenceId:'E11'}]},response:'يعترف بإعداد تقني غير مصرح به سابقًا وحذفه خوفًا من التدقيق.'}]
    },
    lina:{
      heading:'استجواب لينا',intro:'مسار لينا يفسر وصول المستند وكيف علم إلياس بالمراجعة.',wrongConfrontationResponse:'هذا الدليل لا يناقض هذه الإجابة مباشرة.',
      questions:[{id:'Q-L01',text:'هل سلمت جوليان مستندًا مساءً؟',answer:'أرسلت له ما كان مصرحًا لي بإرساله.'},{id:'Q-L02',text:'هل أخبرت إلياس بطلب جوليان؟',answer:'سألني عن سبب بحثي في الملفات فأخبرته أن جوليان طلب مستندًا.'}],
      confrontations:[{id:'C04',label:'اختبار مسار المستند',prompt:'قارن إفادة لينا بالمستند المالي.',evidenceId:'E08',unlockWhen:{type:'all',nodes:[{type:'personQuestionAnswered',personId:'lina',questionId:'Q-L01'},{type:'evidenceExamined',evidenceId:'E08'}]},response:'تعترف بتجاوز المسار الإداري.'}]
    },
    nader:{
      heading:'استجواب نادر',intro:'حركة الخدمة لا تعني بالضرورة صلة بالوفاة.',wrongConfrontationResponse:'هذا الدليل لا يناقض هذه الإجابة مباشرة.',
      questions:[{id:'Q-N01',text:'لماذا ظهرت قرب خروج الخدمة؟',answer:'كنت أنقل مستلزمات للمخزن.'},{id:'Q-N02',text:'لماذا لم تسجل الحركة؟',answer:'أنهيت المهمة سريعًا ونسيت إدخالها.'}],
      confrontations:[{id:'C05',label:'اختبار حركة ممر الخدمة',prompt:'قارن حركة نادر بالكاميرات.',evidenceId:'E07',unlockWhen:{type:'all',nodes:[{type:'personQuestionAnswered',personId:'nader',questionId:'Q-N01'},{type:'evidenceExamined',evidenceId:'E07'}]},response:'تتطابق الحركة مع مهمة مخزون قابلة للتحقق.'}]
    },
    salim:{
      heading:'استجواب سليم',intro:'تحقق من مدة الغياب وحدود الرؤية من الاستقبال.',wrongConfrontationResponse:'هذا الدليل لا يناقض هذه الإجابة مباشرة.',
      questions:[{id:'Q-S01',text:'هل بقيت في الاستقبال طوال الفترة؟',answer:'غادرت دقائق قليلة فقط.'},{id:'Q-S02',text:'هل تستطيع رؤية باب غرفة 02؟',answer:'لا، زاوية الممر تحجبه.'}],
      confrontations:[{id:'C06',label:'اختبار مدة الغياب',prompt:'قارن إفادة سليم بلقطات الكاميرات.',evidenceId:'E07',unlockWhen:{type:'all',nodes:[{type:'personQuestionAnswered',personId:'salim',questionId:'Q-S01'},{type:'evidenceExamined',evidenceId:'E07'}]},response:'يعترف بأنه ابتعد فترة أطول لأمر شخصي داخل المنشأة.'}]
    }
  },

  derivedFacts: [
    {id:'M01',text:'الحالة الصحية السابقة لا تفسر النتائج مجتمعة.',when:{type:'evidenceExamined',evidenceId:'E03'}},
    {id:'M02',text:'وقع حدث غير مشروع أدى إلى الوفاة أثناء عجز شديد.',when:{type:'evidenceExamined',evidenceId:'E03'}},
    {id:'M03',text:'تعديل ميرا للسجل حدث بعد الواقعة لتغطية متابعة لم تنفذ في وقتها.',when:{type:'evidenceExamined',evidenceId:'E04'}},
    {id:'M04',text:'توجد إمكانية وصول إلى النطاق الداخلي دون سجل مباشر لباب غرفة 02.',when:{type:'evidenceExamined',evidenceId:'E05'}},
    {id:'M05',text:'رواية إلياس عن توقيت المهمة التشغيلية لا تطابق النظام المستقل.',when:{type:'evidenceExamined',evidenceId:'E06'}},
    {id:'M06',text:'الكاميرات تضيق الفرص وتفسر حركات جانبية دون تصوير الجريمة.',when:{type:'evidenceExamined',evidenceId:'E07'}},
    {id:'M07',text:'المراجعة المالية وصلت إلى عقود ضمن نطاق مسؤولية إلياس.',when:{type:'evidenceExamined',evidenceId:'E08'}},
    {id:'M08',text:'الأثر الطبي التشغيلي لا ينسجم مع خطة الرعاية ودائرة الوصول محدودة.',when:{type:'evidenceExamined',evidenceId:'E09'}},
    {id:'M09',text:'المطابقة المستقلة تربط عنصرًا من نطاق سيطرة إلياس بالفترة الحرجة مع بقية CORE.',when:{type:'evidenceExamined',evidenceId:'E10'}},
    {id:'M10',text:'حذف آدم يتعلق بمخالفة تقنية منفصلة عن آلية الوفاة.',when:{type:'evidenceExamined',evidenceId:'E11'}}
  ],

  contradictions: [],
  puzzles: [],
  board:{categories:[],allowedLinkTypes:[]},
  hints:[
    {id:'H01',title:'لا يوجد تقدم جديد',unlockWhen:null,levels:['راجع ما يثبته كل دليل، لا ما يوحي به فقط.']},
    {id:'H02',title:'بعد سجل الرعاية',unlockWhen:{type:'evidenceExamined',evidenceId:'E04'},levels:['تعديل السجل يثبت أن شيئًا أُخفي، لكنه لا يحدد سبب الوفاة.']},
    {id:'H03',title:'بعد سجلات الوصول',unlockWhen:{type:'all',nodes:[{type:'evidenceExamined',evidenceId:'E05'},{type:'not',node:{type:'evidenceExamined',evidenceId:'E06'}}]},levels:['الوجود في نطاق يسمح بالوصول لا يثبت دخول غرفة 02.']},
    {id:'H04',title:'قبل الدليل الرابط',unlockWhen:{type:'all',nodes:[{type:'evidenceExamined',evidenceId:'E06'},{type:'not',node:{type:'evidenceExamined',evidenceId:'E10'}}]},levels:['كسر الرواية لا يكفي وحده لإسناد الوفاة.']}
  ],

  deduction: {
    unlockWhen:{type:'all',nodes:[{type:'flagTrue',key:'M01'},{type:'flagTrue',key:'M02'},{type:'flagTrue',key:'M04'},{type:'flagTrue',key:'M05'},{type:'flagTrue',key:'M08'},{type:'flagTrue',key:'M09'}]},
    submitWhen:{type:'flagTrue',key:'M03'},
    lockedMessage:'لا تزال بعض مواد التحقيق الأساسية غير مكتملة.',
    submitLockedMessage:'يمكن فتح الاستنتاج، لكن لا يمكن إرسال التقرير النهائي قبل حسم حقيقة سجل الرعاية (M03).',
    wrongMessage:'هناك جزء في نظريتك لا يتوافق مع معطيات الملف. راجع ما يثبته كل دليل ثم أعد التقديم.',
    successTitle:'تم حل القضية',successMessage:'تطابقت النظرية مع الأدلة الأساسية وتم فصل التستر المهني عن سبب الوفاة.',
    questions:[
      {id:'F01',type:'compound',prompt:'هل كانت وفاة جوليان طبيعية؟',fields:[
        {id:'answer',type:'single_choice',prompt:'اختر النتيجة',options:[{value:'not_natural_alone',label:'لا؛ الحالة السابقة لا تفسر النتائج مجتمعة ووقع حدث غير مشروع أثناء عجز شديد.'},{value:'natural',label:'نعم؛ الحالة السابقة تفسر الوفاة بالكامل.'}]},
        {id:'proof',type:'evidence_multiple',prompt:'اختر السند الإلزامي',validation:{requiredAll:['E03','E09'],allowedSupporting:[],rejectDisallowed:true}}
      ],correctAnswer:{answer:'not_natural_alone',proof:[]}},
      {id:'F02',type:'compound',prompt:'من المسؤول عن وفاة جوليان؟',fields:[
        {id:'person',type:'person_choice',prompt:'اختر الشخص المسؤول'},
        {id:'proof',type:'evidence_multiple',prompt:'اختر الأدلة الأساسية للإسناد',validation:{requiredAll:['E05','E06','E09','E10'],allowedSupporting:['E08'],rejectDisallowed:true}}
      ],correctAnswer:{person:'elias',proof:[]}},
      {id:'F03',type:'compound',prompt:'ما حقيقة التلاعب بسجل الرعاية؟',fields:[
        {id:'answer',type:'single_choice',prompt:'اختر التفسير الصحيح',options:[{value:'mira_coverup',label:'ميرا عدلت السجل بعد الواقعة لتغطية متابعة لم تنفذها؛ التلاعب حقيقي لكنه ليس سبب الوفاة.'},{value:'mira_killer',label:'تعديل ميرا للسجل يثبت أنها تسببت في الوفاة.'},{value:'no_tamper',label:'لم يحدث أي تعديل لاحق للسجل.'}]},
        {id:'proof',type:'evidence_multiple',prompt:'اختر السند الذي يفصل التستر عن الوفاة',validation:{requiredAll:['E04','E03'],allowedSupporting:['E02'],rejectDisallowed:true}}
      ],correctAnswer:{answer:'mira_coverup',proof:[]}}
    ]
  },
  rules: []
};
