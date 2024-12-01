import { Button } from "@/components/ui/button";
import { ImageUploadResult } from "./types/chat";

interface UploadButtonProps {
  onFileSelect: (file: File) => Promise<ImageUploadResult | void>;
}

export const UploadButton = ({ onFileSelect }: UploadButtonProps) => {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="shrink-0"
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) onFileSelect(file);
        };
        input.click();
      }}
    >
      📎
    </Button>
  );
};