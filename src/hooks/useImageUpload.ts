import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { uploadImage } from "@/components/analysis/utils/imageUpload";
import { ImageUploadState } from "@/components/analysis/types/chat";

export const useImageUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<ImageUploadState | null>(null);
  const { toast } = useToast();

  const handleImageUpload = async (file: File) => {
    console.log('Starting image upload process with file:', file);
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadProgress(10);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadState({
          previewUrl: e.target?.result as string,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
      
      setUploadProgress(30);
      console.log('Uploading image to Supabase storage...');
      const { publicUrl, base64 } = await uploadImage(file);
      console.log('Image uploaded successfully, URL:', publicUrl);
      
      setUploadState(prev => ({
        ...prev!,
        publicUrl,
        base64,
        type: file.type
      }));
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
      
      setUploadProgress(100);
      
      return { publicUrl, base64, type: file.type };
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive",
      });
      resetUploadState();
      return null;
    }
  };

  const resetUploadState = () => {
    setUploadProgress(0);
    setUploadState(null);
  };

  return {
    uploadProgress,
    uploadState,
    handleImageUpload,
    resetUploadState
  };
};