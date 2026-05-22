// Firebase Cloud Function — Notificação Diária SPFC às 8h
// Salve em: functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// ── CLOUD FUNCTION: Envia todo dia às 8h BRT ────
exports.dailySPFCNotification = functions.pubsub
  .schedule('0 11 * * *')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {

    try {
      const tokensSnap = await admin.firestore().collection('tokens').get();

      if (tokensSnap.empty) {
        console.log('Nenhum token encontrado');
        return null;
      }

      const tokens = [];
      const batch = admin.firestore().batch();

      tokensSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.token) {
          tokens.push(data.token);
        } else {
          batch.delete(doc.ref);
        }
      });

      if (tokens.length === 0) {
        console.log('Nenhum token válido');
        return null;
      }

      const message = {
        notification: {
          title: '🔴 São Paulo FC',
          body: 'Bom dia! Você sabe o que aconteceu no SPFC no dia de hoje?'
        },
        data: {
          url: '/',
          click_action: '/'
        },
        tokens: tokens
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      console.log('Enviado: ' + response.successCount + ' sucesso, ' + response.failureCount + ' falhas');

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const error = resp.error;
          if (error && (error.code === 'messaging/invalid-registration-token' ||
                        error.code === 'messaging/registration-token-not-registered')) {
            const tokenId = Buffer.from(tokens[idx]).toString('base64').slice(0, 20).replace(/[^a-zA-Z0-9]/g, '');
            batch.delete(admin.firestore().collection('tokens').doc(tokenId));
          }
        }
      });

      await batch.commit();
      return null;

    } catch (error) {
      console.error('Erro ao enviar notificações:', error);
      return null;
    }
  });

// ── CLOUD FUNCTION: Teste ───────────────────────
exports.testNotification = functions.https.onCall(async (data, context) => {
  const token = data.token;
  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'Token necessário');
  }

  try {
    await admin.messaging().send({
      token: token,
      notification: {
        title: '🔴 São Paulo FC',
        body: 'Bom dia! Você sabe o que aconteceu no SPFC no dia de hoje?'
      },
      data: { url: '/' }
    });
    return { success: true };
  } catch (error) {
    console.error('Erro no teste:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Deploy test - v1.1.1.1
// Deploy test - forçando workflow
