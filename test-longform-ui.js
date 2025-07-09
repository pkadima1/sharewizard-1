/**
 * Frontend Test Script for Longform Content Generation
 * 
 * This script tests the progress indicator and error handling in the UI.
 * It simulates different scenarios to verify our fixes.
 */

import puppeteer from 'puppeteer';

async function testLongformUI() {
  console.log('🧪 Starting UI test for longform content generation...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 1. Log in to the application
    await page.goto('http://localhost:5173/login');
    console.log('📝 Logging in...');
    
    // Fill in login credentials - you'll need to replace these with valid test credentials
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForNavigation();
    console.log('✅ Login successful');
    
    // 2. Navigate to the longform wizard
    await page.goto('http://localhost:5173/create/longform');
    console.log('📝 Navigating to longform wizard...');
    
    // 3. Fill out the form steps - this will depend on your actual UI
    // Step 1: Topic
    await page.waitForSelector('input[placeholder*="topic"]', { timeout: 10000 });
    await page.type('input[placeholder*="topic"]', 'Digital Marketing Strategies for Small Businesses');
    await page.click('button:has-text("Next")');
    console.log('✅ Step 1 completed');
    
    // Step 2: Audience & Industry
    await page.waitForTimeout(1000);
    await page.type('input[placeholder*="audience"]', 'small business owners');
    await page.type('input[placeholder*="industry"]', 'digital marketing');
    await page.click('button:has-text("Next")');
    console.log('✅ Step 2 completed');
    
    // Step 3: Content Focus
    await page.waitForTimeout(1000);
    await page.type('input[placeholder*="keyword"]', 'digital marketing');
    await page.keyboard.press('Enter');
    await page.type('input[placeholder*="keyword"]', 'small business');
    await page.keyboard.press('Enter');
    await page.type('input[placeholder*="title"]', '10 Proven Digital Marketing Strategies Every Small Business Owner Should Know');
    await page.click('button:has-text("Next")');
    console.log('✅ Step 3 completed');
    
    // Step 4: Structure & Tone
    await page.waitForTimeout(1000);
    await page.click('div[role="radiogroup"] div:has-text("Introduction, Key Points, Call-to-Action")');
    await page.click('div[role="radiogroup"] div:has-text("Professional")');
    await page.click('button:has-text("Next")');
    console.log('✅ Step 4 completed');
    
    // Step 5: Settings
    await page.waitForTimeout(1000);
    await page.click('div[role="radiogroup"] div:has-text("Markdown")');
    await page.click('button:has-text("Next")');
    console.log('✅ Step 5 completed');
    
    // 4. On Review & Generate page, click Generate
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Generate Content")');
    console.log('📝 Starting content generation...');
    
    // 5. Watch for progress updates and take screenshots
    await page.waitForSelector('.progress-bar', { timeout: 60000 });
    
    // Monitor progress
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(3000);
      
      // Take a screenshot of the progress
      await page.screenshot({ path: `progress-${i}.png` });
      
      // Get the current progress percentage
      const progressText = await page.$eval('.progress-percentage', el => el.textContent);
      console.log(`📊 Current progress: ${progressText}`);
      
      // Check if generation is complete
      const isComplete = await page.evaluate(() => {
        return document.querySelector('.progress-bar[data-complete="true"]') !== null;
      });
      
      if (isComplete) {
        console.log('✅ Generation completed successfully!');
        break;
      }
    }
    
    // 6. Verify the result
    const hasError = await page.evaluate(() => {
      return document.querySelector('.error-message') !== null;
    });
    
    if (hasError) {
      const errorMessage = await page.$eval('.error-message', el => el.textContent);
      console.log(`❌ Error encountered: ${errorMessage}`);
    } else {
      console.log('✅ No errors detected');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'final-result.png' });
    
    console.log('🧪 UI test completed');
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'error.png' });
  } finally {
    await browser.close();
  }
}

testLongformUI().catch(console.error);
