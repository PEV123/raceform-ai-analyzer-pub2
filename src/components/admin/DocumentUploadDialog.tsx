import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface DocumentUploadDialogProps {
  race: Tables<"races"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DocumentUploadDialog = ({
  race,
  open,
  onOpenChange,
}: DocumentUploadDialogProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileUpload = async (files: FileList) => {
    if (!files.length || !race) return;

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Get the current session
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
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Race Documents</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload images or documents related to {race?.race_name}
          </p>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            {isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              disabled={isUploading}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.accept = "image/*,.pdf";
                input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files!);
                input.click();
              }}
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                "Select Files"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};