import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { uploadImage } from "./utils/imageUpload";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Starting image upload process');
      setUploadProgress(10);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
      
      setUploadProgress(30);
      const publicUrl = await uploadImage(file);
      setUploadProgress(90);
      
      await onSendMessage(publicUrl);
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
      
      // Reset states
      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(0);
        setPreviewUrl(null);
      }, 1000);
      
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive",
      });
      setUploadProgress(0);
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleImageUpload(file);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          await handleImageUpload(file);
          break;
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await onSendMessage(newMessage);
    setNewMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div 
        ref={dropZoneRef}
        className={cn(
          "flex gap-2 relative",
          isDragging && "after:absolute after:inset-0 after:bg-primary/10 after:border-2 after:border-dashed after:border-primary after:rounded-lg"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
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
              if (file) handleImageUpload(file);
            };
            input.click();
          }}
        >
          📎
        </Button>
        <div className="flex-1 space-y-2">
          {uploadProgress > 0 && (
            <Progress value={uploadProgress} className="w-full h-2" />
          )}
          {previewUrl && (
            <div className="relative w-20 h-20 mb-2">
              <img 
                src={previewUrl} 
                alt="Upload preview" 
                className="w-full h-full object-cover rounded-md"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 w-6 h-6"
                onClick={() => {
                  setPreviewUrl(null);
                  setUploadProgress(0);
                }}
              >
                ×
              </Button>
            </div>
          )}
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onPaste={handlePaste}
            className="flex-1 resize-none border rounded-md p-2 w-full"
            rows={3}
            placeholder="Type your message or paste an image..."
          />
        </div>
        <Button type="submit" className="shrink-0" disabled={isLoading}>
          Send
        </Button>
      </div>
    </form>
  );
};