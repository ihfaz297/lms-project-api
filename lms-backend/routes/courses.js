const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth, isLearner, isInstructor } = require('../middleware/auth');
const Course = require('../models/Course');
const CourseMaterial = require('../models/CourseMaterial');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');

const Transaction = require('../models/Transaction');
const User = require('../models/User');
const axios = require('axios');

const BANK_API_URL = process.env.BANK_API_URL || 'http://localhost:3002/api';
const COURSE_UPLOAD_BONUS = Number(process.env.COURSE_UPLOAD_BONUS) || 100;
const MATERIAL_UPLOAD_BONUS = Number(process.env.MATERIAL_UPLOAD_BONUS) || 50;

// ===========================================
// GET /api/courses
// Get all courses (max 5 as per requirements)
// ===========================================
router.get('/', optionalAuth, async (req, res) => {
  try {
    const courses = await Course.find().limit(5);

    if (req.user) {
      const enrollments = await Enrollment.find({ learnerId: req.user.id });
      const enrollmentMap = new Map();
      enrollments.forEach(e => enrollmentMap.set(e.courseId.toString(), e));

      const enriched = courses.map(c => {
        const enrollment = enrollmentMap.get(c._id.toString());
        return {
          ...c.toJSON(),
          enrolled: !!enrollment,
          progress: enrollment?.progress || 0,
          completed: enrollment?.completed || false,
        };
      });
      return res.status(200).json(enriched);
    }

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// GET /api/courses/enrolled
// Get courses the current learner is enrolled in
// ===========================================
router.get('/enrolled', authenticateToken, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ learnerId: req.user.id });
    const courseIds = enrollments.map(e => e.courseId);
    const courses = await Course.find({ _id: { $in: courseIds } });

    const result = courses.map(c => {
      const enrollment = enrollments.find(e => e.courseId.toString() === c._id.toString());
      return {
        ...c.toJSON(),
        enrolled: true,
        progress: enrollment?.progress || 0,
        completed: enrollment?.completed || false,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// GET /api/courses/:id
// Get single course details
// ===========================================
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const courseData = course.toJSON();

    if (req.user) {
      const enrollment = await Enrollment.findOne({ courseId: req.params.id, learnerId: req.user.id });
      courseData.enrolled = !!enrollment;
      courseData.progress = enrollment?.progress || 0;
      courseData.completed = enrollment?.completed || false;
    }

    res.status(200).json(courseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// POST /api/courses
// Create new course (instructor only)
// Pays instructor a lump sum bonus
// ===========================================
router.post('/', authenticateToken, isInstructor, async (req, res) => {
  try {
    const { title, description, price, duration, level, thumbnail } = req.body;

    // 1. Validate input
    if (!title || !description || price === undefined || !duration || !level || !thumbnail) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (price < 0) {
      return res.status(400).json({ error: 'Price cannot be negative.' });
    }

    // 2. Check course limit (max 5 courses in system)
    const courseCount = await Course.countDocuments();
    if (courseCount >= 5) {
      return res.status(400).json({ error: 'Maximum course limit (5) reached.' });
    }
    // 3. Get instructor with bank details
    const instructor = await User.findById(req.user.id);
    if(!instructor.hasBankSetup) {
      return res.status(400).json({ error: 'Please setup your bank account first.' });
    }
    // 4. Create course
    const newCourse = new Course({
      title,
      description,
      price,
      duration,
      level,
      thumbnail,
      instructor: req.user.id,
      instructorName: instructor.name
    });
    await newCourse.save();
    // 5. Pay instructor lump sum via Bank API (LMS org -> Instructor)
    let payoutTransaction = null;
    try {
      const bankResponse = await axios.post(`${BANK_API_URL}/transactions/transfer`, {
        fromAccount: process.env.LMS_BANK_ACCOUNT,
        toAccount: instructor.bankAccount,
        amount: COURSE_UPLOAD_BONUS,
        secret: process.env.LMS_BANK_SECRET,
        reason: 'course_upload_bonus'
      });

      // 6. Record payout transaction in LMS
      payoutTransaction = new Transaction({
        learnerId: req.user.id, // Using instructor as "learner" for payout records
        courseId: newCourse._id,
        instructorId: req.user.id,
        amount: COURSE_UPLOAD_BONUS,
        type: 'payout',
        status: 'completed',
        bankTransactionId: bankResponse.data.transactionId,
        completedAt: new Date()
      });
      await payoutTransaction.save();
    } catch (bankError) {
      // Bank transfer failed - course still created but payout failed
      console.error('Instructor payout failed:', bankError.response?.data || bankError.message);
      // Optionally: delete the course if payout is mandatory
      // await Course.findByIdAndDelete(newCourse._id);
      // return res.status(502).json({ error: 'Course created but payout failed' });
    }

    res.status(201).json({
      message: 'Course created successfully',
      course: newCourse,
      payout: payoutTransaction ? {
        amount: COURSE_UPLOAD_BONUS,
        status: 'completed'
      } : null
    });
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
    const materials = await CourseMaterial.find({courseId : req.params.id}).sort({order : 1});
    // 2. Return materials sorted by order

    res.status(200).json(materials);
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
    const course = await Course.findById(req.params.id);
    if(!course) {
      return res.status(404).json({error: 'Course not found'});
    }
    if(course.instructor.toString() !== req.user.id) {
      return res.status(403).json({error: 'You are not the instructor of this course'});
    }
    // #. Validate input
    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }
    if (!['video', 'text', 'audio', 'mcq'].includes(type)) {
      return res.status(400).json({ error: 'Invalid material type' });
    }
    // #. Fetch the instructor for bank details
    const instructor = await User.findById(req.user.id);
    // #. Check if instructor has bank setup
    if(!instructor.hasBankSetup) {
      return res.status(400).json({error: 'Please setup your bank account first.'});
    }
    // 2. Create material
    const newMaterial = new CourseMaterial({
      courseId: req.params.id,
      title,
      type,
      content,
      order : order || 0
    });
    await newMaterial.save();
    
    // 3. TODO: Call Bank API to pay instructor lump sum for material
    let payoutTransaction = null;
    try {
      const bankResponse = await axios.post(`${BANK_API_URL}/transactions/transfer`, {
        fromAccount: process.env.LMS_BANK_ACCOUNT,
        toAccount: instructor.bankAccount,
        amount: MATERIAL_UPLOAD_BONUS,
        secret: process.env.LMS_BANK_SECRET,
        reason: 'material_upload_bonus'
      });

      payoutTransaction = new Transaction({
        learnerId: req.user.id,
        courseId: req.params.id,
        instructorId: req.user.id,
        amount: MATERIAL_UPLOAD_BONUS,
        type: 'payout',
        status: 'completed',
        bankTransactionId: bankResponse.data.transactionId,
        completedAt: new Date()
      });
      await payoutTransaction.save();
    } catch (bankError) {
      console.error('Material payout failed:', bankError.response?.data || bankError.message);
    }
    // 4. Return created material

    res.status(201).json({message: 'Material added successfully', newMaterial, payout: payoutTransaction ? {amount: MATERIAL_UPLOAD_BONUS, status: 'completed'} : null});
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
    const courseId = req.params.id;
    const learnerId = req.user.id;
    // TODO: Implement course enrollment
    // IMPORTANT: This triggers the payment flow
    // 1. Find course
    const course = await Course.findById(courseId);
    if(!course) {
      return res.status(404).json({error: 'Course not found'});
    }
    // 2. Check if learner already enrolled
    const existingEnrollment = await Enrollment.findOne({courseId, learnerId});
    if(existingEnrollment) {
      return res.status(400).json({error: 'Learner already enrolled in this course'});
    }
    // 3. Get learner bank details
    const learner = await User.findById(learnerId);
    if (!learner.hasBankSetup) {
      return res.status(400).json({ error: 'Please setup your bank account first.' });
    }
    // 4. Call Bank API to process payment (learner -> LMS org)
    let bankTransactionId;
    try {
      const bankResponse = await axios.post(`${BANK_API_URL}/transactions/transfer`, {
        fromAccount: learner.bankAccount,
        toAccount: process.env.LMS_BANK_ACCOUNT,
        amount: course.price,
        secret: learner.bankSecret,
        reason: 'course_enrollment'
      });
      bankTransactionId = bankResponse.data.transactionId;
    } catch (bankError) {
      const errorMsg = bankError.response?.data?.error || 'Payment failed';
      return res.status(402).json({ error: errorMsg });
    }
    // 5. Create enrollment record
    const newEnrollment = new Enrollment({
      courseId,
      learnerId,
      progress: 0,
      completed: false // will be updated to active once payment is confirmed
    });
    await newEnrollment.save();
    // 6. Create transaction record (status: PENDING)
    const newTransaction = new Transaction({
      learnerId,
      courseId,
      instructorId: course.instructor,
      amount: course.price,
      type: 'payment',
      status: 'pending',
      bankTransactionId
    });
    await newTransaction.save();
    // 7. Return enrollment confirmation

    res.status(201).json({ message: 'Enrollment successful', enrollment: newEnrollment, transactionId: newTransaction._id});
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
    const courseId = req.params.id;
    const learnerId = req.user.id;
    // 1. Find enrollment
    const enrollment = await Enrollment.findOne({courseId, learnerId});
    if(!enrollment){
      return res.status(404).json({error: 'Not enrolled in this course'});
    }
    if (!enrollment.isPaid) {
      return res.status(403).json({ error: 'Payment required before completing this course' });
    }
    if (enrollment.completed) {
      return res.status(400).json({ error: 'Course already completed' });
    }
    // 2. Get course and user info for certificate
    const course = await Course.findById(courseId);
    const learner = await User.findById(learnerId);
    // 3. Mark as completed
    enrollment.completed = true;
    enrollment.progress = 100;
    enrollment.completedAt = new Date();
    await enrollment.save();
    // 4. Create certificate
    const certificate = new Certificate({
      courseId,
      learnerId,
      courseName: course.title,
      userName: learner.name
    });
    await certificate.save();
    // 4. Return certificate

    
    res.status(200).json({message: 'Congratulations! Course completed.', certificate});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
