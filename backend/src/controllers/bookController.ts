import { Request, Response } from 'express';
import Book from '../models/bookModel';
import { ApiResponse, Book as BookInterface } from '../types';

/**
 * Controller quản lý các logic nghiệp vụ liên quan đến sách
 */
const bookController = {
  /**
   * Lấy danh sách toàn bộ sách
   * @param {Request} req Express Request
   * @param {Response} res Express Response
   * @returns {Promise<void>}
   */
  getBooks: async (req: Request, res: Response): Promise<void> => {
    try {
      const books: BookInterface[] = await Book.getAll();
      
      const response: ApiResponse<BookInterface[]> = {
        success: true,
        data: books
      };
      
      res.status(200).json(response);
    } catch (error: unknown) {
      console.error('Error fetching books:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'Lỗi khi lấy danh sách sách',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      res.status(500).json(response);
    }
  },

  /**
   * Lấy chi tiết một cuốn sách
   * @param {Request} req Express Request
   * @param {Response} res Express Response
   * @returns {Promise<void>}
   */
  getBookById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: idParam } = req.params;
      const id = parseInt(idParam as string);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'ID sách không hợp lệ'
        });
        return;
      }

      const book = await Book.getById(id);
      
      if (!book) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy sách'
        });
        return;
      }

      const response: ApiResponse<BookInterface> = {
        success: true,
        data: book
      };
      
      res.status(200).json(response);
    } catch (error: unknown) {
      console.error('Error fetching book details:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'Lỗi khi lấy thông tin sách',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      res.status(500).json(response);
    }
  }
};

export default bookController;
