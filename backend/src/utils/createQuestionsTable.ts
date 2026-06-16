import db from '../config/db';

async function createTable() {
  try {
    console.log('Connecting to TiDB...');
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        block_class VARCHAR(50) NOT NULL,
        unit VARCHAR(100) NOT NULL,
        skill VARCHAR(100) NOT NULL,
        question_type VARCHAR(100) NOT NULL,
        requirement TEXT NOT NULL,
        content TEXT NOT NULL,
        answers TEXT NOT NULL,
        cognitive_level VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await db.query(createTableQuery);
    console.log('Successfully created table "questions" (if not exists).');

    // Cập nhật tên cột từ answer thành answers nếu cần (Trường hợp bảng đã tồn tại với cột cũ)
    try {
      await db.query("ALTER TABLE questions CHANGE COLUMN answer answers TEXT NOT NULL");
      console.log('Renamed column "answer" to "answers" successfully.');
    } catch (e) {
      // Bỏ qua nếu cột answers đã tồn tại hoặc cột answer không tồn tại
    }
    
    // Thêm một vài dòng dữ liệu mẫu nếu bảng trống
    const [rows]: any = await db.query('SELECT COUNT(*) as count FROM questions');
    if (rows[0] && rows[0].count === 0) {
      console.log('Inserting mock questions...');
      const insertMockQuery = `
        INSERT INTO questions (block_class, unit, skill, question_type, requirement, content, answers, cognitive_level) VALUES
        ('Lớp 1', 'Unit 1: Hello', 'Vocabulary & Structures', 'Multiple choice', 'Chọn đáp án đúng nhất để hoàn thành câu sau:', 'Hello, my name ___ Nam.', '[{"text": "is", "isCorrect": true}, {"text": "am", "isCorrect": false}]', 'Nhận biết'),
        ('Lớp 2', 'Unit 2: My Family', 'Reading', 'Cloze', 'Đọc và điền từ thích hợp vào chỗ trống:', 'This is my father. ___ is a doctor.', '[{"text": "He", "isCorrect": true}, {"text": "She", "isCorrect": false}]', 'Thông hiểu'),
        ('Lớp 6', 'Unit 1: My New School', 'Writing', 'Transformation', 'Viết lại câu sau sao cho nghĩa không đổi:', 'There are 20 classrooms in my school.\\n-> My school has...', '[{"text": "My school has 20 classrooms.", "isCorrect": true}]', 'Vận dụng'),
        ('Lớp 10', 'Unit 1: Family Life', 'Vocabulary & Structures', 'Multiple choice', 'Choose the correct answer:', 'In my family, my father always does the ___ lifting.', '[{"text": "heavy", "isCorrect": true}, {"text": "hard", "isCorrect": false}]', 'Thông hiểu'),
        ('Lớp 12', 'Unit 1: Life Stories', 'Reading', 'Reading comprehension', 'Đọc đoạn văn và trả lời câu hỏi:', 'Who was born in 1990 in the passage?', '[{"text": "Nguyen Van A", "isCorrect": true}]', 'Thông hiểu')
      ;`;
      await db.query(insertMockQuery);
      console.log('Mock questions inserted successfully.');
    } else {
      console.log('Table already has data. Skipping mock data insertion.');
    }
  } catch (error) {
    console.error('Error initializing questions table:', error);
  } finally {
    await db.end();
    process.exit(0);
  }
}

createTable();
