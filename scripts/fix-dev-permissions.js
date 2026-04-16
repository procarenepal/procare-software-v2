#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Firestore permissions for development...');

// Read current rules
const rulesPath = path.join(process.cwd(), 'firestore.rules');
let rules = fs.readFileSync(rulesPath, 'utf8');

// Add a more permissive rule for users collection queries
const newRule = `
// Development-friendly rule for user queries
match /users {
  // Allow all authenticated users to query users collection
  allow list: if isAuthenticated();
}`;

// Check if the rule already exists
if (!rules.includes('Development-friendly rule for user queries')) {
  // Insert the new rule before the roles collection
  const insertPoint = rules.indexOf('// Roles collection rules');
  if (insertPoint !== -1) {
    rules = rules.slice(0, insertPoint) + newRule + '\n\n' + rules.slice(insertPoint);
    
    // Write back to file
    fs.writeFileSync(rulesPath, rules);
    console.log('✅ Added development-friendly user query rule');
  } else {
    console.log('❌ Could not find insertion point for new rule');
  }
} else {
  console.log('✅ Development rule already exists');
}

console.log('🎉 Development permissions fixed!');
console.log('');
console.log('💡 To allow ALL access for development, run:');
console.log('   npm run rules:dev');
console.log('');
console.log('💡 To restore production rules, run:');
console.log('   npm run rules:prod');
