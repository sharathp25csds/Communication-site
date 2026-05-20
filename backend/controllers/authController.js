const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// @desc    Register a new user
// @route   POST /api/auth/signup
const signup = async (req, res, next) => {
  console.log('📝 [Auth Controller] Signup request received for:', req.body.email);
  try {
    const { name, email, password } = req.body;

    // Validate empty fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    // Check if user exists
    const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'user']
    );

    const userId = result.insertId;

    // Generate token
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

    console.log('✅ [Auth Controller] User registered successfully:', email);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: userId,
        name,
        email,
        role: 'user'
      },
      token
    });
  } catch (error) {
    console.error('❌ [Auth Controller] Signup error:', {
      message: error.message,
      stack: error.stack,
      email: req.body?.email
    });
    next(error);
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  console.log('📝 [Auth Controller] Login request received for:', req.body.email);
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

      console.log('✅ [Auth Controller] Login successful:', email);

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      });
    } else {
      console.log('❌ [Auth Controller] Invalid credentials for:', email);
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('❌ [Auth Controller] Login error:', {
      message: error.message,
      stack: error.stack,
      email: req.body?.email
    });
    next(error);
  }
};

module.exports = { signup, login };