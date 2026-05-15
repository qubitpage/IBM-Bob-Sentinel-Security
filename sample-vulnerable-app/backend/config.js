/**
 * ⚠️ VULNERABLE CODE - FOR DEMONSTRATION ONLY
 * This file contains intentional security vulnerabilities
 * DO NOT use this code in production
 */

// VULNERABILITY 1: Hardcoded AWS Credentials (CRITICAL)
const AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";
const AWS_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
const AWS_REGION = "us-east-1";

// VULNERABILITY 2: Hardcoded Stripe API Key (CRITICAL)
const STRIPE_SECRET_KEY = "sk_live_51HqK8LJxyz123456789abcdefghijklmnopqrstuvwxyz";
const STRIPE_PUBLIC_KEY = "pk_live_51HqK8LJxyz987654321zyxwvutsrqponmlkjihgfedcba";

// VULNERABILITY 3: Hardcoded Database Credentials (CRITICAL)
const DB_CONFIG = {
  host: "prod-db.company.com",
  port: 5432,
  database: "production_db",
  username: "admin",
  password: "SuperSecret123!@#",
  ssl: false  // VULNERABILITY 4: SSL disabled (HIGH)
};

// VULNERABILITY 5: Hardcoded JWT Secret (CRITICAL)
const JWT_SECRET = "my-super-secret-jwt-key-12345";
const JWT_EXPIRY = "30d";

// VULNERABILITY 6: Hardcoded API Keys for third-party services (HIGH)
const OPENAI_API_KEY = "sk-proj-abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOP";
const SENDGRID_API_KEY = "SG.1234567890abcdefghijklmnopqrstuvwxyz.ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// VULNERABILITY 7: Hardcoded OAuth Credentials (CRITICAL)
const OAUTH_CONFIG = {
  clientId: "123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com",
  clientSecret: "GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz",
  redirectUri: "https://myapp.com/oauth/callback"
};

// VULNERABILITY 8: Debug mode enabled with verbose logging (MEDIUM)
const DEBUG_MODE = true;
const LOG_LEVEL = "debug";
const EXPOSE_STACK_TRACES = true;

// VULNERABILITY 9: Insecure CORS configuration (HIGH)
const CORS_CONFIG = {
  origin: "*",  // Allows all origins
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
};

// VULNERABILITY 10: Hardcoded admin credentials (CRITICAL)
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123",
  email: "admin@company.com"
};

module.exports = {
  AWS_ACCESS_KEY,
  AWS_SECRET_KEY,
  AWS_REGION,
  STRIPE_SECRET_KEY,
  STRIPE_PUBLIC_KEY,
  DB_CONFIG,
  JWT_SECRET,
  JWT_EXPIRY,
  OPENAI_API_KEY,
  SENDGRID_API_KEY,
  OAUTH_CONFIG,
  DEBUG_MODE,
  LOG_LEVEL,
  EXPOSE_STACK_TRACES,
  CORS_CONFIG,
  ADMIN_CREDENTIALS
};

// Made with Bob
