require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { initializeDatabase, dbHelpers, getDatabase } = require('./database');
const { migrateAddDescription } = require('./migrate-add-description');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../dist')));

// Initialize database
let db;
initializeDatabase().then(async (database) => {
    db = database;
    console.log('✅ SQLite database initialized successfully');
    
    // Run migrations
    try {
        await migrateAddDescription();
        console.log('✅ Database migrations completed');
    } catch (error) {
        console.error('❌ Database migration failed:', error);
        // Don't exit - continue with existing database structure
    }
}).catch(error => {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
});

// Initialize OpenAI client
let openai;
try {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-for-development',
    });
} catch (error) {
    console.error('Error initializing OpenAI client:', error);
}

// Initialize Gemini client
let gemini;
try {
    if (process.env.GEMINI_API_KEY) {
        gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        console.log('✅ Gemini client initialized successfully');
    } else {
        console.log('⚠️ Gemini API key not found in environment');
    }
} catch (error) {
    console.error('Error initializing Gemini client:', error);
}

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Achievement system
const getAllAchievements = () => [
  { id: 'first_task', title: 'First Step', description: 'Complete your first task', rarity: 'common', points: 50, req: (stats) => stats.tasks_completed >= 1 },
  { id: 'tasks_10', title: 'Productive', description: 'Complete 10 tasks', rarity: 'common', points: 100, req: (stats) => stats.tasks_completed >= 10 },
  { id: 'tasks_50', title: 'Task Machine', description: 'Complete 50 tasks', rarity: 'rare', points: 250, req: (stats) => stats.tasks_completed >= 50 },
  { id: 'streak_3', title: 'Warming Up', description: 'Maintain a 3-day streak', rarity: 'common', points: 100, req: (stats) => stats.longest_streak >= 3 },
  { id: 'streak_7', title: 'Unstoppable', description: 'Maintain a 7-day streak', rarity: 'rare', points: 300, req: (stats) => stats.longest_streak >= 7 },
  { id: 'points_1000', title: 'Point Collector', description: 'Accumulate 1,000 points', rarity: 'rare', points: 200, req: (stats) => stats.total_points >= 1000 },
  { id: 'points_5000', title: 'XP Millionaire', description: 'Accumulate 5,000 points', rarity: 'epic', points: 500, req: (stats) => stats.total_points >= 5000 },
  { id: 'level_5', title: 'Beginner Master', description: 'Reach level 5', rarity: 'rare', points: 150, req: (stats) => stats.current_level >= 5 },
  { id: 'level_10', title: 'Experienced Master', description: 'Reach level 10', rarity: 'epic', points: 400, req: (stats) => stats.current_level >= 10 },
  { id: 'legend', title: 'Legend', description: 'Reach level 20', rarity: 'legendary', points: 1000, req: (stats) => stats.current_level >= 20 },
];

// Check and unlock achievements
const checkAndUnlockAchievements = async (userId, updatedStats) => {
  try {
    const allAchievements = getAllAchievements();
    const currentlyUnlocked = updatedStats.achievements_unlocked || [];
    let newAchievements = [];
    let bonusPoints = 0;

    for (const achievement of allAchievements) {
      if (!currentlyUnlocked.includes(achievement.id) && achievement.req(updatedStats)) {
        newAchievements.push(achievement.id);
        bonusPoints += achievement.points;
        console.log(`🏆 Achievement unlocked for user ${userId}: ${achievement.title} (+${achievement.points} points)`);
      }
    }

    if (newAchievements.length > 0) {
      // Update user stats with new achievements and bonus points
      const finalStats = {
        ...updatedStats,
        achievements_unlocked: [...currentlyUnlocked, ...newAchievements],
        total_points: updatedStats.total_points + bonusPoints,
        experience_points: updatedStats.experience_points + bonusPoints
      };

      // Recalculate level with bonus points
      const newLevel = Math.floor(finalStats.experience_points / 1000) + 1;
      finalStats.current_level = Math.max(newLevel, 1);

      await dbHelpers.updateUserStats(db, userId, finalStats);
      
      return {
        newAchievements,
        bonusPoints,
        finalStats
      };
    }

    return { newAchievements: [], bonusPoints: 0, finalStats: updatedStats };
  } catch (error) {
    console.error('Error checking achievements:', error);
    return { newAchievements: [], bonusPoints: 0, finalStats: updatedStats };
  }
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log(`Auth check for ${req.method} ${req.path}`);
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    console.log('Token:', token ? 'Present' : 'Missing');

    if (!token) {
        console.log('No token provided, returning 401');
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Token verification failed:', err.message);
            return res.status(403).json({ error: 'Invalid token' });
        }
        console.log('Token verified successfully for user:', user.id);
        req.user = user;
        next();
    });
};

// --- API Endpoints ---

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'TaskBoss-AI',
        database: db ? 'connected' : 'disconnected'
    });
});

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
        return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    try {
        // Check if user already exists
        const existingUser = await dbHelpers.getUserByEmail(db, email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: Date.now(),
            email,
            full_name,
            password: hashedPassword,
            picture: null,
            created_at: new Date().toISOString()
        };

        await dbHelpers.createUser(db, newUser);

        // Create user stats
        const userStats = {
            id: Date.now() + 1,
            user_id: newUser.id,
            total_points: 0,
            current_level: 1,
            experience_points: 0,
            tasks_completed: 0,
            current_streak: 0,
            longest_streak: 0,
            total_time_saved: 0,
            achievements_unlocked: [],
            daily_goal_streak: 0,
            preferred_categories: [],
            last_activity: new Date().toISOString()
        };

        await dbHelpers.createUserStats(db, userStats);

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return user without password
        const { password: _password, ...userWithoutPassword } = newUser;
        res.status(201).json({
            user: userWithoutPassword,
            token,
            message: 'User registered successfully'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password: inputPassword } = req.body;

    if (!email || !inputPassword) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Find user
        const user = await dbHelpers.getUserByEmail(db, email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(inputPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return user without password
        const { password: _userPassword, ...userWithoutPassword } = user;
        res.json({
            user: userWithoutPassword,
            token,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Tasks (protected routes)
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const tasks = await dbHelpers.getTasksByUserId(db, req.user.id);
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Server error fetching tasks' });
    }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const newTask = {
            id: Date.now(),
            userId: req.user.id,
            user_id: req.user.id, // Keep for database compatibility
            ...req.body
        };
        
        await dbHelpers.createTask(db, newTask);
        
        // Return in camelCase format
        const responseTask = {
            ...newTask,
            userId: newTask.user_id,
            goalId: newTask.goal_id,
            estimatedTime: newTask.estimated_time,
            dueDate: newTask.due_date,
            completedAt: newTask.completed_at,
            pointsEarned: newTask.points_earned,
            createdAt: newTask.created_at
        };
        
        res.status(201).json(responseTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Server error creating task' });
    }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const updates = req.body;
        
        console.log(`Updating task ${taskId} for user ${req.user.id}:`, updates);
        
        // If task is being completed, calculate points and update user stats
        if (updates.status === 'completed') {
            const difficulty = updates.difficulty || 5;
            const estimatedTime = updates.estimated_time || 30;
            const basePoints = difficulty * 10;
            const timeBonus = Math.floor(estimatedTime / 15) * 5;
            const pointsEarned = basePoints + timeBonus;
            
            updates.points_earned = pointsEarned;
            updates.completed_at = new Date().toISOString();
            
            // Update user stats
            const userStats = await dbHelpers.getUserStatsByUserId(db, req.user.id);
            if (userStats) {
                const statsUpdates = {
                    total_points: userStats.total_points + pointsEarned,
                    experience_points: userStats.experience_points + pointsEarned,
                    tasks_completed: userStats.tasks_completed + 1,
                    last_activity: new Date().toISOString()
                };
                
                // Update level based on XP
                const newLevel = Math.floor(statsUpdates.experience_points / 1000) + 1;
                statsUpdates.current_level = Math.max(newLevel, 1);
                
                // Update streak logic (simplified)
                const today = new Date().toISOString().split('T')[0];
                const lastActivity = new Date(userStats.last_activity).toISOString().split('T')[0];
                if (today !== lastActivity) {
                    statsUpdates.current_streak = userStats.current_streak + 1;
                    if (statsUpdates.current_streak > userStats.longest_streak) {
                        statsUpdates.longest_streak = statsUpdates.current_streak;
                    }
                }
                
                await dbHelpers.updateUserStats(db, userStats.id, req.user.id, statsUpdates);
                
                // Check and unlock achievements
                const achievementResult = await checkAndUnlockAchievements(req.user.id, statsUpdates);
                if (achievementResult.newAchievements.length > 0) {
                    console.log(`🏆 User ${req.user.id} unlocked ${achievementResult.newAchievements.length} achievements for ${achievementResult.bonusPoints} bonus points!`);
                }
            }
        }
        
        console.log(`Calling updateTask with taskId: ${taskId}, userId: ${req.user.id}, updates:`, updates);
        const result = await dbHelpers.updateTask(db, taskId, req.user.id, updates);
        console.log(`Update result:`, result);
        
        if (result.changes > 0) {
            console.log(`Task ${taskId} updated successfully`);
            
            // Return in camelCase format
            const responseTask = {
                id: taskId,
                ...updates,
                userId: updates.user_id || updates.userId,
                goalId: updates.goal_id || updates.goalId,
                estimatedTime: updates.estimated_time || updates.estimatedTime,
                dueDate: updates.due_date || updates.dueDate,
                completedAt: updates.completed_at || updates.completedAt,
                pointsEarned: updates.points_earned || updates.pointsEarned,
                createdAt: updates.created_at || updates.createdAt
            };
            
            res.json(responseTask);
        } else {
            console.log(`Task ${taskId} not found or no changes made`);
            res.status(404).json({ error: 'Task not found' });
        }
    } catch (error) {
        console.error('Error updating task:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Server error updating task' });
    }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const result = await dbHelpers.deleteTask(db, taskId, req.user.id);
        
        if (result.changes > 0) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Task not found' });
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Server error deleting task' });
    }
});

