import { useCallback } from "react";
import { useChatMessages } from "./chat/useChatMessages";
import { useChatOperations } from "./chat/useChatOperations";
import { ImageData } from "@/components/analysis/types/chat";

export const useRaceChat = (raceId: string) => {
  const { 
    messages, 
    isLoading, 
    setIsLoading, 
    loadMessages, 
    addMessage 
  } = useChatMessages(raceId);
  
  const { storeMessage, sendMessageToAI } = useChatOperations(raceId);

  const sendMessage = useCallback(async (
    message: string, 
    imageData?: ImageData,
    excludeRaceDocuments?: boolean
  ) => {
    console.log('Sending message:', {
      messageLength: message.length,
      hasImage: !!imageData,
      excludeRaceDocuments
    });

    if (!raceId) return;

    setIsLoading(true);
    try {
      // Store and display user message
      await storeMessage(message, 'user');
      addMessage({ role: 'user', message });

      // Get AI response
      const aiResponse = await sendMessageToAI(
        message,
        messages,
        imageData,
        excludeRaceDocuments
      );

      // Store and display AI response
      await storeMessage(aiResponse, 'assistant');
      addMessage({ role: 'assistant', message: aiResponse });
    } catch (error) {
      console.error('Error in chat flow:', error);
    } finally {
      setIsLoading(false);
    }
  }, [messages, storeMessage, sendMessageToAI, addMessage, setIsLoading, raceId]);

  return {
    messages,
    isLoading,
    sendMessage,
    loadMessages
  };
};