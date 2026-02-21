import db from '../db.js';

async function setupTables() {
  try {
    const connection = await db.getConnection();
    console.log('Connected to database.');

    // Create Users Table
    console.log('Creating users table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        picture TEXT,
        preferences JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Tasks Table (if needed)
    console.log('Creating tasks table...');
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

    console.log('Tables created successfully.');
    connection.release();
    process.exit(0);
  } catch (err) {
    console.error('Table setup failed:', err);
    process.exit(1);
  }
}

setupTables();
