import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ImagePreview } from "./ImagePreview";
import { UploadButton } from "./UploadButton";
import { useImageUpload } from "@/hooks/useImageUpload";

interface ChatInputProps {
  onSendMessage: (message: string, imageBase64?: { data: string; type: string }) => Promise<void>;
  isLoading: boolean;
}

export const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { uploadProgress, uploadState, handleImageUpload, resetUploadState } = useImageUpload();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !uploadState) return;

    let messageToSend = newMessage.trim();
    
    console.log('Sending message with image state:', uploadState);
    
    if (uploadState?.publicUrl) {
      // If we have an image, prepend its URL to the message
      messageToSend = `${uploadState.publicUrl}\n${messageToSend}`;
    }
    
    await onSendMessage(
      messageToSend,
      uploadState ? { 
        data: uploadState.base64 || '',
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