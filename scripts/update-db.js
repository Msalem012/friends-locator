const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function updateDatabase() {
    try {
        console.log('Starting database update...');
        
        // Read the friends table schema
        const friendsTableSchema = `
            CREATE TABLE IF NOT EXISTS friends (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, friend_id),
                CONSTRAINT not_self_friend CHECK (user_id != friend_id)
            );
        `;
        
        // Connect to the database
        const client = await pool.connect();
        
        try {
            console.log('Checking if friends table exists...');
            
            // Check if the friends table already exists
            const tableCheckResult = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'friends'
                );
            `);
            
            const tableExists = tableCheckResult.rows[0].exists;
            
            if (!tableExists) {
                console.log('Creating friends table...');
                await client.query(friendsTableSchema);
                console.log('Friends table created successfully.');
            } else {
                console.log('Friends table already exists, skipping creation.');
            }
            
            console.log('Database update completed successfully.');
        } finally {
            // Release the client back to the pool
            client.release();
        }
        
    } catch (err) {
        console.error('Error updating database:', err);
        process.exit(1);
    } finally {
        // Close the pool
        await pool.end();
    }
}

// Run the update script
updateDatabase().then(() => {
    console.log('Database update script completed.');
}); 