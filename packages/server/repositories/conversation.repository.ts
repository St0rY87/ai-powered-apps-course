// Implementation detail
export type ChatMessage = {
   role: 'system' | 'user' | 'assistant' | 'bot';
   content: string;
};

// store last response id per conversation
const lastResponseIds = new Map<string, string>();
// store message history per conversation (used by providers that require full history)
const messageHistory = new Map<string, ChatMessage[]>();

// how many messages to keep in memory per conversation (default 10)
const HISTORY_LIMIT = Number(process.env.CONVERSATION_HISTORY_LIMIT ?? 10);

export const conversationRepository = {
   getLastResponseId(conversationId: string) {
      return lastResponseIds.get(conversationId);
   },
   setLastResponseId(conversationId: string, responseId: string) {
      lastResponseIds.set(conversationId, responseId);
   },

   // History helpers
   getConversationMessages(conversationId: string) {
      return messageHistory.get(conversationId) ?? [];
   },
   appendMessage(conversationId: string, message: ChatMessage) {
      const list = messageHistory.get(conversationId) ?? [];
      list.push(message);
      // Trim to last HISTORY_LIMIT messages to avoid unbounded growth
      if (list.length > HISTORY_LIMIT) {
         const start = list.length - HISTORY_LIMIT;
         const trimmed = list.slice(start);
         messageHistory.set(conversationId, trimmed);
      } else {
         messageHistory.set(conversationId, list);
      }
   },
   // optional helper to clear conversation
   clearConversation(conversationId: string) {
      messageHistory.delete(conversationId);
      lastResponseIds.delete(conversationId);
   },
};