// Goals (protected routes)
app.get('/api/goals', authenticateToken, async (req, res) => {
    try {
        const goals = await dbHelpers.getGoalsByUserId(db, req.user.id);
        res.json(goals);
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ error: 'Server error fetching goals' });
    }
});

app.post('/api/goals', authenticateToken, async (req, res) => {
    try {
        const newGoal = {
            id: Date.now(),
            userId: req.user.id,
            user_id: req.user.id, // Keep for database compatibility
            ...req.body
        };
        
        await dbHelpers.createGoal(db, newGoal);
        
        // Return in camelCase format
        const responseGoal = {
            ...newGoal,
            userId: newGoal.user_id,
            estimatedTime: newGoal.estimated_time,
            dueDate: newGoal.due_date,
            createdAt: newGoal.created_at
        };
        
        res.status(201).json(responseGoal);
    } catch (error) {
        console.error('Error creating goal:', error);
        res.status(500).json({ error: 'Server error creating goal' });
    }
});

app.put('/api/goals/:id', authenticateToken, async (req, res) => {
    try {
        const goalId = parseInt(req.params.id);
        const updates = req.body;
        
        // If goal is being completed, calculate points and update user stats
        if (updates.status === 'completed') {
            const difficulty = updates.difficulty || 5;
            let basePoints = 100;
            let difficultyBonus = difficulty * 20;
            
            // Check if all tasks are completed for bonus
            const goalTasks = await dbHelpers.getTasksByGoalId(db, goalId);
            const completedTasks = goalTasks.filter(task => task.status === 'completed');
            let completionBonus = 0;
            if (goalTasks.length > 0 && completedTasks.length === goalTasks.length) {
                completionBonus = 50;
            }
            
            const pointsEarned = basePoints + difficultyBonus + completionBonus;
            updates.points_earned = pointsEarned;
            updates.completed_at = new Date().toISOString();
            
            // Update user stats
            const userStats = await dbHelpers.getUserStatsByUserId(db, req.user.id);
            if (userStats) {
                const statsUpdates = {
                    total_points: userStats.total_points + pointsEarned,
                    experience_points: userStats.experience_points + pointsEarned,
                    goals_completed: (userStats.goals_completed || 0) + 1,
                    last_activity: new Date().toISOString()
                };
                
                // Update level based on XP
                const newLevel = Math.floor(statsUpdates.experience_points / 1000) + 1;
                statsUpdates.current_level = Math.max(newLevel, 1);
                
                await dbHelpers.updateUserStats(db, req.user.id, statsUpdates);
                console.log(`Goal completed! User ${req.user.id} earned ${pointsEarned} points. New total: ${statsUpdates.total_points}`);
                
                // Check and unlock achievements
                const achievementResult = await checkAndUnlockAchievements(req.user.id, statsUpdates);
                if (achievementResult.newAchievements.length > 0) {
                    console.log(`🏆 User ${req.user.id} unlocked ${achievementResult.newAchievements.length} achievements for ${achievementResult.bonusPoints} bonus points!`);
                }
            }
        }
        
        const result = await dbHelpers.updateGoal(db, goalId, req.user.id, updates);
        
        if (result.changes > 0) {
            // Return in camelCase format
            const responseGoal = {
                id: goalId,
                ...updates,
                userId: updates.user_id || updates.userId,
                estimatedTime: updates.estimated_time || updates.estimatedTime,
                dueDate: updates.due_date || updates.dueDate,
                createdAt: updates.created_at || updates.createdAt
            };
            res.json(responseGoal);
        } else {
            res.status(404).json({ error: 'Goal not found' });
        }
    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({ error: 'Server error updating goal' });
    }
});

app.delete('/api/goals/:id', authenticateToken, async (req, res) => {
    try {
        const goalId = parseInt(req.params.id);
        const result = await dbHelpers.deleteGoal(db, goalId, req.user.id);
        
        if (result.changes > 0) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Goal not found' });
        }
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({ error: 'Server error deleting goal' });
    }
});

// AI Chat
app.post('/api/chat', authenticateToken, async (req, res) => {
    const { messages } = req.body;

    if (!messages) {
        return res.status(400).json({ error: 'Messages are required' });
    }

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages,
        });
        res.json(completion.choices[0]);
    } catch (error) {
        console.error('Error calling OpenAI:', error);
        res.status(500).json({ error: 'Failed to communicate with OpenAI' });
    }
});

// Users
app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
        const user = await dbHelpers.getUserById(db, req.user.id);
        if (user) {
            const { password: _password, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Server error fetching user' });
    }
});

app.put('/api/users/me', authenticateToken, async (req, res) => {
    try {
        // Don't allow updating email or id through this endpoint
        const { email: _email, id: _id, ...updateData } = req.body;
        
        // If password is being updated, hash it
        if (updateData.password) {
            const saltRounds = 10;
            updateData.password = await bcrypt.hash(updateData.password, saltRounds);
        }
        
        const result = await dbHelpers.updateUser(db, req.user.id, updateData);
        
        if (result.changes > 0) {
            const updatedUser = await dbHelpers.getUserById(db, req.user.id);
            const { password: _password, ...userWithoutPassword } = updatedUser;
            res.json(userWithoutPassword);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Server error during profile update' });
    }
});

// User Stats (protected routes)
app.get('/api/user-stats', authenticateToken, async (req, res) => {
    try {
        const userStats = await dbHelpers.getUserStatsByUserId(db, req.user.id);
        if (userStats) {
            res.json(userStats);
        } else {
            res.status(404).json({ error: 'User stats not found' });
        }
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ error: 'Server error fetching user stats' });
    }
});

