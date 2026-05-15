/**
 * ⚠️ VULNERABLE CODE - FOR DEMONSTRATION ONLY
 * This file contains intentional frontend security vulnerabilities
 * DO NOT use this code in production
 */

/**
 * VULNERABILITY 1: Hardcoded API Keys in Frontend (CRITICAL)
 * 
 * ❌ INSECURE: API keys exposed in client-side code
 * ✅ SECURE: Never store secrets in frontend, use backend proxy
 */
const STRIPE_PUBLIC_KEY = "pk_live_51HqK8LJxyz987654321zyxwvutsrqponmlkjihgfedcba";
const GOOGLE_MAPS_API_KEY = "AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz";
const FIREBASE_API_KEY = "AIzaSyD9876543210zyxwvutsrqponmlkjihgfedcba12345";

/**
 * VULNERABILITY 2: Hardcoded Backend URLs with Tokens (CRITICAL)
 * 
 * ❌ INSECURE: Authentication tokens in source code
 * ✅ SECURE: Use environment variables and secure token storage
 */
const API_CONFIG = {
  baseUrl: "https://api.myapp.com",
  authToken: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  apiKey: "sk_test_1234567890abcdefghijklmnopqrstuvwxyz"
};

/**
 * VULNERABILITY 3: Sensitive Data in LocalStorage (HIGH)
 * 
 * ❌ INSECURE: Storing sensitive data in localStorage
 * ✅ SECURE: Use httpOnly cookies or secure session storage
 */
function saveUserData(userData) {
  // Storing sensitive data in localStorage - accessible via XSS
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('authToken', userData.token);
  localStorage.setItem('creditCard', userData.creditCard);
  localStorage.setItem('ssn', userData.ssn);
}

/**
 * VULNERABILITY 4: Client-Side Authentication Logic (HIGH)
 * 
 * ❌ INSECURE: Authentication checks on client side only
 * ✅ SECURE: Always validate on server, client checks are for UX only
 */
function isAdmin() {
  const user = JSON.parse(localStorage.getItem('user'));
  // Client-side admin check - easily bypassed
  return user && user.role === 'admin';
}

/**
 * VULNERABILITY 5: Insecure API Calls (HIGH)
 * 
 * ❌ INSECURE: Sending sensitive data in URL parameters
 * ✅ SECURE: Use POST with encrypted body, never send secrets in URLs
 */
async function loginUser(username, password) {
  // Sending credentials in URL - logged in browser history and server logs
  const response = await fetch(
    `${API_CONFIG.baseUrl}/login?username=${username}&password=${password}`
  );
  return await response.json();
}

/**
 * VULNERABILITY 6: No Input Validation (MEDIUM)
 * 
 * ❌ INSECURE: No client-side validation
 * ✅ SECURE: Validate and sanitize all inputs
 */
function submitForm(formData) {
  // No validation - sends raw user input
  return fetch(`${API_CONFIG.baseUrl}/submit`, {
    method: 'POST',
    body: JSON.stringify(formData)
  });
}

/**
 * VULNERABILITY 7: Unsafe innerHTML Usage (HIGH)
 * 
 * ❌ INSECURE: Using innerHTML with user content
 * ✅ SECURE: Use textContent or sanitize with DOMPurify
 */
function displayUserComment(comment) {
  const container = document.getElementById('comments');
  // XSS vulnerability - user content directly in innerHTML
  container.innerHTML += `<div class="comment">${comment}</div>`;
}

/**
 * VULNERABILITY 8: Exposed Debug Information (MEDIUM)
 * 
 * ❌ INSECURE: Console logging sensitive data
 * ✅ SECURE: Remove debug logs in production
 */
function debugLog(data) {
  console.log('API Response:', data);
  console.log('Auth Token:', API_CONFIG.authToken);
  console.log('User Data:', localStorage.getItem('user'));
}

/**
 * VULNERABILITY 9: Insecure Random Number Generation (MEDIUM)
 * 
 * ❌ INSECURE: Using Math.random() for security purposes
 * ✅ SECURE: Use crypto.getRandomValues() for security-critical operations
 */
function generateSessionId() {
  // Math.random() is not cryptographically secure
  return 'session_' + Math.random().toString(36).substr(2, 9);
}

/**
 * VULNERABILITY 10: Client-Side Price Calculation (CRITICAL)
 * 
 * ❌ INSECURE: Calculating prices on client side
 * ✅ SECURE: Always calculate prices on server
 */
function calculateTotal(items) {
  // Client-side price calculation - easily manipulated
  let total = 0;
  items.forEach(item => {
    total += item.price * item.quantity;
  });
  return total;
}

/**
 * VULNERABILITY 11: Hardcoded Encryption Keys (CRITICAL)
 * 
 * ❌ INSECURE: Encryption keys in source code
 * ✅ SECURE: Never encrypt on client side, use HTTPS
 */
const ENCRYPTION_KEY = "my-secret-encryption-key-12345";

function encryptData(data) {
  // Fake encryption with hardcoded key - provides no security
  return btoa(data + ENCRYPTION_KEY);
}

/**
 * VULNERABILITY 12: Exposed Internal API Endpoints (HIGH)
 * 
 * ❌ INSECURE: Internal endpoints accessible from frontend
 * ✅ SECURE: Separate internal and public APIs
 */
const INTERNAL_ENDPOINTS = {
  adminPanel: "https://api.myapp.com/admin",
  debugInfo: "https://api.myapp.com/debug",
  databaseDump: "https://api.myapp.com/db/export"
};

/**
 * VULNERABILITY 13: No CSRF Protection (HIGH)
 * 
 * ❌ INSECURE: No CSRF tokens in requests
 * ✅ SECURE: Implement CSRF tokens for state-changing operations
 */
async function deleteAccount(userId) {
  // No CSRF token - vulnerable to CSRF attacks
  return fetch(`${API_CONFIG.baseUrl}/user/${userId}/delete`, {
    method: 'DELETE',
    headers: {
      'Authorization': API_CONFIG.authToken
    }
  });
}

/**
 * VULNERABILITY 14: Unsafe eval() in Frontend (CRITICAL)
 * 
 * ❌ INSECURE: Using eval() with user input
 * ✅ SECURE: Never use eval(), use safe alternatives
 */
function executeUserScript(script) {
  try {
    // Extremely dangerous - allows arbitrary code execution
    eval(script);
  } catch (error) {
    console.error('Script execution failed:', error);
  }
}

/**
 * VULNERABILITY 15: Exposed Source Maps in Production (MEDIUM)
 * 
 * ❌ INSECURE: Source maps reveal original source code
 * ✅ SECURE: Disable source maps in production builds
 */
// Source maps enabled - reveals original code structure

// Export vulnerable functions
window.API = {
  STRIPE_PUBLIC_KEY,
  GOOGLE_MAPS_API_KEY,
  FIREBASE_API_KEY,
  API_CONFIG,
  saveUserData,
  isAdmin,
  loginUser,
  submitForm,
  displayUserComment,
  debugLog,
  generateSessionId,
  calculateTotal,
  encryptData,
  INTERNAL_ENDPOINTS,
  deleteAccount,
  executeUserScript
};

// Made with Bob
