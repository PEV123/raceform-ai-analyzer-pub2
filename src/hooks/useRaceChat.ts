import { useCallback } from "react";
import { useChatMessages } from "./chat/useChatMessages";
import { useChatOperations } from "./chat/useChatOperations";
import { ImageData } from "@/components/analysis/types/chat";
import { useToast } from "@/hooks/use-toast";

export const useRaceChat = (raceId: string) => {
  const { 
    messages, 
    isLoading, 
    setIsLoading, 
    loadMessages, 
    addMessage 
  } = useChatMessages(raceId);
  
  const { storeMessage, sendMessageToAI } = useChatOperations(raceId);
  const { toast } = useToast();

  const sendMessage = useCallback(async (
    message: string, 
    imageData?: ImageData,
    excludeRaceDocuments?: boolean
  ) => {
    console.log('Starting sendMessage with:', {
      messageLength: message.length,
      hasImage: !!imageData,
      excludeRaceDocuments,
      raceId
    });

    if (!raceId) {
      console.error('No raceId provided');
      toast({
        title: "Error",
        description: "Race ID is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Store and display user message
      console.log('Storing user message');
      await storeMessage(message, 'user');
      addMessage({ role: 'user', message });

      // Get AI response
      console.log('Getting AI response');
      const aiResponse = await sendMessageToAI(
        message,
        messages,
        imageData,
        excludeRaceDocuments
      );

      console.log('Received AI response, storing');
      // Store and display AI response
      await storeMessage(aiResponse, 'assistant');
      addMessage({ role: 'assistant', message: aiResponse });
    } catch (error) {
      console.error('Error in chat flow:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, storeMessage, sendMessageToAI, addMessage, setIsLoading, raceId, toast]);

  return {
    messages,
    isLoading,
    sendMessage,
    loadMessages
  };
};