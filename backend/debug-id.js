const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Course = require('./src/models/Course');

dotenv.config();

const checkCourse = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const courseId = '6970f4401876beb61101badc';
        const course = await Course.findById(courseId);

        if (course) {
            console.log('COURSE FOUND:', course);
        } else {
            console.log('COURSE NOT FOUND');
            // List all courses to see what we have
            const allCourses = await Course.find({}).limit(5);
            console.log('Some existing courses:', allCourses.map(c => c._id));
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
};

checkCourse();
