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
    historyLength: conversationHistory.length,
    hasCurrentMessage: !!currentMessage,
    documentCount: processedDocuments.length,
    hasImage: !!imageData
  });

  // Add processed documents as text content
  for (const doc of processedDocuments) {
    const docContent = `Document content (${doc.source.media_type}): ${doc.source.data}`;
    if (docContent.length > MAX_TOKENS_PER_MESSAGE * 4) { // Approximate token count
      console.log('Skipping document due to length:', doc.source.media_type);
      continue;
    }
    
    messages.push({
      role: "user",
      content: [{ 
        type: "text", 
        text: docContent
      }]
    });
  }

  // Add limited conversation history
  if (conversationHistory?.length > 0) {
    const recentHistory = conversationHistory.slice(-MAX_HISTORY_MESSAGES);
    console.log('Adding conversation history:', recentHistory.length, 'messages');
    messages.push(...recentHistory.map(msg => ({
      role: msg.role,
      content: [{ type: "text", text: msg.message }]
    })));
  }

  // Process current message and image
  const currentContent = [];
  
  if (imageData) {
    try {
      console.log('Processing new image upload:', {
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
      } else {
        // Handle non-image uploads as text
        currentContent.push({
          type: "text",
          text: `Document content (${imageData.type}): ${imageData.data}`
        });
      }
      
      console.log('Successfully added content to message');
    } catch (error) {
      console.error('Error processing uploaded content:', error);
    }
  }

  if (currentMessage) {
    currentContent.push({ type: "text", text: currentMessage });
  }
  
  if (currentContent.length > 0) {
    messages.push({
      role: "user",
      content: currentContent
    });
  }

  return messages;
};