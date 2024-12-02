import { Message } from "./types.ts";

const MAX_TOKENS_PER_MESSAGE = 8000;
const MAX_HISTORY_MESSAGES = 10;

export const processMessages = (
  conversationHistory: Message[] = [],
  currentMessage: string,
  processedDocuments: any[],
  imageData?: { data: string; type: string },
  excludeRaceDocuments?: boolean
) => {
  const messages = [];
  console.log('Processing messages with:', {
    historyLength: conversationHistory?.length,
    hasCurrentMessage: !!currentMessage,
    documentCount: processedDocuments?.length,
    hasImage: !!imageData,
    excludeRaceDocuments
  });

  // Add limited conversation history
  if (conversationHistory?.length > 0) {
    console.log('Adding conversation history:', conversationHistory.length, 'messages');
    const recentHistory = conversationHistory.slice(-MAX_HISTORY_MESSAGES);
    messages.push(...recentHistory.map(msg => ({
      role: msg.role,
      content: [{ type: "text", text: msg.message }]
    })));
  }

  // Process current message and any uploads
  const currentContent = [];

  // Handle race documents only if not excluded
  if (!excludeRaceDocuments && processedDocuments?.length > 0) {
    console.log('Processing race documents:', processedDocuments.length);
    for (const doc of processedDocuments) {
      if (doc.source?.data && doc.source?.media_type?.startsWith('image/')) {
        console.log('Adding race document image:', {
          type: doc.source.media_type,
          dataLength: doc.source.data.length
        });
        currentContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: doc.source.media_type,
            data: doc.source.data
          }
        });
      }
    }
  } else if (excludeRaceDocuments) {
    console.log('Race documents excluded by user request');
  }

  // Handle uploaded image if present
  if (imageData) {
    console.log('Processing uploaded image:', {
      type: imageData.type,
      dataLength: imageData.data.length
    });
    currentContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: imageData.type,
        data: imageData.data
      }
    });
  }

  // Add the text message last
  if (currentMessage) {
    currentContent.push({ 
      type: "text", 
      text: currentMessage 
    });
  }
  
  if (currentContent.length > 0) {
    console.log('Adding message with content types:', currentContent.map(c => c.type));
    messages.push({
      role: "user",
      content: currentContent
    });
  }

  return messages;
};