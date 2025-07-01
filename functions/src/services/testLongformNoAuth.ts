/**
 * Test the actual longform function by temporarily bypassing authentication
 * This will help us identify if the issue is with Gemini or elsewhere
 */

import { onCall } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { getOpenAIKey, getGeminiKey } from "../config/secrets.js";
import { initializeFirebaseAdmin } from "../config/firebase-admin.js";

// Initialize Firebase Admin
initializeFirebaseAdmin();

export const testLongformNoAuth = onCall({
  cors: ["localhost:5173", "localhost:5174"],
  timeoutSeconds: 180,
  memory: "256MiB",
  region: "us-central1"
}, async (request) => {
  try {
    console.log("[TEST] Starting longform test without auth");
    
    const data = request.data;
    console.log("[TEST] Input data:", JSON.stringify(data, null, 2));
    
    // Initialize AI services
    const geminiKey = getGeminiKey();
    const openaiKey = getOpenAIKey();
    
    const genAI = new GoogleGenerativeAI(geminiKey);
    const openai = new OpenAI({ apiKey: openaiKey });
    
    console.log("[TEST] AI services initialized");
    
    // Test Gemini with a simplified version of the actual prompt
    const simplifiedPrompt = `Create a content outline for:
Topic: "${data.topic}"
Audience: ${data.audience}
Industry: ${data.industry}
Word Count: ${data.wordCount}

Return a JSON object with this structure:
{
  "meta": {
    "estimatedReadingTime": "5 minutes",
    "primaryEmotion": "informative"
  },
  "sections": [
    {
      "title": "Introduction",
      "wordCount": 200,
      "keyPoints": ["Point 1", "Point 2"]
    },
    {
      "title": "Main Content",
      "wordCount": 400,
      "keyPoints": ["Point 1", "Point 2"]
    }
  ]
}`;

    console.log("[TEST] Calling Gemini with simplified prompt...");
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-001",
      generationConfig: {
        temperature: 0.6,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 2000,
        responseMimeType: "application/json"
      }
    });
    
    const result = await model.generateContent(simplifiedPrompt);
    const response = result.response.text();
    
    console.log("[TEST] Gemini response:", response);
    
    // Parse JSON
    let outline;
    try {
      outline = JSON.parse(response);
      console.log("[TEST] Outline parsed successfully");
    } catch (parseError) {
      console.error("[TEST] JSON parsing failed:", parseError);
      throw new Error(`Outline parsing failed: ${(parseError as Error).message}`);
    }
    
    // Test a simple OpenAI call
    console.log("[TEST] Testing OpenAI with simple prompt...");
    
    const openaiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful content writer."
        },
        {
          role: "user",
          content: `Write a brief 100-word introduction for: ${data.topic}`
        }
      ],
      temperature: 0.8,
      max_tokens: 200
    });
    
    const content = openaiResponse.choices[0]?.message?.content;
    console.log("[TEST] OpenAI response:", content);
    
    return {
      success: true,
      outline: outline,
      sampleContent: content,
      message: "Both AI services working correctly!"
    };
    
  } catch (error) {
    console.error("[TEST] Error in longform test:", error);
    
    const err = error as any;
    return {
      success: false,
      error: err.message || err.toString(),
      errorCode: err.code || 'unknown',
      stack: err.stack,
      message: "Longform test failed - check logs"
    };
  }
});
