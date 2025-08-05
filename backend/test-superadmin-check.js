const { seedSuperAdmin, checkSuperAdmin } = require('./src/utils/seedSuperAdmin');

async function testSuperAdmin() {
    console.log('🧪 Testing SuperAdmin Status...\n');
    
    try {
        // First check if superadmin exists
        console.log('1. Checking if superadmin exists...');
        const exists = await checkSuperAdmin();
        
        if (exists) {
            console.log('✅ Superadmin exists - no action needed');
        } else {
            console.log('❌ Superadmin not found - seeding...');
            
            // Try to seed superadmin
            const result = await seedSuperAdmin();
            
            if (result.exists) {
                console.log('✅ Superadmin now exists');
            } else {
                console.log('✅ Superadmin created successfully');
            }
        }
        
        // Final check
        console.log('\n2. Final verification...');
        const finalCheck = await checkSuperAdmin();
        
        if (finalCheck) {
            console.log('✅ Superadmin is ready for login');
            console.log('   Email: xyvinSuperadmin@gmail.com');
            console.log('   Password: superadmin');
        } else {
            console.log('❌ Superadmin still not found - something went wrong');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testSuperAdmin(); 