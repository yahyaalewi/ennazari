const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Class = require('./src/models/Class');
const Subject = require('./src/models/Subject');
const connectDB = require('./src/config/db');

dotenv.config();

const seedData = async () => {
    try {
        await connectDB();

        console.log('🗑️  Cleaning existing data...');
        await User.deleteMany();
        await Class.deleteMany();
        await Subject.deleteMany();

        console.log('📚 Creating Classes (1ère à 7ème année)...');
        const classes = await Class.insertMany([
            { name: '1ère Année', academicYear: '2024-2025' },
            { name: '2ème Année', academicYear: '2024-2025' },
            { name: '3ème Année', academicYear: '2024-2025' },
            { name: '4ème Année', academicYear: '2024-2025' },
            { name: '5ème Année', academicYear: '2024-2025' },
            { name: '6ème Année', academicYear: '2024-2025' },
            { name: '7ème Année', academicYear: '2024-2025' },
            { name: '7éme année O', academicYear: '2024-2025' }
        ]);

        console.log('📖 Creating Subjects...');
        const subjects = await Subject.insertMany([
            { name: 'Mathématiques', code: 'MATH' },
            { name: 'Physique-Chimie', code: 'PHYS' },
            { name: 'Sciences', code: 'SVT' },
            { name: 'Français', code: 'FR' },
            { name: 'Anglais', code: 'EN' },
            { name: 'Arabe', code: 'AR' },
            { name: 'Histoire-Géographie', code: 'HIST' },
            { name: 'Philosophie', code: 'PHILO' },
            { name: 'التربية الإسلامية', code: 'ISLAMIC_EDU' },
            { name: 'التربية المدنية', code: 'CIVIC_EDU' }
        ]);

        console.log('👥 Creating Users...');

        // Manager
        await User.create({
            firstName: ' directeur',
            lastName: ' ennazari',
            email: 'ennazariDirecteur@ennazari.com',
            password: process.env.ADMIN_PASSWORD || 'password123', // Sécurisé via .env
            role: 'manager',
        });

        // Professeurs avec différentes matières
        const mathSubject = subjects.find(s => s.code === 'MATH');
        const physSubject = subjects.find(s => s.code === 'PHYS');
        const frSubject = subjects.find(s => s.code === 'FR');
        const islamicSubject = subjects.find(s => s.code === 'ISLAMIC_EDU');

        await User.create({
            firstName: 'Ahmed',
            lastName: 'Benali',
            email: 'prof.math@ennazari.com',
            password: 'password123',
            role: 'professor',
            subjects: [mathSubject._id],
        });

        await User.create({
            firstName: 'Fatima',
            lastName: 'Zahra',
            email: 'prof.physique@ennazari.com',
            password: 'password123',
            role: 'professor',
            subjects: [physSubject._id],
        });

        await User.create({
            firstName: 'Karim',
            lastName: 'Alaoui',
            email: 'prof.francais@ennazari.com',
            password: 'password123',
            role: 'professor',
            subjects: [frSubject._id],
        });

        await User.create({
            firstName: 'Khadija',
            lastName: 'Amrani',
            email: 'prof.islamic@ennazari.com',
            password: 'password123', // Keeping it simple as in original seed
            role: 'professor',
            subjects: [islamicSubject._id],
        });

        // Étudiants dans différentes classes
        const classe5 = classes.find(c => c.name === '5ème Année');
        const classe6 = classes.find(c => c.name === '6ème Année');
        const classe7 = classes.find(c => c.name === '7ème Année');

        await User.create({
            firstName: 'Youssef',
            lastName: 'Tazi',
            email: 'student1@ennazari.com',
            password: 'password123',
            role: 'student',
            classId: classe5._id,
        });

        await User.create({
            firstName: 'Amina',
            lastName: 'Benjelloun',
            email: 'student2@ennazari.com',
            password: 'password123',
            role: 'student',
            classId: classe6._id,
        });

        await User.create({
            firstName: 'Omar',
            lastName: 'Cherkaoui',
            email: 'student3@ennazari.com',
            password: 'password123',
            role: 'student',
            classId: classe7._id,
        });

        console.log('✅ Data Imported Successfully!');
        console.log('\n📋 Summary:');
        console.log(`   - ${classes.length} Classes created (1ère à 7ème année)`);
        console.log(`   - ${subjects.length} Subjects created`);
        console.log('   - 1 Manager account');
        console.log('   - 4 Professor accounts');
        console.log('   - 3 Student accounts');
        console.log('\n🔑 Login Credentials:');
        console.log('   Manager: ennazariDirecteur@ennazari.com / 27076535');
        console.log('   Prof Math: prof.math@ennazari.com / password123');
        console.log('   Student: student1@ennazari.com / password123');

        process.exit();
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

seedData();
