import sequelize from '../config/db.js';
import User from './user.js';
import Task from './task.js';

// Setup associations
User.hasMany(Task, {
  foreignKey: 'userId',
  as: 'tasks',
  onDelete: 'CASCADE'
});

Task.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

export {
  sequelize,
  User,
  Task
};
