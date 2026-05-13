import express, { Router } from 'express';
import bookController from '../controllers/bookController';

const router: Router = express.Router();

// API lấy danh sách toàn bộ sách
router.get('/', bookController.getBooks);

// API lấy chi tiết một cuốn sách theo ID
router.get('/:id', bookController.getBookById);

export default router;
