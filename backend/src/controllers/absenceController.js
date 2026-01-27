const Absence = require('../models/Absence');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer Config for Justification Documents
const storage = multer.diskStorage({
    destination(req, file, cb) {
        const dir = path.join(__dirname, '../../uploads/justifications/');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename(req, file, cb) {
        cb(null, `justification-${req.params.id}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const checkFileType = (file, cb) => {
    const filetypes = /jpg|jpeg|png|pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Documents only (jpg, jpeg, png, pdf, doc, docx)!'));
    }
};

const uploadJustification = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @desc    Mark absence
// @route   POST /api/absences
// @access  Private (Professor/Manager)
const markAbsence = async (req, res) => {
    try {
        const { studentId, subjectId, date, durationHours } = req.body;

        // Check if professor teaches this subject (only for professors, managers can mark for any subject)
        if (req.user.role === 'professor') {
            const professorSubjects = req.user.subjects || [];
            if (!professorSubjects.includes(subjectId)) {
                return res.status(403).json({
                    message: 'You can only mark absences for subjects you teach'
                });
            }
        }

        const absence = await Absence.create({
            student: studentId,
            subject: subjectId,
            date: date || Date.now(),
            durationHours,
        });

        // Create notification for the student
        const Subject = require('../models/Subject');
        const { createNotificationsForUsers } = require('./notificationController');

        const subject = await Subject.findById(subjectId);
        const professorName = `${req.user.firstName} ${req.user.lastName}`;
        const roleName = req.user.role === 'manager' ? 'Manager' : 'Professeur';
        const absenceDate = new Date(date || Date.now()).toLocaleDateString('fr-FR');

        await createNotificationsForUsers(
            [studentId],
            'absence_marked',
            'NOTIFICATIONS.ABSENCE_MARKED_TITLE',
            'NOTIFICATIONS.ABSENCE_MARKED_MSG',
            absence._id,
            'Absence',
            { duration: durationHours, subject: subject?.name || 'Matière', date: absenceDate }
        );

        res.status(201).json(absence);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get absences
// @route   GET /api/absences
// @access  Private
const getAbsences = async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'student') {
            query.student = req.user._id;
        } else if (req.query.studentId) {
            query.student = req.query.studentId;
        }

        // If professor, filter by their subjects
        if (req.user.role === 'professor') {
            const professorSubjects = req.user.subjects || [];
            query.subject = { $in: professorSubjects };
        }

        const absences = await Absence.find(query)
            .populate({
                path: 'student',
                select: 'firstName lastName classId',
                populate: {
                    path: 'classId',
                    select: 'name'
                }
            })
            .populate('subject', 'name');

        res.json(absences);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit justification (Student)
// @route   PATCH /api/absences/:id/submit-justification
// @access  Private (Student)
const submitJustification = async (req, res) => {
    try {
        const { justificationReason } = req.body;
        const absence = await Absence.findById(req.params.id);

        if (!absence) {
            return res.status(404).json({ message: 'Absence not found' });
        }

        // Verify the absence belongs to the student
        if (absence.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only justify your own absences' });
        }

        absence.justificationReason = justificationReason;
        absence.justificationStatus = 'pending';
        absence.justificationSubmittedAt = new Date();

        // If a file was uploaded, save its path
        if (req.file) {
            absence.justificationDocument = `/${req.file.path.replace(/\\/g, '/')}`;
        }

        await absence.save();

        const populatedAbsence = await Absence.findById(absence._id)
            .populate('student', 'firstName lastName email')
            .populate('subject', 'name');

        res.json(populatedAbsence);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Review justification (Manager)
// @route   PATCH /api/absences/:id/review-justification
// @access  Private (Manager)
const reviewJustification = async (req, res) => {
    try {
        const { status, comment } = req.body; // status: 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Must be "approved" or "rejected"' });
        }

        const absence = await Absence.findById(req.params.id);

        if (!absence) {
            return res.status(404).json({ message: 'Absence not found' });
        }

        if (absence.justificationStatus !== 'pending') {
            return res.status(400).json({ message: 'This absence has no pending justification' });
        }

        absence.justificationStatus = status;
        absence.justified = status === 'approved';
        absence.justificationReviewedBy = req.user._id;
        absence.justificationReviewedAt = new Date();
        absence.justificationReviewComment = comment;

        await absence.save();

        const populatedAbsence = await Absence.findById(absence._id)
            .populate('student', 'firstName lastName email')
            .populate('subject', 'name')
            .populate('justificationReviewedBy', 'firstName lastName');

        res.json(populatedAbsence);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get pending justifications (Manager)
// @route   GET /api/absences/pending-justifications
// @access  Private (Manager)
const getPendingJustifications = async (req, res) => {
    try {
        const absences = await Absence.find({ justificationStatus: 'pending' })
            .populate({
                path: 'student',
                select: 'firstName lastName classId email',
                populate: {
                    path: 'classId',
                    select: 'name'
                }
            })
            .populate('subject', 'name')
            .sort({ justificationSubmittedAt: -1 });

        res.json(absences);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Legacy function - kept for backward compatibility
// @desc    Justify absence (Manager - direct)
// @route   PATCH /api/absences/:id/justify
// @access  Private (Manager)
const justifyAbsence = async (req, res) => {
    try {
        const { justificationReason } = req.body;
        const absence = await Absence.findById(req.params.id);

        if (absence) {
            absence.justified = true;
            absence.justificationReason = justificationReason;
            absence.justificationStatus = 'approved';
            absence.justificationReviewedBy = req.user._id;
            absence.justificationReviewedAt = new Date();
            await absence.save();
            res.json(absence);
        } else {
            res.status(404).json({ message: 'Absence not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete absence
// @route   DELETE /api/absences/:id
// @access  Private (Manager)
const deleteAbsence = async (req, res) => {
    try {
        const absence = await Absence.findById(req.params.id);

        if (!absence) {
            return res.status(404).json({ message: 'Absence not found' });
        }

        // Delete justification document if exists
        if (absence.justificationDocument) {
            const filePath = path.join(__dirname, '../../', absence.justificationDocument);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await absence.deleteOne();
        res.json({ message: 'Absence deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    markAbsence,
    getAbsences,
    justifyAbsence,
    submitJustification,
    reviewJustification,
    getPendingJustifications,
    deleteAbsence,
    uploadJustification
};
