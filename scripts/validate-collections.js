/**
 * Collection Validator
 * 
 * This script validates that all required collections exist in Firestore
 * and creates them with sample data if they don't exist.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  // Your config will be loaded from environment variables or config file
  // This is just a placeholder - do not add actual keys here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Required collections with sample data
const requiredCollections = {
  'users': {
    email: 'sample@example.com',
    displayName: 'Sample User',
    createdAt: new Date()
  },
  'supportChats': {
    userId: 'sample-user-id',
    startedAt: new Date(),
    status: 'active',
    messages: [
      { role: 'user', content: 'Hello, I need help', timestamp: new Date() },
      { role: 'assistant', content: 'Hi there! How can I help?', timestamp: new Date() }
    ]
  },
  'generatedCaptions': {
    userId: 'sample-user-id',
    prompt: 'Sample prompt',
    caption: 'Sample generated caption',
    createdAt: new Date()
  },
  'generatedContent': {
    userId: 'sample-user-id',
    title: 'Sample long-form content',
    content: 'Sample generated long text...',
    createdAt: new Date()
  }
};

// Validate collections
const validateCollections = async () => {
  console.log('Validating Firestore collections...');
  
  for (const [collName, sampleData] of Object.entries(requiredCollections)) {
    try {
      // Check if collection exists and has documents
      const collRef = collection(db, collName);
      const snapshot = await getDocs(collRef);
      
      console.log(`Collection "${collName}": ${snapshot.size} documents`);
      
      // If no documents, add a sample document
      if (snapshot.size === 0) {
        console.log(`  - Creating sample document in "${collName}"...`);
        await addDoc(collRef, {
          ...sampleData,
          isSample: true,
          createdBy: 'collection-validator'
        });
        console.log('  - Sample document created');
      }
    } catch (error) {
      console.error(`Error validating collection "${collName}":`, error);
    }
  }
  
  console.log('Validation complete!');
};

// Run the validation
validateCollections()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
