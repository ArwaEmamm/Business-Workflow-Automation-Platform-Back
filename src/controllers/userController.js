const User = require('../models/User');
const Request = require('../models/request');

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
    try {
        // التحقق من أن المستخدم admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. Admin only.' 
            });
        }

        // جلب كل المستخدمين مع تحديد الحقول المطلوب إظهارها
        const users = await User.find({})
            .select('name email role createdAt')
            .sort({ createdAt: -1 }); // ترتيب تنازلي حسب تاريخ الإنشاء

        // تنسيق البيانات للعرض
        const formattedUsers = users.map(user => ({
            id: user._id, // نحتاجه للعمليات في الـfrontend
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        }));

        res.status(200).json({
            success: true,
            count: users.length,
            data: formattedUsers
        });
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({
            success: false,
            message: 'Error while fetching users',
            error: error.message
        });
    }
};

// Get all requests (Admin only)
const getAllRequests = async (req, res) => {
    try {
        // التحقق من أن المستخدم admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. Admin only.' 
            });
        }

        // جلب كل الطلبات مع معلومات المستخدم والـworkflow
        const requests = await Request.find({})
            .populate('createdBy', 'name email role')
            .populate('workflowId', 'name description')
            .sort({ createdAt: -1 }); // ترتيب تنازلي حسب تاريخ الإنشاء

        // تنسيق البيانات للعرض
        const formattedRequests = requests.map(request => ({
            id: request._id,
            data: request.data || {}, // كل البيانات المخزنة في حقل data
            status: request.status,
            currentStep: request.currentStep,
            createdAt: request.createdAt,
            attachments: request.attachments || [],
            user: request.createdBy ? {
                id: request.createdBy._id,
                name: request.createdBy.name,
                email: request.createdBy.email,
                role: request.createdBy.role
            } : null,
            workflow: request.workflowId ? {
                id: request.workflowId._id,
                name: request.workflowId.name,
                description: request.workflowId.description
            } : null,
            approvals: request.approvals || []
        }));

        res.status(200).json({
            success: true,
            count: requests.length,
            data: formattedRequests
        });
    } catch (error) {
        console.error('Error in getAllRequests:', error);
        res.status(500).json({
            success: false,
            message: 'Error while fetching requests',
            error: error.message
        });
    }
};

module.exports = {
    getAllUsers,
    getAllRequests
};
