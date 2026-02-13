const jwt = require('jwt-simple');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.decode(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check if user is instructor
const isInstructor = (req, res, next) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Only instructors can access this route' });
  }
  next();
};

// Middleware to check if user is learner
const isLearner = (req, res, next) => {
  if (req.user.role !== 'learner') {
    return res.status(403).json({ error: 'Only learners can access this route' });
  }
  next();
};

// Optional auth - extracts user if token present, continues without error if not
const optionalAuth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.decode(token, JWT_SECRET);
      req.user = decoded;
    } catch (e) {
      // Token invalid, continue without auth
    }
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  isInstructor,
  isLearner,
  JWT_SECRET,
};
