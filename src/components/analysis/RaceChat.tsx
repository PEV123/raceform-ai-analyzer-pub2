import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from '@supabase/auth-helpers-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { uploadImage } from "./utils/imageUpload";
import { MessageDisplay } from "./MessageDisplay";

interface RaceChatProps {
  raceId: string;
}

export const RaceChat = ({ raceId }: RaceChatProps) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; message: string; }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const session = useSession();

  useEffect(() => {
    loadMessages();
  }, [raceId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('race_chats')
        .select('*')
        .eq('race_id', raceId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(
        data.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          message: msg.message,
        }))
      );
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

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
    if (!newMessage.trim() || !session?.user?.id) return;

    const userMessage = newMessage;
    setNewMessage('');
    setMessages((prev) => [...prev, { role: 'user', message: userMessage }]);
    setIsLoading(true);

    try {
      // Save user message
      const { error: userMsgError } = await supabase
        .from('race_chats')
        .insert({
          race_id: raceId,
          message: userMessage,
          role: 'user',
          user_id: session.user.id,
        });

      if (userMsgError) throw userMsgError;

      // Call edge function for AI response
      const response = await fetch(
        'https://vlcrqrmqghskrdhhsgqt.functions.supabase.co/chat-with-anthropic',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: userMessage,
            raceId: raceId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Save AI response
      const { error: aiMsgError } = await supabase
        .from('race_chats')
        .insert({
          race_id: raceId,
          message: data.response,
          role: 'assistant',
          user_id: session.user.id,
        });

      if (aiMsgError) throw aiMsgError;

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', message: data.response },
      ]);
    } catch (error) {
      console.error('Error in chat:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <div className="border-b p-2">
        <Tabs defaultValue="chat">
          <TabsList>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages.map((msg, index) => (
          <MessageDisplay key={index} role={msg.role} message={msg.message} />
        ))}
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </ScrollArea>

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
    </div>
  );
};