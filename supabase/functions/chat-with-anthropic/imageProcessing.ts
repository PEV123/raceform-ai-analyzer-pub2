const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB limit for Claude

// Efficient base64 conversion that handles large buffers
function arrayBufferToBase64(buffer: ArrayBuffer) {
  const chunk_size = 8192; // Process in 8KB chunks
  const bytes = new Uint8Array(buffer);
  let binary = '';
  
  for (let i = 0; i < bytes.byteLength; i += chunk_size) {
    const chunk = bytes.slice(i, i + chunk_size);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  
  return btoa(binary);
}

// Calculate new dimensions maintaining aspect ratio
function calculateNewDimensions(width: number, height: number, targetSize: number) {
  const ratio = Math.sqrt(targetSize / (width * height));
  return {
    width: Math.floor(width * ratio),
    height: Math.floor(height * ratio)
  };
}

export async function processImage(imageUrl: string, fileName: string, contentType: string) {
  console.log(`Processing image: ${fileName}`);
  
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image ${fileName}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const size = arrayBuffer.byteLength;
    console.log(`Downloaded image ${fileName}, size: ${size} bytes`);

    if (size > MAX_IMAGE_SIZE) {
      console.log(`Image ${fileName} exceeds Claude's 5MB limit. Starting progressive reduction...`);
      
      // Convert array buffer to base64 for initial image loading
      const base64 = arrayBufferToBase64(arrayBuffer);
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = `data:${contentType};base64,${base64}`;
      });

      // Start with 50% reduction and increase if needed
      let scale = 0.5;
      let attempts = 0;
      const MAX_ATTEMPTS = 3;

      while (attempts < MAX_ATTEMPTS) {
        const newDimensions = calculateNewDimensions(
          img.width,
          img.height,
          (img.width * img.height) * (scale * scale)
        );

        console.log(`Attempt ${attempts + 1}: Reducing to ${newDimensions.width}x${newDimensions.height}`);

        const canvas = new OffscreenCanvas(newDimensions.width, newDimensions.height);
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Use better quality settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw scaled image
        ctx.drawImage(img, 0, 0, newDimensions.width, newDimensions.height);
        
        // Convert to blob with quality settings
        const blob = await canvas.convertToBlob({
          type: contentType,
          quality: 0.9
        });
        
        const reducedBuffer = await blob.arrayBuffer();
        console.log(`Reduced size: ${reducedBuffer.byteLength} bytes`);
        
        if (reducedBuffer.byteLength <= MAX_IMAGE_SIZE) {
          return {
            type: "image",
            source: {
              type: "base64",
              media_type: contentType,
              data: arrayBufferToBase64(reducedBuffer)
            }
          };
        }
        
        // Increase reduction for next attempt
        scale *= 0.5;
        attempts++;
      }
      
      throw new Error(`Failed to reduce image to acceptable size after ${MAX_ATTEMPTS} attempts`);
    }

    // If image is under size limit, process normally
    console.log(`Image ${fileName} is under size limit, processing normally`);
    return {
      type: "image",
      source: {
        type: "base64",
        media_type: contentType,
        data: arrayBufferToBase64(arrayBuffer)
      }
    };
  } catch (error) {
    console.error(`Error processing image ${fileName}:`, error);
    return null;
  }
}