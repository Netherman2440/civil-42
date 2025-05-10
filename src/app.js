// --- src/app.js ---
import { Conversation } from '@11labs/client';

let conversation = null;
let timerInterval = null;
let seconds = 0;
let currentConversationState = null; // Current conversation state
const conversationStorage = new ConversationStorage(); // Initialize storage

document.getElementById('startButton').addEventListener('click', startConversation);
document.getElementById('endButton').addEventListener('click', endConversation);
document.getElementById('showSavedConversationsButton').addEventListener('click', displaySavedConversations);

window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

async function requestMicrophonePermission() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        return true;
    } catch (error) {
        console.error('Microphone permission denied:', error);
        return false;
    }
}

async function getSignedUrl() {
    try {
        const response = await fetch('/api/signed-url');
        if (!response.ok) throw new Error('Failed to get signed URL');
        const data = await response.json();
        return data.signedUrl;
    } catch (error) {
        console.error('Error getting signed URL:', error);
        throw error;
    }
}


function updateStatus(isConnected) {
    const statusElement = document.getElementById('connectionStatus');
    statusElement.textContent = isConnected ? 'Connected' : 'Disconnected';
    statusElement.classList.toggle('connected', isConnected);
}

function updateSpeakingStatus(mode) {
    const statusElement = document.getElementById('speakingStatus');
    // Update based on the exact mode string we receive
    const isSpeaking = mode.mode === 'speaking';
    statusElement.textContent = isSpeaking ? 'Operator Speaking' : 'Operator Silent';
    statusElement.classList.toggle('speaking', isSpeaking);
    //console.log('Speaking status updated:', { mode, isSpeaking }); // Debug log
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    seconds = 0;
    
    timerInterval = setInterval(() => {
        seconds++;
        
        const timerElement = document.getElementById('timer');
        timerElement.textContent = `Conversation time: ${seconds} seconds`;
        
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

async function startConversation() {
    const startButton = document.getElementById('startButton');
    const endButton = document.getElementById('endButton');
    
    try {
        // Create new conversation state
        currentConversationState = new ConversationState();
        
        // For demo purposes, set a sample scenario
        // In a real app, you might want to select this from a dropdown or fetch from an API
        currentConversationState.setScenario("Sample emergency scenario: Report a car accident");
        
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            alert('Microphone permission is required for the conversation.');
            return;
        }

        const signedUrl = await getSignedUrl();
        //const agentId = await getAgentId();
        
        conversation = await Conversation.startSession({
            signedUrl: signedUrl,
            //agentId: agentId,
            onConnect: () => {
                console.log('Connected');
                updateStatus(true);
                startButton.disabled = true;
                endButton.disabled = false;
            },
            onDisconnect: () => {
                console.log('Disconnected');
                stopTimer();
                updateStatus(false);
                startButton.disabled = false;
                endButton.disabled = true;
                updateSpeakingStatus({ mode: 'listening' });
                
                // Save conversation state when disconnected
                if (currentConversationState) {
                    currentConversationState.endConversation();
                    conversationStorage.saveConversation(currentConversationState);
                }
            },
            onError: (error) => {
                console.error('Conversation error:', error);
                alert('An error occurred during the conversation.');
            },
            onModeChange: (mode) => {
                updateSpeakingStatus(mode);
            },
            onMessage: (message) => {
                addMessageToHistory(message.message, message.role === 'user');
            }
        });

        startTimer();
    } catch (error) {
        console.error('Error starting conversation:', error);
        alert('Failed to start conversation. Please try again.');
    }
}

async function endConversation() {
    if (conversation) {
        await conversation.endSession();
        conversation = null;
    }

    stopTimer();
    
    // Generate summary and report (in a real app, this would call an AI service)
    if (currentConversationState) {
        // For demo purposes, we'll just create simple summary and report
        currentConversationState.setSummary("This is an auto-generated summary of the conversation.");
        currentConversationState.setReport("This is an auto-generated emergency report.");
        
        // Save the final state
        currentConversationState.endConversation();
        conversationStorage.saveConversation(currentConversationState);
        
        // Display a message that the conversation was saved
        alert(`Conversation saved with ID: ${currentConversationState.id}`);
    }
}



// Funkcja do aktualizacji historii rozmowy
function addMessageToHistory(message, isUser = false) {
    const historyContainer = document.getElementById('conversationHistory');
    
    // Utwórz nowy element div dla wiadomości
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isUser ? 'user-message' : 'agent-message');
    
    // Dodaj zawartość wiadomości
    messageElement.textContent = message;
    
    // Dodaj wiadomość do kontenera historii
    historyContainer.appendChild(messageElement);
    
    // Przewiń kontener do najnowszej wiadomości
    historyContainer.scrollTop = historyContainer.scrollHeight;
    
    // Add message to current conversation state
    if (currentConversationState) {
        currentConversationState.addMessage(message, isUser);
    }
    
    // Debug log to verify message is being added
    console.log('Added message to history:', { message, isUser });
}

// Class to manage conversation state
class ConversationState {
  constructor(id = null) {
    this.id = id || this.generateId();
    this.messages = [];
    this.scenario = ""; // Will contain scenario description
    this.summary = ""; // Will be generated by AI after conversation
    this.report = ""; // Will be generated by AI as official report
    this.startTime = new Date();
    this.endTime = null;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  addMessage(message, isUser) {
    this.messages.push({
      text: message,
      isUser: isUser,
      timestamp: new Date()
    });
  }

  setScenario(scenario) {
    this.scenario = scenario;
  }

  setSummary(summary) {
    this.summary = summary;
  }

  setReport(report) {
    this.report = report;
  }

  endConversation() {
    this.endTime = new Date();
  }

  getDuration() {
    const end = this.endTime || new Date();
    return Math.floor((end - this.startTime) / 1000); // Duration in seconds
  }
}

// Storage manager for conversations
class ConversationStorage {
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

// Function to display all saved conversations (you can add this to a button)
function displaySavedConversations() {
    const conversations = conversationStorage.getAllConversations();
    console.log('Saved conversations:', conversations);
    
    // Here you could populate a dropdown or list with the conversations
    // For example:
    const container = document.getElementById('savedConversations');
    if (container) {
        container.innerHTML = '';
        
        if (conversations.length === 0) {
            container.innerHTML = '<p>No saved conversations</p>';
            return;
        }
        
        conversations.forEach(conv => {
            const item = document.createElement('div');
            item.classList.add('saved-conversation');
            
            const date = new Date(conv.startTime);
            item.innerHTML = `
                <h3>Conversation ${conv.id}</h3>
                <p>Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</p>
                <p>Scenario: ${conv.scenario || 'None'}</p>
                <p>Messages: ${conv.messages.length}</p>
                <button class="load-btn" data-id="${conv.id}">Load</button>
                <button class="delete-btn" data-id="${conv.id}">Delete</button>
            `;
            
            container.appendChild(item);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.load-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                loadConversation(id);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                deleteConversation(id);
            });
        });
    }
}

// Function to load a conversation
function loadConversation(id) {
    const conv = conversationStorage.getConversationById(id);
    if (!conv) return;
    
    // Clear current conversation history
    const historyContainer = document.getElementById('conversationHistory');
    historyContainer.innerHTML = '';
    
    // Load conversation messages
    conv.messages.forEach(msg => {
        addMessageToHistory(msg.text, msg.isUser);
    });
    
    // Display scenario, summary and report
    alert(`Scenario: ${conv.scenario}\nSummary: ${conv.summary}\nReport: ${conv.report}`);
}

// Function to delete a conversation
function deleteConversation(id) {
    if (confirm('Are you sure you want to delete this conversation?')) {
        conversationStorage.deleteConversation(id);
        displaySavedConversations(); // Refresh the list
    }
}

