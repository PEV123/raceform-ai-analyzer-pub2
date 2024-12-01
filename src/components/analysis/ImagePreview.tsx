import { Button } from "@/components/ui/button";

interface ImagePreviewProps {
  url: string;
  onRemove: () => void;
}

export const ImagePreview = ({ url, onRemove }: ImagePreviewProps) => {
  return (
    <div className="relative w-20 h-20 mb-2">
      <img 
        src={url} 
        alt="Upload preview" 
        className="w-full h-full object-cover rounded-md"
      />
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute -top-2 -right-2 w-6 h-6"
        onClick={onRemove}
      >
        ×
      </Button>
    </div>
  );
};