import db from '../config/db';

async function dropTables() {
  try {
    console.log('Connecting to TiDB database...');
    
    // Drop action_logs table
    try {
      console.log('Dropping legacy table "action_logs"...');
      await db.query('DROP TABLE IF EXISTS action_logs');
      console.log('Legacy table "action_logs" dropped successfully.');
    } catch (e: any) {
      console.error('Error dropping "action_logs":', e.message);
    }
    
    // Drop type_configs table
    try {
      console.log('Dropping legacy table "type_configs"...');
      await db.query('DROP TABLE IF EXISTS type_configs');
      console.log('Legacy table "type_configs" dropped successfully.');
    } catch (e: any) {
      console.error('Error dropping "type_configs":', e.message);
    }
    
    console.log('\nChecking remaining tables...');
    const [tablesResult]: any = await db.query('SHOW TABLES');
    const firstRow = tablesResult[0];
    const key = Object.keys(firstRow)[0];
    const tables = tablesResult.map((row: any) => row[key]);
    
    console.log(`Remaining tables in database: ${tables.length}`);
    tables.forEach((t: string) => console.log(` - ${t}`));
    
  } catch (error) {
    console.error('Error in drop legacy tables script:', error);
  } finally {
    await db.end();
    process.exit(0);
  }
}

dropTables();
