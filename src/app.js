// --- src/app.js ---
import { Conversation } from '@11labs/client';

// Global variables
let conversation = null;
let timerInterval = null;
let seconds = 0;
let currentConversationState = null;
const conversationStorage = new ConversationStorage();
let countdownInterval = null;

// DOM Elements
const homeView = document.getElementById('homeView');
const summaryView = document.getElementById('summaryView');
const scenarioDisplay = document.getElementById('scenarioDisplay');
const conversationInterface = document.getElementById('conversationInterface');
const analysisInProgress = document.getElementById('analysisInProgress');
const welcomeMessage = document.querySelector('.welcome-message');  //?

// Event Listeners
document.getElementById('startTestButton').addEventListener('click', prepareScenario);
document.getElementById('endButton').addEventListener('click', endConversation);
document.getElementById('showSavedConversationsButton').addEventListener('click', displaySavedConversations);
document.getElementById('goToSummaryButton').addEventListener('click', showSummaryView);
document.getElementById('backToHomeButton').addEventListener('click', resetAndShowHomeView);
document.getElementById('conversationSelect').addEventListener('change', loadSelectedConversation);

// Error handling
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

resetAndShowHomeView();

// View Management Functions
function showView(viewToShow) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active-view');
    });
    
    // Show the requested view
    viewToShow.classList.add('active-view');
}

function resetAndShowHomeView() {
    // Reset home view to initial state
    welcomeMessage.style.display = 'block';
    scenarioDisplay.style.display = 'none';
    conversationInterface.style.display = 'none';
    analysisInProgress.style.display = 'none';
    
    // Reset UI elements
    document.getElementById('connectionStatus').textContent = 'Disconnected';
    document.getElementById('connectionStatus').classList.remove('connected');
    document.getElementById('speakingStatus').textContent = 'Operator Silent';
    document.getElementById('speakingStatus').classList.remove('speaking');
    document.getElementById('timer').textContent = 'Conversation time: 0 seconds';
    document.getElementById('conversationHistory').innerHTML = '';
    
    // Show home view
    showView(homeView);
}

function showSummaryView() {
    // Populate conversation selector
    populateConversationSelector();
    
    // Load the current conversation if available
    if (currentConversationState) {
        loadConversationSummary(currentConversationState.id);
    }
    
    // Show summary view
    showView(summaryView);
}

// Scenario and Conversation Functions
function prepareScenario() {
    // Hide welcome message
    welcomeMessage.style.display = 'none';
    
    // Create new conversation state
    currentConversationState = new ConversationState();
    
    // Set a sample scenario (in a real app, this would be randomly selected)
    const scenario = "Sample emergency scenario: Report a car accident on Main Street. There are two injured people.";
    currentConversationState.setScenario(scenario);
    
    // Display scenario
    document.getElementById('scenarioText').textContent = scenario;
    scenarioDisplay.style.display = 'block';
    
    // Start countdown
    startCountdown();
}

function startCountdown() {
    let count = 5;
    const countdownElement = document.getElementById('countdown');
    
    countdownElement.textContent = count;
    countdownElement.style.display = 'block';
    
    countdownInterval = setInterval(() => {
        count--;
        countdownElement.textContent = count;
        
        if (count <= 0) {
            clearInterval(countdownInterval);
            countdownElement.style.display = 'none';
            startConversation();
        }
    }, 1000);
}

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
    const isSpeaking = mode.mode === 'speaking';
    statusElement.textContent = isSpeaking ? 'Operator Speaking' : 'Operator Silent';
    statusElement.classList.toggle('speaking', isSpeaking);
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
    // Hide scenario display and show conversation interface
    scenarioDisplay.style.display = 'none';
    conversationInterface.style.display = 'block';
    
    try {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            alert('Microphone permission is required for the conversation.');
            return;
        }

        const signedUrl = await getSignedUrl();
        
        conversation = await Conversation.startSession({
            signedUrl: signedUrl,
            onConnect: () => {
                console.log('Connected');
                updateStatus(true);
                startTimer();
                
               
            },
            onDisconnect: () => {
                console.log('Disconnected');
                stopTimer();
                updateStatus(false);
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
    
    // Hide conversation interface and show analysis in progress
    conversationInterface.style.display = 'none';
    analysisInProgress.style.display = 'block';
    
    if (currentConversationState) {
        // For demo purposes, we'll just create simple summary and report
        currentConversationState.setSummary("This is an auto-generated summary of the conversation.");
        currentConversationState.setReport("This is an auto-generated emergency report.");
        
        // Save the final state
        currentConversationState.endConversation();
        conversationStorage.saveConversation(currentConversationState);
        
        // Simulate API call to generate summary and report
        simulateAnalysis();
    }
}

function simulateAnalysis() {
    // Simulate API call delay
    setTimeout(() => {
        // Enable the Go to Summary button
        document.getElementById('goToSummaryButton').disabled = false;
    }, 3000);
}

function addMessageToHistory(message, isUser = false) {
    const historyContainer = document.getElementById('conversationHistory');
    
    // Create new message element
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isUser ? 'user-message' : 'agent-message');
    
    // Add message content
    messageElement.textContent = message;
    
    // Add message to container
    historyContainer.appendChild(messageElement);
    
    // Scroll to latest message
    historyContainer.scrollTop = historyContainer.scrollHeight;
    
    // Add message to current conversation state
    if (currentConversationState) {
        currentConversationState.addMessage(message, isUser);
    }
}

// Summary View Functions
function populateConversationSelector() {
    const selector = document.getElementById('conversationSelect');
    selector.innerHTML = '';
    
    const conversations = conversationStorage.getAllConversations();
    
    conversations.forEach(conv => {
        const option = document.createElement('option');
        option.value = conv.id;
        
        const date = new Date(conv.startTime);
        option.textContent = `${date.toLocaleDateString()} ${date.toLocaleTimeString()} - ${conv.scenario.substring(0, 30)}...`;
        
        selector.appendChild(option);
    });
    
    // Select current conversation if available
    if (currentConversationState) {
        selector.value = currentConversationState.id;
    }
}

function loadSelectedConversation() {
    const selector = document.getElementById('conversationSelect');
    const selectedId = selector.value;
    
    if (selectedId) {
        loadConversationSummary(selectedId);
    }
}

function loadConversationSummary(id) {
    const conv = conversationStorage.getConversationById(id);
    if (!conv) return;
    
    // Display summary and report
    document.getElementById('summaryContent').textContent = conv.summary || 'No summary available';
    document.getElementById('reportContent').textContent = conv.report || 'No report available';
}

// Saved Conversations Display
function displaySavedConversations() {
    const conversations = conversationStorage.getAllConversations();
    console.log('Saved conversations:', conversations);
    
    // Create a modal to display saved conversations
    const modal = document.createElement('div');
    modal.classList.add('modal');
    
    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');
    
    const closeButton = document.createElement('span');
    closeButton.classList.add('close-button');
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => document.body.removeChild(modal);
    
    modalContent.appendChild(closeButton);
    
    const title = document.createElement('h2');
    title.textContent = 'Saved Conversations';
    modalContent.appendChild(title);
    
    const conversationsList = document.createElement('div');
    conversationsList.classList.add('conversations-list');
    
    if (conversations.length === 0) {
        conversationsList.innerHTML = '<p>No saved conversations</p>';
    } else {
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
            
            conversationsList.appendChild(item);
        });
    }
    
    modalContent.appendChild(conversationsList);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Add event listeners to buttons
    document.querySelectorAll('.load-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            loadConversation(id);
            document.body.removeChild(modal);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            deleteConversation(id);
            // Refresh the list
            document.body.removeChild(modal);
            displaySavedConversations();
        });
    });
}

// Function to load a conversation
function loadConversation(id) {
    const conv = conversationStorage.getConversationById(id);
    if (!conv) return;
    
    // Set as current conversation
    currentConversationState = new ConversationState(conv.id);
    currentConversationState.scenario = conv.scenario;
    currentConversationState.summary = conv.summary;
    currentConversationState.report = conv.report;
    currentConversationState.startTime = new Date(conv.startTime);
    currentConversationState.endTime = conv.endTime ? new Date(conv.endTime) : null;
    currentConversationState.messages = [...conv.messages];
    
    // Show summary view with this conversation
    showSummaryView();
}

// Function to delete a conversation
function deleteConversation(id) {
    if (confirm('Are you sure you want to delete this conversation?')) {
        conversationStorage.deleteConversation(id);
    }
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

// Initialize the app


