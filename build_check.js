const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('==================================================');
console.log('   BABKE KEBAB — PRE-PRODUCTION BUILD CHECKER     ');
console.log('==================================================');

const filesToValidate = [
  'server.js',
  'data/defaultData.js',
  'data/store.js',
  'scripts/app.js',
  'scripts/cart.js',
  'scripts/chatbot.js',
  'scripts/embers.js',
  'scripts/hero-spin.js',
  'scripts/preloader.js',
  'scripts/translations.js',
  'components/cartDrawer.js',
  'components/foodChatbot.js',
  'components/reservationForm.js',
  'admin/admin.js'
];

const requiredStaticAssets = [
  'index.html',
  'admin/index.html',
  'styles/main.css',
  'styles/admin.css'
];

let failed = false;

// 1. Validate JS syntax using Node vm compiler
console.log('\nChecking JavaScript syntax...');
filesToValidate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${file}`);
    failed = true;
    return;
  }

  try {
    const code = fs.readFileSync(filePath, 'utf8');
    // Using vm.Script compiles the code without running it
    new vm.Script(code, { filename: file });
    console.log(`✓ ${file} syntax is valid.`);
  } catch (err) {
    console.error(`❌ Syntax error in ${file}:`);
    console.error(err.stack || err.message);
    failed = true;
  }
});

// 2. Validate essential files presence
console.log('\nVerifying static assets...');
requiredStaticAssets.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✓ Required asset exists: ${file}`);
  } else {
    console.error(`❌ Missing essential asset: ${file}`);
    failed = true;
  }
});

// 3. Print final report
console.log('\n==================================================');
if (failed) {
  console.error('❌ BUILD CHECK FAILED: Please fix errors above.');
  process.exit(1);
} else {
  console.log('✓ BUILD CHECK PASSED: Pre-production version is ready.');
  process.exit(0);
}
