/**
 * Test script for JSON repair logic in the longform content generation
 * 
 * This script specifically tests the improved JSON repair functionality
 * to ensure Gemini response truncation and malformed JSON is properly handled
 */

import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

dotenv.config();

// Initialize Gemini API with key from .env
const geminiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiKey);

// Mock Gemini responses with varying levels of malformation
const mockResponses = [
  // Truncated JSON (common case)
  `{
    "title": "Digital Marketing Strategies for Small Businesses",
    "sections": [
      {
        "title": "Introduction to Digital Marketing for Small Businesses",
        "focus": "Setting the context and importance of digital marketing for small businesses",
        "keyPoints": [
          "Digital marketing landscape in 2023",
          "Why small businesses need digital marketing",
          "Common challenges and misconceptions"
        ],
        "wordCount": 200
      },
      {
        "title": "Social Media Marketing",
        "focus": "Leveraging social platforms effectively",
        "keyPoints": [
          "Choosing the right platforms",
          "Content strategy for social media",
          "Engagement tactics for small business"
        ],
        "wordCount": 250
      },
      {`,
  
  // Malformed JSON with missing quotes around keys
  `{
    title: "Digital Marketing Strategies for Small Businesses",
    sections: [
      {
        title: "Introduction to Digital Marketing for Small Businesses",
        focus: "Setting the context and importance of digital marketing for small businesses",
        keyPoints: [
          "Digital marketing landscape in 2023",
          "Why small businesses need digital marketing",
          "Common challenges and misconceptions"
        ],
        wordCount: 200
      }
    ]
  }`,
  
  // Mixed quotes (single and double)
  `{
    "title": 'Digital Marketing Strategies for Small Businesses',
    "sections": [
      {
        "title": "Introduction to Digital Marketing for Small Businesses",
        'focus': "Setting the context and importance of digital marketing for small businesses",
        "keyPoints": [
          'Digital marketing landscape in 2023',
          "Why small businesses need digital marketing",
          'Common challenges and misconceptions'
        ],
        'wordCount': 200
      }
    ]
  }`,
  
  // Trailing commas
  `{
    "title": "Digital Marketing Strategies for Small Businesses",
    "sections": [
      {
        "title": "Introduction to Digital Marketing for Small Businesses",
        "focus": "Setting the context and importance of digital marketing for small businesses",
        "keyPoints": [
          "Digital marketing landscape in 2023",
          "Why small businesses need digital marketing",
          "Common challenges and misconceptions",
        ],
        "wordCount": 200,
      },
    ],
  }`,
  
  // JSON with markdown code blocks
  "```json\n" +
  `{
    "title": "Digital Marketing Strategies for Small Businesses",
    "sections": [
      {
        "title": "Introduction to Digital Marketing for Small Businesses",
        "focus": "Setting the context and importance of digital marketing for small businesses",
        "keyPoints": [
          "Digital marketing landscape in 2023",
          "Why small businesses need digital marketing",
          "Common challenges and misconceptions"
        ],
        "wordCount": 200
      }
    ]
  }` +
  "\n```"
];

/**
 * Test function to repair JSON using our implementation
 * Copy of the logic from the actual service
 */
function repairJson(jsonString) {
  // First level cleanup - Remove markdown code blocks if present
  let cleanedResponse = jsonString.trim();
  cleanedResponse = cleanedResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  
  try {
    // Attempt direct parse first
    return JSON.parse(cleanedResponse);
  } catch (parseError) {
    console.log("JSON Parse Error:", parseError.message);
    console.log("Raw response length:", jsonString.length);
    
    // Second level cleanup - Try to extract JSON from response with more aggressive cleanup
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        // Fix common JSON issues
        let fixedJson = jsonMatch[0]
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes to keys
          .replace(/:\s*'([^']*)'/g, ':"$1"') // Replace single quotes with double
          .replace(/,\s*}/g, '}') // Remove trailing commas
          .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
        
        return JSON.parse(fixedJson);
      } catch (secondParseError) {
        console.log("Second parse attempt failed:", secondParseError.message);
      }
    }
    
    // If all JSON parsing fails, return a structured error
    console.log("All JSON repair attempts failed");
    return { error: "Failed to parse JSON", original: cleanedResponse.substring(0, 100) + "..." };
  }
}

/**
 * Run tests on the JSON repair logic with various malformed inputs
 */
async function testJsonRepair() {
  console.log('🧪 Testing JSON Repair Logic\n');
  
  // Test each mock response
  for (let i = 0; i < mockResponses.length; i++) {
    console.log(`\n📝 TEST CASE ${i + 1}:`);
    console.log('📤 Input Type:', getJsonIssueType(i));
    console.log('📝 Input Length:', mockResponses[i].length);
    
    try {
      const result = repairJson(mockResponses[i]);
      console.log('✅ Repair successful!');
      console.log('📥 Result Structure:', Object.keys(result));
      
      if (result.sections) {
        console.log('📊 Sections found:', result.sections.length);
      } else if (result.error) {
        console.log('❌ Repair failed with error:', result.error);
      }
    } catch (error) {
      console.log('❌ Unexpected error during repair:', error.message);
    }
  }
  
  // Now test with actual Gemini API (if key is available)
  if (geminiKey) {
    try {
      console.log('\n📝 LIVE GEMINI API TEST:');
      const result = await testLiveGeminiResponse();
      console.log('📤 Raw Response Length:', result.length);
      
      const repairedJson = repairJson(result);
      console.log('✅ Repair attempt completed');
      console.log('📥 Result Structure:', Object.keys(repairedJson));
      
      if (repairedJson.sections) {
        console.log('📊 Sections found:', repairedJson.sections.length);
      } else if (repairedJson.error) {
        console.log('❌ Repair failed with error:', repairedJson.error);
      }
    } catch (error) {
      console.log('❌ Gemini API test failed:', error.message);
    }
  } else {
    console.log('\n⚠️ Skipping live Gemini API test - No API key found in environment');
  }
}

/**
 * Helper function to get the issue type description
 */
function getJsonIssueType(index) {
  const issues = [
    "Truncated JSON",
    "Missing quotes around keys",
    "Mixed quotes (single and double)",
    "Trailing commas",
    "JSON with markdown code blocks"
  ];
  return issues[index] || "Unknown issue";
}

/**
 * Test with a live Gemini API call
 */
async function testLiveGeminiResponse() {
  // Test prompt that might result in problematic JSON
  const prompt = `Generate a detailed content outline in JSON format for a blog post about "Digital Marketing Strategies for Small Businesses". The outline should have at least 7 sections, each with a title, focus, keyPoints array, and wordCount. Return ONLY valid JSON, nothing else.`;
  
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-001",
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
      maxOutputTokens: 3000,
      responseMimeType: "application/json"
    }
  });
  
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Run the tests
testJsonRepair().catch(console.error);
