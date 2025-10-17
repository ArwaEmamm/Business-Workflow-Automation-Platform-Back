# 🧩 Business Workflow Automation (BWA)

## 🚀 Project Overview
Business Workflow Automation (BWA) هو نظام لإدارة وأتمتة العمليات الإدارية داخل الشركات الصغيرة والمتوسطة.
يسمح للموظفين بإرسال الطلبات (مثل طلب إجازة أو شراء)، وللمدراء أو الإداريين بمراجعتها والموافقة عليها،
مع وجود نظام إشعارات، وإحصائيات، وLogs لتتبع كل الأنشطة.

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|-------------|----------|
| **Frontend** | React + TypeScript *(to be developed)* | واجهة المستخدم |
| **Backend** | Node.js (Express.js) | REST API |
| **Database** | MongoDB (Mongoose ODM) | تخزين البيانات |
| **Queue System** | Bull + Redis | Background Jobs (مثل إرسال الإيميلات) |
| **Authentication** | JWT + bcrypt | تسجيل الدخول والصلاحيات |
| **Testing** | Jest + Supertest | اختبار الـ APIs |
| **Error Handling** | Custom Error Middleware (AppError) | إدارة الأخطاء بشكل احترافي |

---

## ⚙️ Features Implemented

### 👥 Authentication & Authorization
- تسجيل مستخدم جديد وتسجيل الدخول.
- أدوار مختلفة (Admin / Manager / Employee).
- JWT Tokens لحماية الـ APIs.
- Middleware للتحقق من التوكن والصلاحيات.

### 🔄 Workflow Management
- إنشاء Workflow يحتوي على خطوات approvals.
- CRUD كامل للـ Workflows.
- تخصيص الأدوار لكل خطوة داخل الـ Workflow.

### 📋 Request System
- المستخدم يقدر يقدّم طلب بناءً على Workflow معين.
- النظام بيتتبع الخطوة الحالية.
- المدير أو الأدمن يقدر يوافق أو يرفض.
- التحديث التلقائي لحالة الطلب (Pending → Approved / Rejected).

### 🔔 Notifications
- إشعارات عند الموافقة أو الرفض.
- إرسال إيميل في الخلفية باستخدام Bull Queue + Redis.
- تحديد الإشعار كمقروء.

### 📊 Dashboard & Analytics
- عرض ملخّص الإحصائيات (عدد الطلبات، حالة كل واحدة).
- تختلف حسب الدور (Admin / Manager / Employee).

### 🧾 Activity Logs
- تتبع كل الأحداث (إنشاء، تعديل، حذف).
- فقط الـ Admin يقدر يشوف السجل الكامل.

### 📎 File Uploads
- دعم رفع الملفات كمرفقات محلية.
- استخدام multer للتعامل مع الملفات.

### ⚙️ Error Handling
- كلاس AppError لمعالجة الأخطاء المتوقعة.
- Middleware موحّد للتعامل مع كل الأخطاء في النظام.

### 🧠 Background Jobs
- استخدام Bull Queue لإرسال الإشعارات والإيميلات في الخلفية بدون تعطيل المستخدم.

### 🧪 Testing
- اختبارات شاملة باستخدام Jest + Supertest.
- اختبارات لـ Auth و Workflow APIs.

---

## 📁 Project Structure

```
src/
 ├── config/
 │   └── db.js
 ├── controllers/
 │   ├── authController.js
 │   ├── workflowController.js
 │   ├── requestController.js
 │   ├── notificationController.js
 │   ├── dashboardController.js
 │   └── activityLogsController.js
 ├── jobs/
 │   └── emailQueue.js
 ├── middlewares/
 │   ├── authMiddleware.js
 │   ├── errorMiddleware.js
 │   └── ...
 ├── models/
 │   ├── User.js
 │   ├── Workflow.js
 │   ├── Request.js
 │   ├── Notification.js
 │   └── ActivityLog.js
 ├── routes/
 │   ├── auth.js
 │   └── routes.js
 ├── tests/
 │   ├── auth.test.js
 │   └── workflow.test.js
 └── app.js
.env
README.md
```

---

## 🧰 Installation & Setup

```bash
# Clone the repo
git clone https://github.com/ArwaEmam/BWA-Backend.git
cd BWA-Backend

# Install dependencies
npm install

# Create .env file
PORT=4000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Run server
npm run dev

# Run tests
npm test
```

---

## ✅ API Highlights

| Method | Endpoint | Description | Auth |
|--------|-----------|--------------|------|
| POST | /api/auth/register | Register user | ❌ |
| POST | /api/auth/login | Login user | ❌ |
| POST | /api/workflows | Create workflow | ✅ |
| GET | /api/workflows | Get all workflows | ✅ |
| POST | /api/requests | Create request | ✅ |
| POST | /api/requests/:id/approve | Approve/Reject | ✅ |
| GET | /api/notifications | Get notifications | ✅ |
| GET | /api/dashboard | Get user dashboard | ✅ |

---

## 💬 Future Enhancements
- Frontend (React + TypeScript)
- Real Email Integration (nodemailer)
- Docker support
- Cloudinary for file uploads
- Admin panel UI

🧩 Background Jobs (Redis + Bull)

تم استخدام Redis مع مكتبة Bull لتنفيذ المهام في الخلفية (Background Jobs) بدل ما تتنفذ بشكل متزامن وتبطّئ المستخدم.

🔧 الفكرة

لما المستخدم يطلب مهمة تقيلة (زي إرسال إيميل أو إشعار)، بدل ما السيرفر يستنى لحد ما المهمة تخلص، بيضيفها في الطابور (Queue) وبيكمل التنفيذ فورًا.
عامل زي:

"تم استلام الطلب — هنكمل التنفيذ في الخلفية."

⚙️ التشغيل

تأكد إن Redis شغّال:

لو نزلته على ويندوز، شغّله من المسار:

redis-server.exe


شغّل السيرفر الرئيسي:

npm run dev


شغّل الـ Worker (ملف الـ job):

node src/jobs/emailWorker.js