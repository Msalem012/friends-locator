'use strict';
var express = require('express');
var router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
};

/* GET home page. */
router.get('/', isAuthenticated, function (req, res) {
    res.render('map', { 
        title: 'Geoloc Map',
        user: req.session.user
    });
});

module.exports = router;
