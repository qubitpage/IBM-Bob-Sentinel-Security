/**
 * ⚠️ VULNERABLE CODE - FOR DEMONSTRATION ONLY
 * This file contains intentional authentication vulnerabilities
 * DO NOT use this code in production
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET, ADMIN_CREDENTIALS } = require('./config');

/**
 * VULNERABILITY 1: Hardcoded JWT secret (CRITICAL)
 * 
 * ❌ INSECURE: JWT secret hardcoded in source code
 * ✅ SECURE: Store JWT secret in environment variables
 */
function generateToken(userId, username) {
  const payload = {
    userId,
    username,
    isAdmin: username === 'admin'  // VULNERABILITY 2: Predictable admin check
  };
  
  // Using hardcoded secret
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

/**
 * VULNERABILITY 3: Weak password validation (HIGH)
 * 
 * ❌ INSECURE: No password complexity requirements
 * ✅ SECURE: Enforce strong password policies (length, complexity, etc.)
 */
function validatePassword(password) {
  // Only checks length, no complexity requirements
  return password && password.length >= 3;
}

/**
 * VULNERABILITY 4: Insecure password storage (CRITICAL)
 * 
 * ❌ INSECURE: Passwords stored in plain text
 * ✅ SECURE: Use bcrypt or argon2 for password hashing
 */
function hashPassword(password) {
  // This is NOT hashing - just returning plain text!
  return password;
}

/**
 * VULNERABILITY 5: Timing attack vulnerability (MEDIUM)
 * 
 * ❌ INSECURE: String comparison reveals password length
 * ✅ SECURE: Use constant-time comparison
 */
function comparePasswords(inputPassword, storedPassword) {
  // Vulnerable to timing attacks
  return inputPassword === storedPassword;
}

/**
 * VULNERABILITY 6: No rate limiting on login attempts (HIGH)
 * 
 * ❌ INSECURE: Unlimited login attempts allowed
 * ✅ SECURE: Implement rate limiting and account lockout
 */
async function login(username, password) {
  // No rate limiting - allows brute force attacks
  
  if (username === ADMIN_CREDENTIALS.username && 
      password === ADMIN_CREDENTIALS.password) {
    return {
      success: true,
      token: generateToken(1, username),
      user: { id: 1, username, role: 'admin' }
    };
  }
  
  return { success: false, message: 'Invalid credentials' };
}

/**
 * VULNERABILITY 7: JWT token without expiration validation (HIGH)
 * 
 * ❌ INSECURE: No proper token expiration handling
 * ✅ SECURE: Validate token expiration and implement refresh tokens
 */
function verifyToken(token) {
  try {
    // Using hardcoded secret
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, data: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * VULNERABILITY 8: Session fixation vulnerability (HIGH)
 * 
 * ❌ INSECURE: Session ID not regenerated after login
 * ✅ SECURE: Regenerate session ID after authentication
 */
function createSession(userId, sessionId) {
  // Reuses existing session ID - vulnerable to session fixation
  return {
    sessionId: sessionId || 'session_' + Date.now(),
    userId,
    createdAt: new Date()
  };
}

/**
 * VULNERABILITY 9: Insecure password reset (CRITICAL)
 * 
 * ❌ INSECURE: Predictable reset tokens
 * ✅ SECURE: Use cryptographically secure random tokens
 */
function generatePasswordResetToken(email) {
  // Predictable token generation
  const timestamp = Date.now();
  const token = `reset_${email}_${timestamp}`;
  return token;
}

/**
 * VULNERABILITY 10: No multi-factor authentication (MEDIUM)
 * 
 * ❌ INSECURE: Single-factor authentication only
 * ✅ SECURE: Implement 2FA/MFA for sensitive accounts
 */
function authenticate(username, password) {
  // No MFA support
  return login(username, password);
}

/**
 * VULNERABILITY 11: Exposed user enumeration (MEDIUM)
 * 
 * ❌ INSECURE: Different error messages reveal if user exists
 * ✅ SECURE: Use generic error messages
 */
async function checkUserExists(username) {
  if (username === ADMIN_CREDENTIALS.username) {
    return { exists: true, message: 'User found' };
  }
  return { exists: false, message: 'User not found' };
}

/**
 * VULNERABILITY 12: Insecure "Remember Me" implementation (HIGH)
 * 
 * ❌ INSECURE: Long-lived tokens without proper security
 * ✅ SECURE: Use secure, rotating refresh tokens
 */
function createRememberMeToken(userId) {
  // Creates a token that never expires
  return jwt.sign({ userId }, JWT_SECRET);
}

module.exports = {
  generateToken,
  validatePassword,
  hashPassword,
  comparePasswords,
  login,
  verifyToken,
  createSession,
  generatePasswordResetToken,
  authenticate,
  checkUserExists,
  createRememberMeToken
};

// Made with Bob
