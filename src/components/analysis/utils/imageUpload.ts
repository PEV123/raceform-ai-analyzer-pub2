import { supabase } from "@/integrations/supabase/client";

export const uploadImage = async (file: File): Promise<{ publicUrl: string; base64: string }> => {
  console.log('Starting image upload...');
  const filePath = `chat-images/${Date.now()}-${file.name}`;
  
  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error("No authenticated session found");
    }

    console.log('Uploading file to path:', filePath);
    const { error: uploadError } = await supabase.storage
      .from('race_documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('File uploaded successfully, getting public URL');
    const { data: { publicUrl } } = supabase.storage
      .from('race_documents')
      .getPublicUrl(filePath);

    if (!publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }

    // Convert file to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1]; // Remove data URL prefix
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    console.log('Public URL and base64 generated');
    return { publicUrl, base64 };
  } catch (error) {
    console.error('Error in uploadImage:', error);
    throw error;
  }
};