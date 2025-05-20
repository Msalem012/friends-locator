const fs = require('fs');
const path = require('path');
const { pool } = require('./config/database');

async function setupDatabase() {
    try {
        // Read the SQL file
        const sqlFilePath = path.join(__dirname, 'database_setup.sql');
        const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
        
        console.log('Running database setup script...');
        
        // Execute the SQL commands
        await pool.query(sqlScript);
        
        console.log('Database setup completed successfully!');
    } catch (error) {
        console.error('Error setting up database:', error);
    } finally {
        // Close the pool
        pool.end();
    }
}

setupDatabase(); 