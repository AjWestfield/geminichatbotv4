// Debug script for image deletion
// Run this in browser console to monitor deletion process

console.log('🔍 Image Deletion Debugger Active');
console.log('=================================\n');

// Hook into fetch to monitor DELETE requests
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const [url, options] = args;
  
  // Monitor DELETE requests to /api/images/
  if (url.includes('/api/images/') && options?.method === 'DELETE') {
    const imageId = url.split('/').pop();
    console.log('🗑️  DELETE Request:', {
      url,
      imageId,
      timestamp: new Date().toISOString()
    });
    
    try {
      const response = await originalFetch.apply(this, args);
      const clone = response.clone();
      const data = await clone.json();
      
      if (response.ok) {
        console.log('✅ DELETE Success:', {
          imageId,
          response: data
        });
      } else {
        console.error('❌ DELETE Failed:', {
          imageId,
          status: response.status,
          error: data
        });
      }
      
      return response;
    } catch (error) {
      console.error('❌ DELETE Error:', error);
      throw error;
    }
  }
  
  return originalFetch.apply(this, args);
};

// Monitor console logs for deletion
const originalLog = console.log;
const originalError = console.error;

console.log = function(...args) {
  if (args[0]?.includes?.('[DELETE IMAGE]') || 
      args[0]?.includes?.('[ImageGallery] Deleting') ||
      args[0]?.includes?.('[PAGE] Removing deleted')) {
    originalLog.apply(console, ['🔍 DELETE LOG:', ...args]);
  } else {
    originalLog.apply(console, args);
  }
};

console.error = function(...args) {
  if (args[0]?.includes?.('delete') || args[0]?.includes?.('DELETE')) {
    originalError.apply(console, ['🔍 DELETE ERROR:', ...args]);
  } else {
    originalError.apply(console, args);
  }
};

// Helper functions
window.debugDelete = {
  // Check current images
  checkImages: () => {
    const stored = JSON.parse(localStorage.getItem('generatedImages') || '[]');
    console.table(stored.map(img => ({
      id: img.id,
      prompt: img.prompt?.substring(0, 30) + '...',
      hasOriginalId: !!img.originalImageId,
      urlType: img.url?.substring(0, 10)
    })));
    return stored;
  },
  
  // Check database images
  checkDatabase: async () => {
    const response = await fetch('/api/images');
    const data = await response.json();
    console.log('Database images:', data.images.length);
    console.table(data.images.map(img => ({
      dbId: img.id.substring(0, 8) + '...',
      localId: img.metadata?.localId,
      prompt: img.prompt?.substring(0, 30) + '...'
    })));
    return data.images;
  },
  
  // Test delete by ID
  testDelete: async (imageId) => {
    console.log(`Testing delete for: ${imageId}`);
    const response = await fetch(`/api/images/${imageId}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    console.log('Delete result:', result);
    return result;
  },
  
  // Find image by prompt
  findByPrompt: async (promptPart) => {
    const images = await window.debugDelete.checkDatabase();
    return images.filter(img => 
      img.prompt?.toLowerCase().includes(promptPart.toLowerCase())
    );
  }
};

console.log('✅ Deletion debugger ready!');
console.log('');
console.log('Available commands:');
console.log('- window.debugDelete.checkImages() - Check localStorage images');
console.log('- window.debugDelete.checkDatabase() - Check database images');
console.log('- window.debugDelete.testDelete(imageId) - Test delete an image');
console.log('- window.debugDelete.findByPrompt("apple") - Find images by prompt');
console.log('');
console.log('Now try deleting an image and watch the logs!');