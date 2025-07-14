const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'taskboss.db');

// Create and initialize database
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
            console.log('Connected to SQLite database');
        });

        // Create tables
        db.serialize(() => {
            // Users table
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    full_name TEXT NOT NULL,
                    password TEXT NOT NULL,
                    picture TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Goals table
            db.run(`
                CREATE TABLE IF NOT EXISTS goals (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER,
                    title TEXT NOT NULL,
                    description TEXT,
                    priority TEXT DEFAULT 'medium',
                    category TEXT DEFAULT 'personal',
                    difficulty INTEGER DEFAULT 5,
                    estimated_time INTEGER DEFAULT 60,
                    due_date TEXT,
                    tags TEXT, -- JSON string for tags array
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `);

            // Tasks table
            db.run(`
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER,
                    goal_id INTEGER,
                    title TEXT NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'pending',
                    priority TEXT DEFAULT 'medium',
                    difficulty INTEGER DEFAULT 5,
                    estimated_time INTEGER DEFAULT 30,
                    due_date TEXT,
                    completed_at DATETIME,
                    points_earned INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (goal_id) REFERENCES goals (id)
                )
            `);

            // User stats table
            db.run(`
                CREATE TABLE IF NOT EXISTS user_stats (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER UNIQUE,
                    total_points INTEGER DEFAULT 0,
                    current_level INTEGER DEFAULT 1,
                    experience_points INTEGER DEFAULT 0,
                    tasks_completed INTEGER DEFAULT 0,
                    current_streak INTEGER DEFAULT 0,
                    longest_streak INTEGER DEFAULT 0,
                    total_time_saved INTEGER DEFAULT 0,
                    achievements_unlocked TEXT, -- JSON string for achievements array
                    daily_goal_streak INTEGER DEFAULT 0,
                    preferred_categories TEXT, -- JSON string for categories array
                    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `);

            // User preferences table
            db.run(`
                CREATE TABLE IF NOT EXISTS user_preferences (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER UNIQUE,
                    ai_models TEXT, -- JSON string for AI model preferences
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating tables:', err);
                    reject(err);
                } else {
                    console.log('Database tables created successfully');
                    resolve(db);
                }
            });
        });
    });
}

// Get database connection
function getDatabase() {
    return new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Error connecting to database:', err);
        }
    });
}

// Database helper functions
const dbHelpers = {
    // Users
    createUser: (db, user) => {
        return new Promise((resolve, reject) => {
            const stmt = db.prepare(`
                INSERT INTO users (id, email, full_name, password, picture, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            stmt.run([user.id, user.email, user.full_name, user.password, user.picture, user.created_at], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, ...user });
            });
            stmt.finalize();
        });
    },

    getUserByEmail: (db, email) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    getUserById: (db, id) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    updateUser: (db, id, updates) => {
        return new Promise((resolve, reject) => {
            const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updates);
            values.push(id);
            
            db.run(`UPDATE users SET ${fields} WHERE id = ?`, values, function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    // Goals
    createGoal: (db, goal) => {
        return new Promise((resolve, reject) => {
            const stmt = db.prepare(`
                INSERT INTO goals (id, user_id, title, description, priority, category, difficulty, estimated_time, due_date, tags)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const tags = Array.isArray(goal.tags) ? JSON.stringify(goal.tags) : goal.tags || '[]';
            stmt.run([goal.id, goal.user_id, goal.title, goal.description, goal.priority, goal.category, goal.difficulty, goal.estimated_time, goal.due_date, tags], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, ...goal });
            });
            stmt.finalize();
        });
    },

    getGoalsByUserId: (db, userId) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM goals WHERE user_id = ?', [userId], (err, rows) => {
                if (err) reject(err);
                else {
                    // Parse tags JSON
                    const goals = rows.map(goal => ({
                        ...goal,
                        tags: goal.tags ? JSON.parse(goal.tags) : []
                    }));
                    resolve(goals);
                }
            });
        });
    },

    updateGoal: (db, id, userId, updates) => {
        return new Promise((resolve, reject) => {
            if (updates.tags && Array.isArray(updates.tags)) {
                updates.tags = JSON.stringify(updates.tags);
            }
            
            const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updates);
            values.push(id, userId);
            
            db.run(`UPDATE goals SET ${fields} WHERE id = ? AND user_id = ?`, values, function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    deleteGoal: (db, id, userId) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM goals WHERE id = ? AND user_id = ?', [id, userId], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    // Tasks
    createTask: (db, task) => {
        return new Promise((resolve, reject) => {
            const stmt = db.prepare(`
                INSERT INTO tasks (id, user_id, goal_id, title, description, status, priority, difficulty, estimated_time, due_date, completed_at, points_earned)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            // Handle both camelCase and snake_case input
            const userId = task.user_id || task.userId;
            const goalId = task.goal_id || task.goalId;
            const estimatedTime = task.estimated_time || task.estimatedTime;
            const dueDate = task.due_date || task.dueDate;
            const completedAt = task.completed_at || task.completedAt;
            const pointsEarned = task.points_earned || task.pointsEarned;
            
            stmt.run([task.id, userId, goalId, task.title, task.description, task.status, task.priority, task.difficulty, estimatedTime, dueDate, completedAt, pointsEarned], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, ...task });
            });
            stmt.finalize();
        });
    },

    getTasksByUserId: (db, userId) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM tasks WHERE user_id = ?', [userId], (err, rows) => {
                if (err) reject(err);
                else {
                    // Convert snake_case to camelCase for frontend
                    const tasks = rows.map(task => ({
                        id: task.id,
                        userId: task.user_id,
                        goalId: task.goal_id,
                        title: task.title,
                        description: task.description,
                        status: task.status,
                        priority: task.priority,
                        difficulty: task.difficulty,
                        estimatedTime: task.estimated_time,
                        dueDate: task.due_date,
                        completedAt: task.completed_at,
                        pointsEarned: task.points_earned,
                        createdAt: task.created_at
                    }));
                    resolve(tasks);
                }
            });
        });
    },

    getTasksByGoalId: (db, goalId) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM tasks WHERE goal_id = ?', [goalId], (err, rows) => {
                if (err) reject(err);
                else {
                    // Convert snake_case to camelCase for frontend
                    const tasks = rows.map(task => ({
                        id: task.id,
                        userId: task.user_id,
                        goalId: task.goal_id,
                        title: task.title,
                        description: task.description,
                        status: task.status,
                        priority: task.priority,
                        difficulty: task.difficulty,
                        estimatedTime: task.estimated_time,
                        dueDate: task.due_date,
                        completedAt: task.completed_at,
                        pointsEarned: task.points_earned,
                        createdAt: task.created_at
                    }));
                    resolve(tasks);
                }
            });
        });
    },

    updateTask: (db, id, userId, updates) => {
        return new Promise((resolve, reject) => {
            console.log(`updateTask called with id: ${id}, userId: ${userId}, updates:`, updates);
            
            // Map camelCase to snake_case for database columns
            const fieldMapping = {
                'dueDate': 'due_date',
                'completedAt': 'completed_at',
                'pointsEarned': 'points_earned',
                'estimatedTime': 'estimated_time',
                'createdAt': 'created_at'
            };
            
            const fields = [];
            const values = [];
            
            Object.keys(updates).forEach(key => {
                const dbColumn = fieldMapping[key] || key;
                fields.push(`${dbColumn} = ?`);
                values.push(updates[key]);
            });
            
            if (fields.length === 0) {
                console.log('No fields to update');
                resolve({ changes: 0 });
                return;
            }
            
            values.push(id, userId);
            
            const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`;
            console.log(`Executing SQL: ${sql}`);
            console.log(`With values:`, values);
            
            db.run(sql, values, function(err) {
                if (err) {
                    console.error('Database update error:', err);
                    reject(err);
                } else {
                    console.log(`Update result: changes=${this.changes}`);
                    resolve({ changes: this.changes });
                }
            });
        });
    },

    deleteTask: (db, id, userId) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, userId], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    // User Stats
    createUserStats: (db, stats) => {
        return new Promise((resolve, reject) => {
            const stmt = db.prepare(`
                INSERT INTO user_stats (id, user_id, total_points, current_level, experience_points, tasks_completed, current_streak, longest_streak, total_time_saved, achievements_unlocked, daily_goal_streak, preferred_categories, last_activity)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const achievements = Array.isArray(stats.achievements_unlocked) ? JSON.stringify(stats.achievements_unlocked) : stats.achievements_unlocked || '[]';
            const categories = Array.isArray(stats.preferred_categories) ? JSON.stringify(stats.preferred_categories) : stats.preferred_categories || '[]';
            
            stmt.run([stats.id, stats.user_id, stats.total_points, stats.current_level, stats.experience_points, stats.tasks_completed, stats.current_streak, stats.longest_streak, stats.total_time_saved, achievements, stats.daily_goal_streak, categories, stats.last_activity], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, ...stats });
            });
            stmt.finalize();
        });
    },

    getUserStatsByUserId: (db, userId) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM user_stats WHERE user_id = ?', [userId], (err, row) => {
                if (err) reject(err);
                else if (row) {
                    // Parse JSON fields
                    const stats = {
                        ...row,
                        achievements_unlocked: row.achievements_unlocked ? JSON.parse(row.achievements_unlocked) : [],
                        preferred_categories: row.preferred_categories ? JSON.parse(row.preferred_categories) : []
                    };
                    resolve(stats);
                } else {
                    resolve(null);
                }
            });
        });
    },

    updateUserStats: (db, id, userId, updates) => {
        return new Promise((resolve, reject) => {
            if (updates.achievements_unlocked && Array.isArray(updates.achievements_unlocked)) {
                updates.achievements_unlocked = JSON.stringify(updates.achievements_unlocked);
            }
            if (updates.preferred_categories && Array.isArray(updates.preferred_categories)) {
                updates.preferred_categories = JSON.stringify(updates.preferred_categories);
            }
            
            const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updates);
            values.push(id, userId);
            
            db.run(`UPDATE user_stats SET ${fields} WHERE id = ? AND user_id = ?`, values, function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }
};

module.exports = {
    initializeDatabase,
    getDatabase,
    dbHelpers,
    DB_PATH
};