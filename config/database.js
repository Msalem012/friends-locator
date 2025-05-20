const { Pool } = require('pg');
require('dotenv').config();

// Try explicit connection parameters instead of connection string
const pool = new Pool({
    user: 'geoloc_db_jq8s_user',
    password: 'iIIKQaSn8mx7Cn6Rej0dRw9fWqubXhuA',
    host: 'dpg-d0mdv5muk2gs73fj6v10-a.frankfurt-postgres.render.com',
    port: 5432,
    database: 'geoloc_db_jq8s',
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000, // 10 seconds
    idleTimeoutMillis: 30000 // 30 seconds
});

// Test the connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
    } else {
        console.log('Successfully connected to database');
        release();
    }
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params)
}; 