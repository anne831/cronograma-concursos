const fs = require('fs');
const path = require('path');

console.log('🧪 Testando UX completo...\n');

const root = path.join(__dirname, '..', '..');
const tests = [
  ['PWA', 'public/sw.js', 'caches'],
  ['PWA', 'public/manifest.json', 'display'],
  ['Service Worker', 'src/index.js', 'serviceWorker'],
  ['Offline', 'src/components/OfflineBanner.js', 'offline'],
  ['Toast', 'src/components/Toast.js', 'CustomEvent'],
  ['Loading', 'src/components/Loading.js', 'export default'],
  ['Skeleton', 'src/components/Skeleton.js', 'skeleton'],
  ['Acessibilidade', 'src/App.js', 'skip-link'],
  ['Acessibilidade', 'src/App.js', 'role="main"']
];

let passed = 0;
let total = 0;

tests.forEach(([category, file, keyword]) => {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    console.log('⏭️ ' + category + ': ' + file + ' não encontrado');
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  total++;
  const found = content.includes(keyword);
  console.log(found ? '✅ ' + category + ' (' + file + ')' : '❌ ' + category + ' (' + file + ')');
  if (found) passed++;
});

console.log('\n📊 Resultado: ' + passed + '/' + total + ' checks passaram');
console.log(passed === total ? '✅ Tudo OK!' : '⚠️ Algumas melhorias podem ser necessárias');
