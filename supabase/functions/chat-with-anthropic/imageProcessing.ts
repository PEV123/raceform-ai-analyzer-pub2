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

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE) {
      console.warn(`Image ${fileName} exceeds Claude's 5MB limit: ${contentLength} bytes`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log(`Successfully downloaded image ${fileName}, size: ${arrayBuffer.byteLength} bytes`);

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