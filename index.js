/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from "@google/genai";

const AI_AVATAR_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuA9T1sgk5SJhetyMEYiJgZdqlBOKqsudEBYvvWDHx_cmK13uMV6wG8UMYxaXz6zB4MIfvyUKAmXdlXdtSqTW2Zx5Ct5GSGZ0lu5lEW59f4XbHihQGFg9PTsx1q33s7wtOgXzNMrb_-y0LK-Va5C9pkNNqKrI_Pu0COg_auvu3ypzqjTj-L_3zS0-x3ay_-HF9ZnFuzQYmczRC_lFYedWXYOSOSSUomvBDOOwl3LmWDMqryiwwdyNjXUBqctqdV0vAPAAk45nKobo40";
const USER_AVATAR_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuB9SvUR84BUcmPrDbCzHYG6jBiJWyhIKekj08DbWfbqENpqVglzrst16xZhZMaSBaloXsQI4SPwo1ytdpTnDHU6mAasDhQvejiVjBg89FUtADZWqIfLBn585m7bFnSqVKy-anc0UzGOMbBzYRGaj23-bdkAWtTagqGsb8bmEfppSbQ3EuSqv3KVLaHzMg_e3tYMsMT5P3HWUfk9c1UeN4U4svNDy_qMQdx4E3NKUsOCNBhShoh7bCtnabXgeLUrg2QMv-NSo3ARDHg";
const TEXT_MODEL_NAME = "gemini-2.5-flash-preview-04-17";
const IMAGE_MODEL_NAME = "imagen-3.0-generate-002";
const GEMINI_API_KEY = process.env.API_KEY;

// Screen IDs
const SPLASH_SCREEN_ID = "splash-screen";
const ONBOARDING_SCREEN_ID = "onboarding-screen";
const SIGNIN_SCREEN_ID = "signin-screen";
const CHAT_LIST_SCREEN_ID = "chat-list-screen";
const CHAT_SCREEN_ID = "chat-screen";
const SETTINGS_SCREEN_ID = "settings-screen";
const PROFILE_SCREEN_ID = "profile-screen";
const WEBVIEW_SCREEN_ID = "webview-screen";
const IMAGE_VIEWER_SCREEN_ID = "image-viewer-screen";
const CODE_CANVAS_SCREEN_ID = "code-canvas-screen";
const IMAGE_STUDIO_SCREEN_ID = "image-studio-screen";


// DOM Elements
let chatMessagesContainer = null;
let chatInput = null;
let sendButton = null;
let suggestedPromptButtons; 
let micButton = null;
let micButtonContainer = null;
let voiceModeToggle = null;
let chatListItemsContainer = null;
let chatScreenTitleElement = null;
let novaProcessingIndicatorElement = null;
let novaImageProcessingIndicatorElement = null;
let processLogPanelElement = null;
let processLogListElement = null;
let toggleProcessLogButtonElement = null;
let processLogCloseButtonElement = null;
let generateImageChatButtonElement = null;


// Settings Elements
let aiToneRadios; 
let darkModeToggle = null;
let ttsToggle = null;
let internetSearchToggle = null;
let deepThinkingToggle = null;


// Profile Screen Elements
let profileUserName = null;
let profileUserEmail = null;
let profileInterests = null;
let profilePreferences = null;
let profileFacts = null;


// Webview Elements
let webviewScreenElement = null;
let webviewFrame = null;
let webviewTitle = null;
let webviewLoading = null;
let webviewCloseBtn = null;

// Image Viewer Elements
let imageViewerScreenElement = null;
let imageViewerImg = null;
let imageViewerCloseBtn = null;

// Onboarding Elements
let onboardingDots;
let onboardingNextBtn = null;
let onboardingSkipBtn = null;

// Code Canvas Elements
let codeCanvasButton = null;
let codeCanvasScreenElement = null;
let codeCanvasTextarea = null;
let codeCanvasCopyToChatButton = null;
let codeCanvasCloseButton = null;
let codeEditorWrapper = null;
let codeCanvasInlinePreviewIframe = null;
let codeCanvasToggleViewButton = null;
let codeCanvasEnterFullscreenButton = null;

let fullScreenPreviewOverlay = null;
let fullScreenPreviewIframe = null;
let fullScreenPreviewCloseButton = null;

let codeCanvasViewMode = 'code';
let debounceTimer;

// Image Studio Elements
let imageStudioPromptInput = null;
let imageStudioEngineSelect = null; 
let imageStudioAspectRatioSelect = null;
let imageStudioGenerateButton = null;
let imageStudioLoadingIndicator = null;
let imageStudioErrorMessageElement = null;
let imageStudioGridElement = null;
let imageStudioDownloadAllButton = null;
let currentGeneratedImagesData = [];


// Chat History Interfaces (structures described by usage)
// interface ChatMessage {
//   id: string;
//   sender: 'User' | 'Nova' | 'System';
//   text: string; // For text messages, or could be prompt for image messages
//   timestamp: number;
//   sources?: { uri: string, title: string }[];
//   detectedLanguage?: 'en' | 'ar' | 'unknown';
//   messageType?: 'text' | 'image'; 
//   imageData?: { 
//       base64: string;
//       mimeType: string;
//       promptForImage: string; 
//   };
// }


// interface ChatSession {
//   id:string;
//   title: string;
//   messages: ChatMessage[];
//   lastUpdated: number;
//   aiToneUsed?: string;
// }

// User Profile Interface for Memory (structure described by usage)
// interface UserProfile {
//     name?: string;
//     interests: string[];
//     preferences: { [key: string]: string };
//     facts: string[];
// }

// Global State
let currentScreen = SPLASH_SCREEN_ID;
const screens = [SPLASH_SCREEN_ID, ONBOARDING_SCREEN_ID, SIGNIN_SCREEN_ID, CHAT_LIST_SCREEN_ID, CHAT_SCREEN_ID, SETTINGS_SCREEN_ID, PROFILE_SCREEN_ID, WEBVIEW_SCREEN_ID, IMAGE_VIEWER_SCREEN_ID, CODE_CANVAS_SCREEN_ID, IMAGE_STUDIO_SCREEN_ID];
let ai;
let geminiChat;
let isLoading = false; // General loading for text generation
let isImageLoading = false; // Specific loading for image generation
let geminiInitialized = false;
let processLogVisible = false;
let simulatedProcessInterval;


let chatSessions = [];
let currentChatSessionId = null;
let userProfile = { interests: [], preferences: {}, facts: [] };


// Feature States
let isListening = false;
let ttsEnabled = false;
let currentAiTone = 'friendly';
let darkModeEnabled = true;
let voiceModeActive = false;
let manualTTScancelForMic = false;
let internetSearchEnabled = false;
let deepThinkingEnabled = false;
let currentImageEngine = 'standard'; // 'standard' or 'imagefx'


// Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.lang = navigator.language || 'en-US'; 
}

// --- Initialization ---
function initializeApp() {
  chatMessagesContainer = document.getElementById('chat-messages-container');
  chatInput = document.getElementById('chat-input');
  sendButton = document.getElementById('send-chat-button');
  suggestedPromptButtons = document.querySelectorAll('.suggested-prompt-btn');
  micButton = document.getElementById('mic-button');
  if (micButton) {
    micButtonContainer = micButton.parentElement?.parentElement;
  }
  voiceModeToggle = document.getElementById('voice-mode-toggle');
  chatListItemsContainer = document.getElementById('chat-list-items-container');
  chatScreenTitleElement = document.getElementById('chat-screen-title');
  novaProcessingIndicatorElement = document.getElementById('nova-processing-indicator');
  novaImageProcessingIndicatorElement = document.getElementById('nova-image-processing-indicator');
  
  processLogPanelElement = document.getElementById('process-log-panel');
  processLogListElement = document.getElementById('process-log-list');
  toggleProcessLogButtonElement = document.getElementById('toggle-process-log-btn');
  processLogCloseButtonElement = document.getElementById('process-log-close-btn');
  generateImageChatButtonElement = document.getElementById('generate-image-chat-button');


  aiToneRadios = document.querySelectorAll('input[name="ai_tone"]');
  darkModeToggle = document.getElementById('setting-dark-mode-toggle');
  ttsToggle = document.getElementById('setting-tts-toggle');
  internetSearchToggle = document.getElementById('setting-internet-search-toggle');
  deepThinkingToggle = document.getElementById('setting-deep-thinking-toggle');

  profileUserName = document.getElementById('profile-user-name');
  profileUserEmail = document.getElementById('profile-user-email');
  profileInterests = document.getElementById('profile-interests');
  profilePreferences = document.getElementById('profile-preferences');
  profileFacts = document.getElementById('profile-facts');

  webviewScreenElement = document.getElementById(WEBVIEW_SCREEN_ID);
  webviewFrame = document.getElementById('webview-frame');
  webviewTitle = document.getElementById('webview-title');
  webviewLoading = document.getElementById('webview-loading');
  webviewCloseBtn = document.getElementById('webview-close-btn');

  imageViewerScreenElement = document.getElementById(IMAGE_VIEWER_SCREEN_ID);
  imageViewerImg = document.getElementById('image-viewer-img');
  imageViewerCloseBtn = document.getElementById('image-viewer-close-btn');

  onboardingDots = document.querySelectorAll('#onboarding-dots .onboarding-dot');
  onboardingNextBtn = document.getElementById('onboarding-next-btn');
  onboardingSkipBtn = document.getElementById('onboarding-skip-btn');

  codeCanvasButton = document.getElementById('code-canvas-button');
  codeCanvasScreenElement = document.getElementById(CODE_CANVAS_SCREEN_ID);
  codeCanvasTextarea = document.getElementById('code-canvas-textarea');
  codeCanvasCopyToChatButton = document.getElementById('code-canvas-copy-to-chat-btn');
  codeCanvasCloseButton = document.getElementById('code-canvas-close-btn');
  codeEditorWrapper = document.getElementById('code-editor-wrapper');
  codeCanvasInlinePreviewIframe = document.getElementById('code-canvas-inline-preview-iframe');
  codeCanvasToggleViewButton = document.getElementById('code-canvas-toggle-view-btn');
  codeCanvasEnterFullscreenButton = document.getElementById('code-canvas-enter-fullscreen-btn');
  
  fullScreenPreviewOverlay = document.getElementById('full-screen-preview-overlay');
  fullScreenPreviewIframe = document.getElementById('full-screen-preview-iframe');
  fullScreenPreviewCloseButton = document.getElementById('full-screen-preview-close-btn');

  // Image Studio Elements
  imageStudioPromptInput = document.getElementById('image-studio-prompt-input');
  imageStudioEngineSelect = document.getElementById('image-studio-engine-select');
  imageStudioAspectRatioSelect = document.getElementById('image-studio-aspect-ratio-select');
  imageStudioGenerateButton = document.getElementById('image-studio-generate-btn');
  imageStudioLoadingIndicator = document.getElementById('image-studio-loading-indicator');
  imageStudioErrorMessageElement = document.getElementById('image-studio-error-message');
  imageStudioGridElement = document.getElementById('image-studio-grid');
  imageStudioDownloadAllButton = document.getElementById('image-studio-download-all-btn');


  if (typeof process === 'undefined') {
    window.process = { env: {} };
  }
   if (!GEMINI_API_KEY) {
      console.warn("API_KEY environment variable is not set. Gemini API calls will fail.");
  }

  loadSettings();
  loadUserProfile();
  applySettings(); 
  loadChatSessionsFromLocalStorage();
  initSplash();
  updateOnboardingUI();
  renderChatList();
  updateProfileScreenUI();
  setupEventListeners();

  window.addEventListener('load', () => {
    if(currentScreen === CHAT_SCREEN_ID) scrollToBottomChat();
  });
  console.log("Nova AI Mobile Initialized (v1.8.3 - Desktop Responsive).");
}

// --- Language Detection ---
function detectMessageLanguage(text) {
    if (!text) return 'unknown';
    const arabicRegex = /[\u0600-\u06FF]/;
    if (arabicRegex.test(text)) {
        return 'ar';
    }
    return 'en'; 
}

// --- Settings Logic ---
function loadSettings() {
    const validAiTones = ['friendly', 'formal', 'creative'];
    const defaultAiTone = 'friendly';

    const storedTone = localStorage.getItem('aiTone');
    if (storedTone) {
        try {
            const parsedTone = JSON.parse(storedTone);
            if (typeof parsedTone === 'string' && validAiTones.includes(parsedTone)) {
                currentAiTone = parsedTone;
            } else {
                console.warn(`Stored AI tone '${parsedTone}' is not a valid known tone. Defaulting to '${defaultAiTone}'.`);
                currentAiTone = defaultAiTone;
                saveSetting('aiTone', currentAiTone); // Re-save default correctly
            }
        } catch (e) {
            // Parsing failed. This means storedTone was not a valid JSON string.
            // It might be an old plain string value or corrupted.
            if (typeof storedTone === 'string' && validAiTones.includes(storedTone)) {
                console.warn(`Stored AI tone '${storedTone}' was not JSON. Using as raw string and re-saving as JSON.`);
                currentAiTone = storedTone;
                saveSetting('aiTone', currentAiTone); // Save it correctly as JSON string for next time
            } else {
                console.warn(`Invalid or unparsable AI tone '${storedTone}' in localStorage. Defaulting to '${defaultAiTone}'.`);
                currentAiTone = defaultAiTone;
                // Remove potentially bad value or re-save default
                localStorage.removeItem('aiTone'); 
                saveSetting('aiTone', currentAiTone);
            }
        }
    } else {
        // No stored tone, currentAiTone keeps its initialized default value ('friendly')
        // Optionally, save the default one if it's the first run or cleared
        // saveSetting('aiTone', currentAiTone); 
    }

    const storedDarkMode = localStorage.getItem('darkModeEnabled');
    darkModeEnabled = storedDarkMode ? JSON.parse(storedDarkMode) : true;

    const storedTts = localStorage.getItem('ttsEnabled');
    ttsEnabled = storedTts ? JSON.parse(storedTts) : false;

    const storedVoiceMode = localStorage.getItem('voiceModeActive');
    voiceModeActive = storedVoiceMode ? JSON.parse(storedVoiceMode) : false;

    const storedInternetSearch = localStorage.getItem('internetSearchEnabled');
    internetSearchEnabled = storedInternetSearch ? JSON.parse(storedInternetSearch) : false;

    const storedDeepThinking = localStorage.getItem('deepThinkingEnabled');
    deepThinkingEnabled = storedDeepThinking ? JSON.parse(storedDeepThinking) : false;

    const storedProcessLogVisible = localStorage.getItem('processLogVisible');
    processLogVisible = storedProcessLogVisible ? JSON.parse(storedProcessLogVisible) : false;

    const storedImageEngine = localStorage.getItem('currentImageEngine');
    currentImageEngine = storedImageEngine ? JSON.parse(storedImageEngine) : 'standard';
}

function applySettings() {
    document.querySelector(`input[name="ai_tone"][value="${currentAiTone}"]`)?.setAttribute('checked', 'true');
    aiToneRadios?.forEach(radio => {
        radio.checked = radio.value === currentAiTone;
    });

    if (darkModeToggle) darkModeToggle.checked = darkModeEnabled;
    document.body.classList.toggle('light-mode', !darkModeEnabled);

    if (ttsToggle) ttsToggle.checked = ttsEnabled;
    if (internetSearchToggle) internetSearchToggle.checked = internetSearchEnabled;
    if (deepThinkingToggle) deepThinkingToggle.checked = deepThinkingEnabled;

    if (voiceModeToggle) {
        voiceModeToggle.classList.toggle('active', voiceModeActive);
        voiceModeToggle.setAttribute('aria-pressed', String(voiceModeActive));
    }
    if (chatInput) {
        chatInput.disabled = voiceModeActive;
        chatInput.classList.toggle('opacity-50', voiceModeActive);
        chatInput.placeholder = voiceModeActive ? "Voice mode active..." : "Ask Nova anything...";
        chatInput.dir = "auto"; 
    }
    if (processLogPanelElement) {
        processLogPanelElement.classList.toggle('open', processLogVisible);
    }
    if (toggleProcessLogButtonElement) {
        toggleProcessLogButtonElement.classList.toggle('active', processLogVisible);
    }
    if (imageStudioEngineSelect) {
        imageStudioEngineSelect.value = currentImageEngine;
    }
}

function saveSetting(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// --- User Profile (Memory) Logic ---
function loadUserProfile() {
    const storedProfile = localStorage.getItem('userProfileData');
    if (storedProfile) {
        userProfile = JSON.parse(storedProfile);
    }
}

function saveUserProfile() {
    localStorage.setItem('userProfileData', JSON.stringify(userProfile));
}

async function extractAndStoreUserInfo(chatSession) {
    if (!ai || !geminiInitialized) {
        console.warn("Gemini AI not ready for info extraction.");
        return;
    }
    const messagesToConsider = chatSession.messages.slice(-6);
    if (messagesToConsider.length < 2) return;

    const conversationSnippet = messagesToConsider
        .map(m => `${m.sender === 'System' ? 'Context' : m.sender}: ${m.text}`)
        .join('\n');

    const extractionPrompt = `Based on the following conversation snippet, identify and extract any new or updated personal information about the 'User'. This includes their name (if mentioned and not already known), specific interests, explicit preferences (e.g., 'likes X', 'prefers Y over Z'), or distinct personal facts shared by the user.

Output the extracted information STRICTLY as a JSON object.
The JSON object should have one or more of the following keys if new information is found:
- "userName": string (user's name, if newly identified)
- "newInterests": array of strings (newly mentioned interests)
- "updatedPreferences": object (key-value pairs of preferences, e.g., {"favoriteColor": "blue"})
- "newFacts": array of strings (newly shared personal facts)

If no new or updated personal information is found for the User in this snippet, return an empty JSON object like {}.

Conversation Snippet:
${conversationSnippet}

JSON Output:`;

    let geminiResponse;
    try {
        geminiResponse = await ai.models.generateContent({
            model: TEXT_MODEL_NAME,
            contents: extractionPrompt,
            config: { temperature: 0.1, responseMimeType: "application/json" }
        });

        let jsonStr = geminiResponse.text.trim();
        const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[1]) {
            jsonStr = match[1].trim();
        }

        const extractedData = JSON.parse(jsonStr);

        if (Object.keys(extractedData).length === 0 || extractedData.noNewInfo) {
            return;
        }

        let profileUpdated = false;
        if (extractedData.userName && !userProfile.name) {
            userProfile.name = extractedData.userName;
            profileUpdated = true;
        }
        if (extractedData.newInterests && Array.isArray(extractedData.newInterests)) {
            const uniqueNewInterests = extractedData.newInterests.filter((interest) => !userProfile.interests.includes(interest));
            if (uniqueNewInterests.length > 0) {
                userProfile.interests.push(...uniqueNewInterests);
                profileUpdated = true;
            }
        }
        if (extractedData.newFacts && Array.isArray(extractedData.newFacts)) {
            const uniqueNewFacts = extractedData.newFacts.filter((fact) => !userProfile.facts.includes(fact));
            if (uniqueNewFacts.length > 0) {
                userProfile.facts.push(...uniqueNewFacts);
                profileUpdated = true;
            }
        }
        if (extractedData.updatedPreferences && typeof extractedData.updatedPreferences === 'object') {
            for (const [key, value] of Object.entries(extractedData.updatedPreferences)) {
                if (userProfile.preferences[key] !== value) {
                    userProfile.preferences[key] = value;
                    profileUpdated = true;
                }
            }
        }

        if (profileUpdated) {
            saveUserProfile();
            updateProfileScreenUI();
        }

    } catch (e) {
        console.error("Error extracting or parsing user info from Gemini:", e, "\nRaw response text:", geminiResponse?.text);
    }
}


function updateProfileScreenUI() {
    if (profileUserName) profileUserName.textContent = userProfile.name || "User Name";
    if (profileUserEmail && userProfile.name) { 
        profileUserEmail.textContent = `${userProfile.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    } else if (profileUserEmail) {
        profileUserEmail.textContent = "user.email@example.com";
    }

    if (profileInterests) profileInterests.textContent = userProfile.interests.length > 0 ? userProfile.interests.join(', ') : "Not yet recorded.";
    if (profilePreferences) {
        const prefsText = Object.entries(userProfile.preferences).map(([k, v]) => `${k}: ${v}`).join('; ');
        profilePreferences.textContent = prefsText || "Not yet recorded.";
    }
    if (profileFacts) profileFacts.textContent = userProfile.facts.length > 0 ? userProfile.facts.join('; ') : "Not yet recorded.";
}


// --- Screen Management ---
function showScreen(screenId) {
  const isOverlayScreen = screenId === WEBVIEW_SCREEN_ID || screenId === IMAGE_VIEWER_SCREEN_ID || screenId === CODE_CANVAS_SCREEN_ID;
  
  if (!isOverlayScreen) {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    if (isListening && screenId !== CHAT_SCREEN_ID && recognition) {
        recognition.stop();
    }
  }

  screens.forEach(id => {
    const screenElement = document.getElementById(id);
    if (screenElement) {
        if (id === WEBVIEW_SCREEN_ID || id === IMAGE_VIEWER_SCREEN_ID || id === CODE_CANVAS_SCREEN_ID) {
            screenElement.classList.toggle('active', screenId === id);
        } else {
            screenElement.style.display = (id === screenId) ? 'flex' : 'none';
        }
    }
  });

  if (screenId !== WEBVIEW_SCREEN_ID && screenId !== IMAGE_VIEWER_SCREEN_ID && screenId !== CODE_CANVAS_SCREEN_ID) {
      currentScreen = screenId;
      updateNavigationActiveState(screenId);
  }

  if (screenId === CHAT_SCREEN_ID) {
    scrollToBottomChat();
    if (!voiceModeActive && chatInput) chatInput.focus();
    if (!geminiInitialized) initializeGeminiSDK();
    const currentSession = chatSessions.find(s => s.id === currentChatSessionId);
    if (chatScreenTitleElement) chatScreenTitleElement.textContent = currentSession?.title || "Nova";

  } else if (screenId === CHAT_LIST_SCREEN_ID) {
    renderChatList();
  } else if (screenId === SETTINGS_SCREEN_ID) {
    document.querySelector(`input[name="ai_tone"][value="${currentAiTone}"]`).checked = true;
    if (darkModeToggle) darkModeToggle.checked = darkModeEnabled;
    if (ttsToggle) ttsToggle.checked = ttsEnabled;
    if (internetSearchToggle) internetSearchToggle.checked = internetSearchEnabled;
    if (deepThinkingToggle) deepThinkingToggle.checked = deepThinkingEnabled;
  } else if (screenId === PROFILE_SCREEN_ID) {
    updateProfileScreenUI();
  } else if (screenId === CODE_CANVAS_SCREEN_ID) {
      if(codeCanvasTextarea && codeCanvasViewMode === 'code') codeCanvasTextarea.focus(); 
      const isOpenedByPreviewButton = document.activeElement?.classList.contains('preview-code-btn');
      if (!isOpenedByPreviewButton) {
         setCodeCanvasView('code'); 
         if (codeCanvasEnterFullscreenButton) {
            codeCanvasEnterFullscreenButton.classList.add('hidden');
         }
      }
  } else if (screenId === IMAGE_STUDIO_SCREEN_ID) {
    if (!geminiInitialized) initializeGeminiSDK();
    if(imageStudioPromptInput) imageStudioPromptInput.focus();
    if(imageStudioEngineSelect) imageStudioEngineSelect.value = currentImageEngine;
  }
}

function updateNavigationActiveState(activeScreenId) {
    // Update Bottom Navigation (Mobile)
    document.querySelectorAll('.bottom-nav').forEach(nav => {
        nav.querySelectorAll('.nav-item').forEach(item => {
            const button = item;
            let itemTarget = button.dataset.target;
            const effectiveTarget = itemTarget === 'chat-list-screen-home' ? CHAT_LIST_SCREEN_ID : itemTarget;

            const isActive = (effectiveTarget === activeScreenId) || 
                             (item.id === 'chat-list-new-chat-nav-btn' && activeScreenId === CHAT_SCREEN_ID && !currentChatSessionId) ||
                             (item.id === 'profile-new-chat-nav-btn' && activeScreenId === CHAT_SCREEN_ID && !currentChatSessionId) ||
                             (item.id === 'image-studio-new-chat-nav-btn' && activeScreenId === CHAT_SCREEN_ID && !currentChatSessionId);

            button.classList.toggle('active', isActive);
            button.classList.toggle('text-[#19E5C6]', isActive);
            button.classList.toggle('text-[#7A9A94]', !isActive);
            
            button.querySelector('.material-symbols-outlined.filled')?.classList.toggle('text-[#19E5C6]', isActive);
            button.querySelector('.material-symbols-outlined.filled')?.classList.toggle('text-[#7A9A94]', !isActive);
            button.querySelector('.material-symbols-outlined:not(.filled)')?.classList.toggle('text-[#19E5C6]', isActive);
            button.querySelector('.material-symbols-outlined:not(.filled)')?.classList.toggle('text-[#7A9A94]', !isActive);

            const span = button.querySelector('span:last-child:not(.material-symbols-outlined)');
            if (span) {
                span.classList.toggle('font-medium', isActive);
                span.classList.toggle('text-[#19E5C6]', isActive);
                span.classList.toggle('text-[#7A9A94]', !isActive);
            }
        });
    });

    // Update Sidebar Navigation (Desktop)
    document.querySelectorAll('#desktop-sidebar .sidebar-nav-item').forEach(item => {
        const button = item;
        let itemTarget = button.dataset.target;
        const effectiveTarget = itemTarget === 'chat-list-screen-home' ? CHAT_LIST_SCREEN_ID : itemTarget;

        const isActive = (effectiveTarget === activeScreenId) ||
                         (item.id === 'sidebar-new-chat-nav-btn' && activeScreenId === CHAT_SCREEN_ID && !currentChatSessionId);
        
        button.classList.toggle('active', isActive);
        // Active styles for sidebar are primarily handled by CSS (.sidebar-nav-item.active)
        // but ensure filled icons if that's part of the design for active sidebar items
        button.querySelector('.material-symbols-outlined')?.classList.toggle('filled', isActive);
    });
}


// --- Splash Screen Logic ---
function initSplash() {
  setTimeout(() => {
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (onboardingComplete === 'true') {
      showScreen(CHAT_LIST_SCREEN_ID);
    } else {
      showScreen(ONBOARDING_SCREEN_ID);
    }
  }, 3000);
}

// --- Onboarding Logic ---
let currentOnboardingStep = 0;
const totalOnboardingSteps = 3;

const onboardingContent = [
    { title: "AI Assistant", main: "Your Personal AI Companion", sub: "Unlock the power of AI with our advanced chatbot. Get instant answers, creative inspiration, and personalized assistance anytime, anywhere.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDISnZDku6mxFufrdwyE8U_z3gRZvZUH6Sr7mxWY8opjTDKQYYYW4ButLoD-XUfyYe42PyqETKsHsJlrKL83tNQdCJE60dHYZf_WPlpQtZpJ0Zn1HKjhKBHrxuB0mY7ZlveDIl1oKPhbQT5GoxP-abVe_hkaPNsjY4FF-30GfB-wG9C456BvxyI7s1yE0A7J4CFCSN7SQhHazA_I8NTgQryctLNxst4uLDyUV-ZGE9ol4U8MzmCVKUkH5WsMdau8gpXcxZYvPD9Wj0" },
    { title: "Explore Features", main: "Discover a World of Possibilities", sub: "From drafting emails to planning trips, Nova is here to help you with a wide range of tasks efficiently.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9F5Xf9K4Y0B3r6KCRLRlpOIDnSt0o3h3QkOPB0lXx3Q9N2uJqL8F-YgE5n_qL_xG8vXyY5ZkQz_wP9tS-n0jR6cE1K3gL4fYhP5tSjV0oN1rT0jIqU3hB1mY2wZkXvA_r" },
    { title: "Get Started", main: "Ready to Dive In?", sub: "Let's begin your journey with Nova and experience the future of AI assistance.", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6Y_V-VqZgC8kY7R0kR3J8lP1kCqN_wX9zT_sJqO9nF0cM_lU_pP_wBvY_qZ8xR7yK6oO7tL9vX_jE0dD1mY_gS_aA1bE2vJ3pH0sC9nM_gS7rP0vL1nX_hE1fB0a" }
];

function updateOnboardingUI() {
  if (currentScreen !== ONBOARDING_SCREEN_ID) return;
  if(onboardingDots) {
      onboardingDots.forEach((dot, index) => {
        dot.classList.toggle('bg-[#19e5c6]', index === currentOnboardingStep);
        dot.classList.toggle('bg-[#34655e]', index !== currentOnboardingStep);
      });
  }
  const content = onboardingContent[currentOnboardingStep];
  const titleEl = document.getElementById('onboarding-title');
  const mainTextEl = document.getElementById('onboarding-main-text');
  const subTextEl = document.getElementById('onboarding-sub-text');
  const imageEl = document.getElementById('onboarding-image');

  if (titleEl) titleEl.textContent = content.title;
  if (mainTextEl) mainTextEl.textContent = content.main;
  if (subTextEl) subTextEl.textContent = content.sub;
  if (imageEl) imageEl.style.backgroundImage = `url("${content.image}")`;

  if (onboardingNextBtn) onboardingNextBtn.textContent = currentOnboardingStep === totalOnboardingSteps - 1 ? "Get Started" : "Next";
}

// --- Chat History & Session Logic ---
function saveChatSessionsToLocalStorage() {
  localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
}

function loadChatSessionsFromLocalStorage() {
  const storedSessions = localStorage.getItem('chatSessions');
  if (storedSessions) {
    chatSessions = JSON.parse(storedSessions);
  }
}

function getRelativeTime(timestamp) {
    const now = new Date().getTime();
    const seconds = Math.round((now - timestamp) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

function renderChatList() {
  if (!chatListItemsContainer) return;
  chatListItemsContainer.innerHTML = '';

  if (chatSessions.length === 0) {
    chatListItemsContainer.innerHTML = `<p class="text-center text-[#7A9A94] p-8 lg:p-12">No chats yet. Start a new one!</p>`;
    return;
  }
  const sortedSessions = [...chatSessions].sort((a, b) => b.lastUpdated - a.lastUpdated);
  sortedSessions.forEach(session => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'chat-list-item flex items-center gap-4 px-4 py-3 hover:bg-[#1B302C]/50 transition-colors cursor-pointer lg:py-4 lg:px-6';
    itemDiv.dataset.sessionId = session.id;
    const iconDiv = document.createElement('div');
    iconDiv.className = 'text-[#19E5C6] flex items-center justify-center rounded-xl bg-[#1B302C] shrink-0 size-12 lg:size-14';
    iconDiv.innerHTML = `<svg fill="currentColor" height="28px" viewBox="0 0 256 256" width="28px" xmlns="http://www.w3.org/2000/svg"><path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128ZM84,116a12,12,0,1,0,12,12A12,12,0,0,0,84,116Zm88,0a12,12,0,1,0,12,12A12,12,0,0,0,172,116Zm60,12A104,104,0,0,1,79.12,219.82L45.07,231.17a16,16,0,0,1-20.24-20.24l11.35-34.05A104,104,0,1,1,232,128Zm-16,0A88,88,0,1,0,51.81,172.06a8,8,0,0,1,.66,6.54L40,216,77.4,203.53a7.85,7.85,0,0,1,2.53-.42,8,8,0,0,1,4,1.08A88,88,0,0,0,216,128Z"></path></svg>`;
    const textContentDiv = document.createElement('div');
    textContentDiv.className = 'flex-grow overflow-hidden';
    const titleH3 = document.createElement('h3');
    titleH3.className = 'text-white text-base lg:text-lg font-medium leading-tight truncate';
    titleH3.textContent = session.title;
    const lastMessageP = document.createElement('p');
    lastMessageP.className = 'text-[#7A9A94] text-sm lg:text-base font-normal leading-snug line-clamp-1';
    
    let lastMeaningfulMessage = 'No messages yet';
    if (session.messages.length > 0) {
        const lastMsg = session.messages[session.messages.length - 1];
        if (lastMsg.messageType === 'image' && lastMsg.imageData?.promptForImage) {
            lastMeaningfulMessage = `[Image: ${lastMsg.imageData.promptForImage.substring(0,30)}...]`;
        } else {
            lastMeaningfulMessage = lastMsg.text;
        }
    }
    lastMessageP.textContent = lastMeaningfulMessage;
    
    const lastMessageLang = session.messages.length > 0 ? detectMessageLanguage(session.messages[session.messages.length - 1].text) : 'unknown';
    if (lastMessageLang === 'ar') {
        titleH3.dir = "rtl";
        lastMessageP.dir = "rtl";
        lastMessageP.style.textAlign = "right";
    } else {
        titleH3.dir = "auto";
        lastMessageP.dir = "auto";
        lastMessageP.style.textAlign = "left";
    }

    textContentDiv.appendChild(titleH3);
    textContentDiv.appendChild(lastMessageP);
    const timeDiv = document.createElement('div');
    timeDiv.className = 'text-xs lg:text-sm text-[#7A9A94] shrink-0 ml-auto';
    timeDiv.textContent = getRelativeTime(session.lastUpdated);
    itemDiv.appendChild(iconDiv);
    itemDiv.appendChild(textContentDiv);
    itemDiv.appendChild(timeDiv);
    itemDiv.addEventListener('click', () => loadChat(session.id));
    chatListItemsContainer.appendChild(itemDiv);
  });
}

function getSystemInstruction(tone, profile, isDeepThinking, isInternetSearch) {
    let baseInstruction = "";

    switch (tone) {
        case 'formal':
            baseInstruction = `You are Nova, a professional and formal AI assistant. Maintain a respectful and serious tone. Respond in the primary language used by the user in their last message. If unclear, default to English.`;
            break;
        case 'creative':
            baseInstruction = `You are Nova, a highly creative and imaginative AI assistant. Feel free to use vivid language and think outside the box. Respond in the primary language used by the user in their last message. If unclear, default to English.`;
            break;
        case 'friendly':
        default:
            baseInstruction = `You are Nova, a friendly and helpful AI assistant. Be conversational and approachable. Respond in the primary language used by the user in their last message. If unclear, default to English.`;
            break;
    }

    if (isDeepThinking && isInternetSearch) {
        baseInstruction += `\n\nIMPORTANT: The user has enabled "Deep Thinking Mode" and "Internet Search". Please provide comprehensive, well-researched, and detailed responses. Synthesize information from search results to formulate your answer. Explain your reasoning and cite sources clearly if search is used. Take your time to construct a thorough answer.`;
    } else if (isDeepThinking) {
        baseInstruction += `\n\nIMPORTANT: The user has enabled "Deep Thinking Mode". Please provide comprehensive, well-reasoned, and detailed responses. Explore multiple facets of the topic if appropriate. Take your time to construct a thorough answer.`;
    } else if (isInternetSearch) {
         baseInstruction += `\n\nIMPORTANT: The user has enabled "Internet Search". Use search to find up-to-date information. Cite your sources clearly if search is used.`;
    }
     else if (voiceModeActive) {
        baseInstruction += `\n\nThis is a voice conversation, so try to keep responses relatively concise and conversational for a better spoken experience.`;
    }

    let profileInfo = "\n\nTo help personalize your responses, remember the following about the user:";
    let hasProfileData = false;
    if (profile.name) { profileInfo += `\n- Their name is ${profile.name}. Address them by their name occasionally if it feels natural.`; hasProfileData = true; }
    if (profile.interests && profile.interests.length > 0) { profileInfo += `\n- They are interested in: ${profile.interests.join(', ')}.`; hasProfileData = true; }
    if (profile.preferences && Object.keys(profile.preferences).length > 0) {
        profileInfo += `\n- Preferences: ${Object.entries(profile.preferences).map(([k,v]) => `${k}: ${v}`).join('; ')}.`;
        hasProfileData = true;
    }
    if (profile.facts && profile.facts.length > 0) { profileInfo += `\n- Other facts about them: ${profile.facts.join('; ')}.`; hasProfileData = true; }

    if (hasProfileData) {
        baseInstruction += profileInfo + `\nTry to use this information naturally when relevant to the conversation. Do not explicitly state 'I remember you like X', instead, weave it into your suggestions or responses if appropriate.`;
    }
    baseInstruction += "\nFormat your responses using Markdown. This includes tables, lists, code blocks (e.g., ```html ... ```), bold, italic, etc., where appropriate for clarity and structure."
    baseInstruction += "\n\nIf the user asks you to 'generate a storyboard' or 'create a storyboard from a script', first provide a textual breakdown of the script into scenes and describe the visual elements for each panel/shot in text. Do not attempt to generate images directly for the storyboard in this initial text response. The user can then use dedicated image generation tools (like the in-chat image button or image studio) to visualize each described panel using your textual descriptions as prompts."
    return baseInstruction;
}

function createNewChatSession() {
  currentChatSessionId = null;
  if (chatMessagesContainer) chatMessagesContainer.innerHTML = '';

  if (!geminiInitialized && !initializeGeminiSDK()) {
    displaySystemMessage("Error: AI Service not available.", CHAT_SCREEN_ID);
    return;
  }
  const systemInstruction = getSystemInstruction(currentAiTone, userProfile, deepThinkingEnabled, internetSearchEnabled);
  geminiChat = ai.chats.create({
    model: TEXT_MODEL_NAME,
    config: { systemInstruction }
  });

  if (chatScreenTitleElement) chatScreenTitleElement.textContent = "Nova";
  
  const initialGreetingText = "Hello, I'm Nova, your personal AI assistant. How can I help you today?";
  const initialGreetingLang = detectMessageLanguage(initialGreetingText);
  const initialMessageId = `msg-system-${Date.now()}`;
  appendMessage("Nova", initialGreetingText, 'ai', false, null, true, null, initialGreetingLang, initialMessageId, 'text');
  showScreen(CHAT_SCREEN_ID);
   if (voiceModeActive && !isListening) {
     handleMicInput();
   }
}

function loadChat(sessionId) {
  const session = chatSessions.find(s => s.id === sessionId);
  if (!session) {
    createNewChatSession();
    return;
  }
  currentChatSessionId = sessionId;
  if (chatMessagesContainer) chatMessagesContainer.innerHTML = '';

  if (!geminiInitialized && !initializeGeminiSDK()) {
    displaySystemMessage("Error: AI Service not available.", CHAT_SCREEN_ID);
    return;
  }

  const history = session.messages
    .filter(msg => msg.sender !== 'System')
    .map(msg => {
        if (msg.messageType === 'image' && msg.imageData) {
            return {
                role: msg.sender === "User" ? "user" : "model",
                parts: [{ text: msg.imageData.promptForImage || "[User sent an image instruction]" }] 
            }
        }
        return {
            role: msg.sender === "User" ? "user" : "model",
            parts: [{ text: msg.text || "[empty message]" }] 
        }
  });

  const systemInstruction = getSystemInstruction(session.aiToneUsed || currentAiTone, userProfile, deepThinkingEnabled, internetSearchEnabled);
  geminiChat = ai.chats.create({
    model: TEXT_MODEL_NAME,
    history,
    config: { systemInstruction }
  });

  if (chatScreenTitleElement) chatScreenTitleElement.textContent = session.title || "Nova";
  session.messages.forEach(msg => {
      const lang = msg.detectedLanguage || detectMessageLanguage(msg.text);
      appendMessage(
        msg.sender, 
        msg.text, 
        msg.sender === 'User' ? 'user' : (msg.sender === 'System' ? 'ai' : 'ai'), 
        false, null, msg.sender === 'System', 
        msg.sources, 
        lang, 
        msg.id,
        msg.messageType || 'text',
        msg.imageData
      );
    });
  showScreen(CHAT_SCREEN_ID);
   if (voiceModeActive && !isListening) {
     handleMicInput();
   }
}

