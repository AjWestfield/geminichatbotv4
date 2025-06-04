// Fix for localStorage quota exceeded error
// Run this in the browser console if you're getting quota errors

console.log('🧹 Cleaning up localStorage to fix quota errors...\n');

// Get current images
const images = JSON.parse(localStorage.getItem('generatedImages') || '[]');
console.log(`Found ${images.length} images in localStorage`);

// Count data URLs
const dataUrlImages = images.filter(img => img.url && img.url.startsWith('data:'));
console.log(`Found ${dataUrlImages.length} images with data URLs (these are causing the issue)`);

// Calculate current size
const currentSize = new Blob([JSON.stringify(images)]).size;
console.log(`Current localStorage size: ${(currentSize / 1024 / 1024).toFixed(2)} MB`);

// Remove data URLs
const cleanedImages = images.map(img => ({
  ...img,
  url: img.url && img.url.startsWith('data:') ? '[DATA_URL_REMOVED]' : img.url
}));

// Filter out images with removed URLs
const finalImages = cleanedImages.filter(img => img.url !== '[DATA_URL_REMOVED]');
console.log(`\nAfter cleanup: ${finalImages.length} images will remain`);

// Calculate new size
const newSize = new Blob([JSON.stringify(finalImages)]).size;
console.log(`New localStorage size: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`Space saved: ${((currentSize - newSize) / 1024 / 1024).toFixed(2)} MB`);

// Save cleaned data
try {
  localStorage.setItem('generatedImages', JSON.stringify(finalImages));
  console.log('\n✅ Successfully cleaned localStorage!');
  console.log('   Removed all data URLs to free up space.');
  console.log('   Your blob URLs are preserved.');
  
  // Also clear any other large items
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key !== 'generatedImages') {
      const value = localStorage.getItem(key);
      const size = new Blob([value]).size;
      if (size > 100000) { // 100KB
        console.log(`\n⚠️  Found large item: ${key} (${(size / 1024).toFixed(0)} KB)`);
      }
    }
  });
  
  console.log('\n💡 Tip: Refresh the page to see the cleaned gallery.');
  console.log('   Images stored in the database will reload automatically.');
  
} catch (error) {
  console.error('\n❌ Failed to clean localStorage:', error);
  console.log('   You may need to clear all localStorage data:');
  console.log('   localStorage.clear()');
}