import { Request, Response } from 'express';
import AssignmentModel from '../models/assignmentModel';
import { createActivityLog } from '../utils/logger';

const calculateDueDate = (duration: string): Date => {
  const now = new Date();
  const value = parseInt(duration, 10);
  if (isNaN(value)) {
    // Mặc định 7 ngày
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  if (duration.endsWith('p')) {
    // phút (10p, 15p, 30p, 60p)
    return new Date(now.getTime() + value * 60 * 1000);
  } else if (duration.endsWith('d')) {
    // ngày (1d, 5d, 7d)
    return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
  }
  // Mặc định dự phòng
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
};

const assignmentController = {
  /**
   * Tạo bài tập mới
   */
  createAssignment: async (req: Request, res: Response): Promise<void> => {
    try {
      const { classId } = req.params;
      const { title, exercise_type_id, max_score, color, requirements, student_ids, question_ids, duration } = req.body;

      if (!title) {
        res.status(400).json({ success: false, message: 'Tiêu đề bài tập là bắt buộc' });
        return;
      }

      const maxScore = max_score !== undefined ? parseInt(max_score as string) : 10;
      if (maxScore > 10) {
        res.status(400).json({ success: false, message: 'Điểm tối đa không được vượt quá 10 điểm' });
        return;
      }

      const cId = parseInt(classId as string);
      const studentIds = Array.isArray(student_ids) ? student_ids.map(Number) : [];
      const questionIds = Array.isArray(question_ids) ? question_ids.map(Number) : [];

      const parsedDuration = duration || '7d';
      const dueDate = calculateDueDate(parsedDuration);

      const insertId = await AssignmentModel.create(
        cId,
        {
          title,
          exercise_type_id: exercise_type_id ? parseInt(exercise_type_id as string) : null,
          max_score: max_score !== undefined ? parseInt(max_score as string) : 10,
          color,
          requirements,
          duration: parsedDuration,
          due_date: dueDate
        },
        studentIds,
        questionIds
      );

      // Ghi log hoạt động
      await createActivityLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'CREATE',
        description: `Tạo bài tập mới: "${title}" cho lớp học ID: ${cId}`,
        newValues: { id: insertId, title, classId: cId, studentCount: studentIds.length, questionCount: questionIds.length },
        ipAddress: req.ip
      });

      res.status(201).json({
        success: true,
        message: 'Tạo bài tập mới thành công',
        data: { id: insertId }
      });
    } catch (error: any) {
      console.error('>>> assignmentController.createAssignment Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo bài tập',
        error: error.message
      });
    }
  },

  /**
   * Cập nhật bài tập (Chỉnh sửa / Gia hạn thời gian)
   */
  updateAssignment: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, exercise_type_id, max_score, color, requirements, student_ids, question_ids, duration } = req.body;

      if (!title) {
        res.status(400).json({ success: false, message: 'Tiêu đề bài tập là bắt buộc' });
        return;
      }

      const maxScore = max_score !== undefined ? parseInt(max_score as string) : 10;
      if (maxScore > 10) {
        res.status(400).json({ success: false, message: 'Điểm tối đa không được vượt quá 10 điểm' });
        return;
      }

      const aId = parseInt(id as string);
      const studentIds = Array.isArray(student_ids) ? student_ids.map(Number) : [];
      const questionIds = Array.isArray(question_ids) ? question_ids.map(Number) : [];

      const assignment = await AssignmentModel.getById(aId);
      if (!assignment) {
        res.status(404).json({ success: false, message: 'Không tìm thấy bài tập' });
        return;
      }

      const parsedDuration = duration || '7d';
      const dueDate = calculateDueDate(parsedDuration);

      await AssignmentModel.update(
        aId,
        {
          title,
          exercise_type_id: exercise_type_id ? parseInt(exercise_type_id as string) : null,
          max_score: max_score !== undefined ? parseInt(max_score as string) : 10,
          color,
          requirements,
          duration: parsedDuration,
          due_date: dueDate
        },
        studentIds,
        questionIds
      );

      // Ghi log hoạt động
      await createActivityLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'UPDATE',
        description: `Cập nhật/Gia hạn bài tập: "${title}" (ID: ${aId})`,
        newValues: { id: aId, title, studentCount: studentIds.length, questionCount: questionIds.length, duration: parsedDuration, due_date: dueDate },
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Cập nhật bài tập thành công'
      });
    } catch (error: any) {
      console.error('>>> assignmentController.updateAssignment Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật bài tập',
        error: error.message
      });
    }
  },

  /**
   * Lấy danh sách bài tập của một lớp học
   */
  getAssignments: async (req: Request, res: Response): Promise<void> => {
    try {
      const { classId } = req.params;
      const cId = parseInt(classId as string);

      const assignments = await AssignmentModel.getByClassId(cId);

      res.status(200).json({
        success: true,
        data: assignments
      });
    } catch (error: any) {
      console.error('>>> assignmentController.getAssignments Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách bài tập',
        error: error.message
      });
    }
  },

  /**
   * Lấy chi tiết một bài tập (kèm danh sách học sinh và câu hỏi)
   */
  getAssignmentById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const aId = parseInt(id as string);

      const assignment = await AssignmentModel.getById(aId);
      if (!assignment) {
        res.status(404).json({ success: false, message: 'Không tìm thấy bài tập' });
        return;
      }

      const students = await AssignmentModel.getAssignedStudents(aId);
      const questions = await AssignmentModel.getQuestions(aId);

      res.status(200).json({
        success: true,
        data: {
          ...assignment,
          students,
          questions
        }
      });
    } catch (error: any) {
      console.error('>>> assignmentController.getAssignmentById Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy chi tiết bài tập',
        error: error.message
      });
    }
  },

  /**
   * Xóa bài tập
   */
  deleteAssignment: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const aId = parseInt(id as string);

      const assignment = await AssignmentModel.getById(aId);
      if (!assignment) {
        res.status(404).json({ success: false, message: 'Không tìm thấy bài tập' });
        return;
      }

      await AssignmentModel.delete(aId);

      // Ghi log hoạt động
      await createActivityLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'DELETE',
        description: `Xóa bài tập: "${assignment.title}" (ID: ${aId})`,
        oldValues: assignment,
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Xóa bài tập thành công'
      });
    } catch (error: any) {
      console.error('>>> assignmentController.deleteAssignment Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa bài tập',
        error: error.message
      });
    }
  },

  /**
   * Học sinh lấy danh sách bài tập được giao trong lớp học
   */
  getStudentAssignments: async (req: Request, res: Response): Promise<void> => {
    try {
      const { classId } = req.params;
      const cId = parseInt(classId as string);
      
      // Mặc định lấy theo học sinh đăng nhập, hoặc theo query nếu admin/giáo viên xem
      let studentId = req.user?.id;
      if (req.query.studentId && ['admin', 'teacher'].includes(req.user?.role.toLowerCase() || '')) {
        studentId = parseInt(req.query.studentId as string);
      }

      if (!studentId) {
        res.status(401).json({ success: false, message: 'Không tìm thấy thông tin học sinh' });
        return;
      }

      const rawAssignments = await AssignmentModel.getStudentAssignments(cId, studentId);
      
      // Lấy danh sách câu hỏi và format cho từng bài tập
      const assignments = await Promise.all(
        rawAssignments.map(async (a: any) => {
          const rawQuestions = await AssignmentModel.getQuestions(a.id);
          
          const questions = rawQuestions.map((q: any) => {
            let parsedAnswers = [];
            try {
              parsedAnswers = typeof q.answers === 'string' ? JSON.parse(q.answers) : (q.answers || []);
            } catch (e) {
              parsedAnswers = [];
            }
            
            // Format sang dạng options: string[] và correctIndex: number
            const options = parsedAnswers.map((ans: any) => ans.text || '');
            const correctIndex = parsedAnswers.findIndex((ans: any) => ans.isCorrect === true || ans.isCorrect === 1 || ans.isCorrect === 'true');
            
            const isMultipleChoice = q.question_type === 'Multiple choice';

            return {
              id: q.question_id,
              text: `${q.requirement}\n${q.content}`,
              questionType: q.question_type,
              options: isMultipleChoice ? options : [],
              correctIndex: correctIndex !== -1 ? correctIndex : 0
            };
          });

          return {
            id: a.id,
            title: a.title,
            exercise_type_id: a.exercise_type_id,
            exercise_type_name: a.exercise_type_name,
            max_score: a.max_score,
            maxScore: a.max_score,
            color: a.color,
            requirements: a.requirements,
            created_at: a.created_at,
            dueDate: a.due_date ? new Date(a.due_date).toISOString() : null,
            status: a.status === 1 ? 'done' : (a.due_date && new Date() > new Date(a.due_date) ? 'late' : 'pending'),
            score: a.score !== null ? parseFloat(a.score) : null,
            feedback: a.feedback,
            submitted_at: a.submitted_at,
            graded_at: a.graded_at,
            questions
          };
        })
      );

      res.status(200).json({
        success: true,
        data: assignments
      });
    } catch (error: any) {
      console.error('>>> assignmentController.getStudentAssignments Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi học sinh lấy bài tập',
        error: error.message
      });
    }
  },

  /**
   * Học sinh nộp bài làm trắc nghiệm
   */
  submitAssignment: async (req: Request, res: Response): Promise<void> => {
    try {
      const { assignmentId } = req.params;
      const aId = parseInt(assignmentId as string);
      const studentId = req.user?.id;
      const { answers } = req.body; // Map dạng { [questionId]: selectedIndex }

      if (!studentId) {
        res.status(401).json({ success: false, message: 'Không tìm thấy thông tin học sinh' });
        return;
      }

      if (!answers) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp câu trả lời' });
        return;
      }

      const assignment = await AssignmentModel.getById(aId);
      if (!assignment) {
        res.status(404).json({ success: false, message: 'Không tìm thấy bài tập' });
        return;
      }

      const questions = await AssignmentModel.getQuestionsWithAnswers(aId);
      let score = 0;
      let correctCount = 0;
      const evaluation: { [key: number]: { isCorrect: boolean; correctAnswer: string } } = {};

      if (questions && questions.length > 0) {
        questions.forEach((q: any) => {
          let parsedAnswers = [];
          try {
            parsedAnswers = typeof q.answers === 'string' ? JSON.parse(q.answers) : (q.answers || []);
          } catch (e) {
            parsedAnswers = [];
          }

          const studentAnswer = answers[q.question_id];
          let isCorrect = false;
          let correctAnswerLabel = '';

          if (q.question_type === 'Multiple choice') {
            const correctIndex = parsedAnswers.findIndex((ans: any) => ans.isCorrect === true || ans.isCorrect === 1 || ans.isCorrect === 'true');
            if (studentAnswer !== undefined && parseInt(studentAnswer.toString(), 10) === correctIndex) {
              isCorrect = true;
              correctCount++;
            }
            correctAnswerLabel = correctIndex !== -1 ? (parsedAnswers[correctIndex]?.text || '') : '';
          } else {
            // Word form / short answer
            const correctAnsObj = parsedAnswers.find((ans: any) => ans.isCorrect === true || ans.isCorrect === 1 || ans.isCorrect === 'true');
            const correctText = (correctAnsObj?.text || '').trim().toLowerCase();
            const studentText = (studentAnswer !== undefined && studentAnswer !== null) ? studentAnswer.toString().trim().toLowerCase() : '';
            if (correctText && studentText === correctText) {
              isCorrect = true;
              correctCount++;
            }
            correctAnswerLabel = correctAnsObj?.text || '';
          }

          evaluation[q.question_id] = {
            isCorrect,
            correctAnswer: correctAnswerLabel
          };
        });

        score = parseFloat(((correctCount / questions.length) * assignment.max_score).toFixed(1));
      } else {
        score = 0;
      }

      await AssignmentModel.submitAssignment(aId, studentId, score, JSON.stringify(answers));

      // Ghi log hoạt động
      await createActivityLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'UPDATE',
        description: `Học sinh nộp bài tập ID: ${aId}. Đạt điểm: ${score}/${assignment.max_score}`,
        newValues: { assignmentId: aId, studentId, score, correctCount, totalQuestions: questions.length, evaluation },
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Nộp bài tập thành công',
        data: {
          score,
          correctCount,
          totalQuestions: questions.length,
          evaluation
        }
      });
    } catch (error: any) {
      console.error('>>> assignmentController.submitAssignment Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi nộp bài tập',
        error: error.message
      });
    }
  }
};

export default assignmentController;
