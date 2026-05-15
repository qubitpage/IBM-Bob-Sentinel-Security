/**
 * ⚠️ VULNERABLE CODE - FOR DEMONSTRATION ONLY
 * This file contains intentional XSS and API vulnerabilities
 * DO NOT use this code in production
 */

const express = require('express');
const { CORS_CONFIG, DEBUG_MODE, EXPOSE_STACK_TRACES } = require('./config');

const app = express();

/**
 * VULNERABILITY 1: XSS - Reflected XSS in search (CRITICAL)
 * 
 * ❌ INSECURE: User input directly rendered in HTML without sanitization
 * ✅ SECURE: Sanitize input and use Content-Security-Policy headers
 */
app.get('/search', (req, res) => {
  const query = req.query.q;
  // Directly embedding user input in HTML - XSS vulnerability
  res.send(`
    <html>
      <body>
        <h1>Search Results for: ${query}</h1>
        <p>You searched for: ${query}</p>
      </body>
    </html>
  `);
});

/**
 * VULNERABILITY 2: XSS - Stored XSS in comments (CRITICAL)
 * 
 * ❌ INSECURE: User comments stored and displayed without sanitization
 * ✅ SECURE: Sanitize on input and output, use CSP headers
 */
app.post('/comment', (req, res) => {
  const { username, comment } = req.body;
  // Storing unsanitized user input
  const html = `
    <div class="comment">
      <strong>${username}</strong>: ${comment}
    </div>
  `;
  res.send(html);
});

/**
 * VULNERABILITY 3: XSS - DOM-based XSS (HIGH)
 * 
 * ❌ INSECURE: URL parameters used in DOM manipulation
 * ✅ SECURE: Validate and sanitize before DOM insertion
 */
app.get('/profile', (req, res) => {
  const userId = req.query.id;
  res.send(`
    <html>
      <body>
        <script>
          // Vulnerable: Using URL parameter directly in innerHTML
          document.getElementById('user').innerHTML = 'User ID: ${userId}';
        </script>
        <div id="user"></div>
      </body>
    </html>
  `);
});

/**
 * VULNERABILITY 4: Command Injection (CRITICAL)
 * 
 * ❌ INSECURE: User input passed to shell command
 * ✅ SECURE: Never execute shell commands with user input, use safe APIs
 */
app.get('/ping', (req, res) => {
  const host = req.query.host;
  const { exec } = require('child_process');
  
  // Extremely dangerous - allows arbitrary command execution
  exec(`ping -c 4 ${host}`, (error, stdout, stderr) => {
    if (error) {
      res.send(`Error: ${error.message}`);
      return;
    }
    res.send(`<pre>${stdout}</pre>`);
  });
});

/**
 * VULNERABILITY 5: Path Traversal (CRITICAL)
 * 
 * ❌ INSECURE: User-controlled file path
 * ✅ SECURE: Validate paths, use allowlist, prevent directory traversal
 */
app.get('/download', (req, res) => {
  const filename = req.query.file;
  const fs = require('fs');
  
  // Vulnerable to path traversal: /download?file=../../../etc/passwd
  const filePath = `./uploads/${filename}`;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.send(content);
  } catch (error) {
    res.status(404).send('File not found');
  }
});

/**
 * VULNERABILITY 6: Insecure Direct Object Reference (HIGH)
 * 
 * ❌ INSECURE: No authorization check on user data access
 * ✅ SECURE: Verify user has permission to access requested resource
 */
app.get('/user/:id/data', (req, res) => {
  const userId = req.params.id;
  
  // No authorization check - any user can access any user's data
  const userData = {
    id: userId,
    email: 'user@example.com',
    ssn: '123-45-6789',
    creditCard: '4532-1234-5678-9010'
  };
  
  res.json(userData);
});

/**
 * VULNERABILITY 7: Mass Assignment (HIGH)
 * 
 * ❌ INSECURE: Accepting all user input without filtering
 * ✅ SECURE: Whitelist allowed fields, validate input
 */
app.post('/user/update', (req, res) => {
  const userData = req.body;
  
  // Vulnerable: User could set isAdmin=true or other sensitive fields
  // No field validation or filtering
  res.json({ message: 'User updated', data: userData });
});

/**
 * VULNERABILITY 8: Server-Side Request Forgery (SSRF) (CRITICAL)
 * 
 * ❌ INSECURE: Making requests to user-provided URLs
 * ✅ SECURE: Validate URLs, use allowlist, block internal IPs
 */
app.get('/fetch-url', async (req, res) => {
  const url = req.query.url;
  const axios = require('axios');
  
  try {
    // Vulnerable: Could access internal services or cloud metadata
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    res.status(500).send('Error fetching URL');
  }
});

/**
 * VULNERABILITY 9: XML External Entity (XXE) Injection (CRITICAL)
 * 
 * ❌ INSECURE: Parsing XML without disabling external entities
 * ✅ SECURE: Disable external entities in XML parser
 */
app.post('/parse-xml', (req, res) => {
  const xml2js = require('xml2js');
  const xmlData = req.body.xml;
  
  // Vulnerable XML parser configuration
  const parser = new xml2js.Parser({
    // External entities enabled - XXE vulnerability
  });
  
  parser.parseString(xmlData, (err, result) => {
    if (err) {
      res.status(400).send('Invalid XML');
    } else {
      res.json(result);
    }
  });
});

/**
 * VULNERABILITY 10: Insecure Deserialization (CRITICAL)
 * 
 * ❌ INSECURE: Deserializing untrusted data
 * ✅ SECURE: Never deserialize untrusted data, use JSON instead
 */
app.post('/deserialize', (req, res) => {
  const serialized = req.body.data;
  
  // Extremely dangerous - can lead to remote code execution
  const obj = eval('(' + serialized + ')');
  
  res.json({ result: obj });
});

/**
 * VULNERABILITY 11: Information Disclosure (HIGH)
 * 
 * ❌ INSECURE: Exposing stack traces and internal errors
 * ✅ SECURE: Log errors securely, return generic messages
 */
app.use((err, req, res, next) => {
  if (DEBUG_MODE && EXPOSE_STACK_TRACES) {
    // Exposing full stack trace to users
    res.status(500).json({
      error: err.message,
      stack: err.stack,
      config: require('./config')  // Exposing configuration!
    });
  } else {
    res.status(500).send('Internal Server Error');
  }
});

/**
 * VULNERABILITY 12: Missing Security Headers (MEDIUM)
 * 
 * ❌ INSECURE: No security headers configured
 * ✅ SECURE: Use helmet.js or configure security headers
 */
// No security headers like:
// - Content-Security-Policy
// - X-Frame-Options
// - X-Content-Type-Options
// - Strict-Transport-Security

/**
 * VULNERABILITY 13: Insecure CORS Configuration (HIGH)
 * 
 * ❌ INSECURE: CORS allows all origins with credentials
 * ✅ SECURE: Restrict CORS to specific trusted origins
 */
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', CORS_CONFIG.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', CORS_CONFIG.methods.join(','));
  next();
});

/**
 * VULNERABILITY 14: Unsafe eval() usage (CRITICAL)
 * 
 * ❌ INSECURE: Using eval() with user input
 * ✅ SECURE: Never use eval(), use safe alternatives
 */
app.post('/calculate', (req, res) => {
  const expression = req.body.expression;
  
  try {
    // Extremely dangerous - allows arbitrary code execution
    const result = eval(expression);
    res.json({ result });
  } catch (error) {
    res.status(400).send('Invalid expression');
  }
});

module.exports = app;

// Made with Bob
