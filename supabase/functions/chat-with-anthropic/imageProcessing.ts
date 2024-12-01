import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB limit for Claude

export const processRaceDocuments = async (race: any, supabaseUrl: string) => {
  if (!race.race_documents?.length) return [];
  
  console.log(`Processing ${race.race_documents.length} race documents for vision analysis`);
  const imageDocuments = race.race_documents.filter(doc => doc.content_type?.startsWith('image/'));
  console.log(`Found ${imageDocuments.length} image documents to process`);
  
  const processedImages = [];
  
  for (const doc of imageDocuments) {
    try {
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/race_documents/${doc.file_path}`;
      console.log('Processing image:', doc.file_name);
      
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.error(`Failed to fetch image ${doc.file_name}:`, response.statusText);
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      const chunks = splitArrayBuffer(arrayBuffer, MAX_CHUNK_SIZE);
      console.log(`Split image ${doc.file_name} into ${chunks.length} chunks`);

      for (const [index, chunk] of chunks.entries()) {
        const base64 = arrayBufferToBase64(chunk);
        processedImages.push({
          type: "image",
          source: {
            type: "base64",
            media_type: doc.content_type,
            data: base64
          },
          metadata: {
            fileName: doc.file_name,
            chunkIndex: index,
            totalChunks: chunks.length
          }
        });
      }
      
      console.log(`Successfully processed image ${doc.file_name}`);
    } catch (error) {
      console.error(`Error processing document image ${doc.file_name}:`, error);
    }
  }
  
  return processedImages;
};

function splitArrayBuffer(buffer: ArrayBuffer, maxChunkSize: number): ArrayBuffer[] {
  const chunks: ArrayBuffer[] = [];
  const totalSize = buffer.byteLength;
  let offset = 0;
  
  while (offset < totalSize) {
    const chunkSize = Math.min(maxChunkSize, totalSize - offset);
    chunks.push(buffer.slice(offset, offset + chunkSize));
    offset += chunkSize;
  }
  
  return chunks;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const binString = Array.from(bytes, byte => String.fromCodePoint(byte)).join('');
  return btoa(binString);
}