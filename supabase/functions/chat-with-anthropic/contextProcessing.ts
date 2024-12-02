const MAX_CONTEXT_TOKENS = 50000; // Conservative limit

export const truncateContext = (context: string): string => {
  // Approximate token count (4 chars per token)
  if (context.length > MAX_CONTEXT_TOKENS * 4) {
    console.log('Truncating context from', context.length, 'to', MAX_CONTEXT_TOKENS * 4);
    return context.slice(0, MAX_CONTEXT_TOKENS * 4);
  }
  return context;
};