const fs = require('fs');
const path = require('path');

console.log('🧪 Testando acessibilidade básica...\n');

const files = ['App.js', 'components/Sidebar.js', 'components/Auth.js', 'components/GradeSemanal.js'];
const checks = ['aria-label', 'role=', 'aria-live', 'aria-modal', 'tabindex'];

let passed = 0;
let total = 0;

files.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (!fs.existsSync(fullPath)) {
    console.log(`⏭️ ${file} não encontrado`);
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  checks.forEach(check => {
    total++;
    const found = content.includes(check);
    console.log(found ? `✅ ${file}: ${check}` : `❌ ${file}: ${check}`);
    if (found) passed++;
  });
});

console.log(`\n📊 Resultado: ${passed}/${total} checks passaram`);
console.log(passed === total ? '✅ Acessibilidade básica OK!' : '⚠️ Algumas melhorias podem ser necessárias');
