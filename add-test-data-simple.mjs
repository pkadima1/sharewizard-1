/**
 * Script simple pour ajouter des données de test
 * Utilise l'authentification Firebase pour obtenir l'UID réel
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

console.log('🚀 Démarrage de l\'ajout des données de test...\n');

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // ⚠️ REMPLACEZ PAR VOTRE VRAIE CLÉ
  authDomain: "engperfecthlc.firebaseapp.com",
  projectId: "engperfecthlc",
  storageBucket: "engperfecthlc.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Fonction pour ajouter un document
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
  try {
    console.log('🔐 ÉTAPE 1: Authentification...');
    
    // S'authentifier de manière anonyme pour obtenir un UID
    const userCredential = await signInAnonymously(auth);
    const PARTNER_UID = userCredential.user.uid;
    
    console.log(`✅ Authentifié avec UID: ${PARTNER_UID}`);
    
    console.log('\n📊 ÉTAPE 2: Création du profil partenaire...');
    
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
    
    console.log('\n📊 ÉTAPE 3: Création des codes de parrainage...');
    
    // 2. Créer des codes de parrainage
    const referralCodes = [
      { code: 'PZT2024', description: 'Code principal 2024' },
      { code: 'PZTSPECIAL', description: 'Code spécial' },
      { code: 'PZTBONUS', description: 'Code bonus' }
    ];
    
    for (const codeData of referralCodes) {
      const codeDoc = {
        partnerId: PARTNER_UID,
        code: codeData.code,
        description: codeData.description,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await addDocument('partnerCodes', codeDoc);
    }
    
    console.log('\n📊 ÉTAPE 4: Création des clients parrainés...');
    
    // 3. Créer des clients parrainés
    const customers = [
      { email: 'client1@example.com', name: 'Jean Dupont', code: 'PZT2024' },
      { email: 'client2@example.com', name: 'Marie Martin', code: 'PZT2024' },
      { email: 'client3@example.com', name: 'Pierre Durand', code: 'PZTSPECIAL' },
      { email: 'client4@example.com', name: 'Sophie Bernard', code: 'PZTBONUS' },
      { email: 'client5@example.com', name: 'Lucas Moreau', code: 'PZT2024' }
    ];
    
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
      await addDocument('referralCustomers', customerDoc);
    }
    
    console.log('\n📊 ÉTAPE 5: Création des commissions...');
    
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
    
    for (const commission of commissions) {
      const commissionDoc = {
        partnerId: PARTNER_UID,
        amount: commission.amount,
        description: commission.description,
        status: 'credited',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await addDocument('commissionLedger', commissionDoc);
    }
    
    console.log('\n📊 ÉTAPE 6: Création des factures...');
    
    // 5. Créer des factures
    const invoices = [
      { amount: 150.00, period: 'Novembre 2024', status: 'paid' },
      { amount: 175.50, period: 'Décembre 2024', status: 'pending' },
      { amount: 125.25, period: 'Octobre 2024', status: 'paid' }
    ];
    
    for (const invoice of invoices) {
      const invoiceDoc = {
        partnerId: PARTNER_UID,
        amount: invoice.amount,
        period: invoice.period,
        status: invoice.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await addDocument('invoices', invoiceDoc);
    }
    
    console.log('\n🎉 DONNÉES DE TEST AJOUTÉES AVEC SUCCÈS !');
    console.log(`📊 UID du partenaire: ${PARTNER_UID}`);
    console.log(`💰 Commissions totales: $${commissions.reduce((sum, c) => sum + c.amount, 0).toFixed(2)}`);
    console.log(`👥 Clients parrainés: ${customers.length}`);
    console.log(`📄 Factures: ${invoices.length}`);
    
    console.log('\n🎯 PROCHAINES ÉTAPES:');
    console.log('1. Ouvrez le dashboard sur http://localhost:8082/en/partner/dashboard');
    console.log('2. Connectez-vous avec le même compte');
    console.log('3. Les métriques devraient maintenant afficher des valeurs réelles !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des données:', error.message);
    console.log('\n💡 SOLUTIONS POSSIBLES:');
    console.log('1. Vérifiez que les clés Firebase sont correctes');
    console.log('2. Assurez-vous que le projet Firebase est accessible');
    console.log('3. Vérifiez les règles Firestore dans la console Firebase');
  }
}

// Exécuter le script
addTestData();




