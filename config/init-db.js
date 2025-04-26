const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

async function initializeDatabase() {
    try {
        // Read the schema file
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        
        // Connect to the database
        const client = await pool.connect();
        
        try {
            // Execute the schema
            await client.query(schema);
            console.log('Database tables created successfully');
        } finally {
            // Release the client back to the pool
            client.release();
        }
        
        // Close the pool
        await pool.end();
        
    } catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    }
}

// Run the initialization
initializeDatabase(); 