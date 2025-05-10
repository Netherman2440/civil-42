// Storage manager for conversations
export class ConversationStorage {
    constructor() {
      this.storageKey = 'savedConversations';
    }
  
    saveConversation(conversation) {
      const savedConversations = this.getAllConversations();
      
      // Check if conversation already exists
      const index = savedConversations.findIndex(c => c.id === conversation.id);
      
      if (index !== -1) {
        // Update existing conversation
        savedConversations[index] = conversation;
      } else {
        // Add new conversation
        savedConversations.push(conversation);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(savedConversations));
    }
  
    getAllConversations() {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    }
  
    getConversationById(id) {
      const conversations = this.getAllConversations();
      return conversations.find(c => c.id === id);
    }
  
    deleteConversation(id) {
      let conversations = this.getAllConversations();
      conversations = conversations.filter(c => c.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(conversations));
    }
  
    clearAllConversations() {
      localStorage.removeItem(this.storageKey);
    }
  }