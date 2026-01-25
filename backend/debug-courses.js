const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Course = require('./src/models/Course');
const connectDB = require('./src/config/db');

dotenv.config();

const debugCourses = async () => {
    try {
        await connectDB();

        console.log('\n📊 === DEBUG: Courses & Students ===\n');

        // Get all students
        const students = await User.find({ role: 'student' }).populate('classId');
        console.log('👨‍🎓 Students:');
        students.forEach(s => {
            console.log(`  - ${s.firstName} ${s.lastName} (${s.email})`);
            console.log(`    Class ID: ${s.classId?._id || 'NO CLASS'}`);
            console.log(`    Class Name: ${s.classId?.name || 'NO CLASS'}\n`);
        });

        // Get all courses
        const courses = await Course.find().populate('class').populate('subject').populate('professor', 'firstName lastName');
        console.log('\n📚 Courses:');
        if (courses.length === 0) {
            console.log('  ⚠️  NO COURSES FOUND IN DATABASE\n');
        } else {
            courses.forEach(c => {
                console.log(`  - ${c.title}`);
                console.log(`    Class ID: ${c.class?._id || 'NO CLASS'}`);
                console.log(`    Class Name: ${c.class?.name || 'NO CLASS'}`);
                console.log(`    Subject: ${c.subject?.name || 'NO SUBJECT'}`);
                console.log(`    Professor: ${c.professor?.firstName} ${c.professor?.lastName}\n`);
            });
        }

        // Check if student classes match course classes
        console.log('\n🔍 Matching Analysis:');
        students.forEach(student => {
            const studentClassId = student.classId?._id?.toString();
            const matchingCourses = courses.filter(c => c.class?._id?.toString() === studentClassId);
            console.log(`  ${student.firstName} (Class: ${student.classId?.name || 'NONE'})`);
            console.log(`    Should see ${matchingCourses.length} course(s)`);
            if (matchingCourses.length > 0) {
                matchingCourses.forEach(mc => console.log(`      ✓ ${mc.title}`));
            }
            console.log('');
        });

        process.exit();
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

debugCourses();
