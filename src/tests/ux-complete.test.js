const fs = require('fs');
const path = require('path');

console.log('🧪 Testando UX completo...\n');

const root = path.join(__dirname, '..', '..');
const tests = [
  ['PWA', 'public/sw.js'],
  ['PWA', 'public/manifest.json'],
  ['Service Worker', 'src/index.js'],
  ['Offline', 'src/components/OfflineBanner.js'],
  ['Toast', 'src/components/Toast.js'],
  ['Loading', 'src/components/Loading.js'],
  ['Skeleton', 'src/components/Skeleton.js'],
  ['Acessibilidade', 'src/App.js'],
  ['Testes', 'src/tests/pwa.test.js'],
  ['Testes', 'src/tests/accessibility.test.js']
];

let found = 0;
let total = tests.length;

tests.forEach(([name, file]) => {
  const fp = path.join(root, file);
  console.log(fs.existsSync(fp) ? '✅ ' + name + ' (' + file + ')' : '❌ ' + name + ' (' + file + ')');
  if (fs.existsSync(fp)) found++;
});

console.log('\n📊 Resultado: ' + found + '/' + total + ' existem');
console.log(found === total ? '✅ Tudo OK!' : '⚠️ Algumas melhorias podem ser necessárias');
