#!/usr/bin/env node

// Test script to check edited image persistence in localStorage and database

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('📸 Testing Edited Image Persistence');
console.log('===================================');
console.log('');
console.log('This script will help verify that edited images are being properly saved.');
console.log('');
console.log('Prerequisites:');
console.log('1. Start the dev server: npm run dev');
console.log('2. Open http://localhost:3000 in your browser');
console.log('3. Open browser DevTools (F12) and go to Console tab');
console.log('');

rl.question('Press Enter when ready to continue...', () => {
  console.log('\n📋 Steps to test:');
  console.log('');
  console.log('1. Generate an image:');
  console.log('   - Type: "Generate an image of a sunset over the ocean"');
  console.log('   - Wait for the image to appear in the gallery');
  console.log('');
  console.log('2. Edit the image:');
  console.log('   - Click on the generated image');
  console.log('   - Click the "Edit" button');
  console.log('   - Enter edit prompt: "Add birds flying in the sky"');
  console.log('   - Click "Start Edit"');
  console.log('   - Wait for the edit to complete');
  console.log('');
  console.log('3. Check console logs for:');
  console.log('   ✅ [ImageGallery] Edit completed, adding image: {id: "edited-...", ...}');
  console.log('   ✅ [PAGE] Saving image to database: {id: "edited-...", ...}');
  console.log('   ✅ [SAVE IMAGE] Successfully saved to database: {...}');
  console.log('');
  console.log('4. Check localStorage in DevTools:');
  console.log('   - Go to Application tab → Local Storage → http://localhost:3000');
  console.log('   - Look for "generatedImages" key');
  console.log('   - Click on it and check if your edited image is there');
  console.log('   - Edited images should have "originalImageId" field');
  console.log('');
  console.log('5. Refresh the page:');
  console.log('   - Press F5 to refresh');
  console.log('   - Check if the edited image is still in the gallery');
  console.log('   - If not, check console for any errors');
  console.log('');
  console.log('6. Check for duplicate prevention:');
  console.log('   - In console, run: JSON.parse(localStorage.getItem("generatedImages")).map(img => img.id)');
  console.log('   - Make sure there are no duplicate IDs');
  console.log('');

  rl.question('\nPress Enter to see debugging commands...', () => {
    console.log('\n🔍 Debugging Commands (run in browser console):');
    console.log('');
    console.log('// Check all saved images');
    console.log('JSON.parse(localStorage.getItem("generatedImages"))');
    console.log('');
    console.log('// Check edited images only');
    console.log('JSON.parse(localStorage.getItem("generatedImages")).filter(img => img.originalImageId)');
    console.log('');
    console.log('// Check savedImageIdsRef (need to add debug logging)');
    console.log('// Add this to page.tsx temporarily:');
    console.log('window.debugSavedImageIds = savedImageIdsRef.current');
    console.log('// Then check: window.debugSavedImageIds');
    console.log('');
    console.log('// Clear localStorage (if needed for fresh test)');
    console.log('localStorage.removeItem("generatedImages")');
    console.log('');
    console.log('// Check if persistence is configured');
    console.log('fetch("/api/check-persistence").then(r => r.json()).then(console.log)');
    console.log('');

    rl.question('\nPress Enter to see potential fixes...', () => {
      console.log('\n🛠️ Potential Issues and Fixes:');
      console.log('');
      console.log('1. If edited images disappear on refresh:');
      console.log('   - savedImageIdsRef might include edited image IDs');
      console.log('   - Database save might be failing');
      console.log('   - LocalStorage might not be persisting');
      console.log('');
      console.log('2. If edited images show as generating forever:');
      console.log('   - Image progress store might not be completing');
      console.log('   - isGenerating flag might be stuck as true');
      console.log('');
      console.log('3. If console shows "Failed to save image":');
      console.log('   - Check network tab for API errors');
      console.log('   - Verify database configuration');
      console.log('   - Check blob storage permissions');
      console.log('');

      console.log('\n✅ Test complete!');
      rl.close();
    });
  });
});