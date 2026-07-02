import { User, Task, sequelize } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * Get all users with task counts (Admin Only)
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { 
        exclude: ['password'],
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM Tasks AS task
              WHERE task.userId = User.id
            )`),
            'taskCount'
          ]
        ]
      },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    next(error);
  }
};

/**
 * Update user role (Admin Only)
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const userToUpdate = await User.findByPk(req.params.id);

    if (!userToUpdate) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Guard: Prevent admin from changing their own role (accidental lockout)
    if (userToUpdate.id === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot change your own role.'
      });
    }

    userToUpdate.role = role;
    await userToUpdate.save();

    logger.info(`User role updated: User ID ${userToUpdate.id} role changed to ${role} by Admin ${req.user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'User role updated successfully',
      data: {
        user: {
          id: userToUpdate.id,
          name: userToUpdate.name,
          email: userToUpdate.email,
          role: userToUpdate.role
        }
      }
    });
  } catch (error) {
    logger.error('Update user role error:', error);
    next(error);
  }
};
