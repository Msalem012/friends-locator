const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Register route
router.post('/register', async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { username, email, password } = req.body;
        
        console.log('Registration attempt for:', email);
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
                console.log('Registration failed: Email already exists');
                return res.render('register', { title: 'Register', error: 'Email already registered' });
            } else {
                console.log('Registration failed: Username already exists');
                return res.render('register', { title: 'Register', error: 'Username already taken' });
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

        // Set session
        req.session.user = {
            id: result.rows[0].id,
            username: result.rows[0].username,
            email: result.rows[0].email
        };

        // Save session explicitly
        await new Promise((resolve, reject) => {
            req.session.save(err => {
                if (err) {
                    console.error('Session save error:', err);
                    reject(err);
                } else {
                    console.log('Session saved successfully');
                    resolve();
                }
            });
        });

        console.log('Registration successful for:', email);
        return res.redirect('/');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Registration error:', error);
        return res.render('register', { title: 'Register', error: 'Registration failed. Please try again.' });
    } finally {
        client.release();
    }
});

// Login route
router.post('/login', async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { username, password } = req.body;
        console.log('Login attempt for:', username);

        // Check if user exists
        const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            console.log('Login failed: User not found');
            return res.render('login', { title: 'Login', error: 'Invalid username or password' });
        }

        const user = result.rows[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Login failed: Invalid password');
            return res.render('login', { title: 'Login', error: 'Invalid username or password' });
        }

        // Set session
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email
        };

        // Save session explicitly
        await new Promise((resolve, reject) => {
            req.session.save(err => {
                if (err) {
                    console.error('Session save error:', err);
                    reject(err);
                } else {
                    console.log('Session saved successfully');
                    resolve();
                }
            });
        });

        console.log('Login successful for:', username);
        return res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        return res.render('login', { title: 'Login', error: 'Login failed. Please try again.' });
    } finally {
        client.release();
    }
});

// Logout route
router.post('/logout', (req, res) => {
    console.log('Logout attempt for user:', req.session.user?.email);
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.redirect('/?error=logout_failed');
        }
        res.clearCookie('connect.sid');
        console.log('Logout successful');
        res.redirect('/login');
    });
});

module.exports = router; 