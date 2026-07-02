import { Task, User } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * Create a new task
 */
export const createTask = async (req, res, next) => {
  try {
    const { title, description, status } = req.body;
    
    const newTask = await Task.create({
      title,
      description,
      status: status || 'pending',
      userId: req.user.id
    });

    logger.info(`Task created: ID ${newTask.id} by User ${req.user.email}`);

    res.status(201).json({
      status: 'success',
      data: {
        task: newTask
      }
    });
  } catch (error) {
    logger.error('Create task error:', error);
    next(error);
  }
};

/**
 * Get all tasks
 * Normal user gets only their own. Admin gets all.
 */
export const getAllTasks = async (req, res, next) => {
  try {
    const filter = {};
    
    // Check role to restrict scope
    if (req.user.role !== 'admin') {
      filter.userId = req.user.id;
    } else if (req.query.userId) {
      // Admin can filter by userId if provided
      filter.userId = req.query.userId;
    }

    const tasks = await Task.findAll({
      where: filter,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: {
        tasks
      }
    });
  } catch (error) {
    logger.error('Get all tasks error:', error);
    next(error);
  }
};

/**
 * Get task by ID
 */
export const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Authorization check
    if (req.user.role !== 'admin' && task.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this task'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        task
      }
    });
  } catch (error) {
    logger.error('Get task by ID error:', error);
    next(error);
  }
};

/**
 * Update task
 */
export const updateTask = async (req, res, next) => {
  try {
    const { title, description, status } = req.body;
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Authorization check
    if (req.user.role !== 'admin' && task.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to modify this task'
      });
    }

    // Update fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;

    await task.save();
    
    // Fetch updated task with associated user details
    const updatedTask = await Task.findByPk(task.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });

    logger.info(`Task updated: ID ${task.id} by User ${req.user.email}`);

    res.status(200).json({
      status: 'success',
      data: {
        task: updatedTask
      }
    });
  } catch (error) {
    logger.error('Update task error:', error);
    next(error);
  }
};

/**
 * Delete task
 */
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Authorization check
    if (req.user.role !== 'admin' && task.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this task'
      });
    }

    await task.destroy();

    logger.info(`Task deleted: ID ${req.params.id} by User ${req.user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully'
    });
  } catch (error) {
    logger.error('Delete task error:', error);
    next(error);
  }
};
