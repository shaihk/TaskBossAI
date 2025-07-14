const { getDatabase, initializeDatabase } = require('./database');

console.log('🔄 Creating new SQLite database...');

try {
    const db = getDatabase();
    initializeDatabase(db, () => {
        console.log('✅ New SQLite database created');
        db.close();
    });
} catch (error) {
    console.error('❌ Database creation failed:', error.message);
    process.exit(1);
}