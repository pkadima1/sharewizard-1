/**
 * Mock Visual AI Services for Development
 * 
 * This provides working mock implementations that don't require backend APIs.
 * Use this while developing the UI before backend integration is complete.
 */

import type { EditImageResult, GenerateImagesOptions, GenerateVideoOptions, GenerateVideoResult } from './visuals';

/**
 * Mock: Edit an image with multiple prompts
 * Returns the original image for each prompt (simulating the edit)
 */
export const editImage = async (
  baseFile: File,
  prompts: string[]
): Promise<EditImageResult[]> => {
  console.log('🎨 Mock editImage called:', { 
    fileName: baseFile.name, 
    fileSize: baseFile.size,
    fileType: baseFile.type,
    prompts 
  });

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Convert file to data URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      console.log('✓ File converted to dataURL');
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      console.error('✗ FileReader error:', reader.error);
      reject(reader.error);
    };
    reader.readAsDataURL(baseFile);
  });

  // Return mock results (original image for each prompt)
  const results = prompts.map(prompt => ({
    prompt,
    dataUrl,
  }));
  
  console.log('✓ Mock editImage returning', results.length, 'results');
  return results;
};

/**
 * Mock: Generate images from text
 * Returns placeholder images
 */
export const generateImages = async (
  prompt: string,
  options: GenerateImagesOptions = {}
): Promise<string[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 3000));

  const numberOfImages = options.numberOfImages || 1;

  // Generate placeholder images using placeholder service
  const images: string[] = [];
  for (let i = 0; i < numberOfImages; i++) {
    // Create a canvas with the prompt text
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, 512, 512);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
      
      // Text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Wrap text
      const maxWidth = 480;
      const words = prompt.split(' ');
      let line = '';
      let y = 256 - 40;
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, 256, y);
          line = words[n] + ' ';
          y += 30;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 256, y);
      
      // Add image number
      ctx.font = '18px sans-serif';
      ctx.fillText(`Image ${i + 1} of ${numberOfImages}`, 256, y + 60);
      
      // Add watermark
      ctx.font = '14px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('Mock Preview', 256, 500);
    }
    
    images.push(canvas.toDataURL('image/png'));
  }

  return images;
};

/**
 * Mock: Generate video from text
 * Returns a minimal video placeholder
 */
export const generateVideo = async (
  prompt: string,
  options: GenerateVideoOptions = {}
): Promise<GenerateVideoResult | null> => {
  // Simulate API delay (longer for video)
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Create a canvas for video frames
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 1280, 720);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1280, 720);
    
    // Text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Video Preview', 640, 300);
    
    ctx.font = '32px sans-serif';
    ctx.fillText(prompt.substring(0, 50), 640, 360);
    
    ctx.font = '24px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`${options.resolution || '720p'} • ${options.durationSeconds || 5}s`, 640, 420);
    
    ctx.font = '18px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('Mock Preview - Backend integration pending', 640, 680);
  }

  // Convert canvas to blob and then to data URL
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, 'image/png');
  });

  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

  return {
    mimeType: 'image/png', // Mock: return image instead of video
    dataUrl,
  };
};
