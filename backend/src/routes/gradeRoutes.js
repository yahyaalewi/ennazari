const express = require('express');
const router = express.Router();
const { addGrade, getGrades, deleteGrade } = require('../controllers/gradeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('professor', 'manager'), addGrade)
    .get(protect, getGrades);

// Delete grade (Manager only)
router.delete('/:id', protect, authorize('manager'), deleteGrade);

module.exports = router;
