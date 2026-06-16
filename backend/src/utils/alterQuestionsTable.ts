import db from '../config/db';

async function alterTable() {
  try {
    console.log('Connecting to database and altering table "questions"...');
    
    // Add audio_url column
    try {
      await db.query("ALTER TABLE questions ADD COLUMN audio_url VARCHAR(500) NULL AFTER content");
      console.log('Added column "audio_url" successfully.');
    } catch (e: any) {
      console.log('Column "audio_url" might already exist:', e.message);
    }
    
    // Add image_url column
    try {
      await db.query("ALTER TABLE questions ADD COLUMN image_url VARCHAR(500) NULL AFTER audio_url");
      console.log('Added column "image_url" successfully.');
    } catch (e: any) {
      console.log('Column "image_url" might already exist:', e.message);
    }
    
    console.log('Finished altering table "questions".');
  } catch (error) {
    console.error('Error altering table:', error);
  } finally {
    await db.end();
    process.exit(0);
  }
}

alterTable();
