const mongoose = require('mongoose');
require('dotenv').config();

const Subject = require('./src/models/Subject');

const deleteSubjects = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const subjectsToDelete = [
            'Arts Plastiques',
            'Musique',
            'Éducation Physique et Sportive (EPS)'
        ];

        for (const subjectName of subjectsToDelete) {
            const result = await Subject.deleteOne({ name: subjectName });

            if (result.deletedCount > 0) {
                console.log(`✓ Deleted: ${subjectName}`);
            } else {
                console.log(`✗ Not found: ${subjectName}`);
            }
        }

        console.log('\nDeletion complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

deleteSubjects();
