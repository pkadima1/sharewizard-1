// Quick test to verify word abbreviation translations
const fs = require('fs');

// Load English translations
const enTranslations = JSON.parse(fs.readFileSync('./public/locales/en/longform.json', 'utf8'));
console.log('English word abbreviation:', enTranslations.step4.preview.wordsShort);

// Load French translations
const frTranslations = JSON.parse(fs.readFileSync('./public/locales/fr/longform.json', 'utf8'));
console.log('French word abbreviation:', frTranslations.step4.preview.wordsShort);

// Test with sample data
console.log('\nSample output:');
console.log(`English: 150 ${enTranslations.step4.preview.wordsShort}`);
console.log(`French: 150 ${frTranslations.step4.preview.wordsShort}`);
