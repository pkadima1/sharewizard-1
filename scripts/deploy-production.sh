#!/bin/bash

# 🚀 Production Deployment Script for ShareWizard
# Enhanced Error Recovery System Deployment

echo "🚀 Starting Production Deployment..."

# Step 1: Navigate to functions directory
echo "📁 Navigating to functions directory..."
cd functions

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 3: Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Aborting deployment."
    exit 1
fi

# Step 4: Run linting
echo "🔍 Running linting..."
npm run lint

# Step 5: Deploy to production
echo "🚀 Deploying to production..."
npm run deploy

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🎉 Enhanced Error Recovery System deployed successfully!"
    echo ""
    echo "📊 Expected Improvements:"
    echo "   • Generation time: Reduced from 92s to ~60s"
    echo "   • Retry attempts: Reduced from 6 to 2 maximum"
    echo "   • Error recovery: Immediate fallback on API overload"
    echo "   • French localization: Complete error message support"
    echo ""
    echo "🔍 Monitor logs with: firebase functions:log"
    echo "📈 Check performance metrics in Firebase Console"
else
    echo "❌ Deployment failed!"
    exit 1
fi 