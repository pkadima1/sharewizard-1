/**
 * Temporary test function to isolate Gemini API issues
 * This bypasses authentication to focus on the core Gemini problem
 */

import { onCall } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiKey } from "../config/secrets.js";

export const testGeminiOnly = onCall({
  cors: ["localhost:5173", "localhost:5174"],
  timeoutSeconds: 180,
  memory: "256MiB",
  region: "us-central1"
}, async (request) => {
  try {
    console.log("[TEST] Starting Gemini-only test");
    
    // Initialize Gemini
    const geminiKey = getGeminiKey();
    console.log("[TEST] Gemini key loaded:", geminiKey ? "✅" : "❌");
    
    const genAI = new GoogleGenerativeAI(geminiKey);
    console.log("[TEST] GoogleGenerativeAI initialized");
    
    // Simple test
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-001",
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1000,
        responseMimeType: "application/json"
      }
    });
    
    console.log("[TEST] Model created successfully");
    
    // Very simple prompt
    const prompt = `Generate a simple JSON object with the following structure:
{
  "title": "Test Content Outline",
  "sections": [
    {
      "title": "Introduction",
      "wordCount": 200
    },
    {
      "title": "Main Content", 
      "wordCount": 400
    }
  ]
}`;
    
    console.log("[TEST] Calling Gemini with simple prompt...");
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    console.log("[TEST] Gemini response received:", response);
    
    // Try to parse JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
      console.log("[TEST] JSON parsing successful");
    } catch (parseError) {
      console.error("[TEST] JSON parsing failed:", parseError);
      console.error("[TEST] Raw response:", response);
      throw new Error(`JSON parsing failed: ${(parseError as Error).message}`);
    }
    
    return {
      success: true,
      geminiResponse: parsedResponse,
      rawResponse: response,
      message: "Gemini test successful!"
    };
    
  } catch (error) {
    console.error("[TEST] Gemini test failed:", error);
    
    const err = error as any;
    return {
      success: false,
      error: err.message || err.toString(),
      errorCode: err.code || 'unknown',
      errorDetails: err.details || err.toString(),
      message: "Gemini test failed - check logs for details"
    };
  }
});
