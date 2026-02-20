import mysql from 'mysql2/promise';

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true // Return dates as strings to match frontend ISO expectations
};

// Handle Unix Socket connection for Cloud SQL if configured
if (process.env.INSTANCE_CONNECTION_NAME) {
  // Production: Cloud Run -> Cloud SQL via Unix Socket
  dbConfig.socketPath = `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`;
} else {
  // Local Development: TCP connection
  dbConfig.host = process.env.DB_HOST || '127.0.0.1';
}

const db = mysql.createPool(dbConfig);

// Test Database Connection
db.getConnection()
  .then(connection => {
    console.log('Database pool initialized successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Failed to initialize database pool:', err);
  });

export default db;
