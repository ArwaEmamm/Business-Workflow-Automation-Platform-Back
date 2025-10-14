const Request = require('../models/request');
const Workflow = require('../models/Workflow');
const Notification = require('../models/notification');
const User = require('../models/User'); // عشان نقدر نجيب الـmanager/admin

// ✅ إنشاء طلب جديد

const createNewRequest = async (req, res) => {
  try {
    const createdBy = req.user.id;
    const { workflowId, data } = req.body;
    const attachments = req.files ? req.files.map(file => file.filename) : [];


    // 1️⃣ نتأكد إن الـworkflow موجود
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    // 2️⃣ ننشئ الطلب
    const newRequest = await Request.create({
      workflowId,
      createdBy,
      data,
      currentStep: 1,
      status: 'pending',
      approvals: [],
      attachments,
    });

    // 3️⃣ إشعار للـManager أو الـAdmin المسؤول عن أول خطوة
    const firstStep = workflow.steps[0];
    if (firstStep && firstStep.assignedRole) {
      const reviewer = await User.findOne({ role: firstStep.assignedRole });
      if (reviewer) {
        await Notification.create({
          userId: reviewer._id,
          message: `📄 طلب جديد (${workflow.name}) تم إنشاؤه من قِبل مستخدم وينتظر المراجعة.`,
          type: 'request_created',
          meta: { requestId: newRequest._id }
        });
      }
    }

    res.status(201).json({
      message: 'Request created successfully ✅',
      request: newRequest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ جلب كل الطلبات
const getAllRequests = async (req, res) => {
  try {
    let requests;

    if (req.user.role === 'admin') {
      // لو المستخدم أدمن، يرجع كل الطلبات
      requests = await Request.find();
    } else {
      // لو مش أدمن، يرجع الطلبات اللي تخصه بس
      requests = await Request.find({ createdBy: req.user.id });
    }

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ جلب طلب واحد بالتفصيل
const getSingleRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await Request.findById(id)
      .populate('workflowId', 'name')
      .populate('createdBy', 'name email role');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // التحقق من الصلاحية
    if (req.user.role !== 'admin' && request.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({
      message: 'Your request details ✅',
      request,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ معالجة الموافقة أو الرفض على خطوة
const handleApproval = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { decision, comment } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // 1️⃣ نجيب الطلب من قاعدة البيانات
    const request = await Request.findById(requestId).populate('workflowId');
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // 2️⃣ نجيب الخطوة الحالية
    const currentStep = request.workflowId.steps[request.currentStep - 1];
    if (!currentStep) {
      return res.status(400).json({ message: 'Invalid current step' });
    }

    // 3️⃣ نتحقق إن المستخدم هو المسؤول عن الخطوة دي
    if (currentStep.assignedRole !== userRole) {
      return res.status(403).json({ message: 'You are not allowed to approve this step' });
    }

    // 4️⃣ نضيف approval جديد
    const approval = {
      stepOrder: request.currentStep,
      approvedBy: userId,
      decision,
      comment,
      date: new Date()
    };
    request.approvals.push(approval);

    // 5️⃣ نحدّث الحالة
    if (decision === 'rejected') {
      request.status = 'rejected';
    } else {
      const totalSteps = request.workflowId.steps.length;
      if (request.currentStep >= totalSteps) {
        request.status = 'approved';
      } else {
        request.currentStep += 1; // ننتقل للخطوة اللي بعدها
      }
    }

    await request.save();

    // 6️⃣ إشعارات بعد القرار
    // ⬅️ إشعار لصاحب الطلب
    await Notification.create({
      userId: request.createdBy,
      message: `طلبك رقم (${request._id}) تم ${decision === 'approved' ? 'الموافقة عليه' : 'رفضه'} من قِبل ${userRole}.`,
      type: decision,
      meta: { requestId: request._id }
    });

    // ⬅️ إشعار للشخص اللي وافق
    await Notification.create({
      userId,
      message: `تم تسجيل قرارك (${decision}) على الطلب رقم (${request._id}).`,
      type: 'confirmation',
      meta: { requestId: request._id }
    });

    res.status(200).json({
      message: `Step ${decision} successfully`,
      request
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createNewRequest,
  getAllRequests,
  getSingleRequestById,
  handleApproval
};
