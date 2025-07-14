
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OpenAI } = require('openai');
const { validateSetup } = require('./validate-setup');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../dist')));

const dbPath = './db.json';

// Helper function to read the database
const readDB = () => {
  const dbData = fs.readFileSync(dbPath);
  return JSON.parse(dbData);
};

// Helper function to write to the database
const writeDB = (dbData) => {
  fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
};

// Initialize OpenAI client
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-for-development', // Use environment variable for API key
  });
} catch (error) {
  console.error('Error initializing OpenAI client:', error);
  // Continue without OpenAI functionality
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

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }

  try {
    const db = readDB();
    
    // Check if user already exists
    const existingUser = db.users.find(user => user.email === email);
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

    db.users.push(newUser);

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

    db.user_stats.push(userStats);
    writeDB(db);

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
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
    const db = readDB();
    
    // Find user
    const user = db.users.find(u => u.email === email);
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
app.get('/api/tasks', authenticateToken, (req, res) => {
  const db = readDB();
  const userTasks = db.tasks.filter(task => task.user_id === req.user.id);
  res.json(userTasks);
});

app.post('/api/tasks', authenticateToken, (req, res) => {
  const db = readDB();
  const newTask = { 
    id: Date.now(), 
    user_id: req.user.id,
    ...req.body 
  };
  db.tasks.push(newTask);
  writeDB(db);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', authenticateToken, (req, res) => {
    const db = readDB();
    const taskId = parseInt(req.params.id);
    const taskIndex = db.tasks.findIndex(t => t.id === taskId && t.user_id === req.user.id);

    if (taskIndex !== -1) {
        const oldTask = db.tasks[taskIndex];
        const newTask = { ...oldTask, ...req.body };
        
        // If task is being completed, calculate points and update user stats
        if (oldTask.status !== 'completed' && newTask.status === 'completed') {
            // Calculate points based on difficulty and estimated time
            const difficulty = newTask.difficulty || 5;
            const estimatedTime = newTask.estimated_time || 30;
            const basePoints = difficulty * 10;
            const timeBonus = Math.floor(estimatedTime / 15) * 5;
            const pointsEarned = basePoints + timeBonus;
            
            // Add points to task
            newTask.points_earned = pointsEarned;
            newTask.completed_at = new Date().toISOString();
            
            // Update user stats
            const userStatsIndex = db.user_stats.findIndex(s => s.user_id === req.user.id);
            if (userStatsIndex !== -1) {
                db.user_stats[userStatsIndex].total_points += pointsEarned;
                db.user_stats[userStatsIndex].experience_points += pointsEarned;
                db.user_stats[userStatsIndex].tasks_completed += 1;
                db.user_stats[userStatsIndex].last_activity = new Date().toISOString();
                
                // Update level based on XP
                const xp = db.user_stats[userStatsIndex].experience_points;
                const newLevel = Math.floor(xp / 1000) + 1;
                db.user_stats[userStatsIndex].current_level = Math.max(newLevel, 1);
                
                // Update streak logic (simplified)
                const today = new Date().toISOString().split('T')[0];
                const lastActivity = new Date(db.user_stats[userStatsIndex].last_activity).toISOString().split('T')[0];
                if (today === lastActivity) {
                    // Same day, maintain streak
                } else {
                    // Different day, increment streak
                    db.user_stats[userStatsIndex].current_streak += 1;
                    if (db.user_stats[userStatsIndex].current_streak > db.user_stats[userStatsIndex].longest_streak) {
                        db.user_stats[userStatsIndex].longest_streak = db.user_stats[userStatsIndex].current_streak;
                    }
                }
            }
        }
        
        db.tasks[taskIndex] = newTask;
        writeDB(db);
        res.json(newTask);
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
    const db = readDB();
    const taskId = parseInt(req.params.id);
    const taskIndex = db.tasks.findIndex(t => t.id === taskId && t.user_id === req.user.id);

    if (taskIndex !== -1) {
        db.tasks.splice(taskIndex, 1);
        writeDB(db);
        res.status(204).send();
    } else {
        res.status(404).send('Task not found');
    }
});


// Goals (protected routes)
app.get('/api/goals', authenticateToken, (req, res) => {
  const db = readDB();
  const userGoals = db.goals.filter(goal => goal.user_id === req.user.id);
  res.json(userGoals);
});

app.post('/api/goals', authenticateToken, (req, res) => {
  const db = readDB();
  const newGoal = { 
    id: Date.now(), 
    user_id: req.user.id,
    ...req.body 
  };
  db.goals.push(newGoal);
  writeDB(db);
  res.status(201).json(newGoal);
});

app.put('/api/goals/:id', authenticateToken, (req, res) => {
    const db = readDB();
    const goalId = parseInt(req.params.id);
    const goalIndex = db.goals.findIndex(g => g.id === goalId && g.user_id === req.user.id);

    if (goalIndex !== -1) {
        db.goals[goalIndex] = { ...db.goals[goalIndex], ...req.body };
        writeDB(db);
        res.json(db.goals[goalIndex]);
    } else {
        res.status(404).send('Goal not found');
    }
});

app.delete('/api/goals/:id', authenticateToken, (req, res) => {
    const db = readDB();
    const goalId = parseInt(req.params.id);
    const goalIndex = db.goals.findIndex(g => g.id === goalId && g.user_id === req.user.id);

    if (goalIndex !== -1) {
        db.goals.splice(goalIndex, 1);
        writeDB(db);
        res.status(204).send();
    } else {
        res.status(404).send('Goal not found');
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
app.get('/api/users', (req, res) => {
  const db = readDB();
  res.json(db.users);
});

app.get('/api/users/me', authenticateToken, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (user) {
    const { password: _password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.put('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === req.user.id);
    
    if (userIndex !== -1) {
      // Don't allow updating email or id through this endpoint
      const { email: _email, id: _id, ...updateData } = req.body;
      
      // If password is being updated, hash it
      if (updateData.password) {
        const saltRounds = 10;
        updateData.password = await bcrypt.hash(updateData.password, saltRounds);
      }
      
      // Update user data while preserving email and id
      db.users[userIndex] = { 
        ...db.users[userIndex], 
        ...updateData,
        id: req.user.id, // Preserve original id
        email: db.users[userIndex].email // Preserve original email
      };
      
      writeDB(db);
      
      // Return updated user without password
      const { password: _password, ...userWithoutPassword } = db.users[userIndex];
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
app.get('/api/user-stats', authenticateToken, (req, res) => {
  const db = readDB();
  const userStats = db.user_stats.find(s => s.user_id === req.user.id);
  if (userStats) {
    res.json(userStats);
  } else {
    res.status(404).json({ error: 'User stats not found' });
  }
});

app.put('/api/user-stats/:id', authenticateToken, (req, res) => {
  const db = readDB();
  const statsId = parseInt(req.params.id);
  const statsIndex = db.user_stats.findIndex(s => s.id === statsId && s.user_id === req.user.id);

  if (statsIndex !== -1) {
    db.user_stats[statsIndex] = { ...db.user_stats[statsIndex], ...req.body };
    writeDB(db);
    res.json(db.user_stats[statsIndex]);
  } else {
    res.status(404).send('User stats not found');
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

// Validate setup before starting server
async function startServer() {
  console.log('Starting TaskBoss-AI Server...');
  console.log('');
  
  const isValid = await validateSetup();
  
  if (!isValid) {
    console.log('');
    console.log('Server startup aborted due to configuration errors.');
    console.log('Please run setup.bat to configure the application properly.');
    process.exit(1);
  }
  
  app.listen(port, () => {
    console.log('');
    console.log('========================================');
    console.log(`✅ Server is running at http://localhost:${port}`);
    console.log('✅ All configurations validated successfully');
    console.log('========================================');
  });
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
