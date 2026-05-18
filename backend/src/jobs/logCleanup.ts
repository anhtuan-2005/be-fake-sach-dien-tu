import cron from 'node-cron';
import db from '../config/db';

/**
 * Retention Policy: Tự động dọn dẹp log cũ hơn 90 ngày
 * Chạy vào lúc 00:00 ngày đầu tiên của mỗi tháng
 */
export const setupLogCleanupJob = () => {
  // '0 0 1 * *' -> Minute: 0, Hour: 0, Day of Month: 1, Month: *, Day of Week: *
  cron.schedule('0 0 1 * *', async () => {
    console.log('[CronJob] Bắt đầu dọn dẹp nhật ký hoạt động cũ...');
    
    try {
      // Xóa các bản ghi có created_at cũ hơn 90 ngày
      const [result] = await db.query<any>(
        'DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)'
      );
      
      console.log(`[CronJob] Hoàn tất! Đã xóa ${result.affectedRows} bản ghi cũ hơn 90 ngày.`);
    } catch (error) {
      console.error('[CronJob] Lỗi khi dọn dẹp log:', error);
    }
  });
  
  console.log('[CronJob] Đã kích hoạt Retention Policy (90 ngày) cho Activity Logs.');
};
