const Request = require('../models/request');
const Workflow = require('../models/Workflow');
const Notification = require('../models/notification');
const User = require('../models/User'); // عشان نقدر نجيب الـmanager/admin

// ✅ إنشاء طلب جديد

const createNewRequest = async (req, res) => {
  try {
    // Debug logs (useful when running locally)
    console.log('Creating new request:', { body: req.body, files: req.files, params: req.params });

    const createdBy = req.user.id;
    const { workflowId } = req.params;
    const title = req.body.title || '';
    const description = req.body.description || '';

    // Validate required fields
    if (!title.trim() || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required',
        receivedData: { title, description }
      });
    }

    // Normalize files: multer used as upload.array('attachments') so req.files is an array
    const attachmentDetails = Array.isArray(req.files)
      ? req.files.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          path: file.path,
          size: file.size
        }))
      : [];

    // Ensure workflow exists
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    // Create request document
    const newRequest = await Request.create({
      workflowId,
      createdBy,
      data: {
        title: title.trim(),
        description: description.trim(),
        attachmentDetails
      },
      currentStep: 1,
      status: 'pending',
      approvals: [],
      attachments: attachmentDetails.map(f => f.filename)
    });

    // Populate for response
    const populatedRequest = await Request.findById(newRequest._id)
      .populate('workflowId', 'name description steps')
      .populate('createdBy', 'name email');

    // Notify reviewer of first step
    const firstStep = workflow.steps && workflow.steps[0];
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

    // Return created request
    return res.status(201).json({
      success: true,
      message: 'تم إنشاء الطلب بنجاح ✅',
      request: {
        id: populatedRequest._id,
        title: populatedRequest.data.title,
        description: populatedRequest.data.description,
        status: populatedRequest.status,
        currentStep: populatedRequest.currentStep,
        attachments: populatedRequest.data.attachmentDetails || [],
        workflow: populatedRequest.workflowId
          ? {
              id: populatedRequest.workflowId._id,
              name: populatedRequest.workflowId.name,
              description: populatedRequest.workflowId.description,
              currentStepDetails: populatedRequest.workflowId.steps
                ? populatedRequest.workflowId.steps[populatedRequest.currentStep - 1]
                : null
            }
          : null,
        createdBy: populatedRequest.createdBy
          ? {
              id: populatedRequest.createdBy._id,
              name: populatedRequest.createdBy.name,
              email: populatedRequest.createdBy.email
            }
          : null,
        createdAt: populatedRequest.createdAt
      }
    });
  } catch (error) {
    console.error('Error in createNewRequest:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ✅ جلب كل الطلبات
const getAllRequests = async (req, res) => {
  try {
    let requests;

    if (req.user.role === 'hr_manager') {
      // لو المستخدم hr_manager، يرجع كل الطلبات
      requests = await Request.find();
    } else {
      // لو مش hr_manager، يرجع الطلبات اللي تخصه بس
      requests = await Request.find({ createdBy: req.user.id });
    }

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error('Error in getSingleRequestById:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم',
      error: {
        message: error.message,
        type: error.name,
        path: error.path
      }
    });
  }
};

const mongoose = require('mongoose');

// ✅ جلب طلب واحد بالتفصيل
const getSingleRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching request with ID:', id);

    // التحقق من وجود الـ ID
    if (!id) {
      console.log('Request ID is missing');
      return res.status(400).json({ 
        success: false, 
        message: 'رقم الطلب مطلوب' 
      });
    }

    // التحقق من صحة تنسيق الـ ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid request ID format:', id);
      return res.status(400).json({ 
        success: false, 
        message: 'رقم الطلب غير صحيح' 
      });
    }

    const request = await Request.findById(id)
      .populate('workflowId', 'name description steps')
      .populate('createdBy', 'name email role');

    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'الطلب غير موجود' 
      });
    }

    // التحقق من الصلاحية: السماح للمستخدم إذا كان:
    // 1. Admin
    // 2. صاحب الطلب الأصلي
    // 3. Manager/مراجع مسؤول عن الخطوة الحالية
    const isCreator = request.createdBy._id.toString() === req.user.id;
  const isAdmin = req.user.role === 'hr_manager';
    const isReviewerForCurrentStep = 
      request.workflowId && 
      request.workflowId.steps && 
      Array.isArray(request.workflowId.steps) &&
      request.workflowId.steps[request.currentStep - 1] &&
      request.workflowId.steps[request.currentStep - 1].assignedRole === req.user.role;

    if (!isAdmin && !isCreator && !isReviewerForCurrentStep) {
      console.log('Access denied for user:', req.user.id, 'role:', req.user.role, 'trying to access request:', id);
      return res.status(403).json({ 
        success: false,
        message: 'ليس لديك صلاحية للوصول لهذا الطلب' 
      });
    }

    // Return request data
    return res.status(200).json({
      success: true,
      message: 'تم جلب تفاصيل الطلب بنجاح ✅',
      data: {
        id: request._id,
        title: request.data.title,
        description: request.data.description,
        status: request.status,
        currentStep: request.currentStep,
        attachments: request.data.attachmentDetails || [],
        workflow: {
          id: request.workflowId._id,
          name: request.workflowId.name,
          description: request.workflowId.description,
          steps: request.workflowId.steps
        },
        createdBy: {
          id: request.createdBy._id,
          name: request.createdBy.name,
          email: request.createdBy.email,
          role: request.createdBy.role
        },
        createdAt: request.createdAt,
        approvals: request.approvals
      }
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
    if (currentStep.assignedRole !== userRole && userRole !== 'hr_manager') {
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

    // 4️⃣ نضيف approval جديد كـ تحديث ذريعي بدل حفظ الوثيقة (لتجنب فشل الـ validation إذا كانت بعض الحقول مفقودة)
    const approval = {
      stepOrder: request.currentStep,
      approvedBy: userId,
      decision,
      comment,
      date: new Date()
    };
    console.log(`Adding approval (via update) - Request: ${requestId}, Step: ${request.currentStep}, Decision: ${decision}`);

    // 5️⃣ نحدد عمليات التحديث المناسبة
    const updateOps = { $push: { approvals: approval } };
    if (decision === 'rejected') {
      updateOps.$set = { ...(updateOps.$set || {}), status: 'rejected' };
    } else {
      const totalSteps = (request.workflowId && Array.isArray(request.workflowId.steps)) ? request.workflowId.steps.length : 0;
      if (request.currentStep >= totalSteps && totalSteps > 0) {
        updateOps.$set = { ...(updateOps.$set || {}), status: 'approved' };
      } else {
        // زيادة رقم الخطوة الحالية ذرّياً
        updateOps.$inc = { ...(updateOps.$inc || {}), currentStep: 1 };
      }
    }

    // ننفذ التحديث بدون runValidators (الافتراضي) لتجنب فشل الحقول المطلوبة غير المتعلقة بالموافقة
    const updatedRequest = await Request.findByIdAndUpdate(requestId, updateOps, { new: true })
      .populate('workflowId', 'name description steps')
      .populate('createdBy', 'name email');

    if (!updatedRequest) {
      console.log(`Failed to update request after approval - ID: ${requestId}`);
      return res.status(500).json({ message: 'Failed to update request' });
    }

    // 6️⃣ إشعارات بعد القرار
    // ⬅️ إشعار لصاحب الطلب
    await Notification.create({
      userId: updatedRequest.createdBy,
      message: `طلبك رقم (${updatedRequest._id}) تم ${decision === 'approved' ? 'الموافقة عليه' : 'رفضه'} من قِبل ${userRole}.`,
      type: decision,
      meta: { requestId: updatedRequest._id }
    });

    // ⬅️ إشعارات للشخص اللي وافق
    await Notification.create({
      userId,
      message: `تم تسجيل قرارك (${decision}) على الطلب رقم (${updatedRequest._id}).`,
      type: 'confirmation',
      meta: { requestId: updatedRequest._id }
    });

    return res.status(200).json({
      message: `Step ${decision} successfully`,
      request: updatedRequest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ جلب الطلبات المعلقة للموافقة (للرول مثل manager/admin حسب كل خطوة)
const getPendingRequests = async (req, res) => {
  try {
    const userRole = req.user.role;
    // جلب كل الطلبات المعلقة
    const pendingRequests = await Request.find({ status: 'pending' })
      .populate('workflowId', 'name description steps')
      .populate('createdBy', 'name email')
      .exec();

    // فلترة حسب الدور المسؤول عن الخطوة الحالية
    const filtered = pendingRequests.filter(r => {
      if (!r.workflowId || !Array.isArray(r.workflowId.steps)) return false;
      const step = r.workflowId.steps[r.currentStep - 1];
      return !!step && step.assignedRole === userRole;
    });

    return res.status(200).json({ success: true, count: filtered.length, data: filtered.map(r => ({
      id: r._id,
      title: r.data?.title || null,
      description: r.data?.description || null,
      status: r.status,
      currentStep: r.currentStep,
      workflowName: r.workflowId?.name || null,
      createdBy: r.createdBy ? { name: r.createdBy.name, email: r.createdBy.email } : null,
      createdAt: r.createdAt
    }))});
  } catch (error) {
    console.error('Error in getPendingRequests:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  createNewRequest,
  getAllRequests,
  getSingleRequestById,
  handleApproval,
  getPendingRequests
};
