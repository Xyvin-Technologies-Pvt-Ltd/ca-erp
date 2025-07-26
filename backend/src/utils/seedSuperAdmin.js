const mongoose = require('mongoose');
const SuperAdmin = require('../models/SuperAdmin');
const { logger } = require('./logger');
require('dotenv').config();

const seedSuperAdmin = async () => {
    try {
        console.log('🔍 Starting superadmin check...');
        logger.info('Starting superadmin check');

        // Check if already connected to MongoDB
        if (mongoose.connection.readyState === 1) {
            console.log('✅ Already connected to MongoDB');
        } else {
            // Connect to MongoDB
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ Connected to MongoDB for superadmin check');
            logger.info('Connected to MongoDB for seeding superadmin');
        }

        // Check if superadmin already exists
        console.log('🔍 Checking if superadmin exists...');
        const existingSuperAdmin = await SuperAdmin.findOne({ email: 'xyvinSuperadmin@gmail.com' });
        
        if (existingSuperAdmin) {
            console.log('✅ SuperAdmin already exists');
            console.log(`   Email: ${existingSuperAdmin.email}`);
            console.log(`   ID: ${existingSuperAdmin._id}`);
            console.log(`   Created: ${existingSuperAdmin.createdAt}`);
            logger.info('SuperAdmin already exists, skipping seed');
            return { exists: true, superadmin: existingSuperAdmin };
        }

        console.log('❌ SuperAdmin not found, creating...');
        
        // Create superadmin
        const superadmin = await SuperAdmin.create({
            email: 'xyvinSuperadmin@gmail.com',
            password: 'superadmin'
        });

        console.log('✅ SuperAdmin created successfully!');
        console.log(`   Email: ${superadmin.email}`);
        console.log(`   ID: ${superadmin._id}`);
        console.log(`   Created: ${superadmin.createdAt}`);
        console.log('   Password: superadmin');
        
        logger.info(`SuperAdmin created successfully: ${superadmin.email}`);
        
        return { exists: false, superadmin };

    } catch (error) {
        console.error('❌ Error during superadmin check:', error.message);
        logger.error('Error seeding superadmin:', error);
        throw error;
    }
};

// Function to check superadmin status without seeding
const checkSuperAdmin = async () => {
    try {
        console.log('🔍 Checking superadmin status...');
        
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI);
        }
        
        const superadmin = await SuperAdmin.findOne({ email: 'xyvinSuperadmin@gmail.com' });
        
        if (superadmin) {
            console.log('✅ SuperAdmin exists');
            console.log(`   Email: ${superadmin.email}`);
            console.log(`   ID: ${superadmin._id}`);
            return true;
        } else {
            console.log('❌ SuperAdmin not found');
            return false;
        }
    } catch (error) {
        console.error('❌ Error checking superadmin:', error.message);
        return false;
    }
};

// Run the seed function if this file is executed directly
if (require.main === module) {
    seedSuperAdmin()
        .then((result) => {
            if (result.exists) {
                console.log('✅ Superadmin check completed - already exists');
            } else {
                console.log('✅ Superadmin check completed - created new');
            }
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Superadmin seeding failed:', error.message);
            process.exit(1);
        });
}

module.exports = { seedSuperAdmin, checkSuperAdmin }; 