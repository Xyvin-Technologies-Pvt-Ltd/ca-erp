const mongoose = require('mongoose');
const SuperAdmin = require('../models/SuperAdmin');
const { logger } = require('./logger');
require('dotenv').config();

const seedSuperAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('Connected to MongoDB for seeding superadmin');

        // Check if superadmin already exists
        const existingSuperAdmin = await SuperAdmin.findOne({ email: 'xyvinSuperadmin@gmail.com' });
        if (existingSuperAdmin) {
            logger.info('SuperAdmin already exists, skipping seed');
            return;
        }

        // Create superadmin
        const superadmin = await SuperAdmin.create({
            email: 'xyvinSuperadmin@gmail.com',
            password: 'superadmin'
        });

        logger.info(`SuperAdmin created successfully: ${superadmin.email}`);
        console.log('✅ SuperAdmin seeded successfully!');
        console.log('Email: xyvinSuperadmin@gmail.com');
        console.log('Password: superadmin');

    } catch (error) {
        logger.error('Error seeding superadmin:', error);
        console.error('❌ Error seeding superadmin:', error.message);
    } finally {
        await mongoose.disconnect();
        logger.info('Disconnected from MongoDB');
    }
};

// Run the seed function if this file is executed directly
if (require.main === module) {
    seedSuperAdmin();
}

module.exports = seedSuperAdmin; 