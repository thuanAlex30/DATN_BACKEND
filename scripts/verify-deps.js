#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const expressValidatorPath = path.join(__dirname, '../node_modules/express-validator/lib/index.js');

console.log('Verifying express-validator installation...');

if (!fs.existsSync(expressValidatorPath)) {
  console.log('express-validator/lib/index.js not found. Reinstalling...');
  try {
    execSync('rm -rf node_modules/express-validator node_modules/validator', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    execSync('npm install express-validator@7.3.1 validator@13.11.0 --no-audit --legacy-peer-deps', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('express-validator reinstalled successfully.');
  } catch (error) {
    console.error('Failed to reinstall express-validator:', error.message);
    process.exit(1);
  }
} else {
  console.log('express-validator is properly installed.');
}

