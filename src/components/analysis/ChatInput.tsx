import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

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
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const base64String = event.target?.result as string;
        console.log('Image converted to base64');
        
        try {
          await onSendMessage(base64String);
          toast({
            title: "Success",
            description: "Image uploaded successfully",
          });
        } catch (error) {
          console.error('Error sending image message:', error);
          toast({
            title: "Error",
            description: "Failed to send image",
            variant: "destructive",
          });
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Error",
        description: "Failed to process image",
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