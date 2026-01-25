const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const User = require('./src/models/User');

dotenv.config();

const debugPhotos = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({ profilePicture: { $exists: true, $ne: '' } });
        console.log(`Found ${users.length} users with profile pictures.`);

        users.forEach(u => {
            console.log(`User: ${u.email}`);
            console.log(`  DB Path: "${u.profilePicture}"`);

            // Try to find the file locally
            const relativePath = u.profilePicture.startsWith('/') ? u.profilePicture.substring(1) : u.profilePicture;
            const absolutePath = path.join(__dirname, relativePath);
            console.log(`  Expected Absolute Path: "${absolutePath}"`);

            if (fs.existsSync(absolutePath)) {
                console.log(`  FILE EXISTS ✅`);
            } else {
                console.log(`  FILE MISSING ❌`);
            }
        });

        // List all files in uploads/profiles
        const profilesDir = path.join(__dirname, 'uploads', 'profiles');
        if (fs.existsSync(profilesDir)) {
            const files = fs.readdirSync(profilesDir);
            console.log(`\nFiles in uploads/profiles (${files.length}):`);
            files.forEach(f => console.log(`  - ${f}`));
        } else {
            console.log('\nuploads/profiles directory does not exist!');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
};

debugPhotos();
