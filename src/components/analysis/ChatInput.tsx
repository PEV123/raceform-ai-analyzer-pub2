import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { uploadImage } from "./utils/imageUpload";

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
  const [newMessage, setNewMessage] = useState('');
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      console.log('Starting image upload process');
      const publicUrl = await uploadImage(file);
      console.log('Image uploaded successfully:', publicUrl);
      setNewMessage(prev => prev + `\n${publicUrl}`);
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
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
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => handleImageUpload(e as any);
            input.click();
          }}
        >
          📎
        </Button>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 resize-none border rounded-md p-2"
          rows={3}
          placeholder="Type your message..."
        />
        <Button type="submit" className="shrink-0" disabled={isLoading}>
          Send
        </Button>
      </div>
    </form>
  );
};