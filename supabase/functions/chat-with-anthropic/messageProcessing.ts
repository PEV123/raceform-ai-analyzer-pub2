import { Message } from "./types.ts";

export const processMessages = (
  conversationHistory: Message[] = [],
  currentMessage: string,
  processedDocuments: any[] = [],
  imageData?: { source: { type: string; media_type: string; data: string } },
  excludeRaceDocuments?: boolean
) => {
  console.log('Processing messages with:', {
    historyLength: conversationHistory?.length || 0,
    hasCurrentMessage: !!currentMessage,
    documentCount: processedDocuments?.length || 0,
    hasImage: !!imageData,
    excludeRaceDocuments
  });

  const messages = [];

  // Add conversation history if it exists
  if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    console.log('Adding conversation history:', conversationHistory.length, 'messages');
    messages.push(
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: [{ type: "text", text: msg.message }]
      }))
    );
  }

  // Process current message and any uploads
  const currentContent = [];

  // Handle race documents if they exist and are not excluded
  if (!excludeRaceDocuments && Array.isArray(processedDocuments) && processedDocuments.length > 0) {
    console.log('Processing race documents:', processedDocuments.length);
    processedDocuments.forEach(doc => {
      if (doc?.source?.data && doc?.source?.media_type?.startsWith('image/')) {
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
    });
  }

  // Handle uploaded image if present
  if (imageData?.source?.data && imageData?.source?.media_type) {
    console.log('Processing uploaded image:', {
      type: imageData.source.media_type,
      dataLength: imageData.source.data.length
    });
    currentContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: imageData.source.media_type,
        data: imageData.source.data
      }
    });
  }

  // Add the text message if it exists
  if (currentMessage?.trim()) {
    currentContent.push({ 
      type: "text", 
      text: currentMessage.trim() 
    });
  }

  // Only add the message if there's content
  if (currentContent.length > 0) {
    console.log('Adding message with content types:', currentContent.map(c => c.type));
    messages.push({
      role: "user",
      content: currentContent
    });
  }

  return messages;
};