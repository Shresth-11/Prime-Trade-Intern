import logger from '../utils/logger.js';

/**
 * Express error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Handle specific Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      status: 'error',
      message: 'Email address already registered.',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;
