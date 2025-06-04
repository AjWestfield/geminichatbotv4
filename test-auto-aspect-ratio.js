#!/usr/bin/env node

/**
 * Test script for auto aspect ratio detection
 * This script tests the aspect ratio detection logic
 */

// Mock image dimensions for testing
const testImages = [
  { name: "Portrait Image", width: 768, height: 1024 },
  { name: "Landscape Image", width: 1920, height: 1080 },
  { name: "Square Image", width: 1024, height: 1024 },
  { name: "Tall Portrait", width: 500, height: 1500 },
  { name: "Wide Landscape", width: 2000, height: 800 },
  { name: "Nearly Square", width: 1100, height: 1000 }
];

// Aspect ratio detection logic (matching the implementation)
function detectAspectRatio(width, height) {
  const aspectRatio = width / height;
  
  let orientation;
  let imageSize;
  
  if (Math.abs(aspectRatio - 1) < 0.1) {
    // Square (within 10% of 1:1)
    orientation = 'square';
    imageSize = '1024x1024';
  } else if (aspectRatio > 1) {
    // Landscape
    orientation = 'landscape';
    imageSize = '1536x1024'; // OpenAI-compatible landscape size
  } else {
    // Portrait
    orientation = 'portrait';
    imageSize = '1024x1536'; // OpenAI-compatible portrait size
  }
  
  return {
    width,
    height,
    aspectRatio: aspectRatio.toFixed(2),
    orientation,
    imageSize
  };
}

console.log("Testing Auto Aspect Ratio Detection\n");
console.log("===================================\n");

testImages.forEach(img => {
  const result = detectAspectRatio(img.width, img.height);
  console.log(`${img.name}:`);
  console.log(`  Dimensions: ${result.width}x${result.height}`);
  console.log(`  Aspect Ratio: ${result.aspectRatio}`);
  console.log(`  Orientation: ${result.orientation}`);
  console.log(`  OpenAI Size: ${result.imageSize}`);
  console.log("");
});

console.log("\nValid OpenAI Sizes:");
console.log("- Square: 1024x1024");
console.log("- Landscape: 1536x1024");
console.log("- Portrait: 1024x1536");
console.log("\nThese sizes will be used when editing images to maintain aspect ratio.");