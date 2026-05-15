/**
 * ⚠️ VULNERABLE CODE - FOR DEMONSTRATION ONLY
 * This file contains intentional SQL injection vulnerabilities
 * DO NOT use this code in production
 */

const { DB_CONFIG } = require('./config');

// Mock database connection (for demonstration)
const db = {
  execute: async (query, params) => {
    console.log('Executing query:', query);
    console.log('Parameters:', params);
    return { rows: [] };
  }
};

/**
 * VULNERABILITY 1: SQL Injection - String concatenation in query (CRITICAL)
 * 
 * ❌ INSECURE: User input directly concatenated into SQL query
 * ✅ SECURE: Use parameterized queries with placeholders
 * 
 * Example exploit: email = "' OR '1'='1" would return all users
 */
async function getUserByEmail(email) {
  const query = `SELECT * FROM users WHERE email = '${email}'`;
  return await db.execute(query);
}

/**
 * VULNERABILITY 2: SQL Injection - Template literal injection (CRITICAL)
 * 
 * ❌ INSECURE: Template literals with user input
 * ✅ SECURE: Use parameterized queries: SELECT * FROM users WHERE id = $1
 */
async function getUserById(userId) {
  const query = `SELECT id, username, email, password_hash FROM users WHERE id = ${userId}`;
  return await db.execute(query);
}

/**
 * VULNERABILITY 3: SQL Injection in ORDER BY clause (HIGH)
 * 
 * ❌ INSECURE: Dynamic ORDER BY without validation
 * ✅ SECURE: Whitelist allowed column names
 */
async function getUsers(sortBy = 'id', order = 'ASC') {
  const query = `SELECT * FROM users ORDER BY ${sortBy} ${order}`;
  return await db.execute(query);
}

/**
 * VULNERABILITY 4: SQL Injection in LIKE clause (HIGH)
 * 
 * ❌ INSECURE: User input in LIKE pattern
 * ✅ SECURE: Use parameterized query with proper escaping
 */
async function searchUsers(searchTerm) {
  const query = `SELECT * FROM users WHERE username LIKE '%${searchTerm}%' OR email LIKE '%${searchTerm}%'`;
  return await db.execute(query);
}

/**
 * VULNERABILITY 5: SQL Injection in UPDATE statement (CRITICAL)
 * 
 * ❌ INSECURE: User input in SET clause
 * ✅ SECURE: Use parameterized queries for all user inputs
 */
async function updateUserProfile(userId, username, bio) {
  const query = `UPDATE users SET username = '${username}', bio = '${bio}' WHERE id = ${userId}`;
  return await db.execute(query);
}

/**
 * VULNERABILITY 6: SQL Injection in DELETE statement (CRITICAL)
 * 
 * ❌ INSECURE: Unparameterized DELETE query
 * ✅ SECURE: Use parameterized query: DELETE FROM users WHERE id = $1
 */
async function deleteUser(userId) {
  const query = `DELETE FROM users WHERE id = ${userId}`;
  return await db.execute(query);
}

/**
 * VULNERABILITY 7: SQL Injection with multiple conditions (CRITICAL)
 * 
 * ❌ INSECURE: Multiple user inputs concatenated
 * ✅ SECURE: Use parameterized queries for all conditions
 */
async function loginUser(username, password) {
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  return await db.execute(query);
}

/**
 * VULNERABILITY 8: SQL Injection in INSERT statement (CRITICAL)
 * 
 * ❌ INSECURE: Direct value insertion
 * ✅ SECURE: Use parameterized INSERT with placeholders
 */
async function createUser(username, email, password) {
  const query = `INSERT INTO users (username, email, password) VALUES ('${username}', '${email}', '${password}')`;
  return await db.execute(query);
}

/**
 * VULNERABILITY 9: Exposed database credentials in error messages (HIGH)
 * 
 * ❌ INSECURE: Exposing connection details in errors
 * ✅ SECURE: Log errors securely, return generic messages to users
 */
async function connectDatabase() {
  try {
    console.log(`Connecting to database at ${DB_CONFIG.host}:${DB_CONFIG.port}`);
    console.log(`Username: ${DB_CONFIG.username}, Password: ${DB_CONFIG.password}`);
    // Connection logic here
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}\nHost: ${DB_CONFIG.host}\nUser: ${DB_CONFIG.username}`);
  }
}

/**
 * VULNERABILITY 10: No input validation or sanitization (HIGH)
 * 
 * ❌ INSECURE: No validation before database operations
 * ✅ SECURE: Validate and sanitize all inputs
 */
async function executeRawQuery(userQuery) {
  // Extremely dangerous - allows arbitrary SQL execution
  return await db.execute(userQuery);
}

module.exports = {
  getUserByEmail,
  getUserById,
  getUsers,
  searchUsers,
  updateUserProfile,
  deleteUser,
  loginUser,
  createUser,
  connectDatabase,
  executeRawQuery
};

// Made with Bob
