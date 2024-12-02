import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";

interface UploadButtonProps {
  isUploading: boolean;
  onFileSelect: (files: FileList) => void;
}

export const UploadButton = ({ isUploading, onFileSelect }: UploadButtonProps) => {
  return (
    <Button
      variant="outline"
      className="w-full"
      disabled={isUploading}
      onClick={() => {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.accept = "image/*,.pdf";
        input.onchange = (e) => onFileSelect((e.target as HTMLInputElement).files!);
        input.click();
      }}
    >
      {isUploading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          <span>Select Files</span>
        </div>
      )}
    </Button>
  );
};