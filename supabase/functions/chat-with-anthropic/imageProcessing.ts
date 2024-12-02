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

      const blob = await response.blob();
      const base64Data = await blobToBase64(blob);
      const base64Content = base64Data.split(',')[1];

      processedImages.push({
        type: "image",
        source: {
          type: "base64",
          media_type: doc.content_type,
          data: base64Content
        },
        metadata: {
          fileName: doc.file_name
        }
      });
      
      console.log(`Successfully processed image ${doc.file_name}:`, {
        contentType: doc.content_type,
        dataLength: base64Content.length
      });
    } catch (error) {
      console.error(`Error processing document image ${doc.file_name}:`, error);
    }
  }
  
  console.log('Successfully processed all documents:', {
    count: processedImages.length,
    types: processedImages.map(img => img.source.media_type)
  });
  
  return processedImages;
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};