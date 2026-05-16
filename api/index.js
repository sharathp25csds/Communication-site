const app = require('../backend/app');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

// For Vercel, we export the app
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
