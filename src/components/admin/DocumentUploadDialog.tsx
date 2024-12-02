import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tables } from "@/integrations/supabase/types";
import { UploadProgress } from "./document-upload/UploadProgress";
import { UploadButton } from "./document-upload/UploadButton";
import { useDocumentUpload } from "./document-upload/useDocumentUpload";

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
  const { isUploading, uploadProgress, handleFileUpload } = useDocumentUpload(
    race,
    () => onOpenChange(false)
  );

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
            {isUploading && <UploadProgress progress={uploadProgress} />}
            <UploadButton 
              isUploading={isUploading}
              onFileSelect={handleFileUpload}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};