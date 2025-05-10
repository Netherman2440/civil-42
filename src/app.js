// --- src/app.js ---
import { Conversation } from '@11labs/client';
import { ConversationState } from './utils/conversationState';
import { ConversationStorage } from './utils/conversationStorage';
import { getRandomScenario } from './utils/scenarios';
import { marked } from 'marked';

import { createAnalysisPrompt } from './@prompts/analysis';
import { createAutoTitlePrompt } from './@prompts/autotitle';

// Import the OpenAI service
import openaiService from './utils/openaiService';

//dotenv.config();

//const apiKey = process.env.OPENAI_API_KEY;
//console.log(apiKey); // Sprawdź, czy klucz jest poprawnie załadowany

// Global variables
let conversation = null;
let timerInterval = null;
let seconds = 0;
let currentConversationState = new ConversationState();
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
document.getElementById('deleteCurrentConversationButton').addEventListener('click', deleteCurrentConversation);

// Error handling
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

resetAndShowHomeView();

// View Management Functions
function showView(viewToShow) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
        view.classList.remove('active-view');
    });
    
    // Show the requested view
    viewToShow.style.display = 'block';
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
    
    // Get a random scenario
    const scenarioData = getRandomScenario();
    const scenario = `${scenarioData.title}: ${scenarioData.description}`;
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

async function performAnalysis() {
    if (!currentConversationState) return;

    // Get transcription and duration
    const transcription = currentConversationState.getTranscription();
    const duration = currentConversationState.getDuration();
    const scenario = currentConversationState.scenario;

    // Create prompts
    const analysisPromptText = createAnalysisPrompt(duration, scenario, transcription);
    const autoTitlePromptText = createAutoTitlePrompt(transcription);
    
    // Format messages for OpenAI API
    const analysisMessages = [
        { role: 'system', content: analysisPromptText }
    ];
    
    const autoTitleMessages = [
        { role: 'system', content: autoTitlePromptText },
    ];

    // Perform API calls concurrently
    try {
        const [analysisResponse, autoTitleResponse] = await Promise.all([
            openaiService.generateResponse(analysisMessages, false),
            openaiService.generateResponse(autoTitleMessages, false)
        ]);

        // Log results to console
        console.log('Analysis Result:', analysisResponse);
        console.log('Auto Title Result:', autoTitleResponse);

        // Set the results in the current conversation state
        currentConversationState.setSummary(analysisResponse);
        currentConversationState.setTitle(autoTitleResponse);

    } catch (error) {
        console.error('Error performing analysis:', error);
    }
}

async function endConversation() {
    if (conversation) {
        await conversation.endSession();
        conversation = null;
    }

    stopTimer();
    
    // Hide conversation interface and show analysis in progress
    scenarioDisplay.style.display = 'none';
    conversationInterface.style.display = 'none';
    analysisInProgress.style.display = 'block';
    
    if (currentConversationState) {
        // Perform actual analysis
        await performAnalysis();

        // Save the updated conversation state
        conversationStorage.saveConversation(currentConversationState);

        // Hide the loader when analysis is complete
        document.querySelector('#analysisInProgress .loader').style.display = 'none';
        
        // Update the message to indicate analysis is complete
        document.querySelector('#analysisInProgress p').textContent = 'Analysis complete!';

        // Enable the Go to Summary button
        document.getElementById('goToSummaryButton').disabled = false;
    }
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
        const displayTitle = conv.title ? conv.title : "Title";
        option.textContent = `${date.toLocaleTimeString()} - ${displayTitle}`;
        
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
    
    // Display title in blue (replacing the "Title" label)
    document.getElementById('titleContent').textContent = conv.title || '';

    
    // Display only scenario content without the "Scenario" label
    document.getElementById('scenarioContent').textContent = conv.scenario || 'No scenario available';
    
    // Display summary and report - render markdown for summary
    const summaryElement = document.getElementById('summaryContent');
    if (conv.summary) {
        summaryElement.innerHTML = marked.parse(conv.summary);
    } else {
        summaryElement.textContent = 'No summary available';
    }
    
    document.getElementById('reportContent').textContent = conv.report || 'No report available';
}

// Saved Conversations Display
function displaySavedConversations() {
    // Get all saved conversations
    const conversations = conversationStorage.getAllConversations();
    
    // If there are no saved conversations, show a message and return
    if (conversations.length === 0) {
        alert('No saved conversations available.');
        return;
    }
    
    // Sort conversations by start time (newest first)
    conversations.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    // Get the most recent conversation
    const mostRecent = conversations[0];
    if (!mostRecent) {
        alert('No saved conversations available.');
        return;
    }
    // Create a new conversation state based on the most recent one
    currentConversationState = new ConversationState(mostRecent.id);
    currentConversationState.scenario = mostRecent.scenario;
    currentConversationState.summary = mostRecent.summary;
    currentConversationState.report = mostRecent.report;
    currentConversationState.title = mostRecent.title;
    currentConversationState.startTime = new Date(mostRecent.startTime);
    currentConversationState.endTime = mostRecent.endTime ? new Date(mostRecent.endTime) : null;
    currentConversationState.messages = [...mostRecent.messages];
    
    // Show the summary view with the current conversation
    showSummaryView();
    
    // Set the selector to the most recent conversation
    document.getElementById('conversationSelect').value = mostRecent.id;
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

// Function to delete the current conversation
function deleteCurrentConversation() {
  const selector = document.getElementById('conversationSelect');
  const selectedId = selector.value;
  
  if (!selectedId) {
    alert('No conversation selected.');
    return;
  }
  
  if (confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
    // Delete the conversation
    conversationStorage.deleteConversation(selectedId);
    
    // Update the conversation selector
    populateConversationSelector();
    
    // If there are still conversations, load the first one
    const conversations = conversationStorage.getAllConversations();
    if (conversations.length > 0) {
      loadConversationSummary(conversations[0].id);
    } else {
      // If no conversations left, go back to home
      resetAndShowHomeView();
    }

  }
}

// Class to manage conversation state




// Initialize the app



