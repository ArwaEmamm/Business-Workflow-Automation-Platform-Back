const Request = require('../models/request');
const Workflow = require('../models/Workflow');
const Notification = require('../models/notification');
const User = require('../models/User'); // عشان نقدر نجيب الـmanager/admin

// ✅ إنشاء طلب جديد

const createNewRequest = async (req, res) => {
  try {
    console.log('Creating new request:', {
      body: req.body,
      files: req.files
    });
    
    const createdBy = req.user.id;
    const { workflowId } = req.params;
    const { title, description } = req.body;

    // 1️⃣ التحقق من البيانات المطلوبة
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'عنوان الطلب ووصفه مطلوبين',
        receivedData: { title, description }
      });
    }

    // معالجة الملفات المرفقة
    let attachmentFiles = [];
    if (req.files && req.files.attachments) {
      attachmentFiles = req.files.attachments.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        mimetype: file.mimetype
      }));
    }

    // 2️⃣ تجهيز الملفات المرفقة
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype
      }));
    }

    // 3️⃣ تجميع بيانات الطلب
    const requestData = {
      title: req.body.title,
      description: req.body.description,
      attachmentDetails: attachments
    };

    // 1️⃣ نتأكد إن الـworkflow موجود
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    // 4️⃣ ننشئ الطلب
    const newRequest = await Request.create({
      workflowId,
      createdBy,
      data: {
        title,
        description,
        attachmentDetails: attachmentFiles
      },
      currentStep: 1,
      status: 'pending',
      approvals: [],
      attachments: attachmentFiles.map(file => file.filename)
    });

    // 5️⃣ نجيب الطلب مع كل البيانات المرتبطة
    const populatedRequest = await Request.findById(newRequest._id)
      .populate('workflowId', 'name description steps')
      .populate('createdBy', 'name email');

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

    // نجيب الطلب بشكل مباشر
    // 6️⃣ نجهز الرد
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الطلب بنجاح ✅',
      request: {
        id: populatedRequest._id,
        title: populatedRequest.data.title,
        description: populatedRequest.data.description,
        status: populatedRequest.status,
        currentStep: populatedRequest.currentStep,
        attachments: populatedRequest.data.attachmentDetails,
        workflow: {
          id: populatedRequest.workflowId._id,
          name: populatedRequest.workflowId.name,
          description: populatedRequest.workflowId.description,
          currentStepDetails: populatedRequest.workflowId.steps[populatedRequest.currentStep - 1]
        },
        createdBy: {
          id: populatedRequest.createdBy._id,
          name: populatedRequest.createdBy.name,
          email: populatedRequest.createdBy.email
        },
        createdAt: populatedRequest.createdAt
      }
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

    // التحقق من وجود البيانات المطلوبة
    if (!decision) {
      return res.status(400).json({ 
        message: 'Decision is required',
        details: 'Please provide a decision (approved/rejected)'
      });
    }

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ 
        message: 'Invalid decision value',
        details: 'Decision must be either "approved" or "rejected"'
      });
    }

    console.log(`Processing approval request - ID: ${requestId}, User: ${userId}, Role: ${userRole}, Decision: ${decision}`);

    // 1️⃣ نجيب الطلب من قاعدة البيانات
    const request = await Request.findById(requestId);
    if (!request) {
      console.log(`Request not found - ID: ${requestId}`);
      return res.status(404).json({ 
        message: 'Request not found',
        details: 'The specified request ID does not exist'
      });
    }

    // نجيب معلومات الـworkflow
    await request.populate('workflowId');
    if (!request.workflowId) {
      console.log(`Workflow not found for request - ID: ${requestId}`);
      return res.status(400).json({ 
        message: 'Workflow not found',
        details: 'The workflow associated with this request does not exist'
      });
    }

    // 2️⃣ نجيب الخطوة الحالية
    const currentStep = request.workflowId.steps[request.currentStep - 1];
    if (!currentStep) {
      console.log(`Invalid step for request - ID: ${requestId}, Current Step: ${request.currentStep}`);
      return res.status(400).json({ 
        message: 'Invalid current step',
        details: `No step found at position ${request.currentStep}`
      });
    }

    // 3️⃣ نتحقق إن المستخدم هو المسؤول عن الخطوة دي
    if (currentStep.assignedRole !== userRole && userRole !== 'admin') {
      console.log(`Permission denied - User Role: ${userRole}, Required Role: ${currentStep.assignedRole}`);
      return res.status(403).json({ 
        message: 'You are not allowed to approve this step',
        details: `This step requires ${currentStep.assignedRole} role access`
      });
    }

    // نتحقق من عدم وجود موافقة سابقة على نفس الخطوة
    const existingApproval = request.approvals.find(a => a.stepOrder === request.currentStep);
    if (existingApproval) {
      console.log(`Step already processed - Request: ${requestId}, Step: ${request.currentStep}`);
      return res.status(400).json({ 
        message: 'Step already processed',
        details: 'This step has already been approved or rejected'
      });
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
    console.log(`Adding approval - Request: ${requestId}, Step: ${request.currentStep}, Decision: ${decision}`);

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
