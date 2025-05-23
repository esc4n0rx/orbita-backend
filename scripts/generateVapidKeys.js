// scripts/generateVapidKeys.js
const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

/**
 * Script para gerar chaves VAPID para Web Push Notifications
 * Execute: node scripts/generateVapidKeys.js
 */

function generateVapidKeys() {
  console.log('🔑 Gerando chaves VAPID...');
  
  // Gerar par de chaves VAPID
  const vapidKeys = webpush.generateVAPIDKeys();
  
  console.log('\n✅ Chaves VAPID geradas com sucesso!');
  console.log('\n📋 Adicione as seguintes variáveis ao seu arquivo .env:');
  console.log('================================================');
  console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  console.log(`VAPID_SUBJECT=mailto:seu-email@exemplo.com`);
  console.log('================================================\n');
  
  // Salvar em arquivo opcional
  const keysData = {
    publicKey: vapidKeys.publicKey,
    privateKey: vapidKeys.privateKey,
    subject: 'mailto:seu-email@exemplo.com',
    generatedAt: new Date().toISOString()
  };
  
  const keysPath = path.join(__dirname, '..', 'vapid-keys.json');
  fs.writeFileSync(keysPath, JSON.stringify(keysData, null, 2));
  
  console.log(`💾 Chaves também salvas em: ${keysPath}`);
  console.log('⚠️  IMPORTANTE: Adicione vapid-keys.json ao .gitignore!');
  console.log('⚠️  IMPORTANTE: Mantenha a chave privada segura!');
}

if (require.main === module) {
  generateVapidKeys();
}

module.exports = { generateVapidKeys };