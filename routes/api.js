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

// Save location from client-side IndexedDB to database
router.post('/sync-locations', isAuthenticated, async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { locations } = req.body;
        const userId = req.session.user.id;
        
        if (!Array.isArray(locations) || locations.length === 0) {
            return res.status(400).json({ error: 'No locations provided' });
        }
        
        await client.query('BEGIN');
        
        const results = [];
        for (const location of locations) {
            const result = await client.query(
                'INSERT INTO locations (user_id, latitude, longitude, recorded_at) VALUES ($1, $2, $3, $4) RETURNING *',
                [
                    userId, 
                    location.latitude, 
                    location.longitude, 
                    new Date(location.timestamp)
                ]
            );
            results.push(result.rows[0]);
        }
        
        await client.query('COMMIT');
        res.status(201).json({ message: `Synced ${results.length} locations`, locations: results });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error syncing locations:', error);
        res.status(500).json({ error: 'Error syncing locations' });
    } finally {
        client.release();
    }
});

// Get user profile including location preferences
router.get('/profile', isAuthenticated, async (req, res) => {
    const client = await db.pool.connect();
    try {
        const userId = req.session.user.id;
        const result = await client.query(
            'SELECT id, username, email, location_tracking_enabled FROM users WHERE id = $1',
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Error fetching profile' });
    } finally {
        client.release();
    }
});

// Update user location preferences
router.put('/profile/location-preferences', isAuthenticated, async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { locationTrackingEnabled } = req.body;
        const userId = req.session.user.id;
        
        const result = await client.query(
            'UPDATE users SET location_tracking_enabled = $1 WHERE id = $2 RETURNING id, username, email, location_tracking_enabled',
            [locationTrackingEnabled, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating location preferences:', error);
        res.status(500).json({ error: 'Error updating location preferences' });
    } finally {
        client.release();
    }
});

module.exports = router; 