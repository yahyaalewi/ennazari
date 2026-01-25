const Course = require('../models/Course');
const User = require('../models/User');
const Subject = require('../models/Subject');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createNotificationsForUsers } = require('./notificationController');

// Multer Config
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${file.originalname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const checkFileType = (file, cb) => {
    const filetypes = /pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Error: PDFs Only!');
    }
};

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

// @desc    Upload a course PDF
// @route   POST /api/courses
// @access  Private (Professor/Manager)
const uploadCourse = async (req, res) => {
    try {
        const { title, description, subjectId, classId } = req.body;
        const professorId = req.user._id;

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a PDF file' });
        }

        // Check if professor teaches this subject (only for professors, managers can upload for any subject)
        if (req.user.role === 'professor') {
            const professorSubjects = req.user.subjects || [];
            if (!professorSubjects.includes(subjectId)) {
                return res.status(403).json({
                    message: 'You can only upload courses for subjects you teach'
                });
            }
        }

        const course = await Course.create({
            title,
            description,
            fileUrl: `/${req.file.path.replace(/\\/g, '/')}`, // Normalize path
            subject: subjectId,
            class: classId,
            professor: professorId,
        });

        // Populate course for notification
        await course.populate('subject', 'name');
        await course.populate('class', 'name');

        // Send notifications to all students in the class
        const students = await User.find({
            classId: classId,
            role: 'student'
        }).select('_id');

        if (students.length > 0) {
            const studentIds = students.map(s => s._id);
            const subjectName = course.subject?.name || 'Cours';
            const className = course.class?.name || 'votre classe';

            await createNotificationsForUsers(
                studentIds,
                'course_added',
                `Nouveau cours : ${title}`,
                `Un nouveau cours de ${subjectName} a été ajouté pour ${className}`,
                course._id,
                'Course'
            );
        }

        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get courses
// @route   GET /api/courses
// @access  Private
const getCourses = async (req, res) => {
    try {
        const { classId, subjectId } = req.query;
        let query = {};

        // If student, filter by their class
        if (req.user.role === 'student') {
            if (req.user.classId) {
                query.class = req.user.classId;
            }
        }

        // If professor, filter by their subjects
        if (req.user.role === 'professor') {
            const professorSubjects = req.user.subjects || [];
            query.subject = { $in: professorSubjects };
        }

        // Allow override by query params for professors/managers
        if (classId && req.user.role !== 'student') {
            query.class = classId;
        }
        if (subjectId) {
            query.subject = subjectId;
        }

        const courses = await Course.find(query)
            .populate('subject', 'name')
            .populate('class', 'name')
            .populate('professor', 'firstName lastName');

        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private (Manager)
const deleteCourse = async (req, res) => {
    try {
        console.log('DELETE REQUEST FOR ID:', req.params.id);
        const course = await Course.findById(req.params.id);
        console.log('COURSE FIND RESULT:', course ? 'FOUND' : 'NOT FOUND');

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Only manager can delete
        if (req.user.role !== 'manager') {
            return res.status(403).json({ message: 'Not authorized to delete courses' });
        }

        // Delete file if it exists
        if (course.fileUrl) {
            const filePath = path.join(__dirname, '../../', course.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await course.deleteOne();
        res.json({ message: 'Course removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    upload,
    uploadCourse,
    getCourses,
    deleteCourse
};
