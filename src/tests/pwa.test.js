// Testes básicos de PWA e offline

const fs = require('fs');
const path = require('path');

console.log('🧪 Testando PWA e Offline...\n');

// 1. Verificar se o manifest existe
const manifestPath = path.join(__dirname, '..', '..', 'public', 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log('✅ Manifest.json existe');
  console.log('   - Nome:', manifest.name);
  console.log('   - Display:', manifest.display);
  console.log('   - Theme color:', manifest.theme_color);
} else {
  console.log('❌ Manifest.json não encontrado');
}

// 2. Verificar se o service worker existe
const swPath = path.join(__dirname, '..', '..', 'public', 'sw.js');
if (fs.existsSync(swPath)) {
  const sw = fs.readFileSync(swPath, 'utf8');
  console.log('\n✅ Service Worker (sw.js) existe');
  console.log('   - Cache strategy:', sw.includes('cache') ? 'Cache ativo' : 'Sem cache');
  console.log('   - Offline fallback:', sw.includes('offline') || sw.includes('caches.match') ? 'Sim' : 'Não');
} else {
  console.log('\n❌ Service Worker não encontrado');
}

// 3. Verificar se o index.html referencia o manifest
const indexPath = path.join(__dirname, '..', '..', 'public', 'index.html');
if (fs.existsSync(indexPath)) {
  const index = fs.readFileSync(indexPath, 'utf8');
  console.log('\n✅ index.html existe');
  console.log('   - Manifest link:', index.includes('manifest.json') ? 'Sim' : 'Não');
  console.log('   - Viewport:', index.includes('viewport') ? 'Sim' : 'Não');
} else {
  console.log('\n❌ index.html não encontrado');
}

// 4. Verificar se o index.js registra o service worker
const indexJsPath = path.join(__dirname, '..', 'index.js');
if (fs.existsSync(indexJsPath)) {
  const indexJs = fs.readFileSync(indexJsPath, 'utf8');
  console.log('\n✅ index.js existe');
  console.log('   - Service Worker registration:', indexJs.includes('serviceWorker') ? 'Sim' : 'Não');
} else {
  console.log('\n❌ index.js não encontrado');
}

// 5. Verificar se o OfflineBanner existe
const offlineBannerPath = path.join(__dirname, '..', 'components', 'OfflineBanner.js');
if (fs.existsSync(offlineBannerPath)) {
  const banner = fs.readFileSync(offlineBannerPath, 'utf8');
  console.log('\n✅ OfflineBanner existe');
  console.log('   - Eventos online/offline:', banner.includes('online') && banner.includes('offline') ? 'Sim' : 'Não');
} else {
  console.log('\n❌ OfflineBanner não encontrado');
}

console.log('\n✅ Testes de PWA concluídos!');
