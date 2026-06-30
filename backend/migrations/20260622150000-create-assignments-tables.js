'use strict';

var dbm;
var type;
var seed;

exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.runSql(`
    -- Bảng Assignments (Bài tập)
    CREATE TABLE IF NOT EXISTS assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      class_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      exercise_type_id INT NULL,
      max_score INT DEFAULT 10,
      color VARCHAR(50) DEFAULT '#3b82f6',
      requirements TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );

    -- Bảng trung gian Assignment - Students (Danh sách học sinh được giao bài)
    CREATE TABLE IF NOT EXISTS assignment_students (
      assignment_id INT NOT NULL,
      student_id INT NOT NULL,
      status TINYINT(1) DEFAULT 0, -- 0: Chưa nộp, 1: Đã nộp, 2: Đã chấm điểm
      score DECIMAL(5,2) DEFAULT NULL,
      feedback TEXT NULL,
      submitted_at TIMESTAMP NULL DEFAULT NULL,
      graded_at TIMESTAMP NULL DEFAULT NULL,
      PRIMARY KEY (assignment_id, student_id),
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Bảng trung gian Assignment - Questions (Các câu hỏi thuộc bài tập)
    CREATE TABLE IF NOT EXISTS assignment_questions (
      assignment_id INT NOT NULL,
      question_id INT NOT NULL,
      order_index INT DEFAULT 0,
      PRIMARY KEY (assignment_id, question_id),
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );
  `);
};

exports.down = function(db) {
  return db.runSql(`
    DROP TABLE IF EXISTS assignment_questions;
    DROP TABLE IF EXISTS assignment_students;
    DROP TABLE IF EXISTS assignments;
  `);
};

exports._meta = {
  "version": 1
};
