const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Register route
router.post('/register', async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { username, email, password } = req.body;
        
        await client.query('BEGIN');

        // Check if user already exists
        const userCheck = await client.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );
        
        if (userCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            const existingUser = userCheck.rows[0];
            if (existingUser.email === email) {
                return res.render('register', { error: 'Email already registered' });
            } else {
                return res.render('register', { error: 'Username already taken' });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        const result = await client.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );

        await client.query('COMMIT');

        // Create token
        const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET);

        // Set session
        req.session.user = {
            id: result.rows[0].id,
            username: result.rows[0].username,
            email: result.rows[0].email
        };

        res.redirect('/');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Registration error:', error);
        res.render('register', { error: 'Registration failed. Please try again.' });
    } finally {
        client.release();
    }
});

// Login route
router.post('/login', async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { email, password } = req.body;

        // Check if user exists
        const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        // Create token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

        // Set session
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email
        };

        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'Login failed. Please try again.' });
    } finally {
        client.release();
    }
});

// Logout route
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.redirect('/?error=logout_failed');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

module.exports = router; 