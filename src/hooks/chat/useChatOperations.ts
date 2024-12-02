import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/components/analysis/types/chat";

export const useChatOperations = (raceId: string) => {
  const { toast } = useToast();

  const storeMessage = async (message: string, role: 'user' | 'assistant') => {
    console.log('Storing message:', { role, messageLength: message.length, raceId });
    try {
      const { error } = await supabase
        .from('race_chats')
        .insert({
          race_id: raceId,
          message,
          role
        });

      if (error) {
        console.error('Error storing message:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error storing message:', error);
      toast({
        title: "Error",
        description: "Failed to store message",
        variant: "destructive",
      });
      throw error;
    }
  };

  const sendMessageToAI = async (
    message: string, 
    conversationHistory: any[], 
    imageData?: ImageData,
    excludeRaceDocuments?: boolean
  ) => {
    console.log('Sending message to AI:', {
      messageLength: message.length,
      historyLength: conversationHistory.length,
      hasImage: !!imageData,
      excludeRaceDocuments,
      raceId
    });

    try {
      const { data, error } = await supabase.functions.invoke(
        'chat-with-anthropic',
        {
          body: {
            message,
            raceId,
            conversationHistory,
            imageData,
            excludeRaceDocuments
          }
        }
      );

      if (error) {
        console.error('Error in AI chat:', error);
        throw error;
      }

      console.log('Received AI response:', {
        responseLength: data.message.length,
        preview: data.message.substring(0, 100)
      });

      return data.message;
    } catch (error) {
      console.error('Error in AI chat:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    storeMessage,
    sendMessageToAI
  };
};