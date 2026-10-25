#!/bin/bash
# Backup automático do Firestore para JSON
# Uso: bash scripts/backup-firestore.sh

set -e

PROJECT_ID="${FIREBASE_PROJECT_ID:-cronograma-concursos}"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.json"

echo "🔥 Iniciando backup do Firestore..."
echo "📁 Projeto: $PROJECT_ID"

mkdir -p "$BACKUP_DIR"

# Instalar Firebase CLI se não existir
if ! command -v firebase &> /dev/null; then
  echo "📦 Instalando Firebase CLI..."
  npm install -g firebase-tools
fi

# Fazer backup usando firestore:export (requer plano Blaze)
# Alternativa: usar firestore:backup:caminho para arquivo local
echo "💾 Executando backup..."
firebase firestore:backup:caminho "$BACKUP_FILE" --project "$PROJECT_ID" || {
  echo "⚠️  Backup direto falhou. Tentando método alternativo..."
  
  # Método alternativo: exportar via Node.js script
  node -e "
    const admin = require('firebase-admin');
    const fs = require('fs');
    const serviceAccount = require('../firebase/serviceAccountKey.json');
    
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    const db = admin.firestore();
    
    const collections = ['concursos', 'sessoes', 'topicos', 'revisoes', 'horas', 'questoes', 'simulados', 'anotacoes'];
    const backup = {};
    
    Promise.all(collections.map(async (col) => {
      const snapshot = await db.collection(col).get();
      backup[col] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    })).then(() => {
      fs.writeFileSync('$BACKUP_FILE', JSON.stringify(backup, null, 2));
      console.log('✅ Backup concluído: $BACKUP_FILE');
      process.exit(0);
    }).catch(err => {
      console.error('❌ Erro no backup:', err);
      process.exit(1);
    });
  "
}

echo "✅ Backup concluído: $BACKUP_FILE"
echo "📊 Tamanho: $(du -h "$BACKUP_FILE" | cut -f1)"

# Manter apenas os últimos 10 backups
ls -t "$BACKUP_DIR"/backup_*.json 2>/dev/null | tail -n +11 | xargs -r rm

echo "🧹 Backups antigos removidos"
