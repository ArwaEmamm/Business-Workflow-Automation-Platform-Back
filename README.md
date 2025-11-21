"""
# 🧩 Business Workflow Automation (BWA) — Backend

## ملخص سريع
هذا المستودع يحتوي على باك‑إند لـ Business Workflow Automation: نظام لإدارة الطلبات (إجازات، مشتريات، معدات، تدريب...) مع مسارات موافقة متعددة (Workflows)، إشعارات، وسجل نشاطات.

الـ API مكتوب باستخدام Node.js وExpress، والـ persistence باستخدام MongoDB عبر Mongoose. يستخدم النظام طوابير (Bull + Redis) للمهام الخلفية مثل إرسال الإيميلات.

هذا الملف README يشرح كيف تهيّئ المشروع محليًا، كيف تعبّي الداتا (seed) من التيرمنال، وكيف ترفع الكود إلى GitHub إذا رغبت.
"""

## متطلبات نظام
- Node.js >= 16
- npm
- MongoDB محلي أو Remote/Atlas
- (اختياري) Redis إذا أردت تشغيل الوظائف الخلفية

## الإعداد السريع (PowerShell)
1) انسخ المستودع وانصّب الحزم:
```powershell
git clone <your-repo-url-or-skip-if-already-cloned>
cd bwa-backend
npm install
```

2) أنشئ ملف `.env` في جذر المشروع واملأ القيم التالية (مثال):
```
PORT=4000
MONGO_HOST=127.0.0.1
MONGO_PORT=27017
MONGO_DB_NAME=bwa_dev
# If your DB requires auth:
# MONGO_USER=yourUser
# MONGO_PASS=yourPass
JWT_SECRET=your_jwt_secret
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

3) شغّل السيرفر في وضع التطوير:
```powershell
npm run dev
```

4) شغّل الاختبارات:
```powershell
npm test
```

## تعبئة البيانات (Seed) — أوامر `mongosh` من التيرمنال
إليك مجموعة أوامر جاهزة لتشغيلها داخل `mongosh` على قاعدة بياناتك (مثال يُستخدم `bwa_dev`). افتحي PowerShell ثم:

```powershell
mongosh "mongodb://127.0.0.1:27017/bwa_dev"
```

وبعد فتح الـ shell، الصق هذه الأوامر (النسخة الموصى بها تستخدم ObjectId لعلاقات Mongoose):

```js
// Users
db.users.insertMany([
	{ _id: ObjectId("64f001a1b9a1c4001a2b1111"), name: "Nada Ali", email: "nada.ali@company.com", role: "employee", passwordHash: "changeme" },
	{ _id: ObjectId("64f001a1b9a1c4001a2b2222"), name: "Omar Hassan", email: "omar.hassan@company.com", role: "manager", passwordHash: "changeme" },
	{ _id: ObjectId("64f001a1b9a1c4001a2b3333"), name: "Salma Rady", email: "salma.rady@company.com", role: "hr_manager", passwordHash: "changeme" }
]);

// Workflows
db.workflows.insertMany([
	{
		_id: ObjectId("64f002a1b9a1c4001a2b4001"),
		name: "Vacation Request",
		description: "طلب إجازة سنوية أو عاجلة",
		createdBy: ObjectId("64f001a1b9a1c4001a2b3333"),
		steps: [ { order:1, title: "Manager Approval", assignedRole: "manager" }, { order:2, title: "HR Approval", assignedRole: "hr_manager" } ]
	},
	{ _id: ObjectId("64f002a1b9a1c4001a2b4002"), name: "Purchase Request (<= $1000)", description: "طلبات مشتريات قيمتها أقل من أو تساوي 1000$", createdBy: ObjectId("64f001a1b9a1c4001a2b3333"), steps: [ { order:1, title:"Manager Approval", assignedRole:"manager" } ] },
	{ _id: ObjectId("64f002a1b9a1c4001a2b4003"), name: "Equipment Request (Laptop)", description: "طلب جهاز لابتوب جديد أو استبدال", createdBy: ObjectId("64f001a1b9a1c4001a2b3333"), steps: [ { order:1, title:"Team Lead Approval", assignedRole:"manager" }, { order:2, title:"HR Approval", assignedRole:"hr_manager" } ] },
	{ _id: ObjectId("64f002a1b9a1c4001a2b4004"), name: "Remote Work Day", description: "طلب يوم عمل عن بُعد", createdBy: ObjectId("64f001a1b9a1c4001a2b3333"), steps: [ { order:1, title:"Manager Approval", assignedRole:"manager" } ] },
	{ _id: ObjectId("64f002a1b9a1c4001a2b4005"), name: "Training Enrollment", description: "طلب اشتراك في دورة تدريبية", createdBy: ObjectId("64f001a1b9a1c4001a2b3333"), steps: [ { order:1, title:"Manager Approval", assignedRole:"manager" }, { order:2, title:"HR Approval", assignedRole:"hr_manager" } ] }
]);

// Requests
db.requests.insertMany([
	{ _id: "req_1001", workflowId: ObjectId("64f002a1b9a1c4001a2b4001"), createdBy: ObjectId("64f001a1b9a1c4001a2b1111"), data: { title: "Annual Leave - Summer", from: "2025-07-20", to: "2025-07-28", reason: "Family vacation" }, currentStep:2, status:"pending", attachments:["/mnt/data/c76a4bfd-14d1-4783-a2c8-094a1a1048ca.png"], approvals:[ { stepOrder:1, approvedBy: ObjectId("64f001a1b9a1c4001a2b2222"), decision:"approved", comment:"Enjoy your leave; ensure handover done", date: ISODate("2025-06-05T10:30:00Z") } ], createdAt: ISODate("2025-06-05T09:00:00Z") },
	{ _id: "req_1002", workflowId: ObjectId("64f002a1b9a1c4001a2b4002"), createdBy: ObjectId("64f001a1b9a1c4001a2b1111"), data:{ title:"Office Supplies - Headset", amount:45.99, vendor:"TechStore", reason:"Replacement headset" }, currentStep:1, status:"approved", attachments:[], approvals:[ { stepOrder:1, approvedBy: ObjectId("64f001a1b9a1c4001a2b2222"), decision:"approved", comment:"Ok, within budget", date: ISODate("2025-06-06T14:20:00Z") } ], createdAt: ISODate("2025-06-06T13:55:00Z") },
	{ _id: "req_1003", workflowId: ObjectId("64f002a1b9a1c4001a2b4003"), createdBy: ObjectId("64f001a1b9a1c4001a2b1111"), data:{ title:"Laptop Replacement", spec:"Dell XPS 13", reason:"Old laptop malfunctioning" }, currentStep:1, status:"rejected", attachments:["/mnt/data/c76a4bfd-14d1-4783-a2c8-094a1a1048ca.png"], approvals:[ { stepOrder:1, approvedBy: ObjectId("64f001a1b9a1c4001a2b2222"), decision:"rejected", comment:"Budget constraints — postpone", date: ISODate("2025-06-07T08:15:00Z") } ], createdAt: ISODate("2025-06-07T07:50:00Z") },
	{ _id: "req_1004", workflowId: ObjectId("64f002a1b9a1c4001a2b4004"), createdBy: ObjectId("64f001a1b9a1c4001a2b1111"), data:{ title:"Work from Home - Monday", date:"2025-06-10", reason:"Home delivery appointment" }, currentStep:1, status:"pending", attachments:[], approvals:[], createdAt: ISODate("2025-06-08T11:22:00Z") },
	{ _id: "req_1005", workflowId: ObjectId("64f002a1b9a1c4001a2b4005"), createdBy: ObjectId("64f001a1b9a1c4001a2b1111"), data:{ title:"React Advanced Course", provider:"Online Academy", cost:300 }, currentStep:2, status:"pending", attachments:[], approvals:[ { stepOrder:1, approvedBy: ObjectId("64f001a1b9a1c4001a2b2222"), decision:"approved", comment:"Great fit for the role", date: ISODate("2025-06-09T09:00:00Z") } ], createdAt: ISODate("2025-06-09T08:45:00Z") }
]);
```

ملاحظات:
- استبدلي `127.0.0.1:27017` و`bwa_dev` بقيم قاعدة بياناتك إذا اختلفت.
- حقول `passwordHash` استخدمت نصًا بسيطًا `changeme` كمثال؛ في التطبيق الحقيقي يجب تخزين قيمة hash حقيقية (`bcrypt`).

## (اختياري) إنشاء ملف seed محلي وتشغيله
إذا تفضّلين سكربت Node يقوم بالاتصال وإدخال البيانات، يمكنك إنشاء ملف `scripts/seedDatabase.js` يتضمن منطق الاتصال وإدخال `insertMany`. مثال تشغيلي:

```powershell
# تشغيل سكربت seed (بعد إنشاءه داخل المشروع)
node scripts/seedDatabase.js
```

أخبريني لو تريدين أن أُعيد إنشاء `scripts/seedDatabase.js` في المشروع وأضيف أمر `seed` إلى `package.json`، وسأفعله.

## رفع المشروع إلى GitHub (PowerShell)
إذا رغبتِ أن أرفع المستودع الحالي إلى GitHub تحت الـ URL الذي أعطيتِه، نفّذي هذه الأوامر محليًا (تحتاجين صلاحيات push إلى ذلك الريبو):

```powershell
git remote add origin https://github.com/ArwaEmamm/Business-Workflow-Automation-Platform-Back.git
git branch -M main
git add .
git commit -m "Add README and seed instructions"
git push -u origin main
```

ملاحظة: إذا حصل خطأ لأن الريبو البعيد يحتوي على كود بالفعل، استعملي `git pull --rebase origin main` أو حلّي التعارضات ثم ادفعي.

---

## كيف أقدر أساعدك بعد كده؟
- أقدر أُعيد إنشاء سكربت `scripts/seedDatabase.js` داخل المشروع وأضبط `package.json` لإضافة الأمر `seed`.
- أقدر أُنشئ ملف `seed-mongo.js` جاهز لتشغيله مع `mongosh --file` لو تفضّلين عدم استخدام Node.
- أقدر أساعد في رفع المشروع إلى GitHub لو سمحتِ لي بمعلومات الوصول أو تُنفّذي أوامر الدفع بنفسك وتُخبِريني إن ظهر خطأ.

أخبِريني أي خيار تفضّلينه وسأكمل التنفيذ فورًا.
