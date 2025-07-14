require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OpenAI } = require('openai');
const { initializeDatabase, dbHelpers } = require('./database');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../dist')));

// Initialize database
let db;
initializeDatabase().then(database => {
    db = database;
    console.log('✅ SQLite database initialized successfully');
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

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
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
            user_id: req.user.id,
            ...req.body
        };
        
        await dbHelpers.createTask(db, newTask);
        res.status(201).json(newTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Server error creating task' });
    }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const updates = req.body;
        
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
            }
        }
        
        const result = await dbHelpers.updateTask(db, taskId, req.user.id, updates);
        if (result.changes > 0) {
            res.json({ id: taskId, ...updates });
        } else {
            res.status(404).json({ error: 'Task not found' });
        }
    } catch (error) {
        console.error('Error updating task:', error);
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
            user_id: req.user.id,
            ...req.body
        };
        
        await dbHelpers.createGoal(db, newGoal);
        res.status(201).json(newGoal);
    } catch (error) {
        console.error('Error creating goal:', error);
        res.status(500).json({ error: 'Server error creating goal' });
    }
});

app.put('/api/goals/:id', authenticateToken, async (req, res) => {
    try {
        const goalId = parseInt(req.params.id);
        const result = await dbHelpers.updateGoal(db, goalId, req.user.id, req.body);
        
        if (result.changes > 0) {
            res.json({ id: goalId, ...req.body });
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

// LLM Integration
app.post('/api/llm/invoke', authenticateToken, async (req, res) => {
    const { prompt, response_json_schema, model = 'gpt-4o' } = req.body;
    
    console.log("LLM Request received:", { prompt: prompt?.substring(0, 100) + "...", response_json_schema, model });

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const requestBody = {
            model: model,
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
                console.log("Parsed JSON Response:", jsonResponse);
                res.json(jsonResponse);
            } catch (parseError) {
                console.error("JSON Parse Error:", parseError);
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
        res.status(500).json({ error: 'Failed to communicate with OpenAI', details: error.message });
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