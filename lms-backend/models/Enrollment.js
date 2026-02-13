const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  isPaid: { type: Boolean, default: false },
  progress: { type: Number, default: 0 }, // Percentage 0-100
  completed: { type: Boolean, default: false },
  enrolledAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);
