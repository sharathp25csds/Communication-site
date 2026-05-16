const express = require('express');
const router = express.Router();
const { login, signup } = require('../controllers/authController');

console.log('✅ Auth Routes Registered: /login, /signup');
router.post('/signup', signup);
router.post('/login', login);

module.exports = router;
