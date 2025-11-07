const Workflow = require('../models/Workflow');

const createNewWorkflow = async (req, res) => {
  try {
    const { name, description, steps } = req.body;

    // التحقق من صلاحية المستخدم
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        message: 'Only admins and managers can create workflows'
      });
    }

    // نجيب المستخدم اللي عامل الريكويست (من الـauthMiddleware)
    const createdBy = req.user.id;

    if (!name || !steps || steps.length === 0) {
      return res.status(400).json({ message: 'Name and steps are required' });
    }

    const newWorkflow = await Workflow.create({
      name,
      description,
      createdBy,
      steps,
    });

    res.status(201).json({
      message: 'Workflow created successfully ✅',
      workflow: newWorkflow,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


const getAllWorkflows = async (req, res) => {
  try {
    // كل المستخدمين يمكنهم رؤية جميع الـ workflows
    const workflows = await Workflow.find()
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 }); // ترتيب من الأحدث للأقدم

    // نرجّع النتيجة
    res.status(200).json({
      message: 'Workflows fetched successfully ✅',
      count: workflows.length,
      workflows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Compatibility endpoint: return workflows array only (useful for frontends expecting an array)
const getWorkflowsList = async (req, res) => {
  try {
    // كل المستخدمين المصرح لهم يمكنهم رؤية قائمة الـ workflows
    const workflows = await Workflow.find()
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 }); // ترتيب من الأحدث للأقدم

    res.status(200).json(workflows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSingleWorkflowById = async (req, res) => {
  try {
    const { id } = req.params;

    const workflow = await Workflow.findById(id).populate('createdBy', 'name email role');

    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    // 4️⃣ لو المستخدم مش Admin ولا صاحب الـworkflow → يمنع الوصول
    if (req.user.role !== 'admin' && workflow.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({
      message: 'Workflow fetched successfully ✅',
      workflow,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
const updateWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, steps } = req.body;

    // نجيب الـworkflow من القاعدة
    const workflow = await Workflow.findById(id);

    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    // التحقق من الصلاحية: فقط الـadmin أو اللي أنشأه
    if (req.user.role !== 'admin' && workflow.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // نحدّث الحقول لو وصلت في الـbody
    if (name) workflow.name = name;
    if (description) workflow.description = description;
    if (steps) workflow.steps = steps;

    await workflow.save();

    res.status(200).json({
      message: 'Workflow updated successfully ✅',
      workflow,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
const deleteWorkflow = async (req, res) => {
  try {
    const { id } = req.params;

    const workflow = await Workflow.findById(id);

    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    // نفس شرط الصلاحية
    if (req.user.role !== 'admin' && workflow.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Workflow.findByIdAndDelete(id);

    res.status(200).json({ message: 'Workflow deleted successfully 🗑️' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = { createNewWorkflow, getAllWorkflows, getWorkflowsList, getSingleWorkflowById, updateWorkflow, deleteWorkflow };



