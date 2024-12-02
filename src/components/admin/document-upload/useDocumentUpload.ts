import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export const useDocumentUpload = (
  race: Tables<"races"> | null,
  onComplete: () => void
) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileUpload = async (files: FileList) => {
    if (!files.length || !race) return;

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No authenticated session found");
      }

      const totalFiles = files.length;
      let successfulUploads = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("raceId", race.id);

        const response = await fetch(
          "https://vlcrqrmqghskrdhhsgqt.functions.supabase.co/upload-race-document",
          {
            method: "POST",
            body: formData,
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (!response.ok) {
          console.error(`Failed to upload ${file.name}`);
          continue;
        }

        successfulUploads++;
        setUploadProgress((successfulUploads / totalFiles) * 100);
      }

      if (successfulUploads === totalFiles) {
        toast({
          title: "Success",
          description: `${successfulUploads} document${successfulUploads !== 1 ? 's' : ''} uploaded successfully`,
        });
      } else if (successfulUploads > 0) {
        toast({
          title: "Partial Success",
          description: `${successfulUploads} out of ${totalFiles} documents uploaded successfully`,
          variant: "default",
        });
      } else {
        throw new Error("Failed to upload any documents");
      }

      queryClient.invalidateQueries({ queryKey: ["races"] });
      onComplete();
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast({
        title: "Error",
        description: "Failed to upload documents",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    isUploading,
    uploadProgress,
    handleFileUpload,
  };
};