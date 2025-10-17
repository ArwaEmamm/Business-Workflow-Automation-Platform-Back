require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const { authMiddleware } = require('./middlewares/authMiddleware');
const routes = require('./routes/routes');
const errorHandler = require('./middlewares/errorMiddleware');




const app = express();

// ✅ middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use('/api/auth', authRoutes);
app.use('/api', routes);



// ✅ connect to MongoDB
// ✅ test route
app.get('/', (req, res) => {
  res.send('BWA Backend is running 🚀');
});
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({
    message: `Welcome ${req.user.id}, you have access ✅`,
    role: req.user.role
  });
});
app.use(errorHandler);

// Only connect to DB and start the server when this file is run directly
if (require.main === module) {
  // ✅ connect to MongoDB
  connectDB(process.env.MONGO_URI);

  // ✅ start server
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// export app for tests
module.exports = app;
