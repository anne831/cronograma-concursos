const fs = require('fs');
const path = require('path');

console.log('🧪 Testando polimento visual...\n');

const base = path.join(__dirname, '..');
const checks = [
  ['styles/global.css', 'transition'],
  ['styles/global.css', 'animation'],
  ['styles/global.css', ':hover'],
  ['App.js', 'OfflineBanner'],
  ['components/Toast.js', 'CustomEvent']
];

let passed = 0;
let total = 0;

checks.forEach(([file, keyword]) => {
  const fullPath = path.join(base, file);
  if (!fs.existsSync(fullPath)) {
    console.log('⏭️ ' + file + ' não encontrado');
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  total++;
  const found = content.includes(keyword);
  console.log(found ? '✅ ' + file + ': ' + keyword : '❌ ' + file + ': ' + keyword);
  if (found) passed++;
});

console.log('\n📊 Resultado: ' + passed + '/' + total + ' checks passaram');
