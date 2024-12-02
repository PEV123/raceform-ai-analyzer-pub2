const MAX_CONTEXT_LENGTH = 150000; // Conservative limit to leave room for messages

export const truncateContext = (context: string): string => {
  // Approximate token count (4 chars per token)
  const approximateTokens = context.length / 4;
  
  console.log('Context size:', {
    characters: context.length,
    approximateTokens,
    limit: MAX_CONTEXT_LENGTH
  });
  
  if (approximateTokens > MAX_CONTEXT_LENGTH) {
    console.log('Truncating context from', approximateTokens, 'to', MAX_CONTEXT_LENGTH);
    // Take first part of context up to limit
    const truncated = context.slice(0, MAX_CONTEXT_LENGTH * 4);
    return truncated;
  }
  return context;
};