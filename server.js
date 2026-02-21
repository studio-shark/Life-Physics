import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { OAuth2Client } from 'google-auth-library';
import { GoogleGenerativeAI } from "@google/generative-ai";
import db from './db.js';

const app = express();
const PORT = parseInt(process.env.PORT) || 8080;

// Resolve Client ID from multiple possible sources
const CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "222612925549-3kjshsapngiopj12220s7q6dvct984md.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Middleware for parsing JSON
app.use(express.json());

// CORS Middleware to allow Authorization headers and cross-origin requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ... (existing code) ...

// Debug DB Route - detailed connection info
app.get('/debug/db', async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [rows] = await connection.query('SELECT 1 as val');
    connection.release();
    res.json({ 
      status: 'success', 
      message: 'Database connected successfully', 
      value: rows[0].val,
      config: {
        socketPath: process.env.INSTANCE_CONNECTION_NAME ? `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}` : 'N/A',
        user: process.env.DB_USER ? 'Set' : 'Missing',
        db: process.env.DB_NAME
      }
    });
  } catch (err) {
    console.error('Debug DB Error:', err);
    res.status(500).json({ 
      status: 'error', 
      code: err.code, 
      errno: err.errno, 
      syscall: err.syscall, 
      address: err.address,
      fatal: err.fatal,
      message: err.message 
    });
  }
});

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------------------------------------------------------
// AUTH MIDDLEWARE
// ----------------------------------------------------------------------

const verifyUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    // Attach user info to request for use in routes
    req.user = { google_id: payload.sub, email: payload.email };
    next();
  } catch (error) {
    console.error('Auth Verification Error:', error.message);
    if (error.message.includes('audience')) {
      console.error(`Expected Audience: ${CLIENT_ID}`);
    }
    return res.status(401).json({ status: 'error', message: 'Invalid token', details: error.message });
  }
};

// ----------------------------------------------------------------------
// SYSTEM ROUTES
// ----------------------------------------------------------------------

// Health Check for Cloud Run
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    console.log('Health check: Database connected');
    res.status(200).send('OK');
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).send('Database connection failed');
  }
});

// DB Setup Endpoint
app.get('/api/setup-db', async (req, res) => {
  try {
    const connection = await db.getConnection();
    
    // 1. Create Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        google_id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        picture TEXT,
        preferences JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create Tasks table
    // Including essential fields for app functionality (prerequisites, gamification stats)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        project_id VARCHAR(255),
        title VARCHAR(255),
        description TEXT,
        category VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        difficulty VARCHAR(50),
        prerequisites JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(google_id) ON DELETE CASCADE
      )
    `);
    
    connection.release();
    res.json({ message: 'Database setup completed successfully' });
  } catch (err) {
    console.error('Database setup failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------
// API ROUTES
// ----------------------------------------------------------------------

// Login Route
app.post('/api/auth/login', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'No token provided' });

  try {
    // 1. Verify ID Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    // 2. Upsert User
    const query = `
      INSERT INTO users (google_id, email, name, picture, preferences) 
      VALUES (?, ?, ?, ?, '{}') 
      ON DUPLICATE KEY UPDATE name = VALUES(name), picture = VALUES(picture)
    `;
    await db.execute(query, [googleId, email, name, picture]);

    // 3. Fetch latest preferences
    let preferences = {};
    try {
      const [rows] = await db.execute('SELECT preferences FROM users WHERE google_id = ?', [googleId]);
      if (rows.length > 0 && rows[0].preferences) {
          preferences = rows[0].preferences;
          if (typeof preferences === 'string') {
              try { preferences = JSON.parse(preferences); } catch(e) {}
          }
      }
    } catch (e) {
      console.warn("Failed to fetch preferences", e);
    }

    // 4. Return user profile
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.json({
        status: 'success',
        user: { id: googleId, email, name, picture, preferences },
        message: 'Login successful'
    });

  } catch (error) {
    console.error('Login Verification Failed:', error.message);
    if (error.message.includes('audience')) {
      console.error(`Expected Audience: ${CLIENT_ID}`);
    }
    res.status(401).json({ error: 'Invalid Google Token', details: error.message });
  }
});

// GET /api/tasks - Fetch all tasks for the logged-in user
app.get('/api/tasks', verifyUser, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM tasks WHERE user_id = ?', [req.user.google_id]);
    
    // Parse JSON fields (prerequisites)
    const tasks = rows.map(task => ({
      ...task,
      prerequisites: typeof task.prerequisites === 'string' ? JSON.parse(task.prerequisites) : (task.prerequisites || [])
    }));

    res.json({ status: 'success', tasks });
  } catch (err) {
    console.error('Fetch Tasks Error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks - Create a new task
app.post('/api/tasks', verifyUser, async (req, res) => {
  const task = req.body;
  if (!task.id || !task.title) return res.status(400).json({ status: 'error', message: 'Invalid task data' });

  try {
    const query = `
      INSERT INTO tasks (
        id, user_id, title, description, category, status, difficulty, prerequisites, project_id, created_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Map fields, providing defaults for optional columns to prevent DB errors
    const values = [
      task.id,
      req.user.google_id,
      task.title,
      task.description || '',
      task.category || 'Habits',
      task.status || 'pending',
      task.difficulty || 'Easy Start',
      JSON.stringify(task.prerequisites || []),
      task.projectId || 'p1',
      new Date(task.createdAt || Date.now()),
      task.completedAt ? new Date(task.completedAt) : null
    ];

    await db.execute(query, values);
    res.json({ status: 'success', message: 'Task created successfully' });
  } catch (err) {
    console.error('Create Task Error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update an existing task
app.put('/api/tasks/:id', verifyUser, async (req, res) => {
  const { id } = req.params;
  const task = req.body;

  try {
    const query = `
      UPDATE tasks 
      SET title = ?, description = ?, category = ?, status = ?, difficulty = ?, completed_at = ?, prerequisites = ?
      WHERE id = ? AND user_id = ?
    `;

    const values = [
      task.title,
      task.description,
      task.category,
      task.status,
      task.difficulty,
      task.completedAt ? new Date(task.completedAt) : null,
      JSON.stringify(task.prerequisites || []),
      id,
      req.user.google_id
    ];

    const [result] = await db.execute(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Task not found or unauthorized' });
    }

    res.json({ status: 'success', message: 'Task updated successfully' });
  } catch (err) {
    console.error('Update Task Error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update task' });
  }
});

// GET /api/user/settings
app.get('/api/user/settings', verifyUser, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT preferences FROM users WHERE google_id = ?', [req.user.google_id]);
    const prefs = rows.length > 0 ? rows[0].preferences || {} : {};
    res.json({ status: 'success', preferences: typeof prefs === 'string' ? JSON.parse(prefs) : prefs });
  } catch (err) {
    console.error('Fetch Settings Error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch settings' });
  }
});

// PUT /api/user/settings
app.put('/api/user/settings', verifyUser, async (req, res) => {
  const newSettings = req.body;
  try {
    // Fetch current settings to merge
    const [rows] = await db.execute('SELECT preferences FROM users WHERE google_id = ?', [req.user.google_id]);
    let currentPrefs = rows.length > 0 ? rows[0].preferences || {} : {};
    if (typeof currentPrefs === 'string') currentPrefs = JSON.parse(currentPrefs);

    const updatedPrefs = { ...currentPrefs, ...newSettings };
    
    await db.execute('UPDATE users SET preferences = ? WHERE google_id = ?', [JSON.stringify(updatedPrefs), req.user.google_id]);
    res.json({ status: 'success', preferences: updatedPrefs });
  } catch (err) {
    console.error('Update Settings Error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update settings' });
  }
});

// AI Route
app.post('/api/generate-task', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ result: response.text() });
  } catch (error) {
    console.error('GenAI Error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// Serve Static Files
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
