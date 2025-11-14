const Request = require('../models/request');
const Workflow = require('../models/Workflow');

const getDashboardStats = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    let requests = [];

    // 1️⃣ الأدمن يشوف كل الطلبات
    if (role === 'hr_manager') {
      requests = await Request.find().populate('workflowId', 'name steps');
    }
    // 2️⃣ المدير يشوف الطلبات اللي تخص خطوات المانجر
    else if (role === 'manager') {
      const workflows = await Workflow.find({ 'steps.assignedRole': 'manager' });
      const workflowIds = workflows.map(w => w._id);

      let managerRequests = await Request.find({
        workflowId: { $in: workflowIds },
        status: 'pending',
      }).populate('workflowId', 'name steps');

      // نفلتر الطلبات اللي الخطوة الحالية فيها تخص المانجر فعلاً
      requests = managerRequests.filter(r => {
        const currentStep = r.workflowId?.steps?.[r.currentStep - 1];
        return currentStep && currentStep.assignedRole === 'manager';
      });
    }
    // 3️⃣ الموظف يشوف الطلبات اللي عملها فقط
    else {
      requests = await Request.find({ createdBy: userId }).populate('workflowId', 'name');
    }

    // 4️⃣ لو مفيش طلبات
    if (!requests.length) {
      return res.status(200).json({
        message: 'No requests found yet',
        summary: { total: 0, pending: 0, approved: 0, rejected: 0 },
        recentRequests: [],
      });
    }

    // 5️⃣ نحسب الإحصائيات
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;

    // 6️⃣ آخر 5 طلبات (الأحدث أولًا)
    const recentRequests = [...requests]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map(r => ({
        id: r._id,
        workflowName: r.workflowId?.name || 'Unknown Workflow',
        status: r.status,
        createdAt: r.createdAt,
      }));

    // 7️⃣ نرجّع الرد
    res.status(200).json({
      success: true,
      message:
        role === 'hr_manager'
          ? 'HR Manager Dashboard'
          : role === 'manager'
          ? 'Manager Dashboard'
          : 'User Dashboard',
      summary: { total, pending, approved, rejected },
      recentRequests,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error while loading dashboard' });
  }
};

module.exports = { getDashboardStats };
