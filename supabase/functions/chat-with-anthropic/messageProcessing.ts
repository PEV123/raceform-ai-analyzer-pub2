import { Message } from "./types.ts";

const MAX_TOKENS_PER_MESSAGE = 8000; // Conservative limit
const MAX_HISTORY_MESSAGES = 10; // Limit conversation history

export const processMessages = (
  conversationHistory: Message[] = [],
  currentMessage: string,
  processedDocuments: any[],
  imageData?: { data: string; type: string }
) => {
  const messages = [];
  console.log('Processing messages with:', {
    historyLength: conversationHistory?.length,
    hasCurrentMessage: !!currentMessage,
    documentCount: processedDocuments?.length,
    hasImage: !!imageData
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
  
  // Handle PDF documents first
  for (const doc of processedDocuments) {
    if (doc.source.media_type === 'application/pdf') {
      console.log('Processing PDF document:', doc.source.media_type);
      currentContent.push({
        type: "text",
        text: `PDF Content: ${doc.source.data}`
      });
    }
  }

  // Handle image data if present
  if (imageData) {
    console.log('Processing image upload:', {
      type: imageData.type,
      dataLength: imageData.data.length
    });
    
    if (imageData.type.startsWith('image/')) {
      currentContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: imageData.type,
          data: imageData.data
        }
      });
    }
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