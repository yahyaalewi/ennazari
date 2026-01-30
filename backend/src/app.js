const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

// Initialize App
const app = express();

const path = require('path');

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const morgan = require('morgan');
app.use(morgan('dev'));

// Fix for old file paths saved with absolute Docker path (backward compatibility)
app.use((req, res, next) => {
    if (req.url.includes('/app/uploads')) {
        req.url = req.url.replace(/^.*\/app\/uploads/, '/uploads');
    }
    next();
});

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const classRoutes = require('./routes/classRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const userRoutes = require('./routes/userRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const absenceRoutes = require('./routes/absenceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/absences', absenceRoutes);
app.use('/api/notifications', notificationRoutes);
app.get('/', (req, res) => {
    res.send('School Management API is running...');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

module.exports = app;
