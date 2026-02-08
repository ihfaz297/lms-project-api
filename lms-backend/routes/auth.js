const express = require('express');
const router = express.Router();
const jwt = require('jwt-simple');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

// ===========================================
// POST /api/auth/register
// Register a new user (learner or instructor)
// ===========================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // TODO: Implement registration logic
    // 1. Validate input (name, email, password, role)
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password and role are required.' });
    }
    if (!['learner', 'instructor'].includes(role)) {
      return res.status(400).json({error: 'Role must be either learner or instructor.' });
    }
    if (password.length < 6) {
      return res.status(400).json({error : 'Password must be at least 6 characters long.'});
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({error : 'Invalid email format.'});
    }
    // 2. Check if user already exists
    const existingUser = await User.findOne({email : email.trim().toLowerCase()});
    if(existingUser){
      return res.status(400).json({error : 'User already exists with this email.'});
    }
    // 3. Create new user
    const newUser = new User({
      name : name.trim(),
      email : email.trim().toLowerCase(),
      password : password, // TODO : Hash password before saving
      role : role
    });
    await newUser.save();
    // 4. Generate JWT token
    const payLoad = { id : newUser._id, name: newUser.name, email: newUser.email, role : newUser.role };
    const token = jwt.encode(payLoad, JWT_SECRET);

    // 5. Return token and user data
    
    res.status(201).json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// POST /api/auth/login
// Login user and return JWT token
// ===========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // TODO: Implement login logic
    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    // 2. Find user by email
    const user = await User.findOne({email : email.trim().toLowerCase()});
    if(!user) {
      return res.status(400).json({error:'User not found with this email.'});
    }
    // 3. Compare password
    const isMatch = await user.comparePassword(password);
    if(!isMatch) {  //TODO : use hashed password comparison
      return res.status(400).json({error : 'Password is invalid.'});
    }
    // 4. Generate JWT token
    const payLoad = { id : user._id, name: user.name, email: user.email, role : user.role };
    const token = jwt.encode(payLoad, JWT_SECRET);
    // 5. Return token and user data

    res.status(200).json({ token, user : {id: user._id, name: user.name, email: user.email, role: user.role} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// GET /api/auth/profile
// Get authenticated user profile
// ===========================================
router.get('/profile', require('../middleware/auth').authenticateToken, async (req, res) => {
  try {
    // TODO: Implement get profile logic
    const userId = req.user.id; // Extract user ID from auth middleware
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({error:'User not found'});
    }
    // 1. Use req.user.id from auth middleware
    // 2. Find user by ID (exclude password)
    // 3. Return user data

    res.status(200).json({ user:{id: user._id, name: user.name, email: user.email, role: user.role}});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