app.put('/api/user-stats/:id', authenticateToken, async (req, res) => {
    try {
        const statsId = parseInt(req.params.id);
        const result = await dbHelpers.updateUserStats(db, statsId, req.user.id, req.body);
        
        if (result.changes > 0) {
            res.json({ id: statsId, ...req.body });
        } else {
            res.status(404).json({ error: 'User stats not found' });
        }
    } catch (error) {
        console.error('Error updating user stats:', error);
        res.status(500).json({ error: 'Server error updating user stats' });
    }
});

// LLM Integration with Gemini primary, OpenAI fallback
app.post('/api/llm/invoke', authenticateToken, async (req, res) => {
    const { prompt, response_json_schema, model = 'gemini-1.5-flash' } = req.body;
    
    console.log("LLM Request received:", { prompt: prompt?.substring(0, 100) + "...", response_json_schema, model });

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    // Try Gemini first
    if (gemini && model.includes('gemini')) {
        try {
            console.log("🔮 Using Gemini for LLM request");
            
            const geminiModel = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
            
            let finalPrompt = prompt;
            if (response_json_schema) {
                finalPrompt += `\n\nPlease respond with a valid JSON object that matches this schema: ${JSON.stringify(response_json_schema)}`;
            }
            
            const result = await geminiModel.generateContent(finalPrompt);
            const responseText = result.response.text();
            
            console.log("Gemini Response Text:", responseText);
            
            if (response_json_schema) {
                try {
                    const jsonResponse = JSON.parse(responseText);
                    console.log("Parsed JSON Response from Gemini:", jsonResponse);
                    return res.json(jsonResponse);
                } catch (parseError) {
                    console.error("Gemini JSON Parse Error:", parseError);
                    console.error("Response text that failed to parse:", responseText);
                    
                    // Try to extract JSON from the response if it's wrapped in markdown
                    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
                    if (jsonMatch) {
                        try {
                            const extractedJson = JSON.parse(jsonMatch[1]);
                            console.log("Extracted JSON from Gemini markdown:", extractedJson);
                            return res.json(extractedJson);
                        } catch (extractError) {
                            console.error("Failed to extract JSON from markdown:", extractError);
                        }
                    }
                    
                    // Fall through to OpenAI if JSON parsing fails
                    console.log("🔄 Falling back to OpenAI due to JSON parse error");
                }
            } else {
                return res.json({ response: responseText });
            }
        } catch (error) {
            console.error('Error calling Gemini:', error);
            console.log("🔄 Falling back to OpenAI due to Gemini error");
        }
    }

    // Fallback to OpenAI
    try {
        console.log("🤖 Using OpenAI for LLM request");
        
        const requestBody = {
            model: model.includes('gemini') ? 'gpt-4o' : model,
            messages: [{ role: 'user', content: prompt }],
            response_format: response_json_schema ? { type: 'json_object' } : undefined,
        };
        
        console.log("OpenAI Request:", JSON.stringify(requestBody, null, 2));
        
        const completion = await openai.chat.completions.create(requestBody);

        const responseText = completion.choices[0].message.content;
        console.log("OpenAI Response Text:", responseText);
        
        if (response_json_schema) {
            try {
                const jsonResponse = JSON.parse(responseText);
                console.log("Parsed JSON Response from OpenAI:", jsonResponse);
                res.json(jsonResponse);
            } catch (parseError) {
                console.error("OpenAI JSON Parse Error:", parseError);
                console.error("Response text that failed to parse:", responseText);
                res.status(500).json({ error: 'Failed to parse JSON response from LLM', rawResponse: responseText });
            }
        } else {
            res.json({ response: responseText });
        }
    } catch (error) {
        console.error('Error calling OpenAI:', error);
        console.error('Error details:', error.message);
        console.error('Error response:', error.response?.data);
        res.status(500).json({ error: 'Failed to communicate with LLM providers', details: error.message });
    }
});

