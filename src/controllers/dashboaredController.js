const Request = require('../models/request');
const Workflow = require('../models/Workflow');

const getDashboardStats = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    let requests = [];

    // 1️ الأدمن يشوف كل الطلبات
    if (role === 'admin') {
      requests = await Request.find();
    }
    // 2️⃣ المدير يشوف الطلبات اللي الخطوة الحالية فيها assignedRole = 'manager'
    else if (role === 'manager') {
      const workflows = await Workflow.find({ 'steps.assignedRole': 'manager' });
      const workflowIds = workflows.map(w => w._id);

      // نجيب الطلبات اللي تنتمي للـworkflows دي، والخطوة الحالية فيها تخص المانجر
      requests = await Request.find({
        workflowId: { $in: workflowIds },
        status: 'pending'
      }).populate('workflowId');

      // نفلتر الطلبات اللي فعلاً الخطوة الحالية ليها assignedRole = manager
      requests = requests.filter(r => {
        const currentStep = r.workflowId.steps[r.currentStep - 1];
        return currentStep && currentStep.assignedRole === 'manager';
      });
    }
    // 3️⃣ الموظف يشوف الطلبات اللي عملها فقط
    else {
      requests = await Request.find({ createdBy: userId });
    }

    // 4️⃣ لو مفيش طلبات
    if (!requests.length) {
      return res.status(200).json({
        message: 'No requests found yet',
        summary: { total: 0, pending: 0, approved: 0, rejected: 0 },
        recentRequests: []
      });
    }

    // 5️⃣ نحسب الإحصائيات
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;

    // 6️⃣ آخر 5 طلبات
    const recentRequests = requests
      .slice(-5)
      .reverse()
      .map(r => ({
        id: r._id,
        workflowName: r.workflowId?.name || 'Unknown Workflow',
        status: r.status,
        createdAt: r.createdAt
      }));

    // 7️⃣ نرجّع الرد
    res.status(200).json({
      message:
        role === 'admin'
          ? 'Admin Dashboard'
          : role === 'manager'
          ? 'Manager Dashboard'
          : 'User Dashboard',
      summary: { total, pending, approved, rejected },
      recentRequests
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error while loading dashboard' });
  }
};

module.exports = { getDashboardStats };
