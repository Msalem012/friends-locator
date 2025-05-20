const { pool } = require('./config/database');

async function checkTableStructure() {
    try {
        // Check users table
        console.log('Checking users table structure...');
        let query = `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        `;
        
        let result = await pool.query(query);
        
        console.log('Users table columns:');
        result.rows.forEach(column => {
            console.log(`${column.column_name}: ${column.data_type}`);
        });
        
        // Check friends table
        console.log('\nChecking friends table structure...');
        query = `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'friends'
            ORDER BY ordinal_position;
        `;
        
        result = await pool.query(query);
        
        console.log('Friends table columns:');
        result.rows.forEach(column => {
            console.log(`${column.column_name}: ${column.data_type}`);
        });
        
        console.log('\nTable structure check completed!');
    } catch (error) {
        console.error('Error checking table structure:', error);
    } finally {
        pool.end();
    }
}

checkTableStructure(); 