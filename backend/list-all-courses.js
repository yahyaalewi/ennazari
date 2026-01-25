const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('./src/models/Course');

dotenv.config();

const listCourses = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const courses = await Course.find({});
        console.log('--- COURSES LIST ---');
        courses.forEach(c => {
            console.log(`ID: "${c._id}" | Title: "${c.title}"`);
        });
        console.log('-------------------');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
};

listCourses();
