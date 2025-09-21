// firebase-admin.js
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://undergraduation-admin-crm-default-rtdb.firebaseio.com/`
});

const db = admin.firestore();

module.exports = { admin, db };