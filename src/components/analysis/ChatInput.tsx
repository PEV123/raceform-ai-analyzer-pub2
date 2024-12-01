import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { uploadImage } from "./utils/imageUpload";
import { cn } from "@/lib/utils";
import { ImageUploadState } from "./types/chat";
import { ImagePreview } from "./ImagePreview";
import { UploadButton } from "./UploadButton";

interface ChatInputProps {
  onSendMessage: (message: string, imageBase64?: { data: string; type: string }) => Promise<void>;
  isLoading: boolean;
}

export const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<ImageUploadState | null>(null);
  const { toast } = useToast();
  const dropZoneRef = useRef<HTMLDivElement>(null);

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
      
      // Create preview and start upload
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
      console.log('Image uploaded successfully');
      
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
      
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive",
      });
      resetUploadState();
    }
  };

  const resetUploadState = () => {
    setUploadProgress(0);
    setUploadState(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !uploadState) return;

    let messageToSend = newMessage.trim();
    if (uploadState?.publicUrl) {
      messageToSend = messageToSend ? `${uploadState.publicUrl}\n${messageToSend}` : uploadState.publicUrl;
    }
    
    console.log('Sending message with image:', { messageToSend, uploadState });
    await onSendMessage(
      messageToSend,
      uploadState ? { 
        data: uploadState.base64,
        type: uploadState.type
      } : undefined
    );
    
    setNewMessage('');
    resetUploadState();
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div 
        ref={dropZoneRef}
        className={cn(
          "flex gap-2 relative",
          isDragging && "after:absolute after:inset-0 after:bg-primary/10 after:border-2 after:border-dashed after:border-primary after:rounded-lg"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={async (e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) await handleImageUpload(file);
        }}
      >
        <UploadButton onFileSelect={handleImageUpload} />
        <div className="flex-1 space-y-2">
          {uploadProgress > 0 && (
            <Progress value={uploadProgress} className="w-full h-2" />
          )}
          {uploadState?.previewUrl && (
            <ImagePreview 
              url={uploadState.previewUrl}
              onRemove={resetUploadState}
            />
          )}
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onPaste={async (e) => {
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
            }}
            className="flex-1 resize-none border rounded-md p-2 w-full"
            rows={3}
            placeholder={uploadState ? "Add a message (optional)..." : "Type your message or paste an image..."}
          />
        </div>
        <Button 
          type="submit" 
          className="shrink-0" 
          disabled={isLoading || (!newMessage.trim() && !uploadState)}
        >
          Send
        </Button>
      </div>
    </form>
  );
};