import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import logger from '../utils/logger.js';

// Helper to generate JWT token
const signToken = (id, email, role) => {
  return jwt.sign(
    { id, email, role },
    process.env.JWT_SECRET || 'supersecretprimetradetokenkey123!',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Register a new user
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email address already registered'
      });
    }

    // Role safety logic:
    // Allow specifying role during signup for easy testing/evaluation of RBAC features,
    // but default to 'user'. For demonstration, we also make "admin@example.com" or
    // emails containing "admin" automatically an admin if not specified.
    let assignedRole = 'user';
    if (role && ['user', 'admin'].includes(role)) {
      assignedRole = role;
    } else if (email.includes('admin@') || email.startsWith('admin.')) {
      assignedRole = 'admin';
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role: assignedRole
    });

    // Remove password from response
    newUser.password = undefined;

    const token = signToken(newUser.id, newUser.email, newUser.role);

    logger.info(`User registered: ${newUser.email} (${newUser.role})`);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser
      }
    });
  } catch (error) {
    logger.error('Registration controller error:', error);
    next(error);
  }
};

/**
 * Log in a user
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    const token = signToken(user.id, user.email, user.role);

    logger.info(`User logged in: ${user.email} (${user.role})`);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Login controller error:', error);
    next(error);
  }
};

/**
 * Get profile of current user
 */
export const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Get profile controller error:', error);
    next(error);
  }
};
