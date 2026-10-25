const fs = require('fs');
const path = require('path');

console.log('🧪 Testando acessibilidade...\n');

const base = path.join(__dirname, '..');
const checks = [
  ['App.js', 'aria-label', 'skip-link'],
  ['components/Sidebar.js', 'aria-label', 'role='],
  ['components/Auth.js', 'role=', 'aria-live'],
  ['components/GradeSemanal.js', 'role=', 'aria-modal']
];

let passed = 0;
let total = 0;

checks.forEach(([file, ...keywords]) => {
  const fullPath = path.join(base, file);
  if (!fs.existsSync(fullPath)) {
    console.log('⏭️ ' + file + ' não encontrado');
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  keywords.forEach(kw => {
    total++;
    const found = content.includes(kw);
    console.log(found ? '✅ ' + file + ': ' + kw : '❌ ' + file + ': ' + kw);
    if (found) passed++;
  });
});

console.log('\n📊 Resultado: ' + passed + '/' + total + ' checks passaram');
