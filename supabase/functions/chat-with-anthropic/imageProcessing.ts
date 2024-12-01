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

    // If image is under size limit, return as single image
    if (size <= MAX_IMAGE_SIZE) {
      console.log(`Image ${fileName} is under size limit, processing as single image`);
      return {
        type: "image",
        source: {
          type: "base64",
          media_type: contentType,
          data: arrayBufferToBase64(arrayBuffer)
        }
      };
    }

    // Split into chunks if over size limit
    console.log(`Image ${fileName} exceeds size limit, splitting into chunks`);
    const chunks: Uint8Array[] = [];
    const bytes = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < bytes.length; i += MAX_IMAGE_SIZE) {
      const chunk = bytes.slice(i, Math.min(i + MAX_IMAGE_SIZE, bytes.length));
      chunks.push(chunk);
    }

    console.log(`Split image into ${chunks.length} chunks`);

    // Return array of processed chunks
    return chunks.map((chunk, index) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: contentType,
        data: arrayBufferToBase64(chunk.buffer),
      },
      metadata: {
        chunk: index + 1,
        totalChunks: chunks.length,
        fileName: fileName
      }
    }));

  } catch (error) {
    console.error(`Error processing image ${fileName}:`, error);
    return null;
  }
}