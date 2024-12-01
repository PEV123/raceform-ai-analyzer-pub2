const MAX_CHUNK_SIZE = 4 * 1024 * 1024; // 4MB to stay safely under Claude's 5MB limit

export async function processImage(imageUrl: string, fileName: string, contentType: string) {
  console.log(`Processing image: ${fileName} (${contentType})`);
  
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Get the image data as an ArrayBuffer
    const imageData = await response.arrayBuffer();
    console.log(`Image size: ${imageData.byteLength} bytes`);

    // If image is smaller than max size, return it as a single chunk
    if (imageData.byteLength <= MAX_CHUNK_SIZE) {
      console.log('Image is within size limit, processing as single chunk');
      return {
        type: "image",
        source: {
          type: "base64",
          media_type: contentType,
          data: arrayBufferToBase64(imageData)
        }
      };
    }

    // Split into chunks if larger than max size
    console.log('Image exceeds size limit, splitting into chunks');
    const chunks = [];
    const totalChunks = Math.ceil(imageData.byteLength / MAX_CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * MAX_CHUNK_SIZE;
      const end = Math.min(start + MAX_CHUNK_SIZE, imageData.byteLength);
      const chunk = imageData.slice(start, end);

      chunks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: contentType,
          data: arrayBufferToBase64(chunk)
        },
        metadata: {
          fileName,
          chunk: i + 1,
          totalChunks,
          size: chunk.byteLength
        }
      });
    }

    console.log(`Split image into ${chunks.length} chunks`);
    return chunks;

  } catch (error) {
    console.error('Error processing image:', error);
    return null;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}