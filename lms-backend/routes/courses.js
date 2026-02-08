const express = require('express');
const router = express.Router();
const { authenticateToken, isLearner, isInstructor } = require('../middleware/auth');
const Course = require('../models/Course');
const CourseMaterial = require('../models/CourseMaterial');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');

// ===========================================
// GET /api/courses
// Get all courses (max 5 as per requirements)
// ===========================================
router.get('/', async (req, res) => {
  try {
    // TODO: Implement get all courses
    // 1. Fetch all courses from DB (limit to 5)
    // 2. Return course list

    res.status(200).json({ message: 'Get all courses endpoint ready' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// GET /api/courses/:id
// Get single course details
// ===========================================
router.get('/:id', async (req, res) => {
  try {
    // TODO: Implement get course by ID
    // 1. Find course by ID
    // 2. Return course data

    res.status(200).json({ message: 'Get course by ID endpoint ready' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// POST /api/courses
// Create new course (instructor only)
// ===========================================
router.post('/', authenticateToken, isInstructor, async (req, res) => {
  try {
    const { title, description, price, duration, level, thumbnail } = req.body;

    // TODO: Implement create course
    // 1. Validate input
    // 2. Create course with instructor ID from req.user
    // 3. TODO: Call Bank API to deduct lump sum payment for instructor
    // 4. Return created course

    res.status(201).json({ message: 'Create course endpoint ready' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// GET /api/courses/:id/materials
// Get course materials
// ===========================================
router.get('/:id/materials', async (req, res) => {
  try {
    // TODO: Implement get course materials
    // 1. Find materials for course ID
    // 2. Return materials sorted by order

    res.status(200).json({ message: 'Get course materials endpoint ready' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// POST /api/courses/:id/materials
// Add material to course (instructor only)
// ===========================================
router.post('/:id/materials', authenticateToken, isInstructor, async (req, res) => {
  try {
    const { title, type, content, order } = req.body;

    // TODO: Implement add course material
    // 1. Validate course exists and belongs to instructor
    // 2. Create material
    // 3. TODO: Call Bank API to pay instructor lump sum for material
    // 4. Return created material

    res.status(201).json({ message: 'Add course material endpoint ready' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// POST /api/courses/:id/enroll
// Enroll learner in course (learner only)
// ===========================================
router.post('/:id/enroll', authenticateToken, isLearner, async (req, res) => {
  try {
    // TODO: Implement course enrollment
    // IMPORTANT: This triggers the payment flow
    // 1. Find course
    // 2. Check if learner already enrolled
    // 3. Call Bank API to process payment (learner account -> LMS organization account)
    // 4. Create enrollment record
    // 5. Create transaction record (status: PENDING)
    // 6. Return enrollment confirmation

    res.status(201).json({ message: 'Enroll course endpoint ready' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// POST /api/courses/:id/complete
// Mark course as completed (learner only)
// ===========================================
router.post('/:id/complete', authenticateToken, isLearner, async (req, res) => {
  try {
    // TODO: Implement course completion
    // 1. Find enrollment
    // 2. Mark as completed
    // 3. Create certificate
    // 4. Return certificate

    res.status(200).json({ message: 'Complete course endpoint ready' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
