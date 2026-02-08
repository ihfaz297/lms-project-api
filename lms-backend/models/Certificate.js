const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  courseName: { type: String, required: true },
  userName: { type: String, required: true },
  issuedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Certificate', certificateSchema);
