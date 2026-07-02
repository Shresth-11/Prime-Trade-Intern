import express from 'express';
import { 
  createTask, 
  getAllTasks, 
  getTaskById, 
  updateTask, 
  deleteTask 
} from '../../controllers/taskController.js';
import { protect } from '../../middleware/auth.js';
import { taskCreateValidation, taskUpdateValidation } from '../../middleware/validate.js';

const router = express.Router();

// Protect all routes in this router
router.use(protect);

router.route('/')
  .post(taskCreateValidation, createTask)
  .get(getAllTasks);

router.route('/:id')
  .get(getTaskById)
  .put(taskUpdateValidation, updateTask)
  .delete(deleteTask);

export default router;
