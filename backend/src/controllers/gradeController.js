const Grade = require('../models/Grade');
const Subject = require('../models/Subject');
const { createNotificationsForUsers } = require('./notificationController');

// @desc    Add a grade
// @route   POST /api/grades
// @access  Private (Professor)
const addGrade = async (req, res) => {
    try {
        const { studentId, subjectId, value, coefficient, evaluationType } = req.body;

        // Check if professor teaches this subject (only for professors, managers can add for any subject)
        if (req.user.role === 'professor') {
            const professorSubjects = req.user.subjects || [];
            if (!professorSubjects.includes(subjectId)) {
                return res.status(403).json({
                    message: 'You can only add grades for subjects you teach'
                });
            }
        }

        const grade = await Grade.create({
            student: studentId,
            subject: subjectId,
            professor: req.user._id,
            value,
            coefficient,
            evaluationType,
        });

        // Create notification for the student
        const subject = await Subject.findById(subjectId);
        const professorName = `${req.user.firstName} ${req.user.lastName}`;
        const roleName = req.user.role === 'manager' ? 'Manager' : 'Professor';

        await createNotificationsForUsers(
            [studentId],
            'grade_added',
            'Nouvelle Note',
            `${roleName} ${professorName} a ajouté une note de ${value}/20 en ${subject?.name || 'matière'} (${evaluationType})`
        );

        res.status(201).json(grade);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get grades (My Grades or By Student)
// @route   GET /api/grades
// @access  Private
const getGrades = async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'student') {
            query.student = req.user._id;
        } else if (req.query.studentId) {
            // Professor/Manager viewing specific student
            query.student = req.query.studentId;
        }

        // If professor, filter by their subjects
        if (req.user.role === 'professor') {
            const professorSubjects = req.user.subjects || [];
            query.subject = { $in: professorSubjects };
        }

        // Filter by subject if provided
        if (req.query.subjectId) {
            query.subject = req.query.subjectId;
        }

        const grades = await Grade.find(query)
            .populate('subject', 'name')
            .populate('professor', 'lastName')
            .populate({
                path: 'student',
                select: 'firstName lastName classId',
                populate: {
                    path: 'classId',
                    select: 'name'
                }
            });

        res.json(grades);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete grade
// @route   DELETE /api/grades/:id
// @access  Private (Manager)
const deleteGrade = async (req, res) => {
    try {
        const grade = await Grade.findById(req.params.id);

        if (!grade) {
            return res.status(404).json({ message: 'Grade not found' });
        }

        await grade.deleteOne();
        res.json({ message: 'Grade deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { addGrade, getGrades, deleteGrade };
