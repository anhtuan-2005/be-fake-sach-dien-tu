import { Router } from 'express';
import { ExerciseTypeController } from './exercise-type.controller';
import { verifyToken } from '../../middleware/authMiddleware';
import { authorize } from '../../middleware/authorize';
import { validateDto } from '../../middleware/validation.middleware';
import { CreateExerciseTypeDto, UpdateExerciseTypeDto } from './exercise-type.dto';

const router = Router();

// Tất cả các route trong Quản lý loại bài tập đều yêu cầu xác thực JWT và quyền 'admin'
router.use(verifyToken);
router.use(authorize(['admin', 'teacher']));

// REST endpoints cho Quản lý loại bài tập
router.get('/', ExerciseTypeController.findAll);
router.get('/:id', ExerciseTypeController.findOne);
router.post('/', validateDto(CreateExerciseTypeDto), ExerciseTypeController.create);
router.put('/:id', validateDto(UpdateExerciseTypeDto), ExerciseTypeController.update);
router.delete('/:id', ExerciseTypeController.remove);

export default router;
