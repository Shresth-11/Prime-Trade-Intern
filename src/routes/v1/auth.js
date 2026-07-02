import express from 'express';
import { register, login, getMe } from '../../controllers/authController.js';
import { protect } from '../../middleware/auth.js';
import { registerValidation, loginValidation } from '../../middleware/validate.js';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);

export default router;
