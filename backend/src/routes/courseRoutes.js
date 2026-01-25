const express = require('express');
const router = express.Router();
const { upload, uploadCourse, getCourses, deleteCourse } = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('professor', 'manager'), upload.single('file'), uploadCourse)
    .get(protect, getCourses);

router.route('/:id')
    .delete(protect, authorize('manager'), deleteCourse);

module.exports = router;
