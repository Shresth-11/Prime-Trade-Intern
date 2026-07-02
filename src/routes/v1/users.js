import express from 'express';
import { getAllUsers, updateUserRole } from '../../controllers/userController.js';
import { protect, restrictTo } from '../../middleware/auth.js';
import { roleUpdateValidation } from '../../middleware/validate.js';

const router = express.Router();

// Require login and admin role for all user management routes
router.use(protect, restrictTo('admin'));

router.get('/', getAllUsers);
router.put('/:id/role', roleUpdateValidation, updateUserRole);

export default router;
