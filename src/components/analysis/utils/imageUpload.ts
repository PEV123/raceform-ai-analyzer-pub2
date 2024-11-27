import { supabase } from "@/integrations/supabase/client";

export const uploadImage = async (file: File) => {
  console.log('Starting image upload...');
  const filePath = `chat-images/${Date.now()}-${file.name}`;
  
  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error("No authenticated session found");
    }

    console.log('Uploading file to path:', filePath);
    const { data, error } = await supabase.storage
      .from('race_documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    console.log('File uploaded successfully, getting public URL');
    const { data: { publicUrl } } = supabase.storage
      .from('race_documents')
      .getPublicUrl(filePath);

    console.log('Public URL generated:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    throw error;
  }
};