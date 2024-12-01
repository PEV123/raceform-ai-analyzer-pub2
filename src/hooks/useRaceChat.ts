import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from '@supabase/auth-helpers-react';

interface Message {
  role: 'user' | 'assistant';
  message: string;
}

export const useRaceChat = (raceId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const session = useSession();

  const loadMessages = async () => {
    try {
      console.log('Loading messages for race:', raceId);
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

  const sendMessage = async (message: string, imageData?: { data: string; type: string }) => {
    if ((!message.trim() && !imageData) || !session?.user?.id) return;
    
    setIsLoading(true);
    console.log('Sending message with conversation history and image:', { messageLength: message.length, hasImage: !!imageData });

    try {
      // Save user message
      const { error: userMsgError } = await supabase
        .from('race_chats')
        .insert({
          race_id: raceId,
          message: message || "(Image uploaded)",
          role: 'user',
          user_id: session.user.id,
        });

      if (userMsgError) throw userMsgError;

      // Update local state immediately
      const updatedMessages: Message[] = [...messages, { role: 'user', message: message || "(Image uploaded)" }];
      setMessages(updatedMessages);

      // Prepare request body
      const requestBody: any = {
        message,
        raceId,
        conversationHistory: updatedMessages,
      };

      // If there's an image, format it the same way as race documents
      if (imageData) {
        requestBody.image = {
          type: "image",
          source: {
            type: "base64",
            media_type: imageData.type,
            data: imageData.data
          }
        };
      }

      console.log('Sending request to edge function with image:', !!imageData);
      
      // Call edge function with full conversation history
      const response = await supabase.functions.invoke('chat-with-anthropic', {
        body: JSON.stringify(requestBody),
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to get AI response');
      }

      const data = response.data;
      console.log('AI response received:', data);
      
      // Save AI response
      const { error: aiMsgError } = await supabase
        .from('race_chats')
        .insert({
          race_id: raceId,
          message: data.message,
          role: 'assistant',
          user_id: session.user.id,
        });

      if (aiMsgError) throw aiMsgError;

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', message: data.message },
      ]);
    } catch (error) {
      console.error('Error in chat:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    loadMessages,
  };
};