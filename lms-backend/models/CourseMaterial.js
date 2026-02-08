const mongoose = require('mongoose');

const courseMaterialSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['video', 'text', 'audio', 'mcq'], required: true },
  content: { type: String }, // URL or text content
  order: { type: Number }, // Order within course
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CourseMaterial', courseMaterialSchema);
