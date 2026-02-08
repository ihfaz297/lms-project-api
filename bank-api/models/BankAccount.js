const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
  accountNumber: { type: String, required: true, unique: true },
  secret: { type: String, required: true },
  balance: { type: Number, default: 10000 }, // Start with $10,000
  type: { type: String, enum: ['learner', 'instructor', 'lms_org'], required: true },
  userId: { type: String }, // ID from LMS system
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BankAccount', bankAccountSchema);
