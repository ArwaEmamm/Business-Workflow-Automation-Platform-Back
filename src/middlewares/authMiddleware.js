const jwt = require('jsonwebtoken');

// ✅ الميدل وير الأساسي للتحقق من التوكن
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// ✅ دالة التحقق من الصلاحيات (roles)
function permit(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }

    next();
  };
}

// ✅ نصدّر الاثنين سوا
module.exports = { authMiddleware, permit };
