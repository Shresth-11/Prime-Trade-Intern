import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * Protect routes by verifying JWT in Authorization header
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in. Please log in to get access.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretprimetradetokenkey123!');
    } catch (err) {
      logger.warn(`Token verification failed: ${err.message}`);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token. Please log in again.'
      });
    }

    // Check if user still exists
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    next(error);
  }
};

/**
 * Restrict access to specific roles
 * @param {...string} roles - Allowed roles
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action.'
      });
    }
    next();
  };
};
