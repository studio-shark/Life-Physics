import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const PORT = parseInt(process.env.PORT) || 8080;

// Resolve Client ID from multiple possible sources
const CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "222612925549-3kjshsapngiopj12220s7q6dvct984md.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.API_KEY);

// Middleware for parsing JSON
app.use(express.json());

// CORS Middleware to allow Authorization headers and cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cloud SQL Configuration
const dbConfig = {
  socketPath: process.env.INSTANCE_CONNECTION_NAME ? `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}` : undefined,
  user: process.env.DB_USER, 
  database: process.env.DB_NAME,
  enableKeepAlive: true,
  authPlugins: {
    mysql_clear_password: () => () => {
      return getAuthToken();
    }
  }
};

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/sqlservice.admin']
});

async function getAuthToken() {
  try {
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token;
  } catch (error) {
    console.error('Error fetching auth token:', error);
    throw error;
  }
}

// Database Connection
let pool;
if (process.env.INSTANCE_CONNECTION_NAME) {
    pool = mysql.createPool(dbConfig);
    initDb();
} else {
    console.warn('INSTANCE_CONNECTION_NAME not set. Database features disabled.');
}

async function initDb() {
  try {
    const connection = await pool.getConnection();
    
    // Create Users table with extended profile fields and preferences
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        google_id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        picture TEXT,
        preferences JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Schema Migration: Ensure columns exist if table was already created
    try { await connection.query(`ALTER TABLE users ADD COLUMN name VARCHAR(255)`); } catch (e) {}
    try { await connection.query(`ALTER TABLE users ADD COLUMN picture TEXT`); } catch (e) {}
    try { await connection.query(`ALTER TABLE users ADD COLUMN preferences JSON`); } catch (e) {}

    // Create Tasks table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        project_id VARCHAR(255),
        title TEXT,
        description TEXT,
        category VARCHAR(50),
        status VARCHAR(50),
        difficulty VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at VARCHAR(255),
        prerequisites JSON,
        FOREIGN KEY (user_id) REFERENCES users(google_id) ON DELETE CASCADE
      )
    `);
    
    connection.release();
    console.log('Database tables initialized');
  } catch (err) {
    console.error('Database initialization failed:', err);
  }
}

// ----------------------------------------------------------------------
// LOGIN ROUTE
// ----------------------------------------------------------------------
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

    // 2. DB Upsert (Insert or Update)
    if (pool) {
        // Updated query to default preferences to '{}' and handle duplicates
        const query = `
          INSERT INTO users (google_id, email, name, picture, preferences) 
          VALUES (?, ?, ?, ?, '{}') 
          ON DUPLICATE KEY UPDATE name = VALUES(name), picture = VALUES(picture)
        `;
        await pool.query(query, [googleId, email, name, picture]);
    } else {
        console.warn('DB not connected, login proceeding without persistence');
    }

    // 3. Fetch latest user data including preferences
    let preferences = {};
    if (pool) {
      try {
        const [rows] = await pool.query('SELECT preferences FROM users WHERE google_id = ?', [googleId]);
        if (rows.length > 0 && rows[0].preferences) {
            preferences = rows[0].preferences;
             // Handle if preferences is returned as string by driver
             if (typeof preferences === 'string') {
                try { preferences = JSON.parse(preferences); } catch(e) {}
             }
        }
      } catch (e) {
        console.warn("Failed to fetch preferences", e);
      }
    }

    // 4. Return user profile
    res.json({
        status: 'success',
        user: { id: googleId, email, name, picture, preferences },
        message: 'Login successful'
    });

  } catch (error) {
    console.error('Auth Verification Failed:', error);
    res.status(401).json({ error: 'Invalid Google Token' });
  }
});

// Authentication Middleware (for protected routes)
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
    req.user = { google_id: payload.sub, email: payload.email };
    next();
  } catch (error) {
    console.error('Auth Verification Error:', error);
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
};

// ----------------------------------------------------------------------
// USER SETTINGS ROUTES
// ----------------------------------------------------------------------

// GET /api/user/settings
app.get('/api/user/settings', verifyUser, async (req, res) => {
  if (!pool) return res.status(503).json({ status: 'error', message: 'DB not available' });
  
  try {
    const [rows] = await pool.query('SELECT preferences FROM users WHERE google_id = ?', [req.user.google_id]);
    const prefs = rows.length > 0 ? rows[0].preferences || {} : {};
    res.json({ status: 'success', preferences: prefs });
  } catch (err) {
    console.error('Fetch Settings Error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch settings' });
  }
});

// PUT /api/user/settings
app.put('/api/user/settings', verifyUser, async (req, res) => {
  if (!pool) return res.status(503).json({ status: 'error', message: 'DB not available' });
  const newSettings = req.body;
  
  try {
    // Read-Modify-Write to ensure safe merging of JSON fields
    const [rows] = await pool.query('SELECT preferences FROM users WHERE google_id = ?', [req.user.google_id]);
    let currentPrefs = rows.length > 0 ? rows[0].preferences || {} : {};
    
    // Ensure currentPrefs is an object (in case DB driver returns string)
    if (typeof currentPrefs === 'string') {
        try { currentPrefs = JSON.parse(currentPrefs); } catch(e) { currentPrefs = {}; }
    }

    const updatedPrefs = { ...currentPrefs, ...newSettings };
    
    await pool.query('UPDATE users SET preferences = ? WHERE google_id = ?', [JSON.stringify(updatedPrefs), req.user.google_id]);
    
    res.json({ status: 'success', preferences: updatedPrefs });
  } catch (err) {
    console.error('Update Settings Error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update settings' });
  }
});

// ----------------------------------------------------------------------
// AI ROUTES
// ----------------------------------------------------------------------

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

// ----------------------------------------------------------------------
// TASK ROUTES
// ----------------------------------------------------------------------

// GET /api/tasks
app.get('/api/tasks', verifyUser, async (req, res) => {
  if (!pool) return res.status(503).json({ status: 'error', message: 'DB not available' });
  
  try {
    const [rows] = await pool.query('SELECT * FROM tasks WHERE user_id = ?', [req.user.google_id]);
    res.json({ status: 'success', tasks: rows });
  } catch (err) {
    console.error('Fetch Tasks Error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks
app.post('/api/tasks', verifyUser, async (req, res) => {
  if (!pool) return res.status(503).json({ status: 'error', message: 'DB not available' });
  
  const task = req.body;
  if (!task.id || !task.title) return res.status(400).json({ status: 'error', message: 'Invalid task data' });

  try {
    await pool.query(`
      INSERT INTO tasks (id, user_id, title, description, category, status, difficulty, created_at, completed_at, prerequisites)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      task.id, 
      req.user.google_id, 
      task.title, 
      task.description, 
      task.category, 
      task.status, 
      task.difficulty, 
      task.created_at || new Date().toISOString(),
      task.completed_at, 
      JSON.stringify(task.prerequisites || [])
    ]);

    res.json({ status: 'success', message: 'Task created successfully' });
  } catch (err) {
    console.error('Create Task Error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id
app.put('/api/tasks/:id', verifyUser, async (req, res) => {
  if (!pool) return res.status(503).json({ status: 'error', message: 'DB not available' });
  
  const { id } = req.params;
  const task = req.body;

  try {
    const [result] = await pool.query(`
      UPDATE tasks 
      SET title = ?, description = ?, category = ?, status = ?, difficulty = ?, completed_at = ?, prerequisites = ?
      WHERE id = ? AND user_id = ?
    `, [
      task.title, 
      task.description, 
      task.category, 
      task.status, 
      task.difficulty, 
      task.completed_at, 
      JSON.stringify(task.prerequisites || []),
      id,
      req.user.google_id
    ]);

    if (result.affectedRows === 0) {
        return res.status(404).json({ status: 'error', message: 'Task not found or unauthorized' });
    }

    res.json({ status: 'success', message: 'Task updated successfully' });
  } catch (err) {
    console.error('Update Task Error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update task' });
  }
});

// Serve Static Files
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});