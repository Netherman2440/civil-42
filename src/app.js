// --- src/app.js ---
import { Conversation } from '@11labs/client';

let conversation = null;
let timerInterval = null;
let seconds = 0;

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

async function getAgentId() {
    const response = await fetch('/api/getAgentId');
    const { agentId } = await response.json();
    return agentId;
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
    statusElement.textContent = isSpeaking ? 'Agent Speaking' : 'Agent Silent';
    statusElement.classList.toggle('speaking', isSpeaking);
    console.log('Speaking status updated:', { mode, isSpeaking }); // Debug log
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
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            alert('Microphone permission is required for the conversation.');
            return;
        }

        const signedUrl = await getSignedUrl();
        //const agentId = await getAgentId(); // You can switch to agentID for public agents
        
        conversation = await Conversation.startSession({
            signedUrl: signedUrl,
            //agentId: agentId, // You can switch to agentID for public agents
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
                updateSpeakingStatus({ mode: 'listening' }); // Reset to listening mode on disconnect
            },
            onError: (error) => {
                console.error('Conversation error:', error);
                alert('An error occurred during the conversation.');
            },
            onModeChange: (mode) => {
                //console.log('Mode changed:', mode); // Debug log to see exact mode object
                updateSpeakingStatus(mode);
            },
            onMessage: (message) => {
                console.log('Message received:', message);
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
}

document.getElementById('startButton').addEventListener('click', startConversation);
document.getElementById('endButton').addEventListener('click', endConversation);

window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

// Funkcja do jednorazowego ustawienia tekstu
function setWelcomeMessage(userName) {
    const welcomeElement = document.getElementById('welcomeMessage');
    welcomeElement.textContent = `Witaj ${userName}! Możesz rozpocząć rozmowę z agentem.`;
    
    // Możesz również dodać dodatkowe style
    welcomeElement.classList.add('welcome-active');
}

// Wywołaj tę funkcję raz, np. po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    setWelcomeMessage('Użytkowniku'); // Możesz przekazać imię użytkownika
    
    // Dodaj testową wiadomość, aby sprawdzić, czy historia konwersacji działa
    addMessageToHistory('Witaj! Jestem agentem AI. Jak mogę Ci pomóc?', false);
    addMessageToHistory('Cześć! Mam pytanie...', true);
});

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
    
    // Debug log to verify message is being added
    console.log('Added message to history:', { message, isUser });
}