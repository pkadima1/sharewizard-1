/**
 * Script pour ajouter des données de test étape par étape
 * Ce script va créer des données réalistes pour le dashboard partenaire
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Configuration Firebase (utilise les variables d'environnement)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "engperfecthlc.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "engperfecthlc",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "engperfecthlc.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

console.log('🚀 Démarrage de l\'ajout des données de test...\n');

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// UID de l'utilisateur partenaire (remplacez par le vrai UID)
const PARTNER_UID = 'user-123'; // ⚠️ REMPLACEZ PAR LE VRAI UID DE L'UTILISATEUR CONNECTÉ

console.log(`📋 UID du partenaire: ${PARTNER_UID}`);

// Fonction pour ajouter un document avec gestion d'erreur
async function addDocument(collectionName, data) {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    console.log(`✅ ${collectionName}: Document ajouté avec ID ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error(`❌ Erreur ${collectionName}:`, error.message);
    return null;
  }
}

// Fonction principale
async function addTestData() {
  console.log('📊 ÉTAPE 1: Création du profil partenaire...');
  
  // 1. Créer le profil partenaire
  const partnerData = {
    uid: PARTNER_UID,
    displayName: 'Pzt Partner',
    email: 'pzt@example.com',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  const partnerId = await addDocument('partners', partnerData);
  
  console.log('\n📊 ÉTAPE 2: Création des codes de parrainage...');
  
  // 2. Créer des codes de parrainage
  const referralCodes = [
    { code: 'PZT2024', description: 'Code principal 2024' },
    { code: 'PZTSPECIAL', description: 'Code spécial' },
    { code: 'PZTBONUS', description: 'Code bonus' }
  ];
  
  const codeIds = [];
  for (const codeData of referralCodes) {
    const codeDoc = {
      partnerId: PARTNER_UID,
      code: codeData.code,
      description: codeData.description,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const codeId = await addDocument('partnerCodes', codeDoc);
    if (codeId) codeIds.push(codeId);
  }
  
  console.log('\n📊 ÉTAPE 3: Création des clients parrainés...');
  
  // 3. Créer des clients parrainés
  const customers = [
    { email: 'client1@example.com', name: 'Jean Dupont', code: 'PZT2024' },
    { email: 'client2@example.com', name: 'Marie Martin', code: 'PZT2024' },
    { email: 'client3@example.com', name: 'Pierre Durand', code: 'PZTSPECIAL' },
    { email: 'client4@example.com', name: 'Sophie Bernard', code: 'PZTBONUS' },
    { email: 'client5@example.com', name: 'Lucas Moreau', code: 'PZT2024' }
  ];
  
  const customerIds = [];
  for (const customer of customers) {
    const customerDoc = {
      partnerId: PARTNER_UID,
      customerEmail: customer.email,
      customerName: customer.name,
      referralCode: customer.code,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const customerId = await addDocument('referralCustomers', customerDoc);
    if (customerId) customerIds.push(customerId);
  }
  
  console.log('\n📊 ÉTAPE 4: Création des commissions...');
  
  // 4. Créer des entrées de commission
  const commissions = [
    { amount: 25.50, description: 'Commission client PZT2024 - Jean Dupont' },
    { amount: 32.00, description: 'Commission client PZT2024 - Marie Martin' },
    { amount: 18.75, description: 'Commission client PZTSPECIAL - Pierre Durand' },
    { amount: 45.00, description: 'Commission client PZTBONUS - Sophie Bernard' },
    { amount: 28.50, description: 'Commission client PZT2024 - Lucas Moreau' },
    { amount: 22.00, description: 'Commission bonus mensuelle' },
    { amount: 15.75, description: 'Commission client PZT2024 - Nouveau client' }
  ];
  
  const commissionIds = [];
  for (const commission of commissions) {
    const commissionDoc = {
      partnerId: PARTNER_UID,
      amount: commission.amount,
      description: commission.description,
      status: 'credited',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const commissionId = await addDocument('commissionLedger', commissionDoc);
    if (commissionId) commissionIds.push(commissionId);
  }
  
  console.log('\n📊 ÉTAPE 5: Création des factures...');
  
  // 5. Créer des factures
  const invoices = [
    { amount: 150.00, period: 'Novembre 2024', status: 'paid' },
    { amount: 175.50, period: 'Décembre 2024', status: 'pending' },
    { amount: 125.25, period: 'Octobre 2024', status: 'paid' }
  ];
  
  const invoiceIds = [];
  for (const invoice of invoices) {
    const invoiceDoc = {
      partnerId: PARTNER_UID,
      amount: invoice.amount,
      period: invoice.period,
      status: invoice.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const invoiceId = await addDocument('invoices', invoiceDoc);
    if (invoiceId) invoiceIds.push(invoiceId);
  }
  
  console.log('\n🎉 RÉSUMÉ DES DONNÉES AJOUTÉES:');
  console.log(`✅ Profil partenaire: ${partnerId ? 'Créé' : 'Erreur'}`);
  console.log(`✅ Codes de parrainage: ${codeIds.length}/3 créés`);
  console.log(`✅ Clients parrainés: ${customerIds.length}/5 créés`);
  console.log(`✅ Commissions: ${commissionIds.length}/7 créées`);
  console.log(`✅ Factures: ${invoiceIds.length}/3 créées`);
  
  console.log('\n📊 MÉTRIQUES ATTENDUES:');
  console.log(`💰 Commissions totales: $${commissions.reduce((sum, c) => sum + c.amount, 0).toFixed(2)}`);
  console.log(`👥 Clients actifs: ${customers.length}`);
  console.log(`📄 Factures: ${invoices.length}`);
  
  console.log('\n🎯 PROCHAINES ÉTAPES:');
  console.log('1. Vérifiez le dashboard sur http://localhost:8082/en/partner/dashboard');
  console.log('2. Les métriques devraient maintenant afficher des valeurs réelles');
  console.log('3. Testez tous les onglets du dashboard');
}

// Exécuter le script
addTestData().catch(console.error);
