import db from '../config/db';
import { LogInput } from '../types';

/**
 * Hàm ghi log hoạt động của người dùng vào database
 * Hỗ trợ lưu Diff Data (JSON) để theo dõi thay đổi
 */
export async function createActivityLog(log: LogInput) {
  try {
    console.log(`[ActivityLog] Attempting to log: ${log.action} - ${log.description}`);
    
    const query = `
      INSERT INTO activity_logs 
      (user_id, user_email, action, target_user_id, description, old_values, new_values, ip_address) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      log.userId || null,
      log.userEmail || null,
      log.action,
      log.targetUserId || null,
      log.description,
      log.oldValues ? JSON.stringify(log.oldValues) : null,
      log.newValues ? JSON.stringify(log.newValues) : null,
      log.ipAddress || null
    ];

    await db.query(query, values);
    
    console.log(`[ActivityLog] Success: ${log.action} - ${log.description}`);
  } catch (error: any) {
    console.error("[ActivityLog] Error recording log:", error.message);
    // Log chi tiết lỗi để debug
    if (error.code) console.error("[ActivityLog] Error Code:", error.code);
  }
}
