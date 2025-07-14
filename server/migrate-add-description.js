const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'taskboss.db');

function migrateAddDescription() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
            console.log('Connected to SQLite database for migration');
        });

        // Check if description column already exists
        db.get("PRAGMA table_info(tasks)", (err, _row) => {
            if (err) {
                console.error('Error checking table info:', err);
                reject(err);
                return;
            }

            // Get all columns
            db.all("PRAGMA table_info(tasks)", (err, columns) => {
                if (err) {
                    console.error('Error getting table columns:', err);
                    reject(err);
                    return;
                }

                const hasDescription = columns.some(col => col.name === 'description');
                
                if (hasDescription) {
                    console.log('✅ Description column already exists in tasks table');
                    db.close();
                    resolve();
                    return;
                }

                console.log('🔄 Adding description column to tasks table...');
                
                // Add description column
                db.run("ALTER TABLE tasks ADD COLUMN description TEXT", (err) => {
                    if (err) {
                        console.error('❌ Error adding description column:', err);
                        reject(err);
                        return;
                    }
                    
                    console.log('✅ Successfully added description column to tasks table');
                    
                    db.close((err) => {
                        if (err) {
                            console.error('Error closing database:', err);
                            reject(err);
                        } else {
                            console.log('✅ Database migration completed successfully');
                            resolve();
                        }
                    });
                });
            });
        });
    });
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateAddDescription()
        .then(() => {
            console.log('Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateAddDescription };