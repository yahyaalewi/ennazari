const express = require('express');
const router = express.Router();
const {
    markAbsence,
    getAbsences,
    justifyAbsence,
    submitJustification,
    reviewJustification,
    getPendingJustifications,
    deleteAbsence,
    uploadJustification
} = require('../controllers/absenceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('professor', 'manager'), markAbsence)
    .get(protect, getAbsences);

// Get pending justifications (Manager only)
router.get('/pending-justifications', protect, authorize('manager'), getPendingJustifications);

// Student submits justification with optional document
router.patch('/:id/submit-justification', protect, authorize('student'), uploadJustification.single('document'), submitJustification);

// Manager reviews justification
router.patch('/:id/review-justification', protect, authorize('manager'), reviewJustification);

// Legacy route - Manager directly justifies
router.patch('/:id/justify', protect, authorize('manager'), justifyAbsence);

// Delete absence (Manager only)
router.delete('/:id', protect, authorize('manager'), deleteAbsence);

module.exports = router;
