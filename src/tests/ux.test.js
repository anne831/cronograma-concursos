const fs = require('fs');
const path = require('path');

console.log('🧪 Testando polimentos visuais e UX...\n');

const base = path.join(__dirname, '..');
const components = ['Toast', 'Loading', 'Skeleton', 'OfflineBanner'];
components.forEach(name => {
  const fullPath = path.join(base, 'components', name + '.js');
  console.log(fs.existsSync(fullPath) ? `✅ ${name} existe` : `❌ ${name} não encontrado`);
});

const hookPath = path.join(base, 'hooks', 'useFeedback.js');
console.log(fs.existsSync(hookPath) ? '\n✅ useFeedback hook existe' : '\n❌ useFeedback hook não encontrado');

const cssPath = path.join(base, 'styles', 'global.css');
if (fs.existsSync(cssPath)) {
  const css = fs.readFileSync(cssPath, 'utf8');
  console.log('\n✅ global.css com animações:', css.includes('@keyframes') ? 'Sim' : 'Não');
  console.log('   Hover states:', css.includes(':hover') ? 'Sim' : 'Não');
} else {
  console.log('\n❌ global.css não encontrado');
}

console.log('\n✅ Testes de UX concluídos!');
