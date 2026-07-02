import app from './app.js';
import { sequelize, User } from './models/index.js';
import logger from './utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Seed demo credentials
async function seedDatabase() {
  try {
    const userExists = await User.findOne({ where: { email: 'user@example.com' } });
    if (!userExists) {
      await User.create({
        name: 'Demo Standard User',
        email: 'user@example.com',
        password: 'password123',
        role: 'user'
      });
      logger.info('Database Seed: Demo Standard User created (user@example.com / password123)');
    } else {
      // Ensure the existing admin@example.com or user@example.com has correct role in case it was modified
      if (userExists.role !== 'user') {
        userExists.role = 'user';
        await userExists.save();
        logger.info('Database Seed: Standard User role reset to "user"');
      }
    }
    
    const adminExists = await User.findOne({ where: { email: 'admin@example.com' } });
    if (!adminExists) {
      await User.create({
        name: 'Demo Administrator',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
      });
      logger.info('Database Seed: Demo Administrator created (admin@example.com / password123)');
    } else {
      if (adminExists.role !== 'admin') {
        adminExists.role = 'admin';
        await adminExists.save();
        logger.info('Database Seed: Admin User role reset to "admin"');
      }
    }
  } catch (err) {
    logger.error('Failed to seed database:', err);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception! Server shutting down...');
  logger.error(err);
  process.exit(1);
});

async function startServer() {
  try {
    logger.info('Connecting to Database...');
    // Sync DB models (creates tables if they don't exist)
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');
    
    // In dev, sync schema
    await sequelize.sync({ alter: true });
    logger.info('Database synchronized (alter tables).');

    // Run seed
    await seedDatabase();

    const server = app.listen(PORT, () => {
      logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      logger.info(`Live Dashboard: http://localhost:${PORT}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Rejection! Shutting down server gracefully...');
      logger.error(err);
      server.close(() => {
        process.exit(1);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
