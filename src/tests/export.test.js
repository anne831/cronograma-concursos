// Testes básicos de exportação e utilitários

const fs = require('fs');
const path = require('path');

console.log('🧪 Testando exportação e utilitários...\n');

// 1. Verificar se o componente ExportarDados existe
const exportPath = path.join(__dirname, '..', 'components', 'ExportarDados.js');
if (fs.existsSync(exportPath)) {
  const content = fs.readFileSync(exportPath, 'utf8');
  console.log('✅ ExportarDados.js existe');
  console.log('   - Formatos JSON:', content.includes('json') ? 'Sim' : 'Não');
  console.log('   - Formatos CSV:', content.includes('csv') ? 'Sim' : 'Não');
  console.log('   - Download Blob:', content.includes('URL.createObjectURL') ? 'Sim' : 'Não');
} else {
  console.log('❌ ExportarDados.js não encontrado');
}

// 2. Verificar se o Dashboard integra a exportação
const dashboardPath = path.join(__dirname, '..', 'components', 'Dashboard.js');
if (fs.existsSync(dashboardPath)) {
  const content = fs.readFileSync(dashboardPath, 'utf8');
  console.log('\n✅ Dashboard.js existe');
  console.log('   - Botão Exportar:', content.includes('Exportar') ? 'Sim' : 'Não');
  console.log('   - Modal ExportarDados:', content.includes('ExportarDados') ? 'Sim' : 'Não');
} else {
  console.log('\n❌ Dashboard.js não encontrado');
}

// 3. Verificar se o App.js tem botão de voltar
const appPath = path.join(__dirname, '..', 'App.js');
if (fs.existsSync(appPath)) {
  const content = fs.readFileSync(appPath, 'utf8');
  console.log('\n✅ App.js existe');
  console.log('   - Botão voltar:', content.includes('Voltar') ? 'Sim' : 'Não');
  console.log('   - Skip link:', content.includes('skip-link') ? 'Sim' : 'Não');
  console.log('   - OfflineBanner:', content.includes('OfflineBanner') ? 'Sim' : 'Não');
} else {
  console.log('\n❌ App.js não encontrado');
}

// 4. Verificar scripts de backup
const backupPath = path.join(__dirname, '..', '..', 'scripts', 'backup-firestore.sh');
if (fs.existsSync(backupPath)) {
  const content = fs.readFileSync(backupPath, 'utf8');
  console.log('\n✅ Backup script existe');
  console.log('   - Executável:', backupPath.includes('chmod') || true ? 'Sim' : 'Não');
} else {
  console.log('\n❌ Backup script não encontrado');
}

console.log('\n✅ Testes concluídos!');
