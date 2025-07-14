const fs = require('fs');
const { getDatabase, initializeDatabase } = require('./database');

console.log('🔄 Migrating data from JSON to SQLite...');

try {
    const jsonData = JSON.parse(fs.readFileSync('db.json', 'utf8'));
    const db = getDatabase();
    
    initializeDatabase(db, () => {
        console.log('✅ SQLite database initialized');
        
        // Migrate users
        if (jsonData.users) {
            Object.entries(jsonData.users).forEach(([id, user]) => {
                if (user.password) {
                    db.run('INSERT OR IGNORE INTO users (id, email, full_name, password, picture, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                        [id, user.email, user.fullName, user.password, user.picture, new Date().toISOString()]);
                }
            });
            console.log('✅ Users migrated');
        }
        
        // Migrate goals
        if (jsonData.goals) {
            Object.entries(jsonData.goals).forEach(([id, goal]) => {
                db.run('INSERT OR IGNORE INTO goals (id, user_id, title, description, priority, category, difficulty, estimated_time, due_date, tags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [id, goal.userId, goal.title, goal.description, goal.priority, goal.category, goal.difficulty, goal.estimatedTime, goal.dueDate, JSON.stringify(goal.tags || []), goal.createdAt]);
            });
            console.log('✅ Goals migrated');
        }
        
        // Migrate tasks
        if (jsonData.tasks) {
            Object.entries(jsonData.tasks).forEach(([id, task]) => {
                db.run('INSERT OR IGNORE INTO tasks (id, user_id, goal_id, title, status, priority, difficulty, estimated_time, due_date, completed_at, points_earned, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [id, task.userId, task.goalId, task.title, task.status, task.priority, task.difficulty, task.estimatedTime, task.dueDate, task.completedAt, task.pointsEarned || 0, task.createdAt]);
            });
            console.log('✅ Tasks migrated');
        }
        
        // Migrate user stats
        if (jsonData.userStats) {
            Object.entries(jsonData.userStats).forEach(([userId, stats]) => {
                db.run('INSERT OR IGNORE INTO user_stats (user_id, total_points, current_level, experience_points, tasks_completed, current_streak, longest_streak, total_time_saved, achievements_unlocked, daily_goal_streak, preferred_categories, last_activity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [userId, stats.totalPoints, stats.currentLevel, stats.experiencePoints, stats.tasksCompleted, stats.currentStreak, stats.longestStreak, stats.totalTimeSaved, JSON.stringify(stats.achievementsUnlocked || []), stats.dailyGoalStreak, JSON.stringify(stats.preferredCategories || []), new Date().toISOString()]);
            });
            console.log('✅ User stats migrated');
        }
        
        db.close();
        console.log('🎉 Migration completed successfully!');
    });
} catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
}