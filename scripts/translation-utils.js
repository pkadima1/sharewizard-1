// scripts/translation-utils.js
/**
 * This script provides utilities for managing translations
 * 
 * Usage:
 * - To find missing translations: node scripts/translation-utils.js find-missing
 * - To find unused translations: node scripts/translation-utils.js find-unused
 * - To create a new language: node scripts/translation-utils.js create-language es Spanish
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(process.cwd(), 'public', 'locales');
const SOURCE_LANG = 'en'; // Base language

function findMissingTranslations() {
  const sourceDir = path.join(LOCALES_DIR, SOURCE_LANG);
  const sourceFiles = fs.readdirSync(sourceDir);
  
  // Get all language directories
  const langDirs = fs.readdirSync(LOCALES_DIR)
    .filter(dir => dir !== SOURCE_LANG && fs.statSync(path.join(LOCALES_DIR, dir)).isDirectory());
  
  for (const lang of langDirs) {
    console.log(`\nChecking translations for language: ${lang}`);
    const langDir = path.join(LOCALES_DIR, lang);
    
    for (const file of sourceFiles) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(langDir, file);
      
      if (!fs.existsSync(targetPath)) {
        console.log(`  Missing file: ${file}`);
        continue;
      }
      
      const sourceContent = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
      const targetContent = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
      
      const missingKeys = findMissingKeys(sourceContent, targetContent);
      if (missingKeys.length > 0) {
        console.log(`  In ${file}:`);
        missingKeys.forEach(key => console.log(`    - ${key}`));
      }
    }
  }
}

function findMissingKeys(source, target, prefix = '') {
  let missingKeys = [];
  
  for (const key in source) {
    const currentKey = prefix ? `${prefix}.${key}` : key;
    
    if (!(key in target)) {
      missingKeys.push(currentKey);
    } else if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      missingKeys = [...missingKeys, ...findMissingKeys(source[key], target[key], currentKey)];
    }
  }
  
  return missingKeys;
}

function createNewLanguage(langCode, langName) {
  if (!langCode || !langName) {
    console.error('Language code and name are required');
    process.exit(1);
  }
  
  const newLangDir = path.join(LOCALES_DIR, langCode);
  
  if (fs.existsSync(newLangDir)) {
    console.error(`Language directory already exists: ${langCode}`);
    process.exit(1);
  }
  
  // Create directory
  fs.mkdirSync(newLangDir);
  
  // Copy files from source language
  const sourceDir = path.join(LOCALES_DIR, SOURCE_LANG);
  const sourceFiles = fs.readdirSync(sourceDir);
  
  for (const file of sourceFiles) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(newLangDir, file);
    
    // Copy with placeholder markers for translation
    const content = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    const markedContent = addTranslationMarkers(content);
    
    fs.writeFileSync(targetPath, JSON.stringify(markedContent, null, 2), 'utf8');
  }
  
  console.log(`Created new language: ${langCode} (${langName})`);
  console.log(`Files created in: ${newLangDir}`);
  
  // Update LanguageContext to include the new language
  updateLanguageContext(langCode, langName);
}

function addTranslationMarkers(obj) {
  const result = {};
  
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      result[key] = addTranslationMarkers(obj[key]);
    } else if (typeof obj[key] === 'string') {
      // Mark string for translation
      result[key] = `[TRANSLATE] ${obj[key]}`;
    } else {
      result[key] = obj[key];
    }
  }
  
  return result;
}

function updateLanguageContext(langCode, langName) {
  const contextFilePath = path.join(process.cwd(), 'src', 'contexts', 'LanguageContext.tsx');
  
  if (!fs.existsSync(contextFilePath)) {
    console.warn('Could not find LanguageContext.tsx to update');
    return;
  }
  
  let content = fs.readFileSync(contextFilePath, 'utf8');
  
  // Find the defaultLanguages array
  const langArrayRegex = /const defaultLanguages = \[\s*({[\s\S]*?}),?\s*\];/;
  const match = content.match(langArrayRegex);
  
  if (!match) {
    console.warn('Could not find defaultLanguages array in LanguageContext.tsx');
    return;
  }
  
  // Add the new language
  const newLangEntry = `\n  { code: '${langCode}', name: '${langName}' },`;
  const updatedLangArray = content.replace(langArrayRegex, (match) => {
    return match.replace(/\];/, `${newLangEntry}\n];`);
  });
  
  fs.writeFileSync(contextFilePath, updatedLangArray, 'utf8');
  console.log('Updated LanguageContext.tsx with the new language');
}

// Main function
function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'find-missing':
      findMissingTranslations();
      break;
    case 'create-language':
      const langCode = process.argv[3];
      const langName = process.argv[4];
      createNewLanguage(langCode, langName);
      break;
    default:
      console.log(`
Translation Utilities

Commands:
  find-missing      - Find missing translations in all languages
  create-language   - Create a new language with placeholder translations
                      Usage: node translation-utils.js create-language <code> <name>
                      Example: node translation-utils.js create-language es "Spanish"
      `);
      break;
  }
}

main();
