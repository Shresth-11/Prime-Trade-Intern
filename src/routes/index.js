import express from 'express';
import authRouter from './v1/auth.js';
import taskRouter from './v1/tasks.js';
import userRouter from './v1/users.js';

const router = express.Router();

// Mount API sub-routers
router.use('/auth', authRouter);
router.use('/tasks', taskRouter);
router.use('/users', userRouter);

export default router;
