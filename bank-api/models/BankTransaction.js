const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const bankTransactionSchema = new mongoose.Schema({
  transactionId: { type: String, default: uuidv4, unique: true },
  fromAccount: { type: String, required: true }, // Account number
  toAccount: { type: String, required: true }, // Account number
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  reason: { type: String }, // e.g., "course_enrollment", "course_creation", "material_upload"
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
});

module.exports = mongoose.model('BankTransaction', bankTransactionSchema);
