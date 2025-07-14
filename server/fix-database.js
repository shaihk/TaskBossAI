const { migrateAddDescription } = require('./migrate-add-description');

async function fixDatabase() {
    console.log('🔧 Starting database fix...');
    
    try {
        // Run the migration to add description column
        await migrateAddDescription();
        console.log('✅ Database fix completed successfully');
    } catch (error) {
        console.error('❌ Database fix failed:', error);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    fixDatabase();
}

module.exports = { fixDatabase };