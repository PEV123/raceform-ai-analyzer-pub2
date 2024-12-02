import { useState } from "react";
import { Message } from "@/components/analysis/types/chat";
import { supabase } from "@/integrations/supabase/client";

export const useChatMessages = (raceId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadMessages = async () => {
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

      console.log('Successfully loaded messages:', data?.length);
      setMessages(data.map(msg => ({
        role: msg.role as Message['role'],
        message: msg.message
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  return {
    messages,
    isLoading,
    setIsLoading,
    loadMessages,
    addMessage
  };
};