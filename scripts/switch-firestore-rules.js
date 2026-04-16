#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const RULES_FILE = 'firestore.rules';
const DEV_RULES_FILE = 'firestore.dev.rules';
const BACKUP_RULES_FILE = 'firestore.prod.rules';

function switchRules(mode) {
  const rulesPath = path.join(process.cwd(), RULES_FILE);
  const devRulesPath = path.join(process.cwd(), DEV_RULES_FILE);
  const backupRulesPath = path.join(process.cwd(), BACKUP_RULES_FILE);

  try {
    if (mode === 'dev') {
      // Backup current rules
      if (fs.existsSync(rulesPath)) {
        fs.copyFileSync(rulesPath, backupRulesPath);
        console.log('✅ Backed up production rules to firestore.prod.rules');
      }

      // Switch to dev rules
      if (fs.existsSync(devRulesPath)) {
        fs.copyFileSync(devRulesPath, rulesPath);
        console.log('✅ Switched to development rules (ALLOW ALL)');
        console.log('⚠️  WARNING: All Firestore access is now allowed!');
      } else {
        console.error('❌ Development rules file not found:', devRulesPath);
        process.exit(1);
      }
    } else if (mode === 'prod') {
      // Switch back to production rules
      if (fs.existsSync(backupRulesPath)) {
        fs.copyFileSync(backupRulesPath, rulesPath);
        console.log('✅ Switched to production rules');
      } else {
        console.error('❌ Production rules backup not found:', backupRulesPath);
        console.log('💡 Make sure to backup your rules before switching to dev mode');
        process.exit(1);
      }
    } else {
      console.log('Usage: node scripts/switch-firestore-rules.js [dev|prod]');
      console.log('');
      console.log('Commands:');
      console.log('  dev  - Switch to development rules (allow all access)');
      console.log('  prod - Switch to production rules (restricted access)');
      console.log('');
      console.log('Examples:');
      console.log('  npm run rules:dev   # Switch to dev rules');
      console.log('  npm run rules:prod  # Switch to prod rules');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error switching rules:', error.message);
    process.exit(1);
  }
}

const mode = process.argv[2];
switchRules(mode);
