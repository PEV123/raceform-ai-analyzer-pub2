const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB limit for Claude

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
      console.log(`Image ${fileName} exceeds Claude's 5MB limit. Reducing size...`);
      
      // Convert array buffer to base64 for canvas processing
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = `data:${contentType};base64,${base64}`;
      });

      // Create canvas with reduced dimensions
      const canvas = new OffscreenCanvas(img.width / 2, img.height / 2);
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Draw scaled image
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob and then to array buffer
      const blob = await canvas.convertToBlob({ type: contentType });
      const reducedBuffer = await blob.arrayBuffer();
      
      // Check if we need to reduce size further
      if (reducedBuffer.byteLength > MAX_IMAGE_SIZE) {
        console.log(`Image still too large after initial reduction. Further reducing...`);
        const furtherCanvas = new OffscreenCanvas(canvas.width / 2, canvas.height / 2);
        const furtherCtx = furtherCanvas.getContext('2d');
        
        if (!furtherCtx) {
          throw new Error('Failed to get canvas context for further reduction');
        }

        furtherCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, furtherCanvas.width, furtherCanvas.height);
        const furtherBlob = await furtherCanvas.convertToBlob({ type: contentType });
        const finalBuffer = await furtherBlob.arrayBuffer();
        
        console.log(`Final reduced size: ${finalBuffer.byteLength} bytes`);
        return {
          type: "image",
          source: {
            type: "base64",
            media_type: contentType,
            data: arrayBufferToBase64(finalBuffer)
          }
        };
      }

      console.log(`Reduced size: ${reducedBuffer.byteLength} bytes`);
      return {
        type: "image",
        source: {
          type: "base64",
          media_type: contentType,
          data: arrayBufferToBase64(reducedBuffer)
        }
      };
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

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const binString = Array.from(bytes, byte => String.fromCodePoint(byte)).join('');
  return btoa(binString);
}