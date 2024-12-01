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

// Scale down image using canvas
async function scaleDownImage(imageData: ArrayBuffer, contentType: string, scale: number = 0.5): Promise<ArrayBuffer> {
  const canvas = new OffscreenCanvas(1, 1);
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Create a blob from the array buffer
  const blob = new Blob([imageData], { type: contentType });
  
  // Create ImageBitmap from blob
  const imageBitmap = await createImageBitmap(blob);
  
  // Set canvas size to scaled dimensions
  canvas.width = imageBitmap.width * scale;
  canvas.height = imageBitmap.height * scale;
  
  // Draw scaled image
  ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
  
  // Convert to blob with quality settings
  const newBlob = await canvas.convertToBlob({
    type: contentType,
    quality: 0.9
  });
  
  return await newBlob.arrayBuffer();
}

export async function processImage(imageUrl: string, fileName: string, contentType: string) {
  console.log(`Processing image: ${fileName}`);
  
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image ${fileName}: ${response.statusText}`);
    }

    let arrayBuffer = await response.arrayBuffer();
    let size = arrayBuffer.byteLength;
    console.log(`Downloaded image ${fileName}, size: ${size} bytes`);

    // If image exceeds size limit, progressively reduce it
    if (size > MAX_IMAGE_SIZE) {
      console.log(`Image ${fileName} exceeds Claude's 5MB limit. Starting progressive reduction...`);
      
      let scale = 0.7; // Start with 70% of original size
      let attempts = 0;
      const MAX_ATTEMPTS = 4;

      while (size > MAX_IMAGE_SIZE && attempts < MAX_ATTEMPTS) {
        console.log(`Attempt ${attempts + 1}: Reducing to ${Math.round(scale * 100)}% of original size`);
        
        try {
          arrayBuffer = await scaleDownImage(arrayBuffer, contentType, scale);
          size = arrayBuffer.byteLength;
          console.log(`New size after reduction: ${size} bytes`);
          
          if (size <= MAX_IMAGE_SIZE) {
            break;
          }
          
          scale *= 0.7; // Reduce by another 30% each attempt
          attempts++;
        } catch (error) {
          console.error(`Error during image reduction attempt ${attempts + 1}:`, error);
          throw error;
        }
      }

      if (size > MAX_IMAGE_SIZE) {
        console.error(`Failed to reduce image ${fileName} to acceptable size after ${attempts} attempts`);
        return null;
      }
    }

    console.log(`Final image size for ${fileName}: ${arrayBuffer.byteLength} bytes`);
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