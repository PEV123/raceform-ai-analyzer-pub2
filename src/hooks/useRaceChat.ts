import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/analysis/types/chat";
import { useToast } from "./use-toast";
import { formatRaceContext } from "@/lib/formatRaceContext";

export const useRaceChat = (raceId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadMessages = useCallback(async () => {
    console.log('Loading messages for race:', raceId);
    try {
      const { data, error } = await supabase
        .from('race_chats')
        .select('*')
        .eq('race_id', raceId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        throw error;
      }

      setMessages(data.map(msg => ({
        role: msg.role,
        message: msg.message
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    }
  }, [raceId, toast]);

  const sendMessage = useCallback(async (message: string, imageBase64?: { data: string; type: string }) => {
    console.log('Sending message for race:', raceId);
    setIsLoading(true);

    try {
      // Fetch race data first
      const { data: race, error: raceError } = await supabase
        .from('races')
        .select(`
          *,
          runners (*),
          race_documents (*)
        `)
        .eq('id', raceId)
        .single();

      if (raceError) throw raceError;

      // Format the context
      const context = await formatRaceContext(race);
      console.log('Generated race context length:', context.length);

      // Store user message
      const { error: chatError } = await supabase
        .from('race_chats')
        .insert({
          race_id: raceId,
          message: message,
          role: 'user'
        });

      if (chatError) throw chatError;

      // Update local state
      setMessages(prev => [...prev, { role: 'user', message }]);

      // Call AI function with image if provided
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke(
        'chat-with-anthropic',
        {
          body: {
            message,
            raceId,
            conversationHistory: messages,
            imageData: imageBase64
          }
        }
      );

      if (aiError) throw aiError;

      // Store AI response
      const { error: responseError } = await supabase
        .from('race_chats')
        .insert({
          race_id: raceId,
          message: aiResponse.message,
          role: 'assistant'
        });

      if (responseError) throw responseError;

      // Update local state with AI response
      setMessages(prev => [...prev, { role: 'assistant', message: aiResponse.message }]);
    } catch (error) {
      console.error('Error in chat interaction:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [raceId, messages, toast]);

  return {
    messages,
    isLoading,
    sendMessage,
    loadMessages
  };
};