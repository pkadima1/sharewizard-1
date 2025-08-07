#!/usr/bin/env node

/**
 * Linting Issues Fix Script
 * 
 * Root Causes Identified:
 * 1. Quote Style Issues: Mixed single and double quotes
 * 2. Indentation Issues: Inconsistent spacing (2 vs 4 spaces)
 * 3. TypeScript 'any' Type Issues: Excessive use of 'any' type
 * 4. Unused Variables: Unused parameters and variables
 * 
 * Security Risks Addressed:
 * - Inconsistent string handling can lead to injection vulnerabilities
 * - Poor code readability can hide security issues
 * - 'any' types bypass TypeScript's type safety
 * - Unused code can contain sensitive information
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Common patterns to fix
const patterns = [
  // Fix single quotes to double quotes
  { regex: /'/g, replacement: '"' },
  
  // Fix indentation (convert 4 spaces to 2 spaces)
  { regex: /^    /gm, replacement: '  ' },
  
  // Fix 'any' types to proper types
  { regex: /: any/g, replacement: ': unknown' },
  { regex: /: any\[/g, replacement: ': unknown[' },
  { regex: /: any\)/g, replacement: ': unknown)' },
  
  // Fix unused variable patterns
  { regex: /\/\/ eslint-disable-next-line @typescript-eslint\/no-unused-vars\n/g, replacement: '' },
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Apply patterns
    patterns.forEach(pattern => {
      content = content.replace(pattern.regex, pattern.replacement);
    });
    
    // Fix specific TypeScript issues
    content = content.replace(/error\.message/g, '(error as Error).message');
    content = content.replace(/error\.response/g, '(error as any).response');
    content = content.replace(/error\.code/g, '(error as any).code');
    
    // Fix string literals in console.log
    content = content.replace(/console\.log\('([^']*)'\)/g, 'console.log("$1")');
    content = content.replace(/console\.error\('([^']*)'\)/g, 'console.error("$1")');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function walkDir(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...walkDir(fullPath));
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function main() {
  console.log('🔧 Starting linting issues fix...\n');
  
  const functionsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'functions', 'src');
  const files = walkDir(functionsDir);
  
  let fixedCount = 0;
  
  for (const file of files) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`- Files processed: ${files.length}`);
  console.log(`- Files fixed: ${fixedCount}`);
  console.log(`- Files unchanged: ${files.length - fixedCount}`);
  
  if (fixedCount > 0) {
    console.log('\n✅ Linting issues fixed successfully!');
    console.log('💡 Run "npm run lint" to verify the fixes.');
  } else {
    console.log('\nℹ️  No files needed fixing.');
  }
}

// ES module equivalent
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { fixFile, walkDir }; 