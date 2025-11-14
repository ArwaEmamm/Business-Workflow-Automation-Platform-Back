const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ✅ تسجيل مستخدم جديد
exports.register = async (req, res) => {
  try {
    console.log('Register request body:', req.body);
    
    if (!req.body) {
      return res.status(400).json({ 
        message: 'Request body is missing',
        received: req.body
      });
    }

    const { name, email, password, role } = req.body;

    // 1️⃣ نتأكد إن كل الحقول الأساسية وصلت
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Please fill all required fields',
        received: { name, email, password: password ? '(provided)' : undefined }
      });
    }

    // 2️⃣ نتحقق هل المستخدم موجود مسبقًا
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // 3️⃣ نعمل هاش للباسورد قبل التخزين
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // 4️⃣ نتأكد إن قيمة role مقبولة وإلا نستخدم 'employee' كافتراضي
    const allowedRoles = ['hr_manager', 'manager', 'employee'];
    const roleToUse = allowedRoles.includes(role) ? role : 'employee';

    // 5️⃣ ننشئ المستخدم الجديد
    const newUser = await User.create({
      name,
      email,
      passwordHash: hash,
      role: roleToUse
    });

    // 5️⃣ نولّد له access token (علشان يفضل مسجل بعد التسجيل)
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // 6️⃣ نرجّع البيانات
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      token
    });
  } catch (error) {
    console.error(error);
    // If it's a Mongoose validation error, return 400 with details
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
};
// ✅ تسجيل الدخول
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ نتأكد إن المستخدم كتب البريد والباسورد
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter email and password' });
    }

    // 2️⃣ نبحث عن المستخدم في قاعدة البيانات
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // 3️⃣ نقارن الباسورد اللي دخله بالهاش المتخزن
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // 4️⃣ نولّد التوكن JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    // 5️⃣ نحفظ آخر وقت دخول (اختياري)
    // Normalize role on login to handle legacy values (e.g. "admin\n")
    try {
      if (user.role && typeof user.role === 'string') {
        const trimmed = user.role.trim();
        user.role = trimmed === 'admin' ? 'hr_manager' : trimmed;
      }
    } catch (e) {
      // keep going; we'll still attempt to save lastLogin
      console.warn('Role normalization failed:', e && e.message);
    }

    user.lastLogin = new Date();
    await user.save();

    // 6️⃣ نرجّع الرد
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
