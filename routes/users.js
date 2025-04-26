'use strict';
const express = require('express');
const router = express.Router();
const db = require('../config/database');

/* GET users listing. */
router.get('/', function (req, res) {
    res.send('respond with a resource');
});

/* Search for users by username */
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        
        const result = await db.query(
            'SELECT id, username FROM users WHERE username ILIKE $1 AND id != $2 LIMIT 10',
            [`%${query}%`, req.session.user.id]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/* Add a friend by username */
router.post('/add-friend', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        
        // Find the user by username
        const userResult = await db.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const friendId = userResult.rows[0].id;
        const userId = req.session.user.id;
        
        // Check if they're already friends
        const existingFriend = await db.query(
            'SELECT id FROM friends WHERE user_id = $1 AND friend_id = $2',
            [userId, friendId]
        );
        
        if (existingFriend.rows.length > 0) {
            return res.status(409).json({ error: 'Already friends with this user' });
        }
        
        // Add as friend
        await db.query(
            'INSERT INTO friends (user_id, friend_id) VALUES ($1, $2)',
            [userId, friendId]
        );
        
        res.json({ success: true, message: 'Friend added successfully' });
    } catch (error) {
        console.error('Error adding friend:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/* Get user's friends */
router.get('/friends', async (req, res) => {
    try {
        const userId = req.session.user.id;
        
        const result = await db.query(
            'SELECT u.id, u.username FROM friends f JOIN users u ON f.friend_id = u.id WHERE f.user_id = $1',
            [userId]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting friends:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/* Delete a friend */
router.delete('/friends/:friendId', async (req, res) => {
    try {
        const userId = req.session.user.id;
        const friendId = req.params.friendId;
        
        if (!friendId) {
            return res.status(400).json({ error: 'Friend ID is required' });
        }
        
        // Delete the friendship
        await db.query(
            'DELETE FROM friends WHERE user_id = $1 AND friend_id = $2',
            [userId, friendId]
        );
        
        res.json({ success: true, message: 'Friend removed successfully' });
    } catch (error) {
        console.error('Error removing friend:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;