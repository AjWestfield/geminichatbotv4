// Debug script to check edited image save process
// Run this in browser console while editing an image

console.log('🔍 Debugging Edited Image Save Process');
console.log('=====================================\n');

// Hook into fetch to monitor API calls
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const [url, options] = args;
  
  // Monitor image save requests
  if (url === '/api/images' && options?.method === 'POST') {
    console.log('📤 Image Save Request:', {
      url,
      body: JSON.parse(options.body)
    });
    
    try {
      const response = await originalFetch.apply(this, args);
      const clone = response.clone();
      const data = await clone.json();
      
      console.log('📥 Image Save Response:', {
        status: response.status,
        data
      });
      
      return response;
    } catch (error) {
      console.error('❌ Image Save Error:', error);
      throw error;
    }
  }
  
  // Monitor edit image requests
  if (url === '/api/edit-image' && options?.method === 'POST') {
    console.log('🎨 Edit Image Request:', {
      url,
      body: JSON.parse(options.body)
    });
    
    try {
      const response = await originalFetch.apply(this, args);
      const clone = response.clone();
      const data = await clone.json();
      
      console.log('🎨 Edit Image Response:', {
        status: response.status,
        hasDataUrl: data.images?.[0]?.url?.startsWith('data:'),
        imageCount: data.images?.length
      });
      
      return response;
    } catch (error) {
      console.error('❌ Edit Image Error:', error);
      throw error;
    }
  }
  
  return originalFetch.apply(this, args);
};

console.log('✅ Debug hooks installed!');
console.log('');
console.log('Now edit an image and watch for:');
console.log('1. 🎨 Edit Image Request/Response');
console.log('2. 📤 Image Save Request');
console.log('3. 📥 Image Save Response');
console.log('');
console.log('Look for any errors or unexpected data.');

// Also monitor console logs
const originalLog = console.log;
console.log = function(...args) {
  if (args[0]?.includes?.('[PAGE]') || args[0]?.includes?.('[SAVE IMAGE]')) {
    originalLog.apply(console, ['🔍', ...args]);
  } else {
    originalLog.apply(console, args);
  }
};

// Check current state
setTimeout(() => {
  const images = JSON.parse(localStorage.getItem('generatedImages') || '[]');
  const edited = images.filter(img => img.originalImageId);
  console.log(`\n📊 Current State: ${images.length} total images, ${edited.length} edited`);
  if (edited.length > 0) {
    console.table(edited.map(img => ({
      id: img.id,
      originalId: img.originalImageId,
      hasUrl: !!img.url,
      urlType: img.url?.substring(0, 10)
    })));
  }
}, 1000);