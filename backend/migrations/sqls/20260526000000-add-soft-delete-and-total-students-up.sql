ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted TINYINT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS total_students INT DEFAULT 0;

-- Đồng bộ sĩ số hiện tại cho các lớp học
UPDATE classes c SET total_students = (
    SELECT COUNT(*) 
    FROM student_classes sc 
    JOIN users u ON sc.student_id = u.id 
    WHERE sc.class_id = c.id AND sc.status = 1 AND u.deleted_at IS NULL
);
