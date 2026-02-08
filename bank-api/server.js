require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// ===========================================
// DATABASE CONNECTION
// ===========================================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bank', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// ===========================================
// ROUTES
// ===========================================
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/transactions', require('./routes/transactions'));

// ===========================================
// HEALTH CHECK
// ===========================================
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Bank API is running' });
});

// ===========================================
// ERROR HANDLING
// ===========================================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// ===========================================
// SERVER
// ===========================================
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🏦 Bank API running on http://localhost:${PORT}`);
});
