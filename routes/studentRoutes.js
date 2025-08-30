import express from 'express';
import { body, validationResult, param, query } from 'express-validator';
import Student from '../models/Student.js';

const router = express.Router();

// Helpers
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const buildSort = (sortBy, order) => {
  const allowed = ['name', 'rollNumber', 'email', 'department', 'gpa', 'createdAt'];
  const key = allowed.includes(sortBy) ? sortBy : 'createdAt';
  const dir = order === 'asc' ? 1 : -1;
  return { [key]: dir };
};

const sanitizeString = (s) => (typeof s === 'string' ? s.trim() : s);

// Custom department validation
const validateDepartment = (value, { req }) => {
  if (value === 'custom') {
    if (!req.body.customDepartment || req.body.customDepartment.trim() === '') {
      throw new Error('Custom department name is required when selecting "Custom Department"');
    }
    if (req.body.customDepartment.trim().length < 2) {
      throw new Error('Custom department name must be at least 2 characters long');
    }
    if (req.body.customDepartment.trim().length > 100) {
      throw new Error('Custom department name must be at most 100 characters long');
    }
  }
  return true;
};

// Validators
const studentValidators = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('rollNumber')
    .trim()
    .notEmpty().withMessage('Roll number is required')
    .matches(/^[a-z0-9-]+$/i).withMessage('Roll number must be alphanumeric'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('department')
    .trim()
    .notEmpty().withMessage('Department is required')
    .custom(validateDepartment),
  body('gpa').isFloat({ min: 0, max: 4 }).withMessage('GPA must be between 0.0 and 4.0')
];

// List with pagination, search, sort
router.get(
  '/',
  [
    query('page').optional().toInt(),
    query('limit').optional().toInt(),
    query('q').optional().trim(),
    query('department').optional().trim(),
    query('minGpa').optional().trim(),
    query('maxGpa').optional().trim(),
    query('sortBy').optional().trim(),
    query('order').optional().trim()
  ],
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number.isFinite(req.query.page) ? req.query.page : 1);
    const limitRaw = Number.isFinite(req.query.limit) ? req.query.limit : 10;
    const limit = Math.min(100, Math.max(1, limitRaw));
    const skip = (page - 1) * limit;

    const { q, department, sortBy, order } = req.query;
    const minGpa = req.query.minGpa !== undefined && req.query.minGpa !== '' ? parseFloat(req.query.minGpa) : undefined;
    const maxGpa = req.query.maxGpa !== undefined && req.query.maxGpa !== '' ? parseFloat(req.query.maxGpa) : undefined;

    const filter = {};
    if (q) {
      // Use text search for efficiency and accuracy
      filter.$text = { $search: sanitizeString(q) };
    }
    if (department) filter.department = sanitizeString(department);
    const hasMin = typeof minGpa === 'number' && Number.isFinite(minGpa);
    const hasMax = typeof maxGpa === 'number' && Number.isFinite(maxGpa);
    if (hasMin || hasMax) {
      filter.gpa = {};
      if (hasMin) filter.gpa.$gte = minGpa;
      if (hasMax) filter.gpa.$lte = maxGpa;
    }

    const sort = buildSort(sortBy, order);

    const [total, students] = await Promise.all([
      Student.countDocuments(filter),
      Student.find(filter).sort(sort).skip(skip).limit(limit).lean()
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.render('students', {
      title: 'Students',
      students,
      pagination: { page, limit, total, totalPages },
      filters: { q: q || '', department: department || '', minGpa: minGpa || '', maxGpa: maxGpa || '', sortBy: sortBy || 'createdAt', order: order || 'desc', limit },
      flashMsg: req.query.msg || ''
    });
  })
);

// New form
router.get('/new', (req, res) => {
  res.render('addStudent', { title: 'Add Student', errors: [], values: {} });
});

// Create
router.post(
  '/',
  studentValidators,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render('addStudent', { title: 'Add Student', errors: errors.array(), values: req.body });
    }

    try {
      // Handle custom department
      let departmentValue = sanitizeString(req.body.department);
      if (departmentValue === 'custom' && req.body.customDepartment) {
        departmentValue = sanitizeString(req.body.customDepartment);
      }

      const student = new Student({
        name: sanitizeString(req.body.name),
        rollNumber: sanitizeString(req.body.rollNumber),
        email: sanitizeString(req.body.email),
        department: departmentValue,
        gpa: Number(req.body.gpa)
      });
      await student.save();
      res.redirect('/students?msg=created');
    } catch (err) {
      if (err && err.code === 11000) {
        const dupField = Object.keys(err.keyValue || {})[0];
        return res.status(409).render('addStudent', {
          title: 'Add Student',
          errors: [{ msg: `${dupField} must be unique` }],
          values: req.body
        });
      }
      throw err;
    }
  })
);

// Show one
router.get(
  '/:id',
  [param('id').isMongoId()],
  asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id).lean();
    if (!student) {
      return res.status(404).render('error', { title: 'Not Found', message: 'Student not found', status: 404 });
    }
    res.render('studentDetails', { title: 'Student Details', student, flashMsg: req.query.msg || '' });
  })
);

// Edit form
router.get(
  '/:id/edit',
  [param('id').isMongoId()],
  asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id).lean();
    if (!student) {
      return res.status(404).render('error', { title: 'Not Found', message: 'Student not found', status: 404 });
    }
    res.render('editStudent', { title: 'Edit Student', errors: [], values: student });
  })
);

// Update
router.put(
  '/:id',
  [param('id').isMongoId(), ...studentValidators],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render('editStudent', { title: 'Edit Student', errors: errors.array(), values: { ...req.body, _id: req.params.id } });
    }
    try {
      // Handle custom department
      let departmentValue = sanitizeString(req.body.department);
      if (departmentValue === 'custom' && req.body.customDepartment) {
        departmentValue = sanitizeString(req.body.customDepartment);
      }

      const updated = await Student.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            name: sanitizeString(req.body.name),
            rollNumber: sanitizeString(req.body.rollNumber),
            email: sanitizeString(req.body.email),
            department: departmentValue,
            gpa: Number(req.body.gpa)
          }
        },
        { new: true, runValidators: true, context: 'query' }
      ).lean();
      if (!updated) {
        return res.status(404).render('error', { title: 'Not Found', message: 'Student not found', status: 404 });
      }
      res.redirect(`/students/${updated._id}?msg=updated`);
    } catch (err) {
      if (err && err.code === 11000) {
        const dupField = Object.keys(err.keyValue || {})[0];
        return res.status(409).render('editStudent', {
          title: 'Edit Student',
          errors: [{ msg: `${dupField} must be unique` }],
          values: { ...req.body, _id: req.params.id }
        });
      }
      throw err;
    }
  })
);

// Delete
router.delete(
  '/:id',
  [param('id').isMongoId()],
  asyncHandler(async (req, res) => {
    await Student.findByIdAndDelete(req.params.id);
    res.redirect('/students?msg=deleted');
  })
);

export default router;


