import { Sequelize } from 'sequelize';
import path from 'path';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = path.resolve(process.cwd(), 'database.sqlite');

logger.info(`Database path resolved to: ${dbPath}`);

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: (msg) => logger.debug(msg),
  define: {
    timestamps: true
  }
});

export default sequelize;
