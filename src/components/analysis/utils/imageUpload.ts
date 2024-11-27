import { supabase } from "@/integrations/supabase/client";

export const uploadImage = async (file: File) => {
  const filePath = `chat-images/${Date.now()}-${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('race_documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('race_documents')
    .getPublicUrl(filePath);

  return publicUrl;
};