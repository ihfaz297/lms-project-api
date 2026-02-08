const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['payment', 'payout'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'validated'], default: 'pending' },
  bankTransactionId: { type: String }, // ID from Bank API
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
});

module.exports = mongoose.model('Transaction', transactionSchema);
