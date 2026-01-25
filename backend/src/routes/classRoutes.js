const express = require('express');
const router = express.Router();
const { createClass, getClasses, getClassStudents } = require('../controllers/classController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('manager'), createClass)
    .get(protect, getClasses);

router.get('/:id/students', protect, authorize('manager', 'professor'), getClassStudents);

module.exports = router;