// Get available AI models
app.get('/api/models/available', authenticateToken, async (req, res) => {
    try {
        const models = {
            openai: [
                { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'openai', description: 'Latest flagship model' },
                { id: 'gpt-4o', name: 'ChatGPT-4o', provider: 'openai', description: 'Advanced multimodal model' },
                { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'openai', description: 'Efficient lightweight model' },
                { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', description: 'Affordable and intelligent small model' },
                { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', description: 'Fast and efficient model' }
            ],
            gemini: [
                { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini', description: 'Latest most capable model' },
                { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini', description: 'Latest fast and efficient model' },
                { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini', description: 'Advanced fast model' },
                { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini', description: 'Previous generation capable model' },
                { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'gemini', description: 'Previous generation fast model' }
            ]
        };
        
        res.json(models);
    } catch (error) {
        console.error('Error getting available models:', error);
        res.status(500).json({ error: 'Failed to get available models' });
    }
});

// Save user AI model preferences
app.post('/api/user/preferences', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { aiModels } = req.body;
        
        if (!aiModels) {
            return res.status(400).json({ error: 'AI model preferences are required' });
        }
        
        const database = await getDatabase();
        
        // Check if user preferences already exist
        const existing = await new Promise((resolve, reject) => {
            database.get('SELECT * FROM user_preferences WHERE user_id = ?', [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (existing) {
            // Update existing preferences
            await new Promise((resolve, reject) => {
                database.run(
                    'UPDATE user_preferences SET ai_models = ?, updated_at = ? WHERE user_id = ?',
                    [JSON.stringify(aiModels), new Date().toISOString(), userId],
                    function(err) {
                        if (err) reject(err);
                        else resolve(this);
                    }
                );
            });
        } else {
            // Create new preferences
            await new Promise((resolve, reject) => {
                database.run(
                    'INSERT INTO user_preferences (user_id, ai_models, created_at, updated_at) VALUES (?, ?, ?, ?)',
                    [userId, JSON.stringify(aiModels), new Date().toISOString(), new Date().toISOString()],
                    function(err) {
                        if (err) reject(err);
                        else resolve(this);
                    }
                );
            });
        }
        
        res.json({ message: 'AI model preferences saved successfully' });
    } catch (error) {
        console.error('Error saving user preferences:', error);
        res.status(500).json({ error: 'Failed to save user preferences' });
    }
});

// Get user AI model preferences
app.get('/api/user/preferences', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const database = await getDatabase();
        
        const preferences = await new Promise((resolve, reject) => {
            database.get('SELECT * FROM user_preferences WHERE user_id = ?', [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (preferences) {
            res.json({
                aiModels: JSON.parse(preferences.ai_models || '{}'),
                updatedAt: preferences.updated_at
            });
        } else {
            // Return default preferences
            res.json({
                aiModels: {
                    chatModel: 'gemini-2.5-flash',
                    quoteModel: 'gemini-2.5-flash',
                    fallbackModel: 'gpt-4o-mini'
                }
            });
        }
    } catch (error) {
        console.error('Error getting user preferences:', error);
        res.status(500).json({ error: 'Failed to get user preferences' });
    }
});

// Get API keys status (not actual keys for security)
app.get('/api/settings/keys', authenticateToken, async (req, res) => {
    try {
        const hasOpenAI = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-dummy-key-for-development';
        const hasGemini = !!process.env.GEMINI_API_KEY;
        
        res.json({
            openai: hasOpenAI,
            gemini: hasGemini,
            status: {
                openai: hasOpenAI ? 'unknown' : 'missing',
                gemini: hasGemini ? 'unknown' : 'missing'
            }
        });
    } catch (error) {
        console.error('Error getting API keys status:', error);
        res.status(500).json({ error: 'Failed to get API keys status' });
    }
});

// Update API keys (saves to environment and restarts services)
app.post('/api/settings/keys', authenticateToken, async (req, res) => {
    try {
        const { openai, gemini: geminiApiKey } = req.body;
        const fs = require('fs');
        const path = require('path');
        
        // Read current .env file
        const envPath = path.join(__dirname, '../.env');
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }
        
        // Update environment variables
        if (openai) {
            process.env.OPENAI_API_KEY = openai;
            envContent = envContent.replace(/OPENAI_API_KEY=.*$/m, `OPENAI_API_KEY=${openai}`);
            if (!envContent.includes('OPENAI_API_KEY=')) {
                envContent += `\nOPENAI_API_KEY=${openai}`;
            }
        }
        
        if (geminiApiKey) {
            process.env.GEMINI_API_KEY = geminiApiKey;
            envContent = envContent.replace(/GEMINI_API_KEY=.*$/m, `GEMINI_API_KEY=${geminiApiKey}`);
            if (!envContent.includes('GEMINI_API_KEY=')) {
                envContent += `\nGEMINI_API_KEY=${geminiApiKey}`;
            }
            
            // Reinitialize Gemini client
            try {
                gemini = new GoogleGenerativeAI(geminiApiKey);
                console.log('✓ Gemini client reinitialized with new API key');
            } catch (error) {
                console.error('Error reinitializing Gemini client:', error);
            }
        }
        
        // Write updated .env file
        fs.writeFileSync(envPath, envContent);
        
        // Also update server/.env file
        const serverEnvPath = path.join(__dirname, '.env');
        fs.writeFileSync(serverEnvPath, envContent);
        
        res.json({ message: 'API keys updated successfully' });
    } catch (error) {
        console.error('Error updating API keys:', error);
        res.status(500).json({ error: 'Failed to update API keys' });
    }
});

// Test API connection with custom key
app.post('/api/test/openai', authenticateToken, async (req, res) => {
    try {
        const { apiKey } = req.body;
        const testKey = apiKey || process.env.OPENAI_API_KEY;
        
        if (!testKey) {
            return res.status(400).json({ error: 'OpenAI API key is required' });
        }
        
        // Test OpenAI connection
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${testKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 5
            })
        });
        
        if (response.ok) {
            res.json({ status: 'connected', provider: 'openai' });
        } else {
            res.status(400).json({ status: 'failed', error: 'Invalid API key or connection failed' });
        }
    } catch (error) {
        console.error('Error testing OpenAI connection:', error);
        res.status(500).json({ status: 'failed', error: 'Connection test failed' });
    }
});

// Test endpoint for Gemini integration (supports custom API key)
app.post('/api/test/gemini', authenticateToken, async (req, res) => {
    const { prompt = 'Say hello in Hebrew', apiKey } = req.body;
    
    console.log("Gemini Test Request received with prompt:", prompt);

    try {
        let testClient = gemini;
        
        // Use custom API key if provided
        if (apiKey) {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            testClient = new GoogleGenerativeAI(apiKey);
        }
        
        if (!testClient) {
            return res.status(500).json({ error: 'Gemini client not initialized' });
        }

        const model = testClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        console.log("Gemini Test Response:", responseText);
        res.json({ status: 'connected', response: responseText, provider: 'gemini' });
    } catch (error) {
        console.error('Error testing Gemini:', error);
        res.status(500).json({ status: 'failed', error: 'Failed to test Gemini', details: error.message });
    }
});

// Test endpoint for OpenAI integration (no authentication required)
app.post('/api/test/openai', async (req, res) => {
    const { prompt = 'Say hello in Hebrew' } = req.body;
    
    console.log("OpenAI Test Request received with prompt:", prompt);

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
        });

        const responseText = completion.choices[0].message.content;
        console.log("OpenAI Test Response:", responseText);
        
        res.json({ response: responseText });
    } catch (error) {
        console.error('Error calling OpenAI in test endpoint:', error);
        console.error('Error details:', error.message);
        res.status(500).json({ 
            error: 'Failed to communicate with OpenAI', 
            details: error.message,
            apiKey: process.env.OPENAI_API_KEY ? 'API key is set' : 'API key is missing'
        });
    }
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start the server
app.listen(port, () => {
    console.log('');
    console.log('========================================');
    console.log(`✅ TaskBoss-AI Server is running at http://localhost:${port}`);
    console.log('✅ Using SQLite database');
    console.log('========================================');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    if (db) {
        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err);
            } else {
                console.log('✅ Database connection closed');
            }
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});