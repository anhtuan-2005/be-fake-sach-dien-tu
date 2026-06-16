import db from '../config/db';

async function checkTables() {
  try {
    console.log('Connecting to TiDB database...');
    // Query list of tables
    const [tablesResult]: any = await db.query('SHOW TABLES');
    
    if (!tablesResult || tablesResult.length === 0) {
      console.log('No tables found in the database.');
      return;
    }
    
    const firstRow = tablesResult[0];
    const key = Object.keys(firstRow)[0]; // e.g. "Tables_in_test"
    
    const tables = tablesResult.map((row: any) => row[key]);
    console.log(`\nFound ${tables.length} tables in total.\n`);
    
    console.log('----------------------------------------------------');
    console.log('Table Name | Row Count');
    console.log('----------------------------------------------------');
    
    const emptyTables: string[] = [];
    const activeTables: { name: string; count: number }[] = [];
    
    for (const tableName of tables) {
      try {
        const [countResult]: any = await db.query(`SELECT COUNT(*) AS count FROM \`${tableName}\``);
        const count = countResult[0]?.count || 0;
        console.log(`${tableName} | ${count} rows`);
        if (count === 0) {
          emptyTables.push(tableName);
        } else {
          activeTables.push({ name: tableName, count });
        }
      } catch (err: any) {
        console.log(`${tableName} | Error querying count: ${err.message}`);
      }
    }
    
    console.log('----------------------------------------------------');
    console.log(`\nEmpty tables (0 rows): ${emptyTables.length}`);
    emptyTables.forEach(t => console.log(` - ${t}`));
    
    console.log(`\nActive tables (>0 rows): ${activeTables.length}`);
    activeTables.forEach(t => console.log(` - ${t.name}: ${t.count} rows`));
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await db.end();
    process.exit(0);
  }
}

checkTables();
