'use strict';
const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
require('dotenv').config();
const http = require('http');

const routes = require('./routes/index');
const users = require('./routes/users');
const auth = require('./routes/auth');
const api = require('./routes/api');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Trust first proxy for secure cookies in production
app.set('trust proxy', 1);

// Session configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-fallback-secret',
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        sameSite: 'lax'
    }
};

// In production, ensure secure cookies
if (app.get('env') === 'production') {
    sessionConfig.cookie.secure = true;
}

app.use(cookieParser(sessionConfig.secret));
app.use(session(sessionConfig));

// Debug middleware to log session data
app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('Session Data:', req.session);
    next();
});

// Make user data available to templates
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware
const ensureAuthenticated = (req, res, next) => {
    console.log('Checking auth:', req.session);
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
};

// Public routes
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login', { title: 'Login', error: null });
});

app.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('register', { title: 'Register', error: null });
});

// Map route
app.get('/map', ensureAuthenticated, (req, res) => {
    res.render('map', { title: 'Geoloc Map', user: req.session.user });
});

// Auth routes
app.use('/auth', auth);

// Protected routes
app.use('/', ensureAuthenticated, routes);
app.use('/users', ensureAuthenticated, users);
app.use('/api', ensureAuthenticated, api);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
if (app.get('env') === 'development') {
    app.use((err, req, res, next) => {
        console.error(err);
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

// Create HTTP server
const server = http.createServer(app);

// Set up Socket.IO server if the module is available
try {
    const setupSocketServer = require('./socket-server');
    const io = setupSocketServer(server);
    console.log('Socket.IO server initialized');
} catch (error) {
    console.error('Failed to initialize Socket.IO:', error.message);
    console.log('Continuing without real-time functionality');
}

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

module.exports = app;
