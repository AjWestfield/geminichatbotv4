// Diagnostic script for edited image persistence
// Run this in browser console to check current state

console.log('🔍 Diagnosing Edited Image Persistence');
console.log('=====================================\n');

// Check localStorage
console.log('1. Checking localStorage...');
const localImages = JSON.parse(localStorage.getItem('generatedImages') || '[]');
console.log(`   Total images in localStorage: ${localImages.length}`);
const localEdited = localImages.filter(img => img.originalImageId);
console.log(`   Edited images in localStorage: ${localEdited.length}`);
if (localEdited.length > 0) {
  console.log('   Sample edited image:', {
    id: localEdited[0].id,
    originalImageId: localEdited[0].originalImageId,
    prompt: localEdited[0].prompt,
    model: localEdited[0].model
  });
}

// Check database
console.log('\n2. Checking database...');
fetch('/api/images').then(r => r.json()).then(data => {
  console.log(`   Total images in database: ${data.images.length}`);
  const dbEdited = data.images.filter(img => img.original_image_id);
  console.log(`   Edited images in database: ${dbEdited.length}`);
  if (dbEdited.length > 0) {
    console.log('   Sample edited image from DB:', {
      id: dbEdited[0].id,
      localId: dbEdited[0].metadata?.localId,
      original_image_id: dbEdited[0].original_image_id,
      prompt: dbEdited[0].prompt,
      model: dbEdited[0].model
    });
  }

  // Compare localStorage and database
  console.log('\n3. Comparing localStorage and database...');
  const localOnlyIds = localImages.map(img => img.id);
  const dbIds = data.images.map(img => img.metadata?.localId || img.id);
  
  const inBoth = localOnlyIds.filter(id => dbIds.includes(id));
  const localOnly = localOnlyIds.filter(id => !dbIds.includes(id));
  const dbOnly = dbIds.filter(id => !localOnlyIds.includes(id));
  
  console.log(`   Images in both: ${inBoth.length}`);
  console.log(`   Images only in localStorage: ${localOnly.length}`);
  console.log(`   Images only in database: ${dbOnly.length}`);
  
  // Check for edited images specifically
  console.log('\n4. Edited images analysis...');
  const localEditedIds = localEdited.map(img => img.id);
  const dbEditedIds = dbEdited.map(img => img.metadata?.localId || img.id);
  
  const editedInBoth = localEditedIds.filter(id => dbEditedIds.includes(id));
  const editedLocalOnly = localEditedIds.filter(id => !dbEditedIds.includes(id));
  const editedDbOnly = dbEditedIds.filter(id => !localEditedIds.includes(id));
  
  console.log(`   Edited images in both: ${editedInBoth.length}`);
  console.log(`   Edited images only in localStorage: ${editedLocalOnly.length}`);
  console.log(`   Edited images only in database: ${editedDbOnly.length}`);
  
  if (editedLocalOnly.length > 0) {
    console.log('   ⚠️  Found edited images not saved to database!');
    console.log('   IDs:', editedLocalOnly);
  }
  
  // Persistence check
  console.log('\n5. Persistence configuration...');
  fetch('/api/check-persistence').then(r => r.json()).then(config => {
    console.log('   Persistence configured:', config.configured);
    console.log('   Has Supabase URL:', config.hasSupabaseUrl);
    console.log('   Has Supabase Key:', config.hasSupabaseKey);
    console.log('   Has Blob Token:', config.hasBlobToken);
  });
});

console.log('\n6. Current page state...');
console.log('   Check window.debugImages if available');
console.log('   Or temporarily add to page.tsx: window.debugImages = generatedImages');

console.log('\n✅ Diagnostic complete!');
console.log('If edited images are missing after refresh:');
console.log('1. Check if they exist in localStorage (Section 1)');
console.log('2. Check if they exist in database (Section 2)');
console.log('3. Check if persistence is configured (Section 5)');
console.log('4. Look for any console errors during page load');