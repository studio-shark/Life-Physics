import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { GoogleAuth, OAuth2Client } from 'google-auth-library';

const app = express();
const PORT = parseInt(process.env.PORT) || 8080;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "222612925549-3kjshsapngiopj12220s7q6dvct984md.apps.googleusercontent.com";

// Middleware for parsing JSON
app.use(express.json());

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

// Helpers
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/sqlservice.admin']
});

const client = new OAuth2Client(CLIENT_ID);

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
    
    // Create Users table with google_id as PK
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        google_id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Tasks table with user_id as VARCHAR FK
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
        created_at VARCHAR(255),
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

// Authentication Middleware
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
    
    // Find or create user in DB
    const user = await findOrCreateUser(payload.sub, payload.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Verification Error:', error);
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
};

// DB Helper: Find or Create User
async function findOrCreateUser(googleId, email) {
  if (!pool) return { google_id: googleId, email };
  
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
    if (rows.length > 0) return rows[0];

    await pool.query('INSERT INTO users (google_id, email) VALUES (?, ?)', [googleId, email]);
    return { google_id: googleId, email };
  } catch (err) {
    console.error('User DB Error:', err);
    throw err;
  }
}

// Routes
app.get('/api/test-db', async (req, res) => {
  if (!pool) return res.status(503).json({ status: 'error', message: 'Database not configured' });
  try {
    const [rows] = await pool.query('SELECT 1 as val');
    res.json({ status: 'success', message: 'Database connection successful', result: rows[0] });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database connection failed', error: err.message });
  }
});

// GET /api/tasks - Secure Fetch
app.get('/api/tasks', verifyUser, async (req, res) => {
  if (!pool) return res.status(503).json({ status: 'error', message: 'DB not available' });
  
  try {
    // Use req.user.google_id
    const [rows] = await pool.query('SELECT * FROM tasks WHERE user_id = ?', [req.user.google_id]);
    res.json({ status: 'success', tasks: rows });
  } catch (err) {
    console.error('Fetch Tasks Error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks - Secure Sync
app.post('/api/tasks', verifyUser, async (req, res) => {
  if (!pool) return res.status(503).json({ status: 'error', message: 'DB not available' });
  
  const { tasks } = req.body;
  if (!Array.isArray(tasks)) return res.status(400).json({ status: 'error', message: 'Invalid format' });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Simple Sync: Upsert tasks
    for (const task of tasks) {
      await connection.query(`
        INSERT INTO tasks (id, user_id, title, description, category, status, difficulty, created_at, completed_at, prerequisites)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        title=VALUES(title), description=VALUES(description), status=VALUES(status), 
        completed_at=VALUES(completed_at), prerequisites=VALUES(prerequisites)
      `, [
        task.id, 
        req.user.google_id, // Use google_id 
        task.title, 
        task.description, 
        task.category, 
        task.status, 
        task.difficulty, 
        task.created_at, 
        task.completed_at, 
        JSON.stringify(task.prerequisites || [])
      ]);
    }

    await connection.commit();
    res.json({ status: 'success', message: 'Synced successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('Sync Error:', err);
    res.status(500).json({ status: 'error', message: 'Sync failed' });
  } finally {
    connection.release();
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