import { Button } from "@/components/ui/button";

interface UploadButtonProps {
  onFileSelect: (file: File) => Promise<void>;
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