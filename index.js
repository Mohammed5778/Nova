

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

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBpYxSx0MYQ6c_RRSOLvqEEWkKOMq5Zg0",
  authDomain: "sign-b2acd.firebaseapp.com",
  databaseURL: "https://sign-b2acd-default-rtdb.firebaseio.com",
  projectId: "sign-b2acd",
  storageBucket: "sign-b2acd.appspot.com",
  messagingSenderId: "1039449385751",
  appId: "1:1039449385751:web:e63d9b04d5698595922552",
  measurementId: "G-6D6JECNJ2Q"
};

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
const CREATE_TOOL_SCREEN_ID = "create-tool-screen";
const MEMORIES_SCREEN_ID = "memories-screen";


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
let uploadFileButton = null;
let fileInputHidden = null;
let stagedFilePreviewElement = null;
let stagedFileClearButton = null;


// Settings Elements
let aiToneRadios;
let darkModeToggle = null;
let ttsToggle = null;
let internetSearchToggle = null;
let deepThinkingToggle = null;
let creativityLevelSelect = null;
let advancedScientificModeToggle = null;


// Profile Screen Elements
let profileUserName = null;
let profileUserEmail = null;
let profileInterests = null;
let profilePreferences = null;
let profileFacts = null;
let logoutButton = null;
let viewMemoriesButton = null;

// Memories Screen Elements (New)
let memoriesListContainer = null;
let memoriesBackButton = null;


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

// Sign-In Screen Elements
let signinEmailInput = null;
let signinPasswordInput = null;
let signinButton = null;
let signupButton = null;
let authErrorMessageElement = null;

// Create Tool Screen Elements (New)
let createToolScreenElement = null;
let toolNameInput = null;
let toolInstructionsInput = null;
let toolKnowledgeInput = null;
let saveToolButton = null;
let createToolBackButton = null;
let createToolErrorMessageElement = null;
let chatListCreateToolButton = null;

// Global State
let currentScreen = SPLASH_SCREEN_ID;
const screens = [SPLASH_SCREEN_ID, ONBOARDING_SCREEN_ID, SIGNIN_SCREEN_ID, CHAT_LIST_SCREEN_ID, CHAT_SCREEN_ID, SETTINGS_SCREEN_ID, PROFILE_SCREEN_ID, WEBVIEW_SCREEN_ID, IMAGE_VIEWER_SCREEN_ID, CODE_CANVAS_SCREEN_ID, IMAGE_STUDIO_SCREEN_ID, CREATE_TOOL_SCREEN_ID, MEMORIES_SCREEN_ID];
let ai;
let geminiChat;
let isLoading = false;
let isImageLoading = false;
let geminiInitialized = false;
let processLogVisible = false;
let simulatedProcessInterval;


let chatSessions = [];
let currentChatSessionId = null;
let userProfile = { interests: [], preferences: {}, facts: [] };
let savedMemories = [];
let customTools = [];
let stagedFile = null;


// Feature States
let isListening = false;
let ttsEnabled = false;
let currentAiTone = 'friendly';
let darkModeEnabled = true;
let voiceModeActive = false;
let manualTTScancelForMic = false;
let internetSearchEnabled = false;
let deepThinkingEnabled = false;
let advancedScientificModeEnabled = false;
let currentImageEngine = 'standard';
let currentChatIsBasedOnTool = null;
let currentCreativityLevel = 'balanced';


// Firebase State
let firebaseApp;
let firebaseAuth;
let currentUser = null;


// Web Speech API
const WebSpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
if (WebSpeechRecognition) {
    recognition = new WebSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.lang = navigator.language || 'en-US';
}

// For PDF and Excel export (ensure these are declared if used before CDN script loads, though typically they are used in event handlers)
var html2pdf;
var XLSX;

// --- START OF CORE CHAT AND GEMINI FUNCTIONS ---

function detectMessageLanguage(text) {
    if (!text) return 'unknown';
    const arabicRegex = /[\u0600-\u06FF]/;
    if (arabicRegex.test(text)) {
        return 'ar';
    }
    return 'en';
}

function getSystemInstruction(tone, profile, isDeepThinking, isInternetSearch, isToolChat = false, isAdvancedScientificMode = false) {
    let baseInstruction = "";

    if (isAdvancedScientificMode && !isToolChat) {
        baseInstruction = `You are Nova, an AI specialized in advanced scientific research and academic writing. The user has enabled "Advanced Scientific Research Mode".
Your process MUST be:
1.  **Deep Analysis & Planning**: Meticulously analyze the user's request. Before writing, create a detailed internal plan and outline for a comprehensive scientific paper, including standard sections (Abstract, Introduction, Literature Review, Methodology, Results, Discussion, Conclusion, References if applicable).
2.  **Structured Content Generation**: Generate content for each section, ensuring depth, coherence, and logical flow. Aim for substantial length, comparable to real academic papers.
3.  **Academic Rigor**: Use formal, objective, and precise language. Employ appropriate scientific terminology.
4.  **Evidence-Based Reasoning**: Support claims with sound logic. If internet search is used and provides citable sources, integrate them.
5.  **Iterative Refinement & Self-Correction**: Internally review and refine the content for accuracy, clarity, and completeness as you generate it.
Do not explicitly state these planning steps in your response, but adhere to them strictly. Respond in the primary language of the user's last message; default to English if unclear. Format using Markdown suitable for a research paper. If asked to continue, seamlessly resume from the previous point, maintaining the established structure and depth.`;
    } else if (!isToolChat) {
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
    }


    if (isDeepThinking && !isAdvancedScientificMode) {
        baseInstruction += `\n\nIMPORTANT: The user has enabled "Deep Thinking Mode". Your process should be:
1. Thorough Analysis: Carefully examine the user's query, breaking it down into its core components. Identify any nuances, implicit questions, or underlying needs.
2. Knowledge Retrieval & Synthesis: Access and synthesize relevant information from your knowledge base. If the query is complex or requires diverse information, pull from multiple areas.
3. Multi-perspective Consideration: Explore different angles, viewpoints, or interpretations related to the query. If applicable, consider potential pros and cons, alternative solutions, or broader implications.
4. Structured Reasoning: Formulate your response with clear, logical steps. If you're providing an explanation or argument, ensure your reasoning is easy to follow.
5. Comprehensive & Insightful Output: Aim to provide a response that is not just accurate but also insightful, offering depth and context beyond a superficial answer. Anticipate potential follow-up questions if appropriate.
When generating long reports, maintain coherence across segments and critically review your output for accuracy and completeness before finalizing each part. If continuing a previous thought, ensure seamless integration.
Do not explicitly state these steps in your response, but use them to guide your thought process.`;
    }
    if (isInternetSearch && !isToolChat && !isAdvancedScientificMode) {
         baseInstruction += `\n\nIMPORTANT: The user has enabled "Internet Search". Use Google Search to find up-to-date information when the query seems to require it (e.g., recent events, specific facts not in your base knowledge). When you use search results, you MUST cite your sources. After providing your answer, list the URLs of the websites you used under a "Sources:" heading.`;
    }
     else if (voiceModeActive && !isDeepThinking && !isAdvancedScientificMode) {
        baseInstruction += `\n\nThis is a voice conversation, so try to keep responses relatively concise and conversational for a better spoken experience.`;
    }


    let profileInfo = "\n\nTo help personalize your responses, remember the following about the user (use this information subtly and naturally, do not explicitly state 'I remember you like X'):";
    let hasProfileData = false;
    if (currentUser?.displayName || profile.name) {
        profileInfo += `\n- Their name is ${currentUser?.displayName || profile.name}. Address them by their name occasionally if it feels natural.`;
        hasProfileData = true;
    } else if (currentUser?.email && !profile.name) {
         profileInfo += `\n- You can refer to them by the first part of their email: ${currentUser.email.split('@')[0]}.`;
         hasProfileData = true;
    }

    if (profile.interests && profile.interests.length > 0) { profileInfo += `\n- They are interested in: ${profile.interests.join(', ')}.`; hasProfileData = true; }
    if (profile.preferences && Object.keys(profile.preferences).length > 0) {
        profileInfo += `\n- Preferences: ${Object.entries(profile.preferences).map(([k,v]) => `${k}: ${v}`).join('; ')}.`;
        hasProfileData = true;
    }
    if (profile.facts && profile.facts.length > 0) { profileInfo += `\n- Other facts about them: ${profile.facts.join('; ')}.`; hasProfileData = true; }

    const userMemories = savedMemories.filter(m => m.userId === currentUser?.uid);
    if (userMemories.length > 0) {
        profileInfo += "\n\nHere are some specific things the user has asked you to remember (their saved memories). Prioritize these if relevant:";
        userMemories.sort((a,b) => b.timestamp - a.timestamp).slice(0, 5).forEach(mem => {
            profileInfo += `\n- Regarding a previous point by ${mem.sender}: "${mem.text.substring(0,150)}${mem.text.length > 150 ? '...' : ''}" (Saved on: ${new Date(mem.timestamp).toLocaleDateString()})`;
        });
        hasProfileData = true;
    }

    if (hasProfileData) {
        baseInstruction += profileInfo;
    } else if (!isToolChat && !isAdvancedScientificMode) {
        baseInstruction += "\n\nYou don't have specific profile information for this user yet. Try to learn about them if they share details.";
    }
    baseInstruction += "\nFormat your responses using Markdown. This includes tables, lists, code blocks (e.g., ```html ... ```), bold, italic, etc., where appropriate for clarity and structure. Ensure code blocks are properly formatted and language-tagged if known."
    if (!isAdvancedScientificMode) {
        baseInstruction += "\n\nIf the user asks you to 'generate a storyboard' or 'create a storyboard from a script', first provide a textual breakdown of the script into scenes and describe the visual elements for each panel/shot in text. Do not attempt to generate images directly for the storyboard in this initial text response. The user can then use dedicated image generation tools (like the in-chat image button or image studio) to visualize each described panel using your textual descriptions as prompts."
    }
    return baseInstruction;
}

function initializeGeminiSDK() {
  if (!GEMINI_API_KEY) {
    const commonErrorMessage = "Error: API Key not configured. Please contact support or check documentation.";
    if (currentScreen === CHAT_SCREEN_ID) {
        displaySystemMessage(commonErrorMessage, CHAT_SCREEN_ID, 'en');
        disableChatInput(true, false);
    } else if (currentScreen === IMAGE_STUDIO_SCREEN_ID) {
        if(imageStudioErrorMessageElement) {
            imageStudioErrorMessageElement.textContent = commonErrorMessage;
            imageStudioErrorMessageElement.style.display = 'block';
        }
        if(imageStudioGenerateButton) imageStudioGenerateButton.disabled = true;
    } else {
        console.warn(commonErrorMessage);
    }
    geminiInitialized = false;
    return false;
  }
  try {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    geminiInitialized = true;
    console.log("Gemini SDK Initialized Successfully.");
    if (currentScreen === CHAT_SCREEN_ID) {
        disableChatInput(false, false);
    } else if (currentScreen === IMAGE_STUDIO_SCREEN_ID && imageStudioGenerateButton) {
        imageStudioGenerateButton.disabled = false;
        if(imageStudioErrorMessageElement && imageStudioErrorMessageElement.textContent && imageStudioErrorMessageElement.textContent.includes("API Key not configured")) {
            imageStudioErrorMessageElement.style.display = 'none';
        }
    }
    return true;
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
     const commonErrorMessage = "Error: Could not initialize AI. Please check your API key and network connection.";
    if (currentScreen === CHAT_SCREEN_ID) {
        displaySystemMessage(commonErrorMessage, CHAT_SCREEN_ID, 'en');
        disableChatInput(true, false);
    } else if (currentScreen === IMAGE_STUDIO_SCREEN_ID) {
        if(imageStudioErrorMessageElement) {
            imageStudioErrorMessageElement.textContent = commonErrorMessage;
            imageStudioErrorMessageElement.style.display = 'block';
        }
        if(imageStudioGenerateButton) imageStudioGenerateButton.disabled = true;
    } else {
         console.error(commonErrorMessage);
    }
    geminiInitialized = false;
    return false;
  }
}

function createNewChatSession() {
  if (!currentUser) {
      displaySystemMessage("Please sign in to start a new chat.", CHAT_SCREEN_ID);
      showScreen(SIGNIN_SCREEN_ID);
      return;
  }
  currentChatSessionId = null;
  currentChatIsBasedOnTool = null;
  if (chatMessagesContainer) chatMessagesContainer.innerHTML = '';
  if (stagedFilePreviewElement && stagedFileClearButton) {
    stagedFile = null;
    updateStagedFilePreview();
  }

  if (!geminiInitialized && !initializeGeminiSDK()) {
    displaySystemMessage("Error: AI Service not available.", CHAT_SCREEN_ID);
    return;
  }
  const systemInstruction = getSystemInstruction(currentAiTone, userProfile, deepThinkingEnabled, internetSearchEnabled, false, advancedScientificModeEnabled);
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
  if (!currentUser) {
      displaySystemMessage("Please sign in to load chats.", CHAT_SCREEN_ID);
      showScreen(SIGNIN_SCREEN_ID);
      return;
  }
  const session = chatSessions.find(s => s.id === sessionId);
  if (!session) {
    createNewChatSession();
    return;
  }
  currentChatSessionId = sessionId;
  currentChatIsBasedOnTool = session.basedOnToolId || null;
  if (stagedFilePreviewElement && stagedFileClearButton) {
    stagedFile = null;
    updateStagedFilePreview();
  }

  if (chatMessagesContainer) chatMessagesContainer.innerHTML = '';

  if (!geminiInitialized && !initializeGeminiSDK()) {
    displaySystemMessage("Error: AI Service not available.", CHAT_SCREEN_ID);
    return;
  }

  const history = session.messages
    .filter(msg => msg.sender !== 'System')
    .map(msg => {
        const parts = [];
        if (msg.messageType === 'image' && msg.imageData) {
            parts.push({ text: msg.imageData.promptForImage || "[AI generated an image based on previous prompt]" });
        } else if (msg.userUploadedFile) {
            parts.push({ text: `[User uploaded file: ${msg.userUploadedFile.name}] ${msg.text || ""}`.trim() });
        } else {
            parts.push({ text: msg.text || "[empty message]" });
        }
        return {
            role: (msg.sender === "User") ? "user" : "model",
            parts
        };
    });

  let systemInstruction;
  if (currentChatIsBasedOnTool) {
      const tool = customTools.find(t => t.id === currentChatIsBasedOnTool);
      if (tool) {
          const baseSystemForTool = getSystemInstruction(currentAiTone, userProfile, deepThinkingEnabled, internetSearchEnabled, true, advancedScientificModeEnabled);
          systemInstruction = `${tool.instructions}\n\n${baseSystemForTool}`;
          if (tool.knowledge) {
              systemInstruction += `\n\nConsider the following initial knowledge for this task:\n${tool.knowledge}`;
          }
      } else {
          console.warn(`Tool with ID ${currentChatIsBasedOnTool} not found for loaded chat. Reverting to default instructions.`);
          currentChatIsBasedOnTool = null;
          session.basedOnToolId = undefined;
          systemInstruction = getSystemInstruction(session.aiToneUsed || currentAiTone, userProfile, deepThinkingEnabled, internetSearchEnabled, false, advancedScientificModeEnabled);
      }
  } else {
      systemInstruction = getSystemInstruction(session.aiToneUsed || currentAiTone, userProfile, deepThinkingEnabled, internetSearchEnabled, false, advancedScientificModeEnabled);
  }

  geminiChat = ai.chats.create({
    model: TEXT_MODEL_NAME,
    history,
    config: { systemInstruction }
  });

  if (chatScreenTitleElement) {
      if (currentChatIsBasedOnTool) {
          const tool = customTools.find(t => t.id === currentChatIsBasedOnTool);
          chatScreenTitleElement.textContent = tool ? `Tool: ${tool.name}` : (session.title || "Nova");
      } else {
          chatScreenTitleElement.textContent = session.title || "Nova";
      }
  }

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
        msg.imageData,
        msg.userUploadedFile
      );
    });
  showScreen(CHAT_SCREEN_ID);
   if (voiceModeActive && !isListening) {
     handleMicInput();
   }
}

async function generateChatTitle(firstUserMsg, firstAiMsg) {
    const defaultTitle = firstUserMsg.substring(0, 25) + (firstUserMsg.length > 25 ? "..." : "");
    if (!ai || !geminiInitialized) {
        return defaultTitle;
    }
    try {
        const prompt = `Based on this initial exchange, suggest a very short, concise title (max 5 words) for this chat conversation:
User: "${firstUserMsg.substring(0, 100)}${firstUserMsg.length > 100 ? "..." : ""}"
AI: "${firstAiMsg.substring(0, 100)}${firstAiMsg.length > 100 ? "..." : ""}"
Title:`;
        const response = await ai.models.generateContent({
            model: TEXT_MODEL_NAME,
            contents: prompt,
            config: { temperature: 0.3 }
        });
        let title = response.text.trim().replace(/^["']|["']$/g, "");
        if (!title || title.toLowerCase().startsWith("title:") || title.length < 3 || title.length > 50) {
            title = defaultTitle;
        }
        return title.length > 35 ? title.substring(0,32) + "..." : title;
    } catch (error) {
        console.error("Error generating chat title:", error);
        return defaultTitle;
    }
}

function scrollToBottomChat() {
  if (chatMessagesContainer) chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

function disableChatInput(textLoading, imageLoading) {
    isLoading = textLoading;
    isImageLoading = imageLoading;
    const anyLoading = isLoading || isImageLoading;

    if (isLoading) {
        if (novaProcessingIndicatorElement) {
            let loadingText = "Nova is processing...";
            if (advancedScientificModeEnabled) {
                loadingText = "Nova is conducting advanced research and drafting...";
            } else if (deepThinkingEnabled && internetSearchEnabled) {
                loadingText = "Nova is researching and thinking deeply...";
            } else if (deepThinkingEnabled) {
                loadingText = "Nova is thinking deeply...";
            } else if (internetSearchEnabled) {
                loadingText = "Nova is researching...";
            }
            novaProcessingIndicatorElement.textContent = loadingText;
            novaProcessingIndicatorElement.style.display = 'flex';
            novaProcessingIndicatorElement.classList.add('visible');
        }
        if (novaImageProcessingIndicatorElement) {
             novaImageProcessingIndicatorElement.style.display = 'none';
             novaImageProcessingIndicatorElement.classList.remove('visible');
        }
        if (processLogVisible) startSimulatedProcessLog();
    } else if (isImageLoading) {
        if (novaImageProcessingIndicatorElement) {
            novaImageProcessingIndicatorElement.style.display = 'flex';
            novaImageProcessingIndicatorElement.classList.add('visible');
        }
         if (novaProcessingIndicatorElement) {
            novaProcessingIndicatorElement.style.display = 'none';
            novaProcessingIndicatorElement.classList.remove('visible');
        }
        stopSimulatedProcessLog();
    } else {
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
  if (uploadFileButton) uploadFileButton.disabled = anyLoading;

  sendButton?.classList.toggle('opacity-50', anyLoading);
  sendButton?.classList.toggle('cursor-not-allowed', anyLoading);
  micButton?.classList.toggle('opacity-50', anyLoading && !isListening);
  micButton?.classList.toggle('cursor-not-allowed', anyLoading && !isListening);
  codeCanvasButton?.classList.toggle('opacity-50', anyLoading);
  codeCanvasButton?.classList.toggle('cursor-not-allowed', anyLoading);
  generateImageChatButtonElement?.classList.toggle('opacity-50', anyLoading);
  generateImageChatButtonElement?.classList.toggle('cursor-not-allowed', anyLoading);
  uploadFileButton?.classList.toggle('opacity-50', anyLoading);
  uploadFileButton?.classList.toggle('cursor-not-allowed', anyLoading);
}

function displaySystemMessage(text, screenIdContext, lang = 'en') {
    if (screenIdContext === CHAT_SCREEN_ID && chatMessagesContainer) {
         const systemMessageId = `sys-msg-${Date.now()}`;
         appendMessage("System", text, 'ai', false, null, true, null, lang, systemMessageId, 'text');
    } else {
        console.warn(`System Message (screen: ${screenIdContext}): ${text}`);
    }
}

function appendMessage(senderName, textOrData, type, isStreaming = false, existingMessageDiv = null, isInitialSystemMessage = false, sources = null, detectedLang, messageId, messageType = 'text', imageData, userUploadedFile) {
  if (!chatMessagesContainer) return null;

  let messageWrapper;
  let messageContentHolder;
  let aiMessageContentDiv = null;
  let contentWrapperDiv;

  const language = detectedLang || detectMessageLanguage(typeof textOrData === 'string' ? textOrData : (imageData?.promptForImage || userUploadedFile?.name || ""));
  const domId = messageId || existingMessageDiv?.id || `msg-${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  if (existingMessageDiv && messageType === 'text') {
    messageWrapper = existingMessageDiv;
    const existingTextEl = messageWrapper.querySelector('.message-text');
    if (existingTextEl && isStreaming) {
        existingTextEl.innerHTML = renderMarkdownToHTML(textOrData);
        existingTextEl.dir = language === 'ar' ? 'rtl' : 'ltr';
    }
  } else {
    messageWrapper = document.createElement('div');
    messageWrapper.id = domId;
    messageWrapper.className = 'flex items-end gap-3 p-4 chat-message-wrapper lg:p-5 relative group';

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 lg:w-12 lg:h-12 shrink-0 border-2 border-[#19e5c6]/50';

    contentWrapperDiv = document.createElement('div');
    contentWrapperDiv.className = `flex flex-1 flex-col gap-1 max-w-[85%] lg:max-w-[75%] ${type === 'user' ? 'user-message-content-wrapper' : 'ai-message-content-wrapper'}`;

    const senderNamePara = document.createElement('p');
    senderNamePara.className = 'text-[#A0E1D9] text-xs lg:text-sm font-medium leading-normal';
    senderNamePara.textContent = senderName;

    messageContentHolder = document.createElement('div');

    if (type === 'ai') {
        aiMessageContentDiv = document.createElement('div');
        aiMessageContentDiv.className = 'ai-message-content bg-[#1A3A35] text-white rounded-xl rounded-bl-none shadow-md overflow-hidden lg:rounded-lg';
    } else {
        messageContentHolder.className = 'message-text text-base lg:text-lg font-normal leading-relaxed flex rounded-xl px-4 py-3 shadow-md break-words rounded-br-none bg-[#19e5c6] text-[#0C1A18]';
    }

    if (messageType === 'text') {
        messageContentHolder.classList.add('message-text', 'text-base', 'lg:text-lg', 'font-normal', 'leading-relaxed', 'break-words');
        if (type === 'ai' && aiMessageContentDiv) {
            messageContentHolder.classList.add('px-4', 'py-3', 'lg:px-5', 'lg:py-4');
        }
        let currentText = textOrData;
        if (userUploadedFile) {
            const filePreamble = `Analyzing ${userUploadedFile.isImage ? "image" : "file"}: <i>${escapeHTML(userUploadedFile.name)}</i>.\n`;
            currentText = `${filePreamble}${textOrData}`;
             messageContentHolder.innerHTML = renderMarkdownToHTML(currentText);
        } else {
            messageContentHolder.innerHTML = renderMarkdownToHTML(textOrData);
        }
    } else if (messageType === 'image' && imageData) {
        messageContentHolder.classList.add('ai-message-image-container', 'p-3');
        const promptPara = document.createElement('p');
        promptPara.className = 'ai-image-prompt-text text-xs text-gray-300 mb-2 px-1';
        promptPara.textContent = `Image for: "${imageData.promptForImage}"`;
        messageContentHolder.appendChild(promptPara);

        const imgElement = document.createElement('img');
        imgElement.src = `data:${imageData.mimeType};base64,${imageData.base64}`;
        imgElement.alt = imageData.promptForImage;
        imgElement.className = 'rounded-md object-contain max-w-full h-auto cursor-pointer shadow-sm';
        imgElement.onclick = () => openInAppImageViewer(imgElement.src);
        messageContentHolder.appendChild(imgElement);

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-in-chat-image-btn mt-2 ml-auto flex items-center gap-1 text-xs px-2 py-1 bg-[#244742] hover:bg-[#19e5c6] text-[#A0E1D9] hover:text-[#0C1A18] rounded-md transition-colors';
        downloadBtn.innerHTML = `<span class="material-symbols-outlined text-sm">download</span> Download`;
        downloadBtn.dataset.base64 = imageData.base64;
        downloadBtn.dataset.mime = imageData.mimeType;
        downloadBtn.dataset.prompt = imageData.promptForImage;
        messageContentHolder.appendChild(downloadBtn);
    }

    messageContentHolder.dir = language === 'ar' ? 'rtl' : 'ltr';
    senderNamePara.dir = language === 'ar' ? 'rtl' : 'ltr';

    if (type === 'user') {
      messageWrapper.classList.add('justify-end');
      contentWrapperDiv.classList.add('items-end');
      avatarDiv.style.backgroundImage = `url("${USER_AVATAR_URL}")`;
      contentWrapperDiv.appendChild(senderNamePara);
      contentWrapperDiv.appendChild(messageContentHolder);
      messageWrapper.appendChild(contentWrapperDiv);
      messageWrapper.appendChild(avatarDiv);
    } else {
      messageWrapper.classList.add('justify-start');
      contentWrapperDiv.classList.add('items-start');
      avatarDiv.style.backgroundImage = `url("${AI_AVATAR_URL}")`;
      if (senderName === "System") {
         avatarDiv.style.opacity = "0.6";
         if (aiMessageContentDiv) aiMessageContentDiv.classList.add('opacity-90', 'italic', 'bg-[#222]');
         else messageContentHolder.classList.add('opacity-90', 'italic');
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
        sourcesContainer.className = 'chat-message-external-sources ml-[calc(2.5rem+0.75rem)] mr-4 my-1 p-2 bg-[#102824] rounded-md text-xs';
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
    sourcesHeading.className = "text-[#A0E1D9] font-semibold mb-1";
    sourcesContainer.appendChild(sourcesHeading);
    const ol = document.createElement('ol');
    ol.className = "list-decimal list-inside text-gray-300 space-y-0.5";
    sources.forEach(source => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = source.uri;
        a.textContent = source.title || source.uri;
        a.className = 'webview-link text-[#19e5c6] hover:underline';
        a.dataset.url = source.uri;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        li.appendChild(a);
        try {
            const domain = new URL(source.uri).hostname.replace(/^www\./, '');
            const domainSpan = document.createElement('span');
            domainSpan.className = 'source-domain text-gray-400 ml-1';
            domainSpan.textContent = `(${domain})`;
            li.appendChild(domainSpan);
        } catch (e) {}
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

  if (type === 'ai' && !isStreaming && !isInitialSystemMessage && senderName !== "System" && aiMessageContentDiv) {
      let actionsContainer = messageWrapper.querySelector('.message-actions-container');
      if (!actionsContainer) {
          actionsContainer = document.createElement('div');
          actionsContainer.className = 'message-actions-container mt-2';
          if (contentWrapperDiv && aiMessageContentDiv.parentNode === contentWrapperDiv) {
              contentWrapperDiv.appendChild(actionsContainer);
          } else {
               messageWrapper.appendChild(actionsContainer);
          }
      }
      actionsContainer.innerHTML = '';

      const copyButton = document.createElement('button');
      copyButton.className = 'message-action-btn copy-answer-btn';
      copyButton.innerHTML = `<span class="material-symbols-outlined text-sm">content_copy</span> Copy Answer`;
      copyButton.onclick = () => {
          const textToCopy = messageContentHolder.innerText;
          navigator.clipboard.writeText(textToCopy).then(() => {
              const originalText = copyButton.innerHTML;
              copyButton.innerHTML = `<span class="material-symbols-outlined text-sm">check_circle</span> Copied!`;
              copyButton.disabled = true;
              setTimeout(() => {
                  copyButton.innerHTML = originalText;
                  copyButton.disabled = false;
              }, 2000);
          }).catch(err => console.error('Failed to copy text: ', err));
      };
      actionsContainer.appendChild(copyButton);

      if (messageType === 'text') {
          const continueButton = document.createElement('button');
          continueButton.className = 'message-action-btn continue-generation-btn';
          continueButton.innerHTML = `<span class="material-symbols-outlined text-sm">play_arrow</span> Continue`;
          continueButton.onclick = () => {
              if (chatInput) {
                  chatInput.value = "Please continue generating from where you left off with your previous response.";
                  handleSendMessage();
              }
          };
          actionsContainer.appendChild(continueButton);
      }

      const saveMemoryButton = document.createElement('button');
      saveMemoryButton.className = 'message-action-btn save-memory-btn';
      saveMemoryButton.innerHTML = `<span class="material-symbols-outlined text-sm">bookmark_add</span> Save to Memory`;
      saveMemoryButton.dataset.messageId = domId;
      saveMemoryButton.onclick = () => {
          const textToSave = (messageType === 'image' && imageData) ? `[Image: ${imageData.promptForImage}]` : textOrData;
          handleSaveToMemory(domId, textToSave, senderName , currentChatSessionId);
      };
      actionsContainer.appendChild(saveMemoryButton);

      if (messageType === 'text') {
          const exportPdfButton = document.createElement('button');
          exportPdfButton.className = 'message-action-btn export-pdf-btn';
          exportPdfButton.innerHTML = `<span class="material-symbols-outlined text-sm">picture_as_pdf</span> Export PDF`;
          exportPdfButton.onclick = () => {
              if (typeof html2pdf !== 'undefined') {
                  const elementToExport = messageContentHolder;
                  const filename = `nova-chat-${senderName.toLowerCase().replace(/\s/g, '-')}-${Date.now()}.pdf`;
                  html2pdf().from(elementToExport).set({
                      margin: [10, 10, 10, 10],
                      filename: filename,
                      image: { type: 'jpeg', quality: 0.98 },
                      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                  }).save();
              } else {
                  console.error("html2pdf library not found.");
                  alert("PDF export functionality is currently unavailable.");
              }
          };
          actionsContainer.appendChild(exportPdfButton);

          if (messageContentHolder.querySelector('table')) {
              const exportExcelButton = document.createElement('button');
              exportExcelButton.className = 'message-action-btn export-excel-btn';
              exportExcelButton.innerHTML = `<span class="material-symbols-outlined text-sm">backup_table</span> Export Excel`;
              exportExcelButton.onclick = () => {
                  if (typeof XLSX !== 'undefined') {
                      const tableElement = messageContentHolder.querySelector('table');
                      if (tableElement) {
                          const filename = `nova-chat-table-${Date.now()}.xlsx`;
                          const wb = XLSX.utils.table_to_book(tableElement);
                          XLSX.writeFile(wb, filename);
                      }
                  } else {
                      console.error("XLSX (SheetJS) library not found.");
                      alert("Excel export functionality is currently unavailable.");
                  }
              };
              actionsContainer.appendChild(exportExcelButton);
          }
      }

      const toolForThisChat = customTools.find(t => t.id === currentChatIsBasedOnTool);
      if (toolForThisChat && toolForThisChat.name === "Resume Builder" && textOrData.includes("<!-- START RESUME HTML -->")) {
          const resumeHtmlMatch = textOrData.match(/<!-- START RESUME HTML -->([\s\S]*?)<!-- END RESUME HTML -->/);
          if (resumeHtmlMatch && resumeHtmlMatch[1]) {
              const resumeHtmlContent = resumeHtmlMatch[1].trim();
              const downloadResumeBtn = document.createElement('button');
              downloadResumeBtn.className = 'message-action-btn resume-download-btn bg-[#19e5c6] text-[#0C1A18] hover:bg-opacity-90 py-2 px-4 text-sm';
              downloadResumeBtn.innerHTML = `<span class="material-symbols-outlined text-base mr-1">picture_as_pdf</span> Download Resume as PDF`;
              downloadResumeBtn.onclick = () => {
                  if (typeof html2pdf !== 'undefined') {
                      const filename = `Nova-Resume-${currentUser?.displayName || 'User'}-${Date.now()}.pdf`;
                      const element = document.createElement('div');
                      element.innerHTML = resumeHtmlContent;
                      const style = document.createElement('style');
                      style.innerHTML = `body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; } h1, h2, h3 { color: #19e5c6; margin-bottom: 0.5em; } h1 { font-size: 24px; border-bottom: 2px solid #19e5c6; padding-bottom: 0.3em; } h2 { font-size: 18px; margin-top: 1em; } h3 { font-size: 16px; font-style: italic; } ul { list-style-type: disc; margin-left: 20px; } p { margin-bottom: 0.5em; } .section { margin-bottom: 1.5em; } .contact-info { margin-bottom: 1em; text-align: center; }`;
                      element.prepend(style);
                      html2pdf().from(element).set({
                          margin: 15,
                          filename: filename,
                          image: { type: 'jpeg', quality: 0.98 },
                          html2canvas: { scale: 2, useCORS: true, letterRendering: true, windowWidth: 800 },
                          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                      }).save();
                  } else {
                      console.error("html2pdf library not found.");
                      alert("PDF export functionality is currently unavailable.");
                  }
              };
              actionsContainer.appendChild(downloadResumeBtn);
          }
      }
  }

  if (!isStreaming && !isInitialSystemMessage && senderName !== "System") {
    let textForHistory;
    if (messageType === 'image' && imageData) {
        textForHistory = `[AI Image for: ${imageData.promptForImage}]`;
    } else if (userUploadedFile) {
        textForHistory = `[File: ${userUploadedFile.name}] ${textOrData}`;
    }
    else {
        textForHistory = textOrData;
    }

    const msgToSave = {
        id: domId,
        sender: senderName,
        text: textForHistory,
        timestamp: Date.now(),
        sources: (type === 'ai' && messageType === 'text' && sources) ? sources : undefined,
        detectedLanguage: language,
        messageType: messageType,
        imageData: messageType === 'image' ? imageData : undefined,
        userUploadedFile: userUploadedFile || undefined
    };

    if (currentChatSessionId) {
      const session = chatSessions.find(s => s.id === currentChatSessionId);
      if (session) {
        const existingMsgIndex = session.messages.findIndex(m => m.id === msgToSave.id);
        if (existingMsgIndex !== -1) {
            session.messages[existingMsgIndex] = msgToSave;
        } else {
            session.messages.push(msgToSave);
        }
        session.lastUpdated = Date.now();
      }
    } else if (type === 'user' && currentUser) {
      currentChatSessionId = `session-${Date.now()}`;
      const toolForTitle = currentChatIsBasedOnTool ? customTools.find(t=>t.id === currentChatIsBasedOnTool) : null;
      const newSession = {
        id: currentChatSessionId,
        title: currentChatIsBasedOnTool ? `Tool: ${toolForTitle?.name || 'Unnamed Tool'}` : "New Chat...",
        messages: [msgToSave],
        lastUpdated: Date.now(),
        aiToneUsed: currentAiTone,
        basedOnToolId: currentChatIsBasedOnTool || undefined
      };
      chatSessions.push(newSession);
      if (chatScreenTitleElement) chatScreenTitleElement.textContent = newSession.title;
    }
    saveChatSessionsToLocalStorage();
    if (currentScreen === CHAT_LIST_SCREEN_ID || currentScreen === CHAT_SCREEN_ID) {
        renderChatList();
    }
  }
  scrollToBottomChat();
  return messageWrapper;
}

function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function renderMarkdownToHTML(markdownText) {
    let html = markdownText;
    const codeBlockPlaceholders = [];
    html = html.replace(/```(\w*)\n([\s\S]*?)\n```/g, (match, lang, rawCode) => {
        const languageClass = lang ? `language-${lang.trim()}` : '';
        const trimmedRawCode = rawCode.trim();
        const escapedCodeForDisplay = escapeHTML(trimmedRawCode);
        const escapedCodeForDataAttr = escapeHTML(trimmedRawCode);
        const toolbarHtml = `<div class="code-block-toolbar">${lang ? `<span class="code-block-lang">${escapeHTML(lang.trim())}</span>` : ''}<button class="copy-code-btn" data-code="${escapedCodeForDataAttr}" aria-label="Copy code snippet"><span class="material-symbols-outlined">content_copy</span><span>Copy</span></button><button class="preview-code-btn" data-code="${escapedCodeForDataAttr}" aria-label="Preview code snippet in canvas"><span class="material-symbols-outlined">play_circle</span><span>Preview</span></button></div>`;
        const codeBlockHtml = `<div class="code-block-wrapper">${toolbarHtml}<pre class="${languageClass}"><code class="${languageClass}">${escapedCodeForDisplay}</code></pre></div>`;
        codeBlockPlaceholders.push(codeBlockHtml);
        return `%%CODEBLOCK_WRAPPER_${codeBlockPlaceholders.length - 1}%%`;
    });

    const inlineCodes = [];
    html = html.replace(/`([^`]+)`/g, (match, code) => {
        inlineCodes.push(`<code>${escapeHTML(code)}</code>`);
        return `%%INLINECODE_${inlineCodes.length - 1}%%`;
    });
    html = escapeHTML(html);

    html = html.replace(/^\|(.+)\|\r?\n\|([\s\S]+?)\|\r?\n((?:\|.*\|\r?\n?)*)/gm, (tableMatch) => {
        const rows = tableMatch.trim().split(/\r?\n/);
        if (rows.length < 2) return tableMatch;
        const headerCells = rows[0].slice(1, -1).split('|').map(s => s.trim());
        const separatorLine = rows[1].slice(1, -1).split('|').map(s => s.trim());
        if (headerCells.length !== separatorLine.length || !separatorLine.every(s => /^\s*:?-+:?\s*$/.test(s))) {
            return tableMatch;
        }
        let tableHtml = '<div class="table-wrapper"><table class="markdown-table">';
        tableHtml += '<thead><tr>';
        headerCells.forEach(header => { tableHtml += `<th>${header}</th>`; });
        tableHtml += '</tr></thead>';
        tableHtml += '<tbody>';
        for (let i = 2; i < rows.length; i++) {
            if (!rows[i].trim().startsWith('|') || !rows[i].trim().endsWith('|')) continue;
            tableHtml += '<tr>';
            rows[i].slice(1, -1).split('|').forEach(cell => { tableHtml += `<td>${cell.trim()}</td>`; });
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
    html = html.replace(/^\s*&gt; (.*$)/gim, '<p>%%BLOCKQUOTE_LINE%%$1</p>');
    html = html.replace(/(<p>%%BLOCKQUOTE_LINE%%.*?<\/p>)+/g, (match) => {
        return `<blockquote>${match.replace(/<p>%%BLOCKQUOTE_LINE%%(.*?)<\/p>/g, '<p>$1</p>')}</blockquote>`;
    });
    html = html.replace(/<\/blockquote>\s*<blockquote>/gim, '</blockquote><blockquote>');
    html = html.replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm, '<hr>');
    html = html.replace(/^\s*([*\-+]) +(.*)/gm, (match, bullet, item) => `%%UL_START%%<li>${item.trim()}</li>`);
    html = html.replace(/(%%UL_START%%(<li>.*?<\/li>)+)/g, '<ul>$2</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, '');
    html = html.replace(/^\s*(\d+)\. +(.*)/gm, (match, number, item) => `%%OL_START%%<li>${item.trim()}</li>`);
    html = html.replace(/(%%OL_START%%(<li>.*?<\/li>)+)/g, '<ol>$2</ol>');
    html = html.replace(/<\/ol>\s*<ol>/g, '');

    html = html.split(/\r?\n/).map(paragraph => {
      paragraph = paragraph.trim();
      if (!paragraph) return '';
      if (paragraph.match(/^<\/?(h[1-6]|ul|ol|li|blockquote|hr|table|div class="table-wrapper"|div class="code-block-wrapper")/) ||
          paragraph.startsWith('%%CODEBLOCK_WRAPPER_') || paragraph.startsWith('%%INLINECODE_') ||
          paragraph.startsWith('%%UL_START%%') || paragraph.startsWith('%%OL_START%%')) {
          return paragraph;
      }
      return `<p>${paragraph}</p>`;
    }).join('');
    html = html.replace(/%%UL_START%%<li>(.*?)<\/li>/g, '<ul><li>$1</li></ul>');
    html = html.replace(/%%OL_START%%<li>(.*?)<\/li>/g, '<ol><li>$1</li></ol>');

    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        const decodedText = text;
        const decodedUrl = url.replace(/&amp;/g, '&');
        const classAttr = (decodedUrl.startsWith('http:') || decodedUrl.startsWith('https:')) ? `class="webview-link" data-url="${escapeHTML(decodedUrl)}"` : '';
        return `<a href="${escapeHTML(decodedUrl)}" ${classAttr} target="_blank" rel="noopener noreferrer">${decodedText}</a>`;
    });
    html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    html = html.replace(/(^|[^\*])\*([^\*]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');
    html = html.replace(/(^|[^_])_([^_]+)_([^_]|$)/g, '$1<em>$2</em>$3');
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    html = html.replace(/%%INLINECODE_(\d+)%%/g, (match, index) => inlineCodes[parseInt(index)]);
    html = html.replace(/%%CODEBLOCK_WRAPPER_(\d+)%%/g, (match, index) => codeBlockPlaceholders[parseInt(index)]);

    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p><br\s*\/?>\s*<\/p>/g, '');
    html = html.replace(/(\r?\n)+/g, '\n');
    html = html.replace(/\n(<\/(?:ul|ol|li|h[1-6]|p|blockquote|hr|pre|table|div)>)/g, '$1');
    html = html.replace(/(<(?:ul|ol|li|h[1-6]|p|blockquote|hr|pre|table|div).*?>)\n/g, '$1');
    return html.trim();
}

async function handleSendMessage() {
  if (!currentUser) {
      displaySystemMessage("Please sign in to send messages.", CHAT_SCREEN_ID);
      showScreen(SIGNIN_SCREEN_ID);
      return;
  }
  if (isLoading || isImageLoading || !chatInput) return;
  let userMessageText = chatInput.value.trim();
  let currentStagedFile = stagedFile;
  if (!userMessageText && !currentStagedFile) {
    if (chatInput) chatInput.placeholder = "Please type a message or upload a file.";
    return;
  }
  if (chatInput) chatInput.placeholder = "Ask Nova anything...";

  if (!geminiInitialized && !initializeGeminiSDK()) {
    displaySystemMessage("AI Service is not ready. Message not sent.", CHAT_SCREEN_ID);
    return;
  }

  const userMessageId = `msg-user-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
  let fullMessageForDisplay = userMessageText;
  const geminiMessageParts = [];

  if (currentStagedFile) {
    if (currentStagedFile.type === 'image') {
        geminiMessageParts.push({ inlineData: { mimeType: currentStagedFile.mimeType, data: currentStagedFile.content } });
        fullMessageForDisplay = `[Image: ${currentStagedFile.name}] ${userMessageText}`.trim();
    } else {
        geminiMessageParts.push({ text: `Context from file "${currentStagedFile.name}":\n${currentStagedFile.content}` });
         fullMessageForDisplay = `[File: ${currentStagedFile.name}] ${userMessageText}`.trim();
    }
    if (userMessageText) {
        geminiMessageParts.push({ text: userMessageText });
    } else if (currentStagedFile.type === 'image') {
        geminiMessageParts.push({ text: "Describe this image."});
        if (!userMessageText) fullMessageForDisplay = `[Image: ${currentStagedFile.name}] Describe this image.`;
    } else {
         geminiMessageParts.push({ text: "What can you tell me about the content of this file?" });
         if (!userMessageText) fullMessageForDisplay = `[File: ${currentStagedFile.name}] What about this file?`;
    }
  } else {
      geminiMessageParts.push({ text: userMessageText });
  }

  const userMessageLang = detectMessageLanguage(userMessageText || (currentStagedFile?.name || ""));
  if (currentChatIsBasedOnTool && !currentChatSessionId) {
        currentChatSessionId = `session-tool-${currentChatIsBasedOnTool}-${Date.now()}`;
        const tool = customTools.find(t => t.id === currentChatIsBasedOnTool);
        const newSession = { id: currentChatSessionId, title: tool ? `Tool: ${tool.name}` : "Tool Chat", messages: [], lastUpdated: Date.now(), aiToneUsed: currentAiTone, basedOnToolId: currentChatIsBasedOnTool };
        chatSessions.push(newSession);
        if (chatScreenTitleElement) chatScreenTitleElement.textContent = newSession.title;
  } else if (!geminiChat || !currentChatSessionId) {
    const systemInstruction = getSystemInstruction(currentAiTone, userProfile, deepThinkingEnabled, internetSearchEnabled, false, advancedScientificModeEnabled);
    geminiChat = ai.chats.create({ model: TEXT_MODEL_NAME, config: { systemInstruction } });
     if (!currentChatSessionId) {
        currentChatSessionId = `session-${Date.now()}`;
        const newSession = { id: currentChatSessionId, title: "New Chat...", messages: [], lastUpdated: Date.now(), aiToneUsed: currentAiTone };
        chatSessions.push(newSession);
        if (chatScreenTitleElement) chatScreenTitleElement.textContent = newSession.title;
     }
  }

  appendMessage("User", fullMessageForDisplay, 'user', false, null, false, null, userMessageLang, userMessageId, 'text', undefined, currentStagedFile ? {name: currentStagedFile.name, type: currentStagedFile.type, isImage: currentStagedFile.type === 'image'} : undefined);
  if (chatInput) chatInput.value = "";
  stagedFile = null;
  updateStagedFilePreview();
  disableChatInput(true, false);

  let aiMessageDiv = null;
  let fullResponseText = "";
  let isFirstAIMessageInNewChat = false;
  let groundingSources = null;
  let aiResponseLang = 'unknown';
  const aiMessageId = `msg-ai-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;

  if (currentChatSessionId) {
    const session = chatSessions.find(s => s.id === currentChatSessionId);
    if (session && session.messages.filter(m => m.sender === 'Nova' || m.sender === 'Nova (Tool Mode)').length === 0) {
        isFirstAIMessageInNewChat = true;
    }
  }

  try {
    const sendMessageParams = { message: geminiMessageParts };
    const perMessageConfig = {};
    let configApplied = false;

    if (internetSearchEnabled) {
        perMessageConfig.tools = [{ googleSearch: {} }];
        configApplied = true;
    }
    if (TEXT_MODEL_NAME === 'gemini-2.5-flash-preview-04-17') {
      if (!deepThinkingEnabled && !advancedScientificModeEnabled && (voiceModeActive || currentCreativityLevel === 'focused')) {
        perMessageConfig.thinkingConfig = { thinkingBudget: 0 };
        configApplied = true;
      }
    }
    switch(currentCreativityLevel) {
        case 'focused': perMessageConfig.temperature = 0.2; configApplied = true; break;
        case 'balanced': perMessageConfig.temperature = 0.7; configApplied = true; break;
        case 'inventive': perMessageConfig.temperature = 1.0; configApplied = true; break;
    }
    if (configApplied) {
        sendMessageParams.config = perMessageConfig;
    }

    const result = await geminiChat.sendMessageStream(sendMessageParams);
    for await (const chunk of result) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullResponseText += chunkText;
        if (aiResponseLang === 'unknown' && fullResponseText.length > 10) {
            aiResponseLang = detectMessageLanguage(fullResponseText);
        }
        const aiSenderName = currentChatIsBasedOnTool ? "Nova (Tool Mode)" : "Nova";
        if (!aiMessageDiv) {
          aiMessageDiv = appendMessage(aiSenderName, fullResponseText, 'ai', true, null, false, null, aiResponseLang, aiMessageId, 'text');
        } else {
          appendMessage(aiSenderName, fullResponseText, 'ai', true, aiMessageDiv, false, null, aiResponseLang, aiMessageId, 'text');
        }
        scrollToBottomChat();
      }
      if (chunk.candidates && chunk.candidates[0]?.groundingMetadata?.groundingChunks) {
          const newSources = chunk.candidates[0].groundingMetadata.groundingChunks
              .map(gc => ({ uri: gc.web?.uri || gc.retrievedContext?.uri || '', title: gc.web?.title || gc.retrievedContext?.uri || '' }))
              .filter(s => s.uri);
          if (newSources.length > 0) {
              groundingSources = [...(groundingSources || []), ...newSources].reduce((acc, current) => {
                  if (!acc.find(item => item.uri === current.uri)) acc.push(current);
                  return acc;
              }, []);
              if (aiMessageDiv && groundingSources && groundingSources.length > 0) {
                const aiSenderName = currentChatIsBasedOnTool ? "Nova (Tool Mode)" : "Nova";
                appendMessage(aiSenderName, fullResponseText, 'ai', true, aiMessageDiv, false, groundingSources, aiResponseLang, aiMessageId, 'text');
              }
              if (processLogVisible && groundingSources && groundingSources.length > 0) {
                    newSources.forEach(source => addProcessLogEntry(`Found source: ${source.title || source.uri}`, 'source', source.uri));
              }
          }
      }
    }

    if (ttsEnabled && fullResponseText) {
        const textForSpeech = fullResponseText.replace(/<br\s*\/?>/gi, "\n").replace(/<p.*?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+(>|$)/g, "").replace(/\n\s*\n/g, "\n").trim();
        speak(textForSpeech, true, aiResponseLang);
    }

    if (fullResponseText && currentChatSessionId) {
        const session = chatSessions.find(s => s.id === currentChatSessionId);
        if (session) {
            const aiSenderName = currentChatIsBasedOnTool ? "Nova (Tool Mode)" : "Nova";
             if (aiMessageDiv) {
                appendMessage(aiSenderName, fullResponseText, 'ai', false, aiMessageDiv, false, groundingSources, aiResponseLang, aiMessageId, 'text');
            } else {
                appendMessage(aiSenderName, fullResponseText, 'ai', false, null, false, groundingSources, aiResponseLang, aiMessageId, 'text');
            }
            if (isFirstAIMessageInNewChat && !session.basedOnToolId) {
                const userMsgForTitle = session.messages.find(m => m.sender === 'User')?.text || fullMessageForDisplay;
                const newTitle = await generateChatTitle(userMsgForTitle, fullResponseText);
                session.title = newTitle;
                if(chatScreenTitleElement) chatScreenTitleElement.textContent = newTitle;
                 saveChatSessionsToLocalStorage();
                 renderChatList();
            }
            if (!session.basedOnToolId) {
                 await extractAndStoreUserInfo(session);
            }
        }
    }
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    let errorMessage = "Sorry, I encountered an error processing your request. Please try again.";
    if (error && error.message) {
        if (error.message.includes("API key not valid")) errorMessage = "There's an issue with the API configuration. Please contact support.";
        else if (error.message.toLowerCase().includes("safety") || error.message.includes(" हिंसात्मक ")) errorMessage = "Your request could not be processed due to safety guidelines. Please rephrase your message.";
    }
    const errLang = detectMessageLanguage(errorMessage);
    const errorMsgId = `err-${aiMessageId}`;
    const aiSenderName = currentChatIsBasedOnTool ? "Nova (Tool Mode)" : "Nova";
    appendMessage(aiSenderName, errorMessage, 'ai', false, null, true, null, errLang, errorMsgId, 'text');
    if (ttsEnabled) speak(errorMessage, false, errLang);
  } finally {
    disableChatInput(false, false);
    if(chatInput && !voiceModeActive) {
        chatInput.focus();
    }
    else if (voiceModeActive && !window.speechSynthesis.speaking && !isListening && currentScreen === CHAT_SCREEN_ID) {
         handleMicInput();
    }
  }
}

// --- END OF CORE CHAT AND GEMINI FUNCTIONS ---


// --- START OF PORTED/NEWLY ADDED FUNCTIONS (Utilities, Event Handlers, etc.) ---

function updateStagedFilePreview() {
    if (stagedFilePreviewElement) {
        const fileNameSpan = stagedFilePreviewElement.querySelector('.staged-file-name');
        const fileTypeSpan = stagedFilePreviewElement.querySelector('.staged-file-type');

        if (stagedFile) {
            stagedFilePreviewElement.style.display = 'flex';
            if (fileNameSpan) fileNameSpan.textContent = stagedFile.name;
            if (fileTypeSpan) fileTypeSpan.textContent = `Type: ${stagedFile.type}`;

            if (stagedFileClearButton) {
                stagedFileClearButton.style.display = 'inline-block';
                stagedFileClearButton.onclick = () => {
                    stagedFile = null;
                    updateStagedFilePreview();
                    if (chatInput) chatInput.focus();
                };
            }
        } else {
            stagedFilePreviewElement.style.display = 'none';
            if (stagedFileClearButton) {
                stagedFileClearButton.style.display = 'none';
            }
        }
    }
}

function setCodeCanvasView(mode) {
    codeCanvasViewMode = mode;
    if (!codeCanvasTextarea || !codeCanvasInlinePreviewIframe || !codeCanvasToggleViewButton || !codeCanvasEnterFullscreenButton || !codeEditorWrapper) return;

    if (mode === 'preview') {
        codeEditorWrapper.style.display = 'none';
        if(codeCanvasInlinePreviewIframe) codeCanvasInlinePreviewIframe.style.display = 'block';
        if(codeCanvasToggleViewButton) codeCanvasToggleViewButton.textContent = 'Show Code';
        if(codeCanvasEnterFullscreenButton) codeCanvasEnterFullscreenButton.classList.remove('hidden');
    } else { // 'code'
        codeEditorWrapper.style.display = 'block';
        if(codeCanvasInlinePreviewIframe) codeCanvasInlinePreviewIframe.style.display = 'none';
        if(codeCanvasToggleViewButton) codeCanvasToggleViewButton.textContent = 'Show Preview';
        if(codeCanvasEnterFullscreenButton) codeCanvasEnterFullscreenButton.classList.add('hidden');
        if(codeCanvasTextarea) codeCanvasTextarea.focus();
    }
}

function handleMicInput() {
    if (!WebSpeechRecognition) {
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
            // Do nothing, it's a known issue
        } else {
            alert("Could not start voice recognition. Please check microphone permissions.");
        }
        micButtonContainer?.classList.remove('listening');
        micButton?.querySelector('.mic-listening-indicator')?.classList.remove('animate-ping', 'opacity-100');
        isListening = false;
         if(!(e instanceof Error && e.name === 'InvalidStateError')) {
           manualTTScancelForMic = false;
         }
    }
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
        a.target = "_blank";
        a.rel = "noopener noreferrer";
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
    if (!processLogVisible || (!deepThinkingEnabled && !internetSearchEnabled && !advancedScientificModeEnabled)) {
        if (simulatedProcessInterval) clearInterval(simulatedProcessInterval);
        simulatedProcessInterval = undefined;
        return;
    }
    clearProcessLog();

    const steps = [];
    if (advancedScientificModeEnabled) {
        steps.push("Initiating advanced scientific research protocol...", "Deconstructing query for core research themes...", "Planning research paper structure (Abstract, Intro, Methods...)...", "Formulating detailed outline sections...", "Drafting initial sections based on plan...", "Synthesizing information and refining arguments...");
    } else {
        if (internetSearchEnabled) steps.push("Formulating search queries...", "Searching the web...", "Reviewing search results...");
        if (deepThinkingEnabled) steps.push("Accessing knowledge base...", "Analyzing information...", "Considering multiple perspectives...", "Synthesizing insights...");
    }

    if (stagedFile) {
        steps.unshift(`Analyzing ${stagedFile.type}: ${stagedFile.name}...`, "Extracting content...");
    }

    if (steps.length === 0) steps.push("Processing your request...");
    steps.push("Generating response...");

    let currentStep = 0;
    if (steps.length > 0) {
      addProcessLogEntry(steps[currentStep++]);
    }

    simulatedProcessInterval = window.setInterval(() => {
        if (currentStep < steps.length) {
            addProcessLogEntry(steps[currentStep++]);
        } else {
            if (!advancedScientificModeEnabled) { // Stop for non-scientific mode
                stopSimulatedProcessLog();
            } else if (processLogListElement && steps[steps.length-1] !== processLogListElement.lastChild?.textContent) {
                // For scientific mode, indicate continuation if not actually stopped by logic elsewhere
                addProcessLogEntry("Continuing in-depth generation...");
            }
        }
    }, (advancedScientificModeEnabled ? 2500 : 1200) + Math.random() * (advancedScientificModeEnabled ? 1000 : 500));
}


function stopSimulatedProcessLog() {
    if (simulatedProcessInterval) {
        clearInterval(simulatedProcessInterval);
        simulatedProcessInterval = undefined;
    }
}

function openInAppImageViewer(imageUrl) {
    if (imageViewerScreenElement && imageViewerImg) {
        imageViewerImg.src = imageUrl;
        showScreen(IMAGE_VIEWER_SCREEN_ID);
    } else {
        window.open(imageUrl, '_blank');
    }
}

function downloadImageWithBase64(base64Data, mimeType, filename) {
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${base64Data}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

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
    const targetLang = lang === 'ar' ? 'ar-SA' : (lang === 'en' ? 'en-US' : navigator.language || 'en-US');
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
            displaySystemMessage(`Voice for ${targetLang} is not available on your device. TTS for this message is skipped.`, CHAT_SCREEN_ID, 'en');
        }
        if (ttsEnabled && voiceModeActive && isAiMessageForVoiceMode && !isListening && currentScreen === CHAT_SCREEN_ID) {
            handleMicInput();
        }
    };
    window.speechSynthesis.speak(utterance);
}

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

function openInAppWebView(url) {
    if (webviewScreenElement && webviewFrame && webviewTitle && webviewLoading) {
        webviewTitle.textContent = "Loading...";
        webviewFrame.src = 'about:blank';
        if(webviewLoading) webviewLoading.style.display = 'block';
        if(webviewFrame) webviewFrame.style.display = 'none';
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
        toggleProcessLogButtonElement.setAttribute('aria-expanded', String(processLogVisible));
    }
    saveSetting('processLogVisible', processLogVisible);

    if (processLogVisible && (deepThinkingEnabled || internetSearchEnabled || advancedScientificModeEnabled || stagedFile)) {
        startSimulatedProcessLog();
    } else {
        stopSimulatedProcessLog();
    }
}

function handleFileUpload(event) {
    if (!currentUser) {
        displaySystemMessage("Please sign in to upload files.", CHAT_SCREEN_ID);
        showScreen(SIGNIN_SCREEN_ID);
        return;
    }
    const target = event.target;
    const file = target.files?.[0];
    if (!file) return;

    const textBasedTypes = [
        'text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json',
        'application/xml', 'application/x-python-code', 'text/markdown', 'text/csv',
    ];
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    if (file.size > MAX_FILE_SIZE) {
        displaySystemMessage(`File "${file.name}" is too large (max ${MAX_FILE_SIZE / (1024*1024)}MB).`, CHAT_SCREEN_ID);
        if (fileInputHidden) fileInputHidden.value = '';
        return;
    }

    const isTextFile = textBasedTypes.includes(file.type) ||
                       file.name.match(/\.(txt|html|css|js|json|xml|py|md|csv|log|yaml|yml|rtf|tsv|ini|cfg|conf|sh|bat|ps1|rb|java|c|cpp|h|hpp|cs|go|php|swift|kt|dart|rs|lua|pl|sql)$/i);
    const isImageFile = imageTypes.includes(file.type);

    if (isTextFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileContent = e.target?.result;
            stagedFile = {
                name: file.name,
                type: 'text',
                content: fileContent,
                mimeType: file.type || 'text/plain'
            };
            updateStagedFilePreview();
            displaySystemMessage(`Text file "${file.name}" is staged for analysis. Type your query and send.`, CHAT_SCREEN_ID);
        };
        reader.onerror = () => {
            displaySystemMessage(`Error reading file "${file.name}".`, CHAT_SCREEN_ID);
            stagedFile = null;
            updateStagedFilePreview();
        };
        reader.readAsText(file);
    } else if (isImageFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Content = (e.target?.result).split(',')[1];
            stagedFile = {
                name: file.name,
                type: 'image',
                content: base64Content,
                mimeType: file.type
            };
            updateStagedFilePreview();
            displaySystemMessage(`Image "${file.name}" is staged for analysis. Type your query and send.`, CHAT_SCREEN_ID);
        };
        reader.onerror = () => {
            displaySystemMessage(`Error reading image "${file.name}".`, CHAT_SCREEN_ID);
            stagedFile = null;
            updateStagedFilePreview();
        };
        reader.readAsDataURL(file);
    } else {
        displaySystemMessage(`File type "${file.type || 'unknown'}" (${file.name}) is not currently supported for direct analysis. Please try a common text or image file.`, CHAT_SCREEN_ID);
        stagedFile = null;
        updateStagedFilePreview();
    }

    if (fileInputHidden) {
        fileInputHidden.value = ''; // Reset file input
    }
}

async function handleGenerateImageInChat() {
    if (!currentUser) {
      displaySystemMessage("Please sign in to generate images.", CHAT_SCREEN_ID);
      showScreen(SIGNIN_SCREEN_ID);
      return;
    }
    if (isLoading || isImageLoading || !chatInput) return;
    const prompt = chatInput.value.trim();
    if (!prompt) {
        displaySystemMessage("Please enter a prompt for the image.", CHAT_SCREEN_ID, 'en');
        return;
    }

    if (!geminiInitialized && !initializeGeminiSDK()) {
      displaySystemMessage("AI Service not ready for image generation.", CHAT_SCREEN_ID, 'en');
      return;
    }

    const userMessageLang = detectMessageLanguage(prompt);
    const userMessageId = `msg-user-imgprompt-${Date.now()}`;
    appendMessage("User", prompt, 'user', false, null, false, null, userMessageLang, userMessageId, 'text');
    chatInput.value = "";
    disableChatInput(false, true);

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
                        id: aiImageId, sender: 'Nova',
                        text: `[AI generated image for prompt: ${prompt.substring(0,50)}...]`,
                        timestamp: Date.now(), messageType: 'image', imageData: imageDataPayload, detectedLanguage: 'en'
                    };
                    session.messages.push(aiImageMessageForHistory);
                    session.lastUpdated = Date.now();
                    saveChatSessionsToLocalStorage();
                    renderChatList();
                }
            } else {
                currentChatSessionId = `session-img-${Date.now()}`;
                const newSession = {
                    id: currentChatSessionId, title: `Image: ${prompt.substring(0,20)}...`,
                    messages: [
                        { id: userMessageId, sender: 'User', text: prompt, timestamp: Date.now()-100, detectedLanguage: userMessageLang, messageType: 'text'},
                        { id: aiImageId, sender: 'Nova', text: `[AI image for: ${prompt.substring(0,50)}...]`, timestamp: Date.now(), messageType: 'image', imageData: imageDataPayload, detectedLanguage: 'en' }
                    ],
                    lastUpdated: Date.now(), aiToneUsed: currentAiTone,
                };
                chatSessions.push(newSession);
                if (chatScreenTitleElement) chatScreenTitleElement.textContent = newSession.title;
                saveChatSessionsToLocalStorage();
                renderChatList();
            }
        } else {
            displaySystemMessage("Sorry, I couldn't generate an image for that prompt. Please try a different prompt or check the image model.", CHAT_SCREEN_ID, 'en');
        }
    } catch (error) {
        console.error("Error generating image in chat:", error);
        let errMsg = "Failed to generate image. Please try again.";
        if (error instanceof Error) errMsg = `Image Generation Error: ${error.message}`;
        if (error.message && (error.message.toLowerCase().includes("safety") || error.message.includes("प्रोम्प्ट में मौजूद नहीं किया जा सका"))) {
            errMsg = "The image could not be generated due to safety guidelines. Please try a different prompt.";
        }
        displaySystemMessage(errMsg, CHAT_SCREEN_ID, 'en');
    } finally {
        disableChatInput(false, false);
        if (chatInput && !voiceModeActive) chatInput.focus();
    }
}


function displayGeneratedImages(imagesData) {
    if (!imageStudioGridElement) return;
    imageStudioGridElement.innerHTML = '';

    imagesData.forEach((imgData, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'image-studio-item group relative aspect-square overflow-hidden rounded-lg shadow-lg cursor-pointer transition-all hover:shadow-xl focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#19E5C6]';
        itemDiv.tabIndex = 0;

        const imgElement = document.createElement('img');
        const imageSrc = `data:${imgData.mimeType};base64,${imgData.base64}`;
        imgElement.src = imageSrc;
        imgElement.alt = `Generated image for: ${imgData.prompt.substring(0, 50)} - ${index + 1}`;
        imgElement.className = 'w-full h-full object-cover transition-transform group-hover:scale-105';
        imgElement.onclick = () => openInAppImageViewer(imageSrc);

        const overlayDiv = document.createElement('div');
        overlayDiv.className = 'absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center';

        const downloadButton = document.createElement('button');
        downloadButton.className = 'download-btn-overlay p-2 bg-[#19E5C6]/80 text-[#0C1A18] rounded-full hover:bg-[#19E5C6] focus:outline-none focus:ring-2 focus:ring-white';
        downloadButton.innerHTML = `<span class="material-symbols-outlined text-2xl leading-none">download</span>`;
        downloadButton.setAttribute('aria-label', `Download image ${index + 1}`);
        downloadButton.onclick = (e) => {
            e.stopPropagation();
            downloadImageWithBase64(imgData.base64, imgData.mimeType, `nova-image-${imgData.prompt.substring(0,20).replace(/\s+/g, '_')}-${index + 1}.jpeg`);
        };

        overlayDiv.appendChild(downloadButton);
        itemDiv.appendChild(imgElement);
        itemDiv.appendChild(overlayDiv);
        imageStudioGridElement.appendChild(itemDiv);
    });
}

async function handleGenerateImages() {
    if (!imageStudioPromptInput || !imageStudioGenerateButton || !imageStudioLoadingIndicator || !imageStudioGridElement || !imageStudioErrorMessageElement || !imageStudioDownloadAllButton) return;

    if (!currentUser) {
      if (imageStudioErrorMessageElement) {
        imageStudioErrorMessageElement.textContent = "Please sign in to generate images.";
        imageStudioErrorMessageElement.style.display = 'block';
      }
      return;
    }

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
    imageStudioGenerateButton.classList.add('opacity-50', 'cursor-not-allowed');
    if (imageStudioLoadingIndicator) imageStudioLoadingIndicator.style.display = 'flex';
    if (imageStudioGridElement) imageStudioGridElement.innerHTML = '';
    if (imageStudioErrorMessageElement) imageStudioErrorMessageElement.style.display = 'none';
    if (imageStudioDownloadAllButton) imageStudioDownloadAllButton.style.display = 'none';
    currentGeneratedImagesData = [];

    try {
        const imageGenConfig = {
            numberOfImages: 4,
            outputMimeType: 'image/jpeg',
        };

        if (imageStudioAspectRatioSelect && imageStudioAspectRatioSelect.value) {
            imageGenConfig.aspectRatio = imageStudioAspectRatioSelect.value;
        } else {
            imageGenConfig.aspectRatio = "1:1";
        }

        const selectedEngineModel = (imageStudioEngineSelect?.value === 'imagefx') ? IMAGE_MODEL_NAME : IMAGE_MODEL_NAME;

        const response = await ai.models.generateImages({
            model: selectedEngineModel,
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
            if (imageStudioDownloadAllButton) imageStudioDownloadAllButton.style.display = 'flex';
        } else {
            if (imageStudioErrorMessageElement) {
                imageStudioErrorMessageElement.textContent = "No images were generated. Try a different prompt or check the model settings.";
                imageStudioErrorMessageElement.style.display = 'block';
            }
        }
    } catch (error) {
        console.error("Error generating images in Image Studio:", error);
        let errMsg = "Failed to generate images. Please try again.";
        if (error instanceof Error) {
            errMsg = `Error: ${error.message}`;
        } else if (typeof error === 'string') {
            errMsg = error;
        }
        if (imageStudioErrorMessageElement) {
            imageStudioErrorMessageElement.textContent = errMsg;
            imageStudioErrorMessageElement.style.display = 'block';
        }
    } finally {
        if (imageStudioLoadingIndicator) imageStudioLoadingIndicator.style.display = 'none';
        if (imageStudioGenerateButton) {
            imageStudioGenerateButton.disabled = false;
            imageStudioGenerateButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

function setupEventListeners() {
    if (window.speechSynthesis && typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }
    window.speechSynthesis.getVoices();

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
    
    advancedScientificModeToggle?.addEventListener('change', () => {
        if (!advancedScientificModeToggle) return;
        advancedScientificModeEnabled = advancedScientificModeToggle.checked;
        saveSetting('advancedScientificModeEnabled', advancedScientificModeEnabled);
    });

    creativityLevelSelect?.addEventListener('change', () => {
        if (!creativityLevelSelect) return;
        currentCreativityLevel = creativityLevelSelect.value;
        saveSetting('currentCreativityLevel', currentCreativityLevel);
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
            if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
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

    signinButton?.addEventListener('click', handleSignIn);
    signupButton?.addEventListener('click', handleSignUp);
    logoutButton?.addEventListener('click', handleSignOut);
    viewMemoriesButton?.addEventListener('click', () => showScreen(MEMORIES_SCREEN_ID));
    memoriesBackButton?.addEventListener('click', () => showScreen(PROFILE_SCREEN_ID));

    chatListCreateToolButton?.addEventListener('click', () => showScreen(CREATE_TOOL_SCREEN_ID));
    createToolBackButton?.addEventListener('click', () => showScreen(CHAT_LIST_SCREEN_ID));
    saveToolButton?.addEventListener('click', handleSaveTool);


    document.getElementById('chat-list-new-chat-header-btn')?.addEventListener('click', createNewChatSession);

    sendButton?.addEventListener('click', () => handleSendMessage());
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
    uploadFileButton?.addEventListener('click', () => fileInputHidden?.click());
    fileInputHidden?.addEventListener('change', handleFileUpload);


    let previousScreenForSettings = CHAT_LIST_SCREEN_ID;
    document.getElementById('settings-back-btn')?.addEventListener('click', () => showScreen(previousScreenForSettings || CHAT_LIST_SCREEN_ID));
    document.getElementById('chat-back-btn')?.addEventListener('click', () => showScreen(CHAT_LIST_SCREEN_ID));
    document.getElementById('profile-back-btn')?.addEventListener('click', () => showScreen(previousScreenForSettings || CHAT_LIST_SCREEN_ID));

    document.getElementById('chat-settings-btn')?.addEventListener('click', () => {
        previousScreenForSettings = CHAT_SCREEN_ID;
        showScreen(SETTINGS_SCREEN_ID);
    });

    function handleNavClick(targetScreen, currentActiveScreenBeforeNav) {
        if (!targetScreen) return;

        if (!currentUser &&
            targetScreen !== SIGNIN_SCREEN_ID &&
            targetScreen !== ONBOARDING_SCREEN_ID &&
            targetScreen !== SPLASH_SCREEN_ID) {
            showScreen(SIGNIN_SCREEN_ID);
            return;
        }

        if (targetScreen === "discover-screen") {
            alert("Discover section is not yet implemented.");
            return;
        }

        if (targetScreen === PROFILE_SCREEN_ID) {
             if (currentActiveScreenBeforeNav !== PROFILE_SCREEN_ID && currentActiveScreenBeforeNav !== MEMORIES_SCREEN_ID) {
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
        else if (targetScreen === CREATE_TOOL_SCREEN_ID) {
            showScreen(CREATE_TOOL_SCREEN_ID);
        }
        else if (screens.includes(targetScreen) &&
                 targetScreen !== WEBVIEW_SCREEN_ID &&
                 targetScreen !== IMAGE_VIEWER_SCREEN_ID &&
                 targetScreen !== CODE_CANVAS_SCREEN_ID &&
                 targetScreen !== MEMORIES_SCREEN_ID) {
            showScreen(targetScreen);
        }
    }

    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
      const buttonItem = item;
      buttonItem.addEventListener('click', () => {
        const targetScreen = buttonItem.dataset.target;
        handleNavClick(targetScreen, currentScreen);
      });
    });

    document.querySelectorAll('#desktop-sidebar .sidebar-nav-item').forEach(item => {
        const buttonItem = item;
        buttonItem.addEventListener('click', () => {
            const targetScreen = buttonItem.dataset.target;
            handleNavClick(targetScreen, currentScreen);
        });
    });


    webviewCloseBtn?.addEventListener('click', () => {
        if (webviewScreenElement && webviewFrame) {
            webviewFrame.src = 'about:blank';
            webviewScreenElement.classList.remove('active');
            const underlyingScreen = currentScreen === WEBVIEW_SCREEN_ID ? CHAT_SCREEN_ID : currentScreen;
            showScreen(underlyingScreen);
        }
    });

    imageViewerCloseBtn?.addEventListener('click', () => {
        if (imageViewerScreenElement && imageViewerImg) {
            imageViewerImg.src = '';
            imageViewerScreenElement.classList.remove('active');
            const underlyingScreen = currentScreen === IMAGE_VIEWER_SCREEN_ID ? CHAT_SCREEN_ID : currentScreen;
            showScreen(underlyingScreen);
        }
    });

    document.body.addEventListener('click', (event) => {
      const target = event.target;
      if (target.classList.contains('webview-link') && target.dataset.url) {
          event.preventDefault();
          openInAppWebView(target.dataset.url);
      }
      const downloadButton = target.closest('.download-in-chat-image-btn');
      if (downloadButton && downloadButton.dataset.base64 && downloadButton.dataset.mime) {
          const base64 = downloadButton.dataset.base64;
          const mimeType = downloadButton.dataset.mime;
          const promptForImage = downloadButton.dataset.prompt || 'generated-image';
          const filename = `nova-chat-image-${promptForImage.substring(0,20).replace(/\s+/g, '_')}.jpeg`;
          downloadImageWithBase64(base64, mimeType, filename);
      }
    });

    chatMessagesContainer?.addEventListener('click', (event) => {
        const targetElement = event.target;
        const previewButton = targetElement.closest('.preview-code-btn');
        const copyButton = targetElement.closest('.copy-code-btn');

        if (previewButton && codeCanvasTextarea) {
            const rawCode = previewButton.dataset.code;
            if (rawCode) {
                codeCanvasTextarea.value = rawCode;
                showScreen(CODE_CANVAS_SCREEN_ID);
                setCodeCanvasView('preview');
                renderCodeToIframe();
            }
        } else if (copyButton) {
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
        const underlyingScreen = currentScreen === CODE_CANVAS_SCREEN_ID ? CHAT_SCREEN_ID : currentScreen;
        showScreen(underlyingScreen);
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

    codeCanvasTextarea?.addEventListener('input', renderCodeToIframeDebounced);

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

    if (recognition) {
        recognition.onstart = () => {
            isListening = true;
            micButtonContainer?.classList.add('listening');
            micButton?.querySelector('.mic-listening-indicator')?.classList.add('animate-ping', 'opacity-100');
            micButton?.setAttribute('aria-label', 'Stop listening');
            micButton?.setAttribute('aria-pressed', 'true');
            if (voiceModeToggle) voiceModeToggle.disabled = true;
            if (codeCanvasButton) codeCanvasButton.disabled = true;
            if (generateImageChatButtonElement) generateImageChatButtonElement.disabled = true;
            if (uploadFileButton) uploadFileButton.disabled = true;
        };

        recognition.onend = () => {
            isListening = false;
            micButtonContainer?.classList.remove('listening');
            micButton?.querySelector('.mic-listening-indicator')?.classList.remove('animate-ping', 'opacity-100');
            micButton?.setAttribute('aria-label', 'Use microphone');
            micButton?.setAttribute('aria-pressed', 'false');
            if (voiceModeToggle) voiceModeToggle.disabled = false;
            if (codeCanvasButton) codeCanvasButton.disabled = isLoading || isImageLoading;
            if (generateImageChatButtonElement) generateImageChatButtonElement.disabled = isLoading || isImageLoading;
            if (uploadFileButton) uploadFileButton.disabled = isLoading || isImageLoading;
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
            else if (event.error === 'audio-capture') errorMessage += "Microphone problem. Please check permissions and hardware.";
            else if (event.error === 'not-allowed') errorMessage += "Permission to use microphone was denied or not granted.";
            else if (event.error === 'language-not-supported') errorMessage += `STT language (${recognition.lang}) not supported.`;
            else errorMessage += `Details: ${event.error}`;

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
                    chatInput.placeholder = "Ask Nova anything...";
                }
            }
            isListening = false;
            micButtonContainer?.classList.remove('listening');
            micButton?.querySelector('.mic-listening-indicator')?.classList.remove('animate-ping', 'opacity-100');
        };
    }
}
// --- END OF PORTED/NEWLY ADDED FUNCTIONS ---

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
  uploadFileButton = document.getElementById('upload-file-button');
  fileInputHidden = document.getElementById('file-input-hidden');
  stagedFilePreviewElement = document.getElementById('staged-file-preview');
  stagedFileClearButton = document.getElementById('staged-file-clear-button');


  aiToneRadios = document.querySelectorAll('input[name="ai_tone"]');
  darkModeToggle = document.getElementById('setting-dark-mode-toggle');
  ttsToggle = document.getElementById('setting-tts-toggle');
  internetSearchToggle = document.getElementById('setting-internet-search-toggle');
  deepThinkingToggle = document.getElementById('setting-deep-thinking-toggle');
  creativityLevelSelect = document.getElementById('setting-creativity-level');
  advancedScientificModeToggle = document.getElementById('setting-advanced-scientific-mode-toggle');


  profileUserName = document.getElementById('profile-user-name');
  profileUserEmail = document.getElementById('profile-user-email');
  profileInterests = document.getElementById('profile-interests');
  profilePreferences = document.getElementById('profile-preferences');
  profileFacts = document.getElementById('profile-facts');
  logoutButton = document.getElementById('logout-button');
  viewMemoriesButton = document.getElementById('view-memories-btn');

  memoriesListContainer = document.getElementById('memories-list-container');
  memoriesBackButton = document.getElementById('memories-back-btn');

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

  imageStudioPromptInput = document.getElementById('image-studio-prompt-input');
  imageStudioEngineSelect = document.getElementById('image-studio-engine-select');
  imageStudioAspectRatioSelect = document.getElementById('image-studio-aspect-ratio-select');
  imageStudioGenerateButton = document.getElementById('image-studio-generate-btn');
  imageStudioLoadingIndicator = document.getElementById('image-studio-loading-indicator');
  imageStudioErrorMessageElement = document.getElementById('image-studio-error-message');
  imageStudioGridElement = document.getElementById('image-studio-grid');
  imageStudioDownloadAllButton = document.getElementById('image-studio-download-all-btn');

  signinEmailInput = document.getElementById('signin-email-input');
  signinPasswordInput = document.getElementById('signin-password-input');
  signinButton = document.getElementById('signin-button');
  signupButton = document.getElementById('signup-button');
  authErrorMessageElement = document.getElementById('auth-error-message');

  createToolScreenElement = document.getElementById(CREATE_TOOL_SCREEN_ID);
  toolNameInput = document.getElementById('tool-name-input');
  toolInstructionsInput = document.getElementById('tool-instructions-input');
  toolKnowledgeInput = document.getElementById('tool-knowledge-input');
  saveToolButton = document.getElementById('save-tool-button');
  createToolBackButton = document.getElementById('create-tool-back-btn');
  createToolErrorMessageElement = document.getElementById('create-tool-error-message');
  chatListCreateToolButton = document.getElementById('chat-list-create-tool-btn');

  if (typeof process === 'undefined') {
    window.process = { env: {} };
  }
   if (!GEMINI_API_KEY) {
      console.warn("API_KEY environment variable is not set. Gemini API calls will fail.");
  }

  initFirebaseAuth();
  updateStagedFilePreview();

  window.addEventListener('load', () => {
    if(currentScreen === CHAT_SCREEN_ID) scrollToBottomChat();
  });
  console.log("Nova AI Mobile Initialized (v1.9.2 - Advanced Scientific Mode).");
}

// --- Firebase Authentication ---
function initFirebaseAuth() {
    try {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        firebaseAuth = firebase.auth();

        firebaseAuth.onAuthStateChanged(user => {
            const onboardingComplete = localStorage.getItem('onboardingComplete') === 'true';
            if (user) {
                currentUser = user;
                if (profileUserEmail) profileUserEmail.textContent = user.email;
                if (profileUserName && user.displayName) profileUserName.textContent = user.displayName;
                else if (profileUserName && user.email) profileUserName.textContent = user.email.split('@')[0];
                if (logoutButton) logoutButton.style.display = 'block';

                if (currentScreen === SIGNIN_SCREEN_ID || currentScreen === SPLASH_SCREEN_ID || currentScreen === ONBOARDING_SCREEN_ID) {
                     showScreen(CHAT_LIST_SCREEN_ID);
                }
                if (!geminiInitialized) initializeGeminiSDK();
                loadSavedMemories();
                loadCustomTools();

            } else {
                currentUser = null;
                if (profileUserEmail) profileUserEmail.textContent = "user.email@example.com";
                if (profileUserName) profileUserName.textContent = "User Name";
                if (logoutButton) logoutButton.style.display = 'none';
                savedMemories = [];
                customTools = [];

                if (currentScreen !== SPLASH_SCREEN_ID && currentScreen !== ONBOARDING_SCREEN_ID && currentScreen !== SIGNIN_SCREEN_ID) {
                    showScreen(SIGNIN_SCREEN_ID);
                } else if (currentScreen === SPLASH_SCREEN_ID) {
                     setTimeout(() => {
                        if (onboardingComplete) {
                            showScreen(SIGNIN_SCREEN_ID);
                        } else {
                            showScreen(ONBOARDING_SCREEN_ID);
                        }
                    }, 2500);
                }
            }
            loadSettings();
            loadUserProfile();
            applySettings();
            loadChatSessionsFromLocalStorage();
            renderChatList();
            updateProfileScreenUI();
            setupEventListeners();
            if (currentScreen === ONBOARDING_SCREEN_ID) updateOnboardingUI();
        });
    } catch (error) {
        console.error("Firebase initialization error:", error);
        if (authErrorMessageElement) {
            authErrorMessageElement.textContent = "Failed to initialize authentication. Please refresh.";
            authErrorMessageElement.style.display = "block";
        }
        loadSettings();
        applySettings();
        setupEventListeners();
        showScreen(SIGNIN_SCREEN_ID);
    }
}

function handleSignUp() {
    if (!signinEmailInput || !signinPasswordInput || !authErrorMessageElement || !firebaseAuth) return;
    const email = signinEmailInput.value;
    const password = signinPasswordInput.value;
    authErrorMessageElement.style.display = 'none';
    authErrorMessageElement.textContent = '';

    firebaseAuth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            currentUser = userCredential.user;
            console.log("User signed up successfully:", currentUser);
        })
        .catch((error) => {
            console.error("Sign up error:", error.code, error.message);
            let userMessage = "An unexpected error occurred during sign up. Please try again.";
            if (error.code === 'auth/email-already-in-use') {
                userMessage = "This email address is already in use. Please try signing in or use a different email.";
            } else if (error.code === 'auth/weak-password') {
                userMessage = "The password is too weak. Please choose a stronger password (at least 6 characters).";
            } else if (error.code === 'auth/invalid-email') {
                userMessage = "The email address is not valid. Please enter a correct email.";
            } else {
                userMessage = error.message;
            }
            if (authErrorMessageElement) {
                authErrorMessageElement.textContent = userMessage;
                authErrorMessageElement.style.display = 'block';
            }
        });
}

function handleSignIn() {
    if (!signinEmailInput || !signinPasswordInput || !authErrorMessageElement || !firebaseAuth) return;
    const email = signinEmailInput.value;
    const password = signinPasswordInput.value;
    authErrorMessageElement.style.display = 'none';
    authErrorMessageElement.textContent = '';

    firebaseAuth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            currentUser = userCredential.user;
            console.log("User signed in successfully:", currentUser);
        })
        .catch((error) => {
            console.error("Sign in error:", error.code, error.message);
            let userMessage = "An unexpected error occurred during sign in. Please try again.";
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                userMessage = "Incorrect email or password. Please check your credentials and try again.";
            } else if (error.code === 'auth/invalid-email') {
                userMessage = "The email address is not valid. Please enter a correct email.";
            } else {
                userMessage = error.message;
            }
            if (authErrorMessageElement) {
                authErrorMessageElement.textContent = userMessage;
                authErrorMessageElement.style.display = 'block';
            }
        });
}

function handleSignOut() {
    if (!firebaseAuth) return;
    firebaseAuth.signOut()
        .then(() => {
            console.log("User signed out successfully");
            currentChatSessionId = null;
            chatSessions = [];
            savedMemories = [];
            customTools = [];
            userProfile = { interests: [], preferences: {}, facts: [] };
            if (chatMessagesContainer) chatMessagesContainer.innerHTML = '';
        })
        .catch((error) => {
            console.error("Sign out error:", error);
             if (authErrorMessageElement && currentScreen === PROFILE_SCREEN_ID) {
                authErrorMessageElement.textContent = "Logout failed: " + error.message;
                authErrorMessageElement.style.display = 'block';
            } else {
                alert("Logout failed: " + error.message);
            }
        });
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
            } else { currentAiTone = defaultAiTone; saveSetting('aiTone', currentAiTone); }
        } catch (e) {
            if (typeof storedTone === 'string' && validAiTones.includes(storedTone)) {
                currentAiTone = storedTone; saveSetting('aiTone', currentAiTone);
            } else { currentAiTone = defaultAiTone; localStorage.removeItem('aiTone'); saveSetting('aiTone', currentAiTone); }
        }
    } else { currentAiTone = defaultAiTone; }


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

    const storedAdvancedScientificMode = localStorage.getItem('advancedScientificModeEnabled');
    advancedScientificModeEnabled = storedAdvancedScientificMode ? JSON.parse(storedAdvancedScientificMode) : false;

    const storedProcessLogVisible = localStorage.getItem('processLogVisible');
    processLogVisible = storedProcessLogVisible ? JSON.parse(storedProcessLogVisible) : false;

    const storedImageEngine = localStorage.getItem('currentImageEngine');
    currentImageEngine = storedImageEngine ? JSON.parse(storedImageEngine) : 'standard';

    const storedCreativityLevel = localStorage.getItem('currentCreativityLevel');
    currentCreativityLevel = storedCreativityLevel ? JSON.parse(storedCreativityLevel) : 'balanced';
}

function applySettings() {
    const toneRadio = document.querySelector(`input[name="ai_tone"][value="${currentAiTone}"]`);
    if (toneRadio) toneRadio.checked = true;
    else if (aiToneRadios && aiToneRadios.length > 0) aiToneRadios[0].checked = true;

    if (aiToneRadios) {
        aiToneRadios.forEach(radio => {
            radio.checked = radio.value === currentAiTone;
        });
    }

    if (darkModeToggle) darkModeToggle.checked = darkModeEnabled;
    document.body.classList.toggle('light-mode', !darkModeEnabled);

    if (ttsToggle) ttsToggle.checked = ttsEnabled;
    if (internetSearchToggle) internetSearchToggle.checked = internetSearchEnabled;
    if (deepThinkingToggle) deepThinkingToggle.checked = deepThinkingEnabled;
    if (advancedScientificModeToggle) advancedScientificModeToggle.checked = advancedScientificModeEnabled;
    if (creativityLevelSelect) creativityLevelSelect.value = currentCreativityLevel;


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
    } else {
        userProfile = { interests: [], preferences: {}, facts: [] };
    }
}

function saveUserProfile() {
    localStorage.setItem('userProfileData', JSON.stringify(userProfile));
}

async function extractAndStoreUserInfo(chatSession) {
    if (!ai || !geminiInitialized || !currentUser) {
        console.warn("Gemini AI not ready or user not logged in for info extraction.");
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
    if (currentUser) {
        if (profileUserName) profileUserName.textContent = currentUser.displayName || userProfile.name || currentUser.email?.split('@')[0] || "User Name";
        if (profileUserEmail) profileUserEmail.textContent = currentUser.email || "user.email@example.com";
        if (logoutButton) logoutButton.style.display = 'block';
    } else {
        if (profileUserName) profileUserName.textContent = "User Name";
        if (profileUserEmail) profileUserEmail.textContent = "user.email@example.com";
        if (logoutButton) logoutButton.style.display = 'none';
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
  if (!currentUser && screenId !== SPLASH_SCREEN_ID && screenId !== ONBOARDING_SCREEN_ID && screenId !== SIGNIN_SCREEN_ID) {
    console.log("User not authenticated. Redirecting to sign-in.");
    currentScreen = SIGNIN_SCREEN_ID;
    screens.forEach(id => {
        const screenElement = document.getElementById(id);
        if (screenElement) {
            screenElement.style.display = (id === SIGNIN_SCREEN_ID) ? 'flex' : 'none';
        }
    });
    updateNavigationActiveState(SIGNIN_SCREEN_ID);
    return;
  }

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
    if (chatScreenTitleElement) {
        if (currentChatIsBasedOnTool) {
            const tool = customTools.find(t => t.id === currentChatIsBasedOnTool);
            chatScreenTitleElement.textContent = tool ? `Tool: ${tool.name}` : (currentSession?.title || "Nova");
        } else {
            chatScreenTitleElement.textContent = currentSession?.title || "Nova";
        }
    }
  } else if (screenId === CHAT_LIST_SCREEN_ID) {
    renderChatList();
  } else if (screenId === SETTINGS_SCREEN_ID) {
    applySettings();
  } else if (screenId === PROFILE_SCREEN_ID) {
    updateProfileScreenUI();
  } else if (screenId === CODE_CANVAS_SCREEN_ID) {
      if(codeCanvasTextarea && codeCanvasViewMode === 'code') codeCanvasTextarea.focus();
      const isOpenedByPreviewButton = document.activeElement?.classList.contains('preview-code-btn');
      if (!isOpenedByPreviewButton && codeCanvasViewMode !== 'preview') {
         setCodeCanvasView('code');
      }
  } else if (screenId === IMAGE_STUDIO_SCREEN_ID) {
    if (!geminiInitialized) initializeGeminiSDK();
    if(imageStudioPromptInput) imageStudioPromptInput.focus();
    if(imageStudioEngineSelect) imageStudioEngineSelect.value = currentImageEngine;
  } else if (screenId === MEMORIES_SCREEN_ID) {
    renderMemoriesScreen();
  } else if (screenId === CREATE_TOOL_SCREEN_ID) {
    if (toolNameInput) toolNameInput.value = '';
    if (toolInstructionsInput) toolInstructionsInput.value = '';
    if (toolKnowledgeInput) toolKnowledgeInput.value = '';
    if (createToolErrorMessageElement) createToolErrorMessageElement.style.display = 'none';
  }
}

function updateNavigationActiveState(activeScreenId) {
    document.querySelectorAll('.bottom-nav').forEach(nav => {
        nav.querySelectorAll('.nav-item').forEach(item => {
            const button = item;
            let itemTarget = button.dataset.target;
            const effectiveTarget = itemTarget === 'chat-list-screen-home' ? CHAT_LIST_SCREEN_ID : itemTarget;

            const isActive = (effectiveTarget === activeScreenId) ||
                             (item.id === 'chat-list-new-chat-nav-btn' && activeScreenId === CHAT_SCREEN_ID && !currentChatSessionId && !currentChatIsBasedOnTool) ||
                             (item.id === 'profile-new-chat-nav-btn' && activeScreenId === CHAT_SCREEN_ID && !currentChatSessionId && !currentChatIsBasedOnTool) ||
                             (item.id === 'image-studio-new-chat-nav-btn' && activeScreenId === CHAT_SCREEN_ID && !currentChatSessionId && !currentChatIsBasedOnTool);

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

    document.querySelectorAll('#desktop-sidebar .sidebar-nav-item').forEach(item => {
        const button = item;
        let itemTarget = button.dataset.target;
        const effectiveTarget = itemTarget === 'chat-list-screen-home' ? CHAT_LIST_SCREEN_ID : itemTarget;

        const isActive = (effectiveTarget === activeScreenId) ||
                         (item.id === 'sidebar-new-chat-nav-btn' && activeScreenId === CHAT_SCREEN_ID && !currentChatSessionId && !currentChatIsBasedOnTool) ||
                         (item.id === 'sidebar-create-tool-nav-btn' && activeScreenId === CREATE_TOOL_SCREEN_ID);

        button.classList.toggle('active', isActive);
    });
}


// --- Splash Screen Logic ---
function initSplash() {
  showScreen(SPLASH_SCREEN_ID);
  const progressBar = document.getElementById('splash-progress-bar');
  if (progressBar) {
      setTimeout(() => { progressBar.style.width = '100%'; }, 100);
  }
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
  } else {
    chatSessions = [];
  }
}

function deleteChatSession(sessionId) {
    const sessionToDelete = chatSessions.find(s => s.id === sessionId);
    if (!sessionToDelete) return;

    const confirmDelete = confirm(`Are you sure you want to delete the chat "${sessionToDelete.title}"? This action cannot be undone.`);
    if (confirmDelete) {
        chatSessions = chatSessions.filter(s => s.id !== sessionId);
        saveChatSessionsToLocalStorage();

        if (currentChatSessionId === sessionId) {
            currentChatSessionId = null;
            if (currentScreen === CHAT_SCREEN_ID) {
                showScreen(CHAT_LIST_SCREEN_ID);
            }
        }
        renderChatList();
    }
}

// --- Custom Tools Logic (New) ---
function saveCustomTools() {
    localStorage.setItem('customTools', JSON.stringify(customTools));
}
function loadCustomTools() {
    const storedTools = localStorage.getItem('customTools');
    if (storedTools) {
        customTools = JSON.parse(storedTools);
    } else {
        customTools = [];
    }
}

function handleSaveTool() {
    if (!toolNameInput || !toolInstructionsInput || !toolKnowledgeInput || !createToolErrorMessageElement) return;
    const name = toolNameInput.value.trim();
    const instructions = toolInstructionsInput.value.trim();
    const knowledge = toolKnowledgeInput.value.trim();

    if (!name || !instructions) {
        createToolErrorMessageElement.textContent = "Tool Name and Instructions are required.";
        createToolErrorMessageElement.style.display = 'block';
        return;
    }
    createToolErrorMessageElement.style.display = 'none';

    const newTool = {
        id: `tool-${Date.now()}`,
        name,
        instructions,
        knowledge: knowledge || undefined,
        icon: 'construction',
        lastUsed: Date.now()
    };
    customTools.push(newTool);
    saveCustomTools();
    renderChatList();
    showScreen(CHAT_LIST_SCREEN_ID);
}

function startChatWithTool(toolId) {
    const tool = customTools.find(t => t.id === toolId);
    if (!tool) {
        console.error("Tool not found:", toolId);
        displaySystemMessage("Error: Could not start chat with this tool.", CHAT_SCREEN_ID);
        return;
    }

    currentChatSessionId = null;
    currentChatIsBasedOnTool = tool.id;

    if (chatMessagesContainer) chatMessagesContainer.innerHTML = '';
    if (!geminiInitialized && !initializeGeminiSDK()) {
        displaySystemMessage("Error: AI Service not available.", CHAT_SCREEN_ID);
        return;
    }

    let systemInstruction;
    const baseSystemInstruction = getSystemInstruction(currentAiTone, userProfile, deepThinkingEnabled, internetSearchEnabled, true, advancedScientificModeEnabled);
    systemInstruction = `${tool.instructions}\n\n${baseSystemInstruction}`;

    if (tool.knowledge) {
        systemInstruction += `\n\nConsider the following initial knowledge for this task:\n${tool.knowledge}`;
    }

    geminiChat = ai.chats.create({
        model: TEXT_MODEL_NAME,
        config: { systemInstruction }
    });

    if (chatScreenTitleElement) chatScreenTitleElement.textContent = `Tool: ${tool.name}`;

    const initialGreetingText = `Using tool: ${tool.name}. How can I assist you with this tool?`;
    const initialGreetingLang = detectMessageLanguage(initialGreetingText);
    const initialMessageId = `msg-system-tool-${Date.now()}`;
    appendMessage("Nova (Tool Mode)", initialGreetingText, 'ai', false, null, true, null, initialGreetingLang, initialMessageId, 'text');
    showScreen(CHAT_SCREEN_ID);
    if (voiceModeActive && !isListening) {
        handleMicInput();
    }
}


// --- Manual Memories Logic (New) ---
function saveMemory(memory) {
    savedMemories.push(memory);
    localStorage.setItem('savedMemories', JSON.stringify(savedMemories));
}
function loadSavedMemories() {
    const storedMemories = localStorage.getItem('savedMemories');
    if (storedMemories) {
        savedMemories = JSON.parse(storedMemories);
    } else {
        savedMemories = [];
    }
}
function handleSaveToMemory(messageId, messageText, sender, chatId) {
    if (!currentUser) return;
    const memory = {
        id: `mem-${Date.now()}`,
        text: messageText,
        sender: sender,
        chatId: chatId || currentChatSessionId,
        originalMessageId: messageId,
        timestamp: Date.now(),
        userId: currentUser.uid
    };
    saveMemory(memory);
    const saveBtn = document.querySelector(`.message-action-btn.save-memory-btn[data-message-id="${messageId}"]`);
    if (saveBtn) {
        const originalTextContent = saveBtn.querySelector('span:not(.material-symbols-outlined)')?.textContent || "Save to Memory";
        saveBtn.innerHTML = `<span class="material-symbols-outlined text-sm">bookmark_added</span> Saved!`;
        saveBtn.disabled = true;
        setTimeout(() => {
             saveBtn.innerHTML = `<span class="material-symbols-outlined text-sm">bookmark_add</span> ${originalTextContent}`;
             saveBtn.disabled = false;
        }, 2000);
    }
    addProcessLogEntry(`Message saved to memory: "${messageText.substring(0, 30)}..."`);
}

function renderMemoriesScreen() {
    if (!memoriesListContainer) return;
    memoriesListContainer.innerHTML = '';
    if (!currentUser) {
        memoriesListContainer.innerHTML = `<p class="text-center text-[#7A9A94] p-8">Please sign in to view your memories.</p>`;
        return;
    }
    const userMemories = savedMemories.filter(m => m.userId === currentUser.uid);

    if (userMemories.length === 0) {
        memoriesListContainer.innerHTML = `<p class="text-center text-[#7A9A94] p-8">No memories saved yet.</p>`;
        return;
    }

    userMemories.sort((a, b) => b.timestamp - a.timestamp).forEach(memory => {
        const memoryCard = document.createElement('div');
        memoryCard.className = 'bg-[#1A3A35] p-4 rounded-lg shadow text-white';
        const textP = document.createElement('p');
        textP.className = 'text-sm mb-1 break-words';
        textP.textContent = memory.text;
        const dateP = document.createElement('p');
        dateP.className = 'text-xs text-[#A0E1D9]';
        dateP.textContent = `Saved: ${new Date(memory.timestamp).toLocaleString()} (from ${memory.sender})`;
        memoryCard.appendChild(textP);
        memoryCard.appendChild(dateP);
        memoriesListContainer.appendChild(memoryCard);
    });
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

  if (!currentUser) {
      chatListItemsContainer.innerHTML = `<p class="text-center text-[#7A9A94] p-8 lg:p-12">Please sign in to see your chats & tools.</p>`;
      return;
  }

  const combinedItems = [];
  chatSessions.forEach(session => combinedItems.push(session));
  customTools.forEach(tool => combinedItems.push({ ...tool, type: 'tool', lastUpdated: tool.lastUsed || 0 }));

  if (combinedItems.length === 0) {
    chatListItemsContainer.innerHTML = `<p class="text-center text-[#7A9A94] p-8 lg:p-12">No chats or tools yet. Start a new one or create a tool!</p>`;
    return;
  }

  const sortedItems = combinedItems.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));

  sortedItems.forEach(item => {
    const itemOuterDiv = document.createElement('div');
    itemOuterDiv.className = 'chat-list-item flex items-center justify-between gap-2 px-4 py-3 hover:bg-[#1B302C]/50 transition-colors cursor-pointer lg:py-4 lg:px-6';

    const itemType = 'messages' in item ? 'chat' : 'tool';

    itemOuterDiv.dataset.id = item.id;
    itemOuterDiv.dataset.type = itemType;

    itemOuterDiv.addEventListener('click', (e) => {
        if (e.target.closest('.delete-chat-btn') || e.target.closest('.delete-tool-btn')) {
            return;
        }
        if (itemType === 'tool') {
            startChatWithTool(item.id);
        } else {
            loadChat(item.id);
        }
    });

    const leftContentDiv = document.createElement('div');
    leftContentDiv.className = 'flex items-center gap-4 flex-grow overflow-hidden';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'text-[#19E5C6] flex items-center justify-center rounded-xl bg-[#1B302C] shrink-0 size-12 lg:size-14';

    const textContentDiv = document.createElement('div');
    textContentDiv.className = 'flex-grow overflow-hidden';
    const titleH3 = document.createElement('h3');
    titleH3.className = 'text-white text-base lg:text-lg font-medium leading-tight truncate';

    const subTextP = document.createElement('p');
    subTextP.className = 'text-[#7A9A94] text-sm lg:text-base font-normal leading-snug line-clamp-1';

    if (itemType === 'tool') {
        iconDiv.innerHTML = `<span class="material-symbols-outlined text-3xl">${item.icon || 'construction'}</span>`;
        titleH3.textContent = `Tool: ${item.name}`;
        subTextP.textContent = item.instructions.substring(0, 50) + (item.instructions.length > 50 ? "..." : "");
    } else {
        iconDiv.innerHTML = `<svg fill="currentColor" height="28px" viewBox="0 0 256 256" width="28px" xmlns="http://www.w3.org/2000/svg"><path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128ZM84,116a12,12,0,1,0,12,12A12,12,0,0,0,84,116Zm88,0a12,12,0,1,0,12,12A12,12,0,0,0,172,116Zm60,12A104,104,0,0,1,79.12,219.82L45.07,231.17a16,16,0,0,1-20.24-20.24l11.35-34.05A104,104,0,1,1,232,128Zm-16,0A88,88,0,1,0,51.81,172.06a8,8,0,0,1,.66,6.54L40,216,77.4,203.53a7.85,7.85,0,0,1,2.53-.42,8,8,0,0,1,4,1.08A88,88,0,0,0,216,128Z"></path></svg>`;
        titleH3.textContent = item.title;
        let lastMeaningfulMessage = 'No messages yet';
        if (item.messages && item.messages.length > 0) {
            const lastMsg = item.messages[item.messages.length - 1];
            if (lastMsg.messageType === 'image' && lastMsg.imageData?.promptForImage) {
                lastMeaningfulMessage = `[Image: ${lastMsg.imageData.promptForImage.substring(0,30)}...]`;
            } else if (lastMsg.userUploadedFile?.name) {
                 lastMeaningfulMessage = `[${lastMsg.userUploadedFile.isImage ? "Image" : "File"}: ${lastMsg.userUploadedFile.name}] ${lastMsg.text ? lastMsg.text.substring(0,30) : ''}...`;
            } else {
                lastMeaningfulMessage = lastMsg.text;
            }
        }
        subTextP.textContent = lastMeaningfulMessage;
        const lastMessageLang = item.messages && item.messages.length > 0 ? detectMessageLanguage(item.messages[item.messages.length - 1].text) : 'unknown';
        if (lastMessageLang === 'ar') {
            titleH3.dir = "rtl";
            subTextP.dir = "rtl";
            subTextP.style.textAlign = "right";
        } else {
            titleH3.dir = "auto";
            subTextP.dir = "auto";
            subTextP.style.textAlign = "left";
        }
    }

    textContentDiv.appendChild(titleH3);
    textContentDiv.appendChild(subTextP);
    leftContentDiv.appendChild(iconDiv);
    leftContentDiv.appendChild(textContentDiv);

    const rightActionsDiv = document.createElement('div');
    rightActionsDiv.className = 'flex items-center gap-2 shrink-0';
    const timeDiv = document.createElement('div');
    timeDiv.className = 'text-xs lg:text-sm text-[#7A9A94] shrink-0';
    timeDiv.textContent = getRelativeTime(item.lastUpdated);

    const deleteButton = document.createElement('button');
    const itemName = itemType === 'tool' ? item.name : item.title;
    deleteButton.className = `${itemType === 'tool' ? 'delete-tool-btn' : 'delete-chat-btn'} p-2 rounded-full text-red-400 hover:text-red-600 hover:bg-red-500/10 transition-colors duration-150`;
    deleteButton.setAttribute('aria-label', `Delete ${itemType}: ${itemName}`);
    deleteButton.innerHTML = `<span class="material-symbols-outlined text-lg">delete</span>`;
    deleteButton.onclick = (e) => {
        e.stopPropagation();
        if (itemType === 'tool') {
            alert("Tool deletion not yet implemented from list.");
        } else {
            deleteChatSession(item.id);
        }
    };

    rightActionsDiv.appendChild(timeDiv);
    rightActionsDiv.appendChild(deleteButton);
    itemOuterDiv.appendChild(leftContentDiv);
    itemOuterDiv.appendChild(rightActionsDiv);
    chatListItemsContainer.appendChild(itemOuterDiv);
  });
}

document.addEventListener('DOMContentLoaded', initializeApp);
