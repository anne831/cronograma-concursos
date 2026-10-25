// Restaurar backup do Firestore
// Uso: node scripts/restore-firestore.js backups/backup_20250101_120000.json

const admin = require('firebase-admin');
const fs = require('fs');

const backupFile = process.argv[2];
if (!backupFile) {
  console.error('❌ Uso: node scripts/restore-firestore.js <arquivo-backup.json>');
  process.exit(1);
}

const serviceAccount = require('../firebase/serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
const collections = Object.keys(backup);

async function restore() {
  console.log(`🔄 Restaurando ${collections.length} coleções...`);
  
  for (const col of collections) {
    const docs = backup[col];
    console.log(`📥 ${col}: ${docs.length} documentos`);
    
    const batch = db.batch();
    docs.forEach(doc => {
      const ref = db.collection(col).doc(doc.id);
      delete doc.id; // Remover ID dos dados
      batch.set(ref, doc);
    });
    
    await batch.commit();
  }
  
  console.log('✅ Restauração concluída!');
  process.exit(0);
}

restore().catch(err => {
  console.error('❌ Erro na restauração:', err);
  process.exit(1);
});