async function generateChatTitle(firstUserMsg, firstAiMsg) {
    if (!ai || !geminiInitialized) {
        return "Chat";
    }
    try {
        const prompt = `Based on this initial exchange, suggest a very short, concise title (max 5 words) for this chat conversation:
User: "${firstUserMsg}"
AI: "${firstAiMsg}"
Title:`;
        const response = await ai.models.generateContent({
            model: TEXT_MODEL_NAME,
            contents: prompt,
            config: { temperature: 0.3 }
        });
        let title = response.text.trim().replace(/^["']|["']$/g, "");
        if (!title || title.toLowerCase().includes("title:") || title.length < 3) title = firstUserMsg.substring(0,25) + (firstUserMsg.length > 25 ? "..." : "");
        return title.length > 35 ? title.substring(0,32) + "..." : title;
    } catch (error) {
        console.error("Error generating chat title:", error);
        return firstUserMsg.substring(0, 25) + (firstUserMsg.length > 25 ? "..." : "");
    }
}

// --- Gemini Integration ---
function initializeGeminiSDK() {
  if (!GEMINI_API_KEY) {
    if (currentScreen === CHAT_SCREEN_ID) {
        displaySystemMessage("Error: API Key not configured. Please contact support.", CHAT_SCREEN_ID, 'en');
        disableChatInput(true, false);
    } else if (currentScreen === IMAGE_STUDIO_SCREEN_ID) {
        if(imageStudioErrorMessageElement) {
            imageStudioErrorMessageElement.textContent = "Error: API Key not configured. Image generation is unavailable.";
            imageStudioErrorMessageElement.style.display = 'block';
        }
        if(imageStudioGenerateButton) imageStudioGenerateButton.disabled = true;
    }
    geminiInitialized = false;
    return false;
  }
  try {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    geminiInitialized = true;
    return true;
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
    if (currentScreen === CHAT_SCREEN_ID) {
        displaySystemMessage("Error: Could not initialize AI. Please check your API key and network.", CHAT_SCREEN_ID, 'en');
        disableChatInput(true, false);
    } else if (currentScreen === IMAGE_STUDIO_SCREEN_ID) {
        if(imageStudioErrorMessageElement) {
            imageStudioErrorMessageElement.textContent = "Error: Could not initialize AI. Image generation is unavailable.";
            imageStudioErrorMessageElement.style.display = 'block';
        }
        if(imageStudioGenerateButton) imageStudioGenerateButton.disabled = true;
    }
    geminiInitialized = false;
    return false;
  }
}

function scrollToBottomChat() {
  if (chatMessagesContainer) chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

function disableChatInput(textLoading, imageLoading) {
    isLoading = textLoading;
    isImageLoading = imageLoading;
    const anyLoading = isLoading || isImageLoading;

    if (isLoading) { // Text specific indicator
        if (novaProcessingIndicatorElement) {
            if (deepThinkingEnabled && internetSearchEnabled) {
                novaProcessingIndicatorElement.textContent = "Nova is researching and thinking deeply...";
            } else if (deepThinkingEnabled) {
                novaProcessingIndicatorElement.textContent = "Nova is thinking deeply...";
            } else if (internetSearchEnabled) {
                novaProcessingIndicatorElement.textContent = "Nova is researching...";
            } else {
                novaProcessingIndicatorElement.textContent = "Nova is processing...";
            }
            novaProcessingIndicatorElement.style.display = 'block';
            novaProcessingIndicatorElement.classList.add('visible');
        }
        if (novaImageProcessingIndicatorElement) { // Hide image indicator if text is loading
             novaImageProcessingIndicatorElement.style.display = 'none';
             novaImageProcessingIndicatorElement.classList.remove('visible');
        }
        startSimulatedProcessLog(); 
    } else if (isImageLoading) { // Image specific indicator
        if (novaImageProcessingIndicatorElement) {
            novaImageProcessingIndicatorElement.style.display = 'block';
            novaImageProcessingIndicatorElement.classList.add('visible');
        }
         if (novaProcessingIndicatorElement) { // Hide text indicator if image is loading
            novaProcessingIndicatorElement.style.display = 'none';
            novaProcessingIndicatorElement.classList.remove('visible');
        }
        stopSimulatedProcessLog(); // No process log for image generation for now
    } else { // No loading
        if (novaProcessingIndicatorElement) {
            novaProcessingIndicatorElement.style.display = 'none';
            novaProcessingIndicatorElement.classList.remove('visible');
        }
        if (novaImageProcessingIndicatorElement) {
            novaImageProcessingIndicatorElement.style.display = 'none';
            novaImageProcessingIndicatorElement.classList.remove('visible');
        }
        stopSimulatedProcessLog();
    }

  if (chatInput && !voiceModeActive) chatInput.disabled = anyLoading;
  else if (chatInput && voiceModeActive) chatInput.disabled = true;

  if (sendButton) sendButton.disabled = anyLoading;
  if (micButton) micButton.disabled = anyLoading;
  if (codeCanvasButton) codeCanvasButton.disabled = anyLoading;
  if (generateImageChatButtonElement) generateImageChatButtonElement.disabled = anyLoading;


  sendButton?.classList.toggle('opacity-50', anyLoading);
  sendButton?.classList.toggle('cursor-not-allowed', anyLoading);
  micButton?.classList.toggle('opacity-50', anyLoading);
  micButton?.classList.toggle('cursor-not-allowed', anyLoading);
  codeCanvasButton?.classList.toggle('opacity-50', anyLoading);
  codeCanvasButton?.classList.toggle('cursor-not-allowed', anyLoading);
  generateImageChatButtonElement?.classList.toggle('opacity-50', anyLoading);
  generateImageChatButtonElement?.classList.toggle('cursor-not-allowed', anyLoading);
}


function displaySystemMessage(text, screenIdContext, lang = 'en') {
    if (screenIdContext === CHAT_SCREEN_ID && chatMessagesContainer) {
         const systemMessageId = `sys-msg-${Date.now()}`; 
         appendMessage("System", text, 'ai', false, null, true, null, lang, systemMessageId, 'text');
    } else {
        alert(text);
    }
}

function appendMessage(
  senderName,
  textOrData, 
  type,
  isStreaming = false,
  existingMessageDiv = null,
  isInitialSystemMessage = false,
  sources,
  detectedLang,
  messageId,
  messageType = 'text',
  imageData
) {
  if (!chatMessagesContainer) return null;

  let messageWrapper;
  let messageContentHolder; 
  let aiMessageContentDiv = null; 
  let contentWrapperDiv; 
  
  const language = detectedLang || detectMessageLanguage(typeof textOrData === 'string' ? textOrData : (imageData?.promptForImage || ""));
  const domId = messageId || existingMessageDiv?.id || `msg-${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  if (existingMessageDiv) {
    messageWrapper = existingMessageDiv;
    messageWrapper.id = domId; 
    if (messageType === 'text' && isStreaming) {
        const existingTextEl = messageWrapper.querySelector('.message-text');
        if (existingTextEl) {
            existingTextEl.innerHTML = renderMarkdownToHTML(textOrData);
            existingTextEl.dir = language === 'ar' ? 'rtl' : 'ltr';
        }
    }
  } else { 
    messageWrapper = document.createElement('div');
    messageWrapper.id = domId;
    messageWrapper.className = 'flex items-end gap-3 p-4 chat-message-wrapper lg:p-5'; 
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 lg:w-12 lg:h-12 shrink-0 border-2 border-[#19e5c6]/50';
    
    contentWrapperDiv = document.createElement('div');
    contentWrapperDiv.className = `flex flex-1 flex-col gap-1 ${type === 'user' ? 'user-message-content-wrapper' : 'ai-message-content-wrapper'}`;

    const senderNamePara = document.createElement('p');
    senderNamePara.className = 'text-[#A0E1D9] text-xs lg:text-sm font-medium leading-normal';
    senderNamePara.textContent = senderName;

    if (type === 'ai') {
        aiMessageContentDiv = document.createElement('div');
        aiMessageContentDiv.className = 'ai-message-content bg-[#1A3A35] text-white rounded-xl rounded-bl-none shadow-md overflow-hidden lg:rounded-lg'; 
        messageContentHolder = document.createElement('div'); 
    } else { 
        messageContentHolder = document.createElement('div');
        messageContentHolder.className = 'message-text text-base lg:text-lg font-normal leading-relaxed flex rounded-xl px-4 py-3 shadow-md break-words';
    }

    if (messageType === 'text') {
        messageContentHolder.classList.add('message-text', 'text-base', 'lg:text-lg', 'font-normal', 'leading-relaxed', 'break-words');
        if (type === 'ai') messageContentHolder.classList.add('px-4', 'py-3', 'lg:px-5', 'lg:py-4'); 
        messageContentHolder.innerHTML = renderMarkdownToHTML(textOrData);
    } else if (messageType === 'image' && imageData) {
        messageContentHolder.classList.add('ai-message-image-container'); 

        const promptPara = document.createElement('p');
        promptPara.className = 'ai-image-prompt-text';
        promptPara.textContent = `Image for: "${imageData.promptForImage}"`;
        messageContentHolder.appendChild(promptPara);

        const imgElement = document.createElement('img');
        imgElement.src = `data:${imageData.mimeType};base64,${imageData.base64}`;
        imgElement.alt = imageData.promptForImage;
        imgElement.onclick = () => openInAppImageViewer(imgElement.src); 
        messageContentHolder.appendChild(imgElement);
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-in-chat-image-btn';
        downloadBtn.innerHTML = `<span class="material-symbols-outlined">download</span> Download Image`;
        downloadBtn.onclick = () => {
            const filename = `nova-chat-image-${imageData.promptForImage.substring(0,20).replace(/\s+/g, '_') || 'generated'}.jpeg`;
            downloadImageWithBase64(imageData.base64, imageData.mimeType, filename);
        };
        messageContentHolder.appendChild(downloadBtn);
    }

    messageContentHolder.dir = language === 'ar' ? 'rtl' : 'ltr';
    senderNamePara.dir = language === 'ar' ? 'rtl' : 'ltr'; 
    
    if (type === 'user') {
      messageWrapper.classList.add('justify-end');
      contentWrapperDiv.classList.add('items-end');
      if (messageContentHolder.classList.contains('message-text')) { 
        messageContentHolder.classList.add('rounded-br-none', 'bg-[#19e5c6]', 'text-[#0C1A18]');
      }
      avatarDiv.style.backgroundImage = `url("${USER_AVATAR_URL}")`;
      contentWrapperDiv.appendChild(senderNamePara);
      contentWrapperDiv.appendChild(messageContentHolder);
      messageWrapper.appendChild(contentWrapperDiv);
      messageWrapper.appendChild(avatarDiv);
    } else { 
      contentWrapperDiv.classList.add('items-start');
      avatarDiv.style.backgroundImage = `url("${AI_AVATAR_URL}")`;
      if (senderName === "System") {
         avatarDiv.style.opacity = "0.5";
         if (aiMessageContentDiv) aiMessageContentDiv.classList.add('opacity-80', 'italic');
         else messageContentHolder.classList.add('opacity-80', 'italic');
      }
      contentWrapperDiv.appendChild(senderNamePara);
      if(aiMessageContentDiv) {
        aiMessageContentDiv.appendChild(messageContentHolder);
        contentWrapperDiv.appendChild(aiMessageContentDiv);
      } else { 
        contentWrapperDiv.appendChild(messageContentHolder); 
      }
      messageWrapper.appendChild(avatarDiv);
      messageWrapper.appendChild(contentWrapperDiv);
    }
    chatMessagesContainer.appendChild(messageWrapper);
  }


  if (type === 'ai' && messageType === 'text' && sources && sources.length > 0 && chatMessagesContainer) {
    const sourcesContainerId = domId + '-sources';
    let sourcesContainer = document.getElementById(sourcesContainerId);

    if (!sourcesContainer) {
        sourcesContainer = document.createElement('div');
        sourcesContainer.id = sourcesContainerId;
        sourcesContainer.className = 'chat-message-external-sources';
        if (language === 'ar') sourcesContainer.dir = 'rtl';
        
        if (messageWrapper.nextSibling) {
            chatMessagesContainer.insertBefore(sourcesContainer, messageWrapper.nextSibling);
        } else {
            chatMessagesContainer.appendChild(sourcesContainer);
        }
    }
    
    sourcesContainer.innerHTML = ''; 

    const sourcesHeading = document.createElement('h4');
    sourcesHeading.textContent = language === 'ar' ? "المصادر:" : "Sources:";
    sourcesContainer.appendChild(sourcesHeading);
    
    const ol = document.createElement('ol');
    sources.forEach(source => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = source.uri;
        a.textContent = source.title || source.uri;
        a.className = 'webview-link';
        a.dataset.url = source.uri;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        
        li.appendChild(a);

        try {
            const domain = new URL(source.uri).hostname;
            const domainSpan = document.createElement('span');
            domainSpan.className = 'source-domain';
            domainSpan.textContent = ` (${domain})`;
            li.appendChild(domainSpan);
        } catch (e) { /* ignore invalid URL */ }
        
        ol.appendChild(li);
    });
    sourcesContainer.appendChild(ol);

    if (processLogVisible) { 
        sources.forEach(source => addProcessLogEntry(`Source: ${source.title || source.uri}`, 'source', source.uri));
    }
  } else if (type === 'ai' && (!sources || sources.length === 0) && chatMessagesContainer) {
    const sourcesContainerId = domId + '-sources';
    const existingSourcesContainer = document.getElementById(sourcesContainerId);
    if (existingSourcesContainer) {
        existingSourcesContainer.remove();
    }
  }

  if (!existingMessageDiv && !isInitialSystemMessage && !isStreaming && senderName !== "System") {
    const msgToSave = {
        id: messageId || domId, 
        sender: senderName,
        text: typeof textOrData === 'string' ? textOrData : (imageData?.promptForImage || "[AI Image Response]"), 
        timestamp: Date.now(),
        sources: (type === 'ai' && messageType === 'text' && sources) ? sources : undefined,
        detectedLanguage: language,
        messageType: messageType,
        imageData: messageType === 'image' ? imageData : undefined
    };

    if (currentChatSessionId) {
      const session = chatSessions.find(s => s.id === currentChatSessionId);
      if (session) {
        if (!session.messages.find(m => m.id === msgToSave.id)) {
            session.messages.push(msgToSave);
        }
        session.lastUpdated = Date.now();
      }
    } else if (type === 'user') { 
      currentChatSessionId = Date.now().toString();
      const newSession = {
        id: currentChatSessionId,
        title: "New Chat...", 
        messages: [msgToSave],
        lastUpdated: Date.now(),
        aiToneUsed: currentAiTone,
      };
      chatSessions.push(newSession);
      if (chatScreenTitleElement) chatScreenTitleElement.textContent = newSession.title;
    }
    saveChatSessionsToLocalStorage();
    renderChatList(); 
  }

  scrollToBottomChat();
  return messageWrapper;
}

function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// --- Markdown Rendering ---
function renderMarkdownToHTML(markdownText) {
    let html = markdownText;

    const codeBlockPlaceholders = [];
    const inlineCodes = [];

    html = html.replace(/```(\w*)\n([\s\S]*?)\n```/g, (match, lang, rawCode) => {
        const languageClass = lang ? `language-${lang}` : '';
        const trimmedRawCode = rawCode.trim();
        const escapedCodeForDisplay = escapeHTML(trimmedRawCode);
        const escapedCodeForDataAttr = escapeHTML(trimmedRawCode); 

        const toolbarHtml = `
            <div class="code-block-toolbar">
                <button class="copy-code-btn" data-code="${escapedCodeForDataAttr}" aria-label="Copy code snippet">
                    <span class="material-symbols-outlined">content_copy</span>
                    <span>Copy</span>
                </button>
                <button class="preview-code-btn" data-code="${escapedCodeForDataAttr}" aria-label="Preview code snippet">
                    <span class="material-symbols-outlined">play_circle</span>
                    <span>Preview</span>
                </button>
            </div>`;

        const codeBlockHtml = `
            <div class="code-block-wrapper">
                ${toolbarHtml}
                <pre class="${languageClass}"><code class="${languageClass}">${escapedCodeForDisplay}</code></pre>
            </div>`;
        codeBlockPlaceholders.push(codeBlockHtml);
        return `%%CODEBLOCK_WRAPPER_${codeBlockPlaceholders.length - 1}%%`;
    });

    html = html.replace(/`([^`]+)`/g, (match, code) => {
        inlineCodes.push(`<code>${escapeHTML(code)}</code>`);
        return `%%INLINECODE${inlineCodes.length - 1}%%`;
    });
    
    html = escapeHTML(html); 

    html = html.replace(/%%CODEBLOCK_WRAPPER_(\d+)%%/g, (match, index) => codeBlockPlaceholders[parseInt(index)]);


    html = html.replace(/^\|(.+)\|\r?\n\|([\s\S]+?)\|\r?\n((?:\|.*\|\r?\n?)*)/gm, (tableMatch) => {
        const rows = tableMatch.trim().split(/\r?\n/);
        if (rows.length < 2) return tableMatch; 

        const headerCells = rows[0].slice(1, -1).split('|');
        const separatorCells = rows[1].slice(1, -1).split('|');

        if (headerCells.length !== separatorCells.length) return tableMatch;

        if (!separatorCells.every(s => /^\s*:?-+:?\s*$/.test(s.trim()))) {
            return tableMatch; 
        }
        
        let tableHtml = '<div class="table-wrapper"><table>';
        tableHtml += '<thead><tr>';
        headerCells.forEach(header => {
            tableHtml += `<th>${header.trim()}</th>`;
        });
        tableHtml += '</tr></thead>';
        
        tableHtml += '<tbody>';
        for (let i = 2; i < rows.length; i++) {
            if (!rows[i].trim().startsWith('|') || !rows[i].trim().endsWith('|')) continue; 
            tableHtml += '<tr>';
            rows[i].slice(1, -1).split('|').forEach(cell => {
                tableHtml += `<td>${cell.trim()}</td>`;
            });
            tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table></div>';
        return tableHtml;
    });

    html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
    html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    html = html.replace(/^\s*&gt; (.*$)/gim, '<blockquote>$1</blockquote>');
    html = html.replace(/<\/blockquote>\s*<blockquote>/gim, '<br>');

    html = html.replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm, '<hr>');

    html = html.replace(/^\s*([*\-+]) +(.*)/gm, (match, bullet, item) => {
        return `%%UL_START%%<li>${item.trim()}</li>`;
    });
    html = html.replace(/(%%UL_START%%(<li>.*?<\/li>)+)/g, '<ul>$2</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, ''); 


    html = html.replace(/^\s*(\d+)\. +(.*)/gm, (match, number, item) => {
        return `%%OL_START%%<li>${item.trim()}</li>`;
    });
    html = html.replace(/(%%OL_START%%(<li>.*?<\/li>)+)/g, '<ol>$2</ol>');
    html = html.replace(/<\/ol>\s*<ol>/g, ''); 
    
    html = html.split(/\n+/).map(paragraph => {
      if (!paragraph.trim()) return ''; 
      if (paragraph.match(/<\/?(h[1-6]|ul|ol|li|blockquote|pre|hr|table|div class="table-wrapper"|div class="code-block-wrapper")/) || paragraph.startsWith('%%CODEBLOCK_WRAPPER_') || paragraph.startsWith('%%INLINECODE')) {
          return paragraph;
      }
      return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`; 
    }).join('');

    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        const decodedText = text; 
        const decodedUrl = url.replace(/&amp;/g, '&'); 
        const classAttr = (decodedUrl.startsWith('http:') || decodedUrl.startsWith('https:')) ? 'class="webview-link" data-url="' + decodedUrl + '"' : '';
        return `<a href="${decodedUrl}" ${classAttr} target="_blank" rel="noopener noreferrer">${decodedText}</a>`;
    });

    html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    html = html.replace(/(^|[^\*])\*([^\*]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');
    html = html.replace(/(^|[^_])_([^_]+)_([^_]|$)/g, '$1<em>$2</em>$3');
    
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    html = html.replace(/%%INLINECODE(\d+)%%/g, (match, index) => inlineCodes[parseInt(index)]);

    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p><br\s*\/?>\s*<\/p>/g, ''); 
    html = html.replace(/<br\s*\/?>\s*<br\s*\/?>/g, '<br>'); 

    return html;
}


async function handleSendMessage() {
  if (isLoading || isImageLoading || !chatInput) return;
  const messageText = chatInput.value.trim();
  if (!messageText) return;

  if (!geminiInitialized && !initializeGeminiSDK()) return;

  const userMessageLang = detectMessageLanguage(messageText);
  const userMessageId = `msg-user-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;

  if (!geminiChat || !currentChatSessionId) {
    const systemInstruction = getSystemInstruction(currentAiTone, userProfile, deepThinkingEnabled, internetSearchEnabled);
    geminiChat = ai.chats.create({
        model: TEXT_MODEL_NAME,
        config: { systemInstruction }
    });
     if (!currentChatSessionId) { 
        currentChatSessionId = `session-${Date.now()}`; 
        const newSession = {
            id: currentChatSessionId,
            title: "New Chat...", 
            messages: [], 
            lastUpdated: Date.now(),
            aiToneUsed: currentAiTone,
        };
        chatSessions.push(newSession);
        if (chatScreenTitleElement) chatScreenTitleElement.textContent = newSession.title;
     }
  }
  
  appendMessage("User", messageText, 'user', false, null, false, null, userMessageLang, userMessageId, 'text'); 
  chatInput.value = "";
  disableChatInput(true, false); // Text loading true, image loading false

  let aiMessageDiv = null;
  let fullResponseText = "";
  let isFirstAIMessageInNewChat = false;
  let groundingSources = null;
  let aiResponseLang = 'unknown';
  const aiMessageId = `msg-ai-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;


  if (currentChatSessionId) {
    const session = chatSessions.find(s => s.id === currentChatSessionId);
    if (session && session.messages.filter(m => m.sender === 'Nova').length === 0) {
        isFirstAIMessageInNewChat = true;
    }
  }

  try {
    const sendMessageParams = {
        message: messageText
    };

    const perMessageConfig = {};
    let configApplied = false;

    if (internetSearchEnabled) {
        perMessageConfig.tools = [{ googleSearch: {} }];
        configApplied = true;
    } else {
        if (TEXT_MODEL_NAME === 'gemini-2.5-flash-preview-04-17' && !deepThinkingEnabled && voiceModeActive) {
            perMessageConfig.thinkingConfig = { thinkingBudget: 0 };
            configApplied = true;
        }
    }

    if (configApplied) {
        sendMessageParams.config = perMessageConfig;
    }
    
    const result = await geminiChat.sendMessageStream(sendMessageParams);

    for await (const chunk of result) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullResponseText += chunkText;
        if (aiResponseLang === 'unknown') { 
            aiResponseLang = detectMessageLanguage(fullResponseText);
        }
        if (!aiMessageDiv) {
          aiMessageDiv = appendMessage("Nova", fullResponseText, 'ai', true, null, false, null, aiResponseLang, aiMessageId, 'text'); 
        } else {
          appendMessage("Nova", fullResponseText, 'ai', true, aiMessageDiv, false, null, aiResponseLang, aiMessageId, 'text');
        }
        scrollToBottomChat();
      }
      if (chunk.candidates && chunk.candidates[0]?.groundingMetadata?.groundingChunks) {
          groundingSources = chunk.candidates[0].groundingMetadata.groundingChunks.map(
              (gc) => ({ uri: gc.web?.uri || gc.retrievedContext?.uri || '', title: gc.web?.title || '' })
          ).filter((s) => s.uri);
          if (aiMessageDiv && groundingSources && groundingSources.length > 0) {
            appendMessage("Nova", fullResponseText, 'ai', true, aiMessageDiv, false, groundingSources, aiResponseLang, aiMessageId, 'text');
          }
          if (groundingSources && groundingSources.length > 0) {
                groundingSources.forEach(source => addProcessLogEntry(`Found source: ${source.title || source.uri}`, 'source', source.uri));
          }
      }
    }

    if (ttsEnabled && fullResponseText) {
        speak(fullResponseText.replace(/<\/?[^>]+(>|$)/g, ""), true, aiResponseLang);
    }

    if (fullResponseText && currentChatSessionId) {
        const session = chatSessions.find(s => s.id === currentChatSessionId);
        if (session) {
            const aiMessageForHistory = {
                id: aiMessageId, 
                sender: 'Nova',
                text: fullResponseText,
                timestamp: Date.now(),
                sources: groundingSources || undefined,
                detectedLanguage: aiResponseLang,
                messageType: 'text'
            };
            const existingMsgIndex = session.messages.findIndex(m => m.id === aiMessageId);
            if (existingMsgIndex !== -1) {
                session.messages[existingMsgIndex] = aiMessageForHistory; 
            } else {
                session.messages.push(aiMessageForHistory); 
            }
            session.lastUpdated = Date.now();
            
            if (aiMessageDiv) { 
                appendMessage("Nova", fullResponseText, 'ai', false, aiMessageDiv, false, groundingSources, aiResponseLang, aiMessageId, 'text');
            } else { 
                appendMessage("Nova", fullResponseText, 'ai', false, null, false, groundingSources, aiResponseLang, aiMessageId, 'text');
            }

            if (isFirstAIMessageInNewChat) {
                const userMsgForTitle = session.messages.find(m => m.sender === 'User')?.text || messageText;
                const newTitle = await generateChatTitle(userMsgForTitle, fullResponseText);
                session.title = newTitle;
                if(chatScreenTitleElement) chatScreenTitleElement.textContent = newTitle;
            }
            saveChatSessionsToLocalStorage();
            renderChatList();
            await extractAndStoreUserInfo(session);
        }
    }

  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    let errorMessage = "Sorry, I encountered an error. Please try again.";
    if (error.message) { 
        errorMessage = `Error: ${error.message}`;
    }
    
    const errLang = detectMessageLanguage(errorMessage);
    const errorMsgId = `err-${aiMessageId}`; 
    if (aiMessageDiv) { 
        appendMessage("Nova", errorMessage, 'ai', false, aiMessageDiv, true, null, errLang, errorMsgId, 'text');
    } else { 
        appendMessage("Nova", errorMessage, 'ai', false, null, true, null, errLang, errorMsgId, 'text');
    }
    if (ttsEnabled) speak(errorMessage, false, errLang);
  } finally {
    disableChatInput(false, false); 
    if(chatInput && !voiceModeActive) chatInput.focus();
    else if (voiceModeActive && !ttsEnabled && !isListening && currentScreen === CHAT_SCREEN_ID) { 
         handleMicInput();
    }
  }
}


async function handleGenerateImageInChat() {
    if (isLoading || isImageLoading || !chatInput) return;
    const prompt = chatInput.value.trim();
    if (!prompt) {
        displaySystemMessage("Please enter a prompt for the image.", CHAT_SCREEN_ID);
        return;
    }

    if (!geminiInitialized && !initializeGeminiSDK()) return;

    const userMessageLang = detectMessageLanguage(prompt);
    const userMessageId = `msg-user-imgprompt-${Date.now()}`;
    appendMessage("User", prompt, 'user', false, null, false, null, userMessageLang, userMessageId, 'text');
    chatInput.value = "";
    disableChatInput(false, true); // Image loading true, text loading false

    const aiImageId = `msg-ai-img-${Date.now()}`;

    try {
        const response = await ai.models.generateImages({
            model: IMAGE_MODEL_NAME,
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: "1:1" }, 
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const imgData = response.generatedImages[0];
            const imageDataPayload = {
                base64: imgData.image.imageBytes,
                mimeType: imgData.image.mimeType || 'image/jpeg',
                promptForImage: prompt
            };
            
            appendMessage("Nova", "", 'ai', false, null, false, null, 'en', aiImageId, 'image', imageDataPayload);

            if (currentChatSessionId) {
                const session = chatSessions.find(s => s.id === currentChatSessionId);
                if (session) {
                    const aiImageMessageForHistory = {
                        id: aiImageId,
                        sender: 'Nova',
                        text: `[Image generated for prompt: ${prompt.substring(0,50)}...]`, 
                        timestamp: Date.now(),
                        messageType: 'image',
                        imageData: imageDataPayload,
                        detectedLanguage: 'en' 
                    };
                    session.messages.push(aiImageMessageForHistory);
                    session.lastUpdated = Date.now();
                    saveChatSessionsToLocalStorage();
                    renderChatList();
                }
            }
        } else {
            displaySystemMessage("Sorry, I couldn't generate an image for that prompt. Try something else.", CHAT_SCREEN_ID);
        }

    } catch (error) {
        console.error("Error generating image in chat:", error);
        let errMsg = "Failed to generate image. Please try again.";
        if (error instanceof Error) errMsg = `Error: ${error.message}`;
        displaySystemMessage(errMsg, CHAT_SCREEN_ID);
    } finally {
        disableChatInput(false, false); 
        if (chatInput && !voiceModeActive) chatInput.focus();
    }
}


// --- Speech-to-Text (STT) ---
function handleMicInput() {
    if (!SpeechRecognition) {
        alert("Speech recognition is not supported by your browser.");
        return;
    }
    if (isListening) {
        if (recognition) recognition.stop();
        return;
    }
    try {
        if (window.speechSynthesis.speaking) {
            manualTTScancelForMic = true;
            window.speechSynthesis.cancel();
        }
        if (recognition) {
            recognition.start();
        }
    } catch (e) {
        console.error("Speech recognition start error:", e);
        if (e instanceof Error && e.name === 'InvalidStateError' && !isListening) {
        } else {
            alert("Could not start voice recognition. Please check microphone permissions.");
        }
        micButtonContainer?.classList.remove('listening');
        micButton?.querySelector('.mic-listening-indicator')?.classList.remove('animate-ping');
        isListening = false;
         if(!(e instanceof Error && e.name === 'InvalidStateError')) {
           manualTTScancelForMic = false;
         }
    }
}

if (recognition) {
    recognition.onstart = () => {
        isListening = true;
        micButtonContainer?.classList.add('listening');
        micButton?.querySelector('.mic-listening-indicator')?.classList.add('animate-ping');
        micButton?.setAttribute('aria-label', 'Stop listening');
        if (voiceModeToggle) voiceModeToggle.disabled = true;
        if (codeCanvasButton) codeCanvasButton.disabled = true;
        if (generateImageChatButtonElement) generateImageChatButtonElement.disabled = true;
    };
    recognition.onend = () => {
        isListening = false;
        micButtonContainer?.classList.remove('listening');
        micButton?.querySelector('.mic-listening-indicator')?.classList.remove('animate-ping');
        micButton?.setAttribute('aria-label', 'Use microphone');
         if (voiceModeToggle) voiceModeToggle.disabled = false;
         if (codeCanvasButton) codeCanvasButton.disabled = false;
         if (generateImageChatButtonElement) generateImageChatButtonElement.disabled = isLoading || isImageLoading; 
    };
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (chatInput) chatInput.value = transcript;
        if (voiceModeActive) {
            handleSendMessage();
        }
    };
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        let errorMessage = "Speech recognition error. ";
        if (event.error === 'no-speech') errorMessage += "No speech detected.";
        else if (event.error === 'audio-capture') errorMessage += "Microphone problem.";
        else if (event.error === 'not-allowed') errorMessage += "Permission denied.";
        else if (event.error === 'language-not-supported') errorMessage += `STT language (${recognition.lang}) not supported.`;

        if (event.error !== 'no-speech' || !voiceModeActive) {
             displaySystemMessage(errorMessage, CHAT_SCREEN_ID, 'en');
        }
        if (voiceModeActive && (event.error === 'not-allowed' || event.error === 'audio-capture' || event.error === 'language-not-supported')) {
            voiceModeActive = false;
            if(voiceModeToggle) {
                voiceModeToggle.classList.remove('active');
                voiceModeToggle.setAttribute('aria-pressed', 'false');
            }
            saveSetting('voiceModeActive', voiceModeActive);
            if (chatInput) {
                chatInput.disabled = false;
                chatInput.classList.remove('opacity-50');
            }
        }
    };
}

// --- Text-to-Speech (TTS) ---
function speak(text, isAiMessageForVoiceMode, lang = 'en') {
    if (!ttsEnabled || !window.speechSynthesis) {
        if (voiceModeActive && isAiMessageForVoiceMode && !isListening && currentScreen === CHAT_SCREEN_ID) {
            handleMicInput();
        }
        return;
    }
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel(); 
    }
    const utterance = new SpeechSynthesisUtterance(text);
    
    const targetLang = lang === 'ar' ? 'ar-SA' : 'en-US'; 
    utterance.lang = targetLang;

    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(voice => voice.lang === targetLang);
    if (!selectedVoice && targetLang.includes('-')) { 
        selectedVoice = voices.find(voice => voice.lang.startsWith(targetLang.split('-')[0]));
    }
     if (!selectedVoice && targetLang === 'ar-SA') { 
        selectedVoice = voices.find(voice => voice.lang.startsWith('ar'));
    }
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    } else {
        console.warn(`TTS voice for lang ${targetLang} not found. Using browser default.`);
    }

    utterance.onend = () => {
        if (manualTTScancelForMic) {
            manualTTScancelForMic = false;
            return;
        }
        if (ttsEnabled && voiceModeActive && isAiMessageForVoiceMode && !isListening && currentScreen === CHAT_SCREEN_ID) {
            handleMicInput();
        }
    };

    utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event.error, "for language:", utterance.lang);
        if (manualTTScancelForMic) {
            manualTTScancelForMic = false;
            return; 
        }
        if (event.error === 'interrupted') {
            return; 
        }
        if (event.error === 'language-unavailable' || event.error === 'voice-unavailable') {
            displaySystemMessage(`Voice for ${targetLang} is not available on your device.`, CHAT_SCREEN_ID, 'en');
        }
        if (ttsEnabled && voiceModeActive && isAiMessageForVoiceMode && !isListening && currentScreen === CHAT_SCREEN_ID) {
            handleMicInput();
        }
    };
    window.speechSynthesis.speak(utterance);
}


// --- Event Listeners Setup ---
function setupEventListeners() {
    if (window.speechSynthesis && typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices(); 
        };
    }

    aiToneRadios?.forEach(radio => {
        radio.addEventListener('change', (event) => {
            currentAiTone = event.target.value;
            saveSetting('aiTone', currentAiTone);
        });
    });

    darkModeToggle?.addEventListener('change', () => {
        if (!darkModeToggle) return;
        darkModeEnabled = darkModeToggle.checked;
        document.body.classList.toggle('light-mode', !darkModeEnabled);
        saveSetting('darkModeEnabled', darkModeEnabled);
    });

    ttsToggle?.addEventListener('change', () => {
        if (!ttsToggle) return;
        ttsEnabled = ttsToggle.checked;
        saveSetting('ttsEnabled', ttsEnabled);
        if (!ttsEnabled && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
    });

    internetSearchToggle?.addEventListener('change', () => {
        if (!internetSearchToggle) return;
        internetSearchEnabled = internetSearchToggle.checked;
        saveSetting('internetSearchEnabled', internetSearchEnabled);
    });

    deepThinkingToggle?.addEventListener('change', () => {
        if (!deepThinkingToggle) return;
        deepThinkingEnabled = deepThinkingToggle.checked;
        saveSetting('deepThinkingEnabled', deepThinkingEnabled);
    });

    voiceModeToggle?.addEventListener('click', () => {
        if (!voiceModeToggle) return;
        voiceModeActive = !voiceModeActive;
        voiceModeToggle.classList.toggle('active', voiceModeActive);
        voiceModeToggle.setAttribute('aria-pressed', String(voiceModeActive));
        saveSetting('voiceModeActive', voiceModeActive);

        if (chatInput) {
            chatInput.disabled = voiceModeActive;
            chatInput.classList.toggle('opacity-50', voiceModeActive);
            chatInput.placeholder = voiceModeActive ? "Voice mode active..." : "Ask Nova anything...";
        }

        if (voiceModeActive) {
            if (!isListening) handleMicInput();
        } else {
            if (isListening && recognition) recognition.stop();
        }
    });

    toggleProcessLogButtonElement?.addEventListener('click', () => toggleProcessLogPanel());
    processLogCloseButtonElement?.addEventListener('click', () => toggleProcessLogPanel(false));


    onboardingNextBtn?.addEventListener('click', () => {
      if (currentOnboardingStep < totalOnboardingSteps - 1) {
        currentOnboardingStep++;
        updateOnboardingUI();
      } else {
        localStorage.setItem('onboardingComplete', 'true');
        showScreen(SIGNIN_SCREEN_ID);
      }
    });
    onboardingSkipBtn?.addEventListener('click', () => {
      localStorage.setItem('onboardingComplete', 'true');
      showScreen(SIGNIN_SCREEN_ID);
    });

    document.getElementById('signin-btn')?.addEventListener('click', () => showScreen(CHAT_LIST_SCREEN_ID));
    ['forgot-password-link', 'google-signin-btn', 'apple-signin-btn', 'signup-link'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', (e) => { e.preventDefault(); alert("This feature is not yet implemented."); });
    });

    document.getElementById('chat-list-new-chat-header-btn')?.addEventListener('click', createNewChatSession);

    sendButton?.addEventListener('click', handleSendMessage);
    chatInput?.addEventListener('keypress', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
      }
    });
    suggestedPromptButtons?.forEach(button => {
      button.addEventListener('click', () => {
        const promptText = button.textContent?.trim();
        if (promptText && chatInput) {
          chatInput.value = promptText;
          handleSendMessage();
        }
      });
    });
    micButton?.addEventListener('click', handleMicInput);
    generateImageChatButtonElement?.addEventListener('click', handleGenerateImageInChat);


    let previousScreenForSettings = CHAT_LIST_SCREEN_ID;
    document.getElementById('settings-back-btn')?.addEventListener('click', () => showScreen(previousScreenForSettings || CHAT_LIST_SCREEN_ID));
    document.getElementById('chat-back-btn')?.addEventListener('click', () => showScreen(CHAT_LIST_SCREEN_ID));
    document.getElementById('profile-back-btn')?.addEventListener('click', () => showScreen(previousScreenForSettings || CHAT_LIST_SCREEN_ID));

    document.getElementById('chat-settings-btn')?.addEventListener('click', () => {
        previousScreenForSettings = CHAT_SCREEN_ID;
        showScreen(SETTINGS_SCREEN_ID);
    });

    // Combined Navigation Click Handler
    function handleNavClick(targetScreen, currentActiveScreenBeforeNav) {
        if (!targetScreen) return;

        if (targetScreen === "discover-screen") { 
            alert("Discover section is not yet implemented."); 
            return;
        }
        if (targetScreen === PROFILE_SCREEN_ID) {
             if (currentActiveScreenBeforeNav !== PROFILE_SCREEN_ID) {
                 previousScreenForSettings = currentActiveScreenBeforeNav;
             }
             showScreen(PROFILE_SCREEN_ID);
        }
        else if (targetScreen === CHAT_SCREEN_ID && currentScreen !== CHAT_SCREEN_ID) {
             createNewChatSession();
        } else if (targetScreen === 'chat-list-screen-home') {
             showScreen(CHAT_LIST_SCREEN_ID);
        } else if (targetScreen === SETTINGS_SCREEN_ID) {
             if (currentActiveScreenBeforeNav !== SETTINGS_SCREEN_ID) {
                previousScreenForSettings = currentActiveScreenBeforeNav;
             }
             showScreen(SETTINGS_SCREEN_ID);
        }
        else if (screens.includes(targetScreen) && targetScreen !== WEBVIEW_SCREEN_ID && targetScreen !== IMAGE_VIEWER_SCREEN_ID && targetScreen !== CODE_CANVAS_SCREEN_ID) {
            showScreen(targetScreen);
        }
    }
    
    // Mobile Bottom Nav
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const targetScreen = item.dataset.target;
        handleNavClick(targetScreen, currentScreen);
      });
    });

    // Desktop Sidebar Nav
    document.querySelectorAll('#desktop-sidebar .sidebar-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const targetScreen = item.dataset.target;
            handleNavClick(targetScreen, currentScreen);
        });
    });


    webviewCloseBtn?.addEventListener('click', () => {
        if (webviewScreenElement && webviewFrame) {
            webviewFrame.src = 'about:blank'; 
            showScreen(currentScreen); 
        }
    });

    imageViewerCloseBtn?.addEventListener('click', () => {
        if (imageViewerScreenElement && imageViewerImg) {
            imageViewerImg.src = ''; 
            showScreen(currentScreen); 
        }
    });
    
    document.body.addEventListener('click', (event) => {
      const target = event.target;
      if (target.classList.contains('webview-link') && target.dataset.url) {
          event.preventDefault();
          openInAppWebView(target.dataset.url);
      }
      if (target.closest('.download-in-chat-image-btn')) { 
          const button = target.closest('.download-in-chat-image-btn');
          const base64 = button.dataset.base64;
          const mimeType = button.dataset.mime;
          const promptForImage = button.dataset.prompt;
          if (base64 && mimeType) {
            const filename = `nova-chat-image-${(promptForImage || 'generated').substring(0,20).replace(/\s+/g, '_')}.jpeg`;
            downloadImageWithBase64(base64, mimeType, filename);
          }
      }
    });

    chatMessagesContainer?.addEventListener('click', (event) => {
        const targetElement = event.target;
        const previewButton = targetElement.closest('.preview-code-btn');
        const copyButton = targetElement.closest('.copy-code-btn');

        if (previewButton instanceof HTMLButtonElement && codeCanvasTextarea) {
            const rawCode = previewButton.dataset.code;
            if (rawCode) {
                codeCanvasTextarea.value = rawCode; 
                showScreen(CODE_CANVAS_SCREEN_ID);
                setCodeCanvasView('preview');
                renderCodeToIframe(); 
            }
        } else if (copyButton instanceof HTMLButtonElement) {
            const rawCode = copyButton.dataset.code;
            if (rawCode && navigator.clipboard) {
                navigator.clipboard.writeText(rawCode).then(() => {
                    const originalContent = copyButton.innerHTML;
                    copyButton.innerHTML = `<span class="material-symbols-outlined" style="font-size:1em; vertical-align: middle; line-height:1;">check_circle</span> <span style="vertical-align: middle;">Copied!</span>`;
                    copyButton.disabled = true;
                    setTimeout(() => {
                        copyButton.innerHTML = originalContent;
                        copyButton.disabled = false;
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy code: ', err);
                    alert('Failed to copy code to clipboard.');
                });
            }
        }
    });

    codeCanvasButton?.addEventListener('click', () => {
      showScreen(CODE_CANVAS_SCREEN_ID);
      setCodeCanvasView('code'); 
    });
    codeCanvasCloseButton?.addEventListener('click', () => {
        if (codeCanvasScreenElement) codeCanvasScreenElement.classList.remove('active');
        setCodeCanvasView('code'); 
        if (codeCanvasInlinePreviewIframe) codeCanvasInlinePreviewIframe.srcdoc = '';
        showScreen(CHAT_SCREEN_ID); 
    });
    codeCanvasCopyToChatButton?.addEventListener('click', () => {
        if (codeCanvasTextarea && chatInput) {
            const codeText = codeCanvasTextarea.value;
            if (codeText.trim()) {
                chatInput.value = `\`\`\`\n${codeText}\n\`\`\``; 
            }
            if (codeCanvasScreenElement) codeCanvasScreenElement.classList.remove('active');
            showScreen(CHAT_SCREEN_ID);
            chatInput.focus();
        }
    });

    codeCanvasTextarea?.addEventListener('input', () => {
        if (codeCanvasViewMode === 'preview') {
            renderCodeToIframeDebounced();
        }
    });

    codeCanvasToggleViewButton?.addEventListener('click', () => {
        if (codeCanvasViewMode === 'code') {
            setCodeCanvasView('preview');
            renderCodeToIframe();
        } else {
            setCodeCanvasView('code');
        }
    });

    codeCanvasEnterFullscreenButton?.addEventListener('click', () => {
        if (fullScreenPreviewOverlay && fullScreenPreviewIframe && codeCanvasTextarea) {
            fullScreenPreviewIframe.srcdoc = codeCanvasTextarea.value;
            fullScreenPreviewOverlay.style.display = 'flex';
        }
    });

    fullScreenPreviewCloseButton?.addEventListener('click', () => {
        if (fullScreenPreviewOverlay && fullScreenPreviewIframe) {
            fullScreenPreviewOverlay.style.display = 'none';
            fullScreenPreviewIframe.srcdoc = '';
        }
    });

    // Image Studio Event Listeners
    imageStudioGenerateButton?.addEventListener('click', handleGenerateImages);
    imageStudioDownloadAllButton?.addEventListener('click', () => {
        currentGeneratedImagesData.forEach((imgData, index) => {
            const promptPart = imgData.prompt.substring(0, 20).replace(/\s+/g, '_');
            downloadImageWithBase64(imgData.base64, imgData.mimeType, `nova-image-${promptPart}-${index + 1}.jpeg`);
        });
    });
    imageStudioEngineSelect?.addEventListener('change', (event) => {
        currentImageEngine = event.target.value;
        saveSetting('currentImageEngine', currentImageEngine);
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);

// --- Code Canvas Specific Logic ---
function renderCodeToIframe() {
    if (codeCanvasTextarea && codeCanvasInlinePreviewIframe) {
        const codeToRun = codeCanvasTextarea.value;
        codeCanvasInlinePreviewIframe.srcdoc = codeToRun;
    }
}

function renderCodeToIframeDebounced() {
    clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
        renderCodeToIframe();
    }, 500); 
}

function setCodeCanvasView(mode) {
    codeCanvasViewMode = mode;
    if (!codeCanvasTextarea || !codeCanvasInlinePreviewIframe || !codeCanvasToggleViewButton || !codeCanvasEnterFullscreenButton) return;

    if (mode === 'preview') {
        codeCanvasTextarea.style.display = 'none';
        codeCanvasInlinePreviewIframe.style.display = 'block';
        codeCanvasToggleViewButton.textContent = 'Show Code';
        codeCanvasEnterFullscreenButton.classList.remove('hidden');
    } else { 
        codeCanvasTextarea.style.display = 'block';
        codeCanvasInlinePreviewIframe.style.display = 'none';
        codeCanvasToggleViewButton.textContent = 'Show Preview';
        codeCanvasEnterFullscreenButton.classList.add('hidden');
        if(codeCanvasTextarea) codeCanvasTextarea.focus();
    }
}


// --- In-app Webview & Image Viewer ---
function openInAppWebView(url) {
    if (webviewScreenElement && webviewFrame && webviewTitle && webviewLoading) {
        webviewTitle.textContent = "Loading...";
        webviewFrame.src = 'about:blank';
        webviewLoading.style.display = 'block';
        webviewFrame.style.display = 'none';
        showScreen(WEBVIEW_SCREEN_ID); 

        webviewFrame.onload = () => {
            if (webviewLoading) webviewLoading.style.display = 'none';
            if (webviewFrame) webviewFrame.style.display = 'block';
            try {
                if (webviewTitle) webviewTitle.textContent = webviewFrame.contentDocument?.title || url;
            } catch (e) {
                if (webviewTitle) webviewTitle.textContent = url;
            }
        };
        webviewFrame.onerror = () => {
            if (webviewLoading) webviewLoading.style.display = 'none';
            if (webviewFrame) webviewFrame.style.display = 'block';
            if (webviewTitle) webviewTitle.textContent = "Error Loading Page";
        };
        webviewFrame.src = url;
    } else {
        window.open(url, '_blank');
    }
}

function openInAppImageViewer(imageUrl) { 
    if (imageViewerScreenElement && imageViewerImg) {
        imageViewerImg.src = imageUrl;
        showScreen(IMAGE_VIEWER_SCREEN_ID); 
    } else {
        alert(`Image viewer placeholder: ${imageUrl}`);
    }
}

// --- Process Log Panel ---
function toggleProcessLogPanel(forceState) {
    if (typeof forceState === 'boolean') {
        processLogVisible = forceState;
    } else {
        processLogVisible = !processLogVisible;
    }

    if (processLogPanelElement) {
        processLogPanelElement.classList.toggle('open', processLogVisible);
    }
    if (toggleProcessLogButtonElement) {
        toggleProcessLogButtonElement.classList.toggle('active', processLogVisible);
    }
    saveSetting('processLogVisible', processLogVisible);
}


function addProcessLogEntry(text, type = 'info', url) {
    if (!processLogListElement) return;
    const li = document.createElement('li');
    if (type === 'source' && url) {
        li.classList.add('source-entry');
        const a = document.createElement('a');
        a.href = url;
        a.textContent = text;
        a.className = 'webview-link';
        a.dataset.url = url;
        li.appendChild(a);
    } else {
        li.textContent = text;
    }
    processLogListElement.appendChild(li);
    processLogListElement.scrollTop = processLogListElement.scrollHeight; 
}

function clearProcessLog() {
    if (processLogListElement) processLogListElement.innerHTML = '';
}

function startSimulatedProcessLog() {
    if (!deepThinkingEnabled && !internetSearchEnabled) {
        return;
    }
    clearProcessLog();
    
    const steps = [];
    if (internetSearchEnabled) steps.push("Formulating search queries...", "Searching the web...", "Reviewing search results...");
    if (deepThinkingEnabled) steps.push("Accessing knowledge base...", "Analyzing information...", "Considering multiple perspectives...", "Synthesizing insights...");
    if (steps.length === 0) steps.push("Processing your request...");
    steps.push("Generating response...");

    let currentStep = 0;
    addProcessLogEntry(steps[currentStep++]);
    
    simulatedProcessInterval = window.setInterval(() => {
        if (currentStep < steps.length) {
            addProcessLogEntry(steps[currentStep++]);
        } else {
            stopSimulatedProcessLog();
        }
    }, 1200); 
}

function stopSimulatedProcessLog() {
    if (simulatedProcessInterval) {
        clearInterval(simulatedProcessInterval);
        simulatedProcessInterval = undefined;
    }
}

// --- Image Studio Logic ---
async function handleGenerateImages() {
    if (!imageStudioPromptInput || !imageStudioGenerateButton || !imageStudioLoadingIndicator || !imageStudioGridElement || !imageStudioErrorMessageElement || !imageStudioDownloadAllButton || !imageStudioEngineSelect) return;
    const prompt = imageStudioPromptInput.value.trim();
    if (!prompt) {
        imageStudioErrorMessageElement.textContent = "Please enter a prompt for image generation.";
        imageStudioErrorMessageElement.style.display = 'block';
        return;
    }
    if (!geminiInitialized && !initializeGeminiSDK()) {
        imageStudioErrorMessageElement.textContent = "AI Service not available. Cannot generate images.";
        imageStudioErrorMessageElement.style.display = 'block';
        return;
    }

    imageStudioGenerateButton.disabled = true;
    imageStudioLoadingIndicator.style.display = 'flex';
    imageStudioGridElement.innerHTML = ''; 
    imageStudioErrorMessageElement.style.display = 'none';
    imageStudioDownloadAllButton.style.display = 'none';
    currentGeneratedImagesData = [];

    const selectedEngine = imageStudioEngineSelect.value;
    console.log(`Generating images using selected engine: ${selectedEngine}`);
    addProcessLogEntry(`Image generation initiated with engine: ${selectedEngine === 'imagefx' ? 'ImageFX Engine (Premium)' : 'Standard Engine'}.`);


    try {
        const imageGenConfig = {
            numberOfImages: 4, // Both "Standard" and "ImageFX" will generate 4 images for now
            outputMimeType: 'image/jpeg',
        };

        if (imageStudioAspectRatioSelect && imageStudioAspectRatioSelect.value) {
            imageGenConfig.aspectRatio = imageStudioAspectRatioSelect.value;
        } else {
            imageGenConfig.aspectRatio = "1:1"; 
        }

        const response = await ai.models.generateImages({
            model: IMAGE_MODEL_NAME, // This remains 'imagen-3.0-generate-002' as per guidelines
            prompt: prompt,
            config: imageGenConfig,
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            currentGeneratedImagesData = response.generatedImages.map(imgInfo => ({
                base64: imgInfo.image.imageBytes,
                prompt: prompt, 
                mimeType: imgInfo.image.mimeType || 'image/jpeg'
            }));
            displayGeneratedImages(currentGeneratedImagesData);
            imageStudioDownloadAllButton.style.display = 'flex';
            addProcessLogEntry(`${response.generatedImages.length} images generated successfully.`);
        } else {
            imageStudioErrorMessageElement.textContent = "No images were generated. Try a different prompt.";
            imageStudioErrorMessageElement.style.display = 'block';
            addProcessLogEntry("Image generation failed: No images returned.");
        }
    } catch (error) {
        console.error("Error generating images:", error);
        let errMsg = "Failed to generate images. Please try again.";
        if (error instanceof Error) {
            errMsg = `Error: ${error.message}`;
        }
        imageStudioErrorMessageElement.textContent = errMsg;
        imageStudioErrorMessageElement.style.display = 'block';
        addProcessLogEntry(`Image generation error: ${errMsg}`);
    } finally {
        imageStudioLoadingIndicator.style.display = 'none';
        imageStudioGenerateButton.disabled = false;
    }
}

function displayGeneratedImages(imagesData) {
    if (!imageStudioGridElement) return;
    imageStudioGridElement.innerHTML = ''; 

    imagesData.forEach((imgData, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'image-studio-item';

        const imgElement = document.createElement('img');
        const imageSrc = `data:${imgData.mimeType};base64,${imgData.base64}`;
        imgElement.src = imageSrc;
        imgElement.alt = `Generated image for: ${imgData.prompt.substring(0, 50)} - ${index + 1}`;
        imgElement.onclick = () => openInAppImageViewer(imageSrc); 

        const downloadButton = document.createElement('button');
        downloadButton.className = 'download-btn-overlay';
        downloadButton.innerHTML = `<span class="material-symbols-outlined">download</span>`;
        downloadButton.setAttribute('aria-label', `Download image ${index + 1}`);
        downloadButton.onclick = (e) => {
            e.stopPropagation(); 
            downloadImageWithBase64(imgData.base64, imgData.mimeType, `nova-image-${imgData.prompt.substring(0,20).replace(/\s+/g, '_')}-${index + 1}.jpeg`);
        };
        itemDiv.appendChild(imgElement);
        itemDiv.appendChild(downloadButton);
        imageStudioGridElement.appendChild(itemDiv);
    });
}

// --- Helper Utilities ---
/**
 * Triggers a browser download for a base64 encoded image.
 * @param {string} base64Data The base64 encoded image data.
 * @param {string} mimeType The MIME type of the image (e.g., 'image/jpeg', 'image/png').
 * @param {string} filename The desired filename for the downloaded image.
 */
function downloadImageWithBase64(base64Data, mimeType, filename) {
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${base64Data}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}