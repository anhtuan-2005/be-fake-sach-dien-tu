ALTER TABLE classes ADD COLUMN IF NOT EXISTS completion_status TINYINT DEFAULT 0 COMMENT '0: Đang học, 1: Hoàn thành';
