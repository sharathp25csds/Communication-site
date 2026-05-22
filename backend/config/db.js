const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Debug Logging for Environment Variables
console.log('🔍 Database Configuration:');
console.log(`   - DB_HOST: ${process.env.DB_HOST}`);
console.log(`   - DB_NAME: ${process.env.DB_NAME}`);
console.log(`   - DB_USER: ${process.env.DB_USER}`);
console.log(`   - DB_PORT: ${process.env.DB_PORT || 3306}`);

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

// Safe ALTER TABLE helper — checks if column exists before adding
async function addColumnIfNotExists(pool, table, column, definition) {
  try {
    const [rows] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [process.env.DB_NAME, table, column]
    );
    if (rows.length === 0) {
      await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
      console.log(`   ✅ Column '${column}' added to '${table}'`);
    } else {
      console.log(`   - Column '${column}' already exists in '${table}'`);
    }
  } catch (e) {
    console.warn(`   ⚠️ Could not add column '${column}' to '${table}':`, e.message);
  }
}

async function connectDB() {
  try {
    // 1. Connect without database first
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL Server');

    // 2. Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    console.log(`✅ Database '${process.env.DB_NAME}' verified/created`);
    await connection.end();

    // 3. Create pool with database
    pool = mysql.createPool({ ...dbConfig, database: process.env.DB_NAME });

    // 4. Verify/Create Tables
    const [rows] = await pool.query('SHOW TABLES');
    const existingTables = rows.map(row => Object.values(row)[0]);

    const requiredTables = ['users', 'calls', 'reports', 'transcripts', 'ai_chats'];
    let allTablesExist = true;

    for (const table of requiredTables) {
      if (existingTables.includes(table)) {
        console.log(`   - Table '${table}' is accessible`);
      } else {
        console.warn(`   ⚠️ Warning: Table '${table}' is missing!`);
        allTablesExist = false;
      }
    }

    // Create ai_chats table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_chats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        message TEXT NOT NULL,
        reply TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // FIXED: Safe migrations using INFORMATION_SCHEMA check
    await addColumnIfNotExists(pool, 'users', 'role', "VARCHAR(50) DEFAULT 'user'");
    await addColumnIfNotExists(pool, 'reports', 'subject', 'VARCHAR(255)');
    await addColumnIfNotExists(pool, 'reports', 'priority', "VARCHAR(50) DEFAULT 'medium'");

    // Seed or Update Admin Account
    const adminEmail = 'sharathp25csds@rnsit.ac.in';
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('sharu@098', 10);

    const [adminRows] = await pool.query('SELECT id, role FROM users WHERE email = ?', [adminEmail]);
    if (adminRows.length === 0) {
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin', adminEmail, hashedPassword, 'admin']
      );
      console.log('✅ Admin account seeded successfully');
    } else if (adminRows[0].role !== 'admin') {
      await pool.query(
        'UPDATE users SET role = ?, password = ? WHERE email = ?',
        ['admin', hashedPassword, adminEmail]
      );
      console.log('✅ Existing user upgraded to admin account');
    }

    if (!allTablesExist) {
      console.log('🔄 Attempting to initialize tables from schema.sql...');
      const schemaPath = path.join(__dirname, '../../database/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        const queries = schema.split(';').filter(q => q.trim().length > 0);
        for (let query of queries) {
          await pool.query(query);
        }
        console.log('✅ Tables initialized successfully');
      } else {
        console.error('❌ schema.sql not found. Cannot initialize tables.');
      }
    }

    console.log('🚀 MySQL Database Ready');
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.error('❌ Error: MySQL Server connection refused. Is XAMPP/MySQL running?');
    } else {
      console.error('❌ Database initialization failed:', err.message);
    }
    console.warn('⚠️ Backend is running with limited database functionality.');
  }
}

connectDB();

module.exports = {
  query: (sql, params) => pool ? pool.query(sql, params) : Promise.reject(new Error('Database not connected')),
  execute: (sql, params) => pool ? pool.execute(sql, params) : Promise.reject(new Error('Database not connected')),
  getConnection: () => pool ? pool.getConnection() : Promise.reject(new Error('Database not connected')),
  pool: () => pool
};