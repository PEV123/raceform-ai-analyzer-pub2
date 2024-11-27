import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !race) return;

    setIsUploading(true);
    const file = e.target.files[0];

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("raceId", race.id);

      const response = await fetch(
        "https://vlcrqrmqghskrdhhsgqt.functions.supabase.co/upload-race-document",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["races"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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
            <Button
              variant="outline"
              className="w-full"
              disabled={isUploading}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*,.pdf";
                input.onchange = (e) => handleFileUpload(e as any);
                input.click();
              }}
            >
              {isUploading ? "Uploading..." : "Select File"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};