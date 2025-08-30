import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Helpers
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Validators
const signupValidators = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
];

const loginValidators = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Signup page
router.get('/signup', (req, res) => {
  res.render('signup', { 
    title: 'Sign Up', 
    errors: [], 
    values: {},
    flashMsg: req.query.msg || ''
  });
});

// Signup process
router.post('/signup', signupValidators, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('signup', { 
      title: 'Sign Up', 
      errors: errors.array(), 
      values: req.body 
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: req.body.email }, { username: req.body.username }]
    });

    if (existingUser) {
      if (existingUser.email === req.body.email) {
        return res.status(409).render('signup', {
          title: 'Sign Up',
          errors: [{ msg: 'Email already registered' }],
          values: req.body
        });
      } else {
        return res.status(409).render('signup', {
          title: 'Sign Up',
          errors: [{ msg: 'Username already taken' }],
          values: req.body
        });
      }
    }

    // Create new user
    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password
    });

    await user.save();
    res.redirect('/login?msg=signup_success');
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).render('signup', {
      title: 'Sign Up',
      errors: [{ msg: 'An error occurred during signup. Please try again.' }],
      values: req.body
    });
  }
}));

// Login page
router.get('/login', (req, res) => {
  res.render('login', { 
    title: 'Login', 
    errors: [], 
    values: {},
    flashMsg: req.query.msg || ''
  });
});

// Login process
router.post('/login', loginValidators, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('login', { 
      title: 'Login', 
      errors: errors.array(), 
      values: req.body 
    });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).render('login', {
        title: 'Login',
        errors: [{ msg: 'Invalid email or password' }],
        values: req.body
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).render('login', {
        title: 'Login',
        errors: [{ msg: 'Account is deactivated. Please contact administrator.' }],
        values: req.body
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(req.body.password);
    if (!isValidPassword) {
      return res.status(401).render('login', {
        title: 'Login',
        errors: [{ msg: 'Invalid email or password' }],
        values: req.body
      });
    }

    // Set session
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.role = user.role;
    
    res.redirect('/?msg=login_success');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('login', {
      title: 'Login',
      errors: [{ msg: 'An error occurred during login. Please try again.' }],
      values: req.body
    });
  }
}));

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/?msg=logout_success');
  });
});

export default router;
