const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
};

// Create a new location
router.post('/locations', isAuthenticated, async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { name, latitude, longitude } = req.body;
        const userId = req.session.user.id;

        const result = await client.query(
            'INSERT INTO locations (user_id, name, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, name, latitude, longitude]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error saving location:', error);
        res.status(500).json({ error: 'Error saving location' });
    } finally {
        client.release();
    }
});

// Get all locations for the current user
router.get('/locations', isAuthenticated, async (req, res) => {
    const client = await db.pool.connect();
    try {
        const userId = req.session.user.id;
        const result = await client.query(
            'SELECT * FROM locations WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ error: 'Error fetching locations' });
    } finally {
        client.release();
    }
});

module.exports = router; 