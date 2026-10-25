const fs = require('fs');
const path = require('path');

console.log('🧪 Testando performance básica...\n');

const base = path.join(__dirname, '..');

// 1. Verificar build
const buildPath = path.join(__dirname, '..', '..', 'build');
if (fs.existsSync(buildPath)) {
  const buildFiles = fs.readdirSync(buildPath, { recursive: true });
  let totalSize = 0;
  buildFiles.forEach(f => {
    const fp = path.join(buildPath, f);
    if (fs.statSync(fp).isFile()) {
      totalSize += fs.statSync(fp).size;
    }
  });
  console.log(`✅ Build total: ${(totalSize / 1024).toFixed(1)} KB`);
} else {
  console.log('❌ Build não encontrado');
}

// 2. Verificar arquivos principais
const checks = [
  ['App.js', path.join(base, 'App.js')],
  ['index.js', path.join(base, 'index.js')],
  ['sw.js', path.join(base, 'public', 'sw.js')],
  ['manifest.json', path.join(base, 'public', 'manifest.json')]
];

checks.forEach(([name, p]) => {
  console.log(fs.existsSync(p) ? `✅ ${name} existe` : `❌ ${name} não encontrado`);
});

console.log('\n✅ Testes de performance concluídos!');
