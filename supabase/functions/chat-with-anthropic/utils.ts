import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const processRaceDocuments = async (race: any, supabaseUrl: string) => {
  if (!race.race_documents?.length) return [];
  
  console.log(`Processing ${race.race_documents.length} race documents for analysis`);
  
  // Define supported media types for both images and PDFs
  const SUPPORTED_MEDIA_TYPES = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    pdfs: ['application/pdf']
  };
  
  // Filter documents by supported types
  const supportedDocuments = race.race_documents.filter((doc: any) => 
    [...SUPPORTED_MEDIA_TYPES.images, ...SUPPORTED_MEDIA_TYPES.pdfs].includes(doc.content_type)
  );
  
  console.log('Document processing status:', {
    total: race.race_documents.length,
    supported: supportedDocuments.length,
    unsupported: race.race_documents.length - supportedDocuments.length,
    documentTypes: race.race_documents.map((doc: any) => ({
      fileName: doc.file_name,
      contentType: doc.content_type,
      isSupported: [...SUPPORTED_MEDIA_TYPES.images, ...SUPPORTED_MEDIA_TYPES.pdfs].includes(doc.content_type)
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
      
      // Determine the correct type based on content type
      const type = SUPPORTED_MEDIA_TYPES.images.includes(doc.content_type) ? 'image' : 'document';
      
      processedDocuments.push({
        type,
        source: {
          type: "base64",
          media_type: doc.content_type,
          data: base64Content
        }
      });
      
      console.log(`Successfully processed document ${doc.file_name}:`, {
        contentType: doc.content_type,
        type,
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