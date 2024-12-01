const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB limit for Claude

// Efficient base64 encoding that avoids call stack issues
export function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
  return btoa(binString);
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
      console.log(`Image ${fileName} exceeds Claude's 5MB limit. Splitting into chunks...`);
      
      // Calculate dimensions to split the image
      const img = new Image();
      img.src = `data:${contentType};base64,${arrayBufferToBase64(arrayBuffer)}`;
      await new Promise((resolve) => img.onload = resolve);
      
      // Split into quarters if needed
      const canvas = new OffscreenCanvas(img.width / 2, img.height / 2);
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Draw top-left quarter
      ctx.drawImage(img, 0, 0, img.width / 2, img.height / 2, 0, 0, canvas.width, canvas.height);
      
      const blob = await canvas.convertToBlob({ type: contentType });
      const quarterBuffer = await blob.arrayBuffer();
      const base64Quarter = arrayBufferToBase64(quarterBuffer);
      
      console.log(`Successfully split and encoded ${fileName} to a manageable size`);

      return {
        type: "image",
        source: {
          type: "base64",
          media_type: contentType,
          data: base64Quarter
        }
      };
    }

    // If image is under size limit, process normally
    const base64 = arrayBufferToBase64(arrayBuffer);
    console.log(`Successfully encoded image ${fileName} to base64`);

    return {
      type: "image",
      source: {
        type: "base64",
        media_type: contentType,
        data: base64
      }
    };
  } catch (error) {
    console.error(`Error processing image ${fileName}:`, error);
    return null;
  }
}