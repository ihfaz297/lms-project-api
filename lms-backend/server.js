require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// ===========================================
// MIDDLEWARE
// ===========================================
app.use(cors());
app.use(express.json());

// ===========================================
// DATABASE CONNECTION
// ===========================================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// ===========================================
// ROUTES
// ===========================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/bank', require('./routes/bank'));
app.use('/api/instructor', require('./routes/instructor'));

// ===========================================
// HEALTH CHECK
// ===========================================
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'LMS Backend is running' });
});

// ===========================================
// ERROR HANDLING MIDDLEWARE
// ===========================================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
  });
});

// ===========================================
// SERVER
// ===========================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 LMS Backend server running on http://localhost:${PORT}`);
});
