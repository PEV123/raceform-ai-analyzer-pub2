import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB limit for Claude

export const processRaceDocuments = async (race: any, supabaseUrl: string) => {
  if (!race.race_documents?.length) return [];
  
  console.log(`Processing ${race.race_documents.length} race documents for vision analysis`);
  
  // Define supported media types
  const SUPPORTED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  // Filter documents by supported types
  const supportedDocuments = race.race_documents.filter((doc: any) => 
    SUPPORTED_MEDIA_TYPES.includes(doc.content_type)
  );
  
  console.log('Document processing status:', {
    total: race.race_documents.length,
    supported: supportedDocuments.length,
    unsupported: race.race_documents.length - supportedDocuments.length,
    documentTypes: race.race_documents.map((doc: any) => ({
      fileName: doc.file_name,
      contentType: doc.content_type,
      isSupported: SUPPORTED_MEDIA_TYPES.includes(doc.content_type)
    }))
  });
  
  const processedDocuments = [];
  
  for (const doc of supportedDocuments) {
    try {
      const documentUrl = `${supabaseUrl}/storage/v1/object/public/race_documents/${doc.file_path}`;
      console.log('Processing supported document:', {
        fileName: doc.file_name,
        contentType: doc.content_type,
        url: documentUrl
      });
      
      const response = await fetch(documentUrl);
      if (!response.ok) {
        console.error(`Failed to fetch document ${doc.file_name}:`, response.statusText);
        continue;
      }

      const blob = await response.blob();
      const base64Data = await blobToBase64(blob);
      const base64Content = base64Data.split(',')[1];
      
      processedDocuments.push({
        type: "image",
        source: {
          type: "base64",
          media_type: doc.content_type,
          data: base64Content
        }
      });
      
      console.log(`Successfully processed document ${doc.file_name}:`, {
        contentType: doc.content_type,
        dataLength: base64Content.length
      });
    } catch (error) {
      console.error(`Error processing document ${doc.file_name}:`, error);
    }
  }
  
  console.log(`Successfully processed ${processedDocuments.length} supported documents`);
  return processedDocuments;
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};