const db = require('../config/db');

// @desc    Get user profile
// @route   GET /api/users/profile
const getUserProfile = async (req, res, next) => {
  try {
    const [users] = await db.execute('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
const updateUserProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    await db.execute('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.user.id]);
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUserProfile, updateUserProfile };
