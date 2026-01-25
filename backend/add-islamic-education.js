const mongoose = require('mongoose');
require('dotenv').config();

const Subject = require('./src/models/Subject');

const addIslamicEducation = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Check if subject already exists
        const existing = await Subject.findOne({ name: 'التربية الإسلامية' });

        if (existing) {
            console.log('Subject "التربية الإسلامية" already exists!');
            process.exit(0);
        }

        // Create new subject
        const subject = await Subject.create({
            name: 'التربية الإسلامية',
            code: 'ISLAMIC',
            description: 'Éducation Islamique'
        });

        console.log('Subject created successfully:', subject);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

addIslamicEducation();
