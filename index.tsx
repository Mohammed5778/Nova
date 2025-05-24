/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, Chat, Content, GenerateContentResponse, GenerateContentParameters, SendMessageParameters, Part } from "@google/genai";

const AI_AVATAR_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuA9T1sgk5SJhetyMEYiJgZdqlBOKqsudEBYvvWDHx_cmK13uMV6wG8UMYxaXz6zB4MIfvyUKAmXdlXdtSqTW2Zx5Ct5GSGZ0lu5lEW59f4XbHihQGFg9PTsx1q33s7wtOgXzNMrb_-y0LK-Va5C9pkNNqKrI_Pu0COg_auvu3ypzqjTj-L_3zS0-x3ay_-HF9ZnFuzQYmczRC_lFYedWXYOSOSSUomvBDOOwl3LmWDMqryiwwdyNjXUBqctqdV0vAPAAk45nKobo40";
const USER_AVATAR_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuB9SvUR84BUcmPrDbCzHYG6jBiJWyhIKekj08DbWfbqENpqVglzrst16xZhZMaSBaloXsQI4SPwo1ytdpTnDHU6mAasDhQvejiVjBg89FUtADZWqIfLBn585m7bFnSqVKy-anc0UzGOMbBzYRGaj23-bdkAWtTagqGsb8bmEfppSbQ3EuSqv3KVLaHzMg_e3tYMsMT5P3HWUfk9c1UeN4U4svNDy_qMQdx4E3NKUsOCNBhShoh7bCtnabXgeLUrg2QMv-NSo3ARDHg";
const TEXT_MODEL_NAME = "gemini-2.5-flash-preview-04-17";
const IMAGE_MODEL_NAME = "imagen-3.0-generate-002";
const GEMINI_API_KEY = process.env.API_KEY;

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBpYxSx0MYQ6c_RRSOLvqEEWkKOMq5Zg0", // This is a placeholder API key, ensure it's replaced or handled securely
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
const CREATE_TOOL_SCREEN_ID = "create-tool-screen"; // New
const MEMORIES_SCREEN_ID = "memories-screen"; // New


// DOM Elements
let chatMessagesContainer: HTMLDivElement | null = null;
let chatInput: HTMLInputElement | null = null;
let sendButton: HTMLButtonElement | null = null;
let suggestedPromptButtons: NodeListOf<Element>;
let micButton: HTMLButtonElement | null = null;
let micButtonContainer: HTMLDivElement | null = null;
let voiceModeToggle: HTMLButtonElement | null = null;
let chatListItemsContainer: HTMLDivElement | null = null;
let chatScreenTitleElement: HTMLElement | null = null;
let novaProcessingIndicatorElement: HTMLDivElement | null = null;
let novaImageProcessingIndicatorElement: HTMLDivElement | null = null;
let processLogPanelElement: HTMLDivElement | null = null;
let processLogListElement: HTMLUListElement | null = null;
let toggleProcessLogButtonElement: HTMLButtonElement | null = null;
let processLogCloseButtonElement: HTMLButtonElement | null = null;
let generateImageChatButtonElement: HTMLButtonElement | null = null;
let uploadFileButton: HTMLButtonElement | null = null;
let fileInputHidden: HTMLInputElement | null = null;
let stagedFilePreviewElement: HTMLDivElement | null = null; // For showing staged file
let stagedFileClearButton: HTMLButtonElement | null = null; // Button within stagedFilePreviewElement


// Settings Elements
let aiToneRadios: NodeListOf<HTMLInputElement>;
let darkModeToggle: HTMLInputElement | null = null;
let ttsToggle: HTMLInputElement | null = null;
let internetSearchToggle: HTMLInputElement | null = null;
let deepThinkingToggle: HTMLInputElement | null = null;
let creativityLevelSelect: HTMLSelectElement | null = null; // New for creativity/temperature


// Profile Screen Elements
let profileUserName: HTMLElement | null = null;
let profileUserEmail: HTMLElement | null = null;
let profileInterests: HTMLElement | null = null;
let profilePreferences: HTMLElement | null = null;
let profileFacts: HTMLElement | null = null;
let logoutButton: HTMLButtonElement | null = null;
let viewMemoriesButton: HTMLButtonElement | null = null; // New

// Memories Screen Elements (New)
let memoriesListContainer: HTMLDivElement | null = null;
let memoriesBackButton: HTMLButtonElement | null = null;


// Webview Elements
let webviewScreenElement: HTMLElement | null = null;
let webviewFrame: HTMLIFrameElement | null = null;
let webviewTitle: HTMLElement | null = null;
let webviewLoading: HTMLElement | null = null;
let webviewCloseBtn: HTMLElement | null = null;

// Image Viewer Elements
let imageViewerScreenElement: HTMLElement | null = null;
let imageViewerImg: HTMLImageElement | null = null;
let imageViewerCloseBtn: HTMLElement | null = null;

// Onboarding Elements
let onboardingDots: NodeListOf<Element>;
let onboardingNextBtn: HTMLElement | null = null;
let onboardingSkipBtn: HTMLElement | null = null;

// Code Canvas Elements
let codeCanvasButton: HTMLButtonElement | null = null;
let codeCanvasScreenElement: HTMLElement | null = null;
let codeCanvasTextarea: HTMLTextAreaElement | null = null;
let codeCanvasCopyToChatButton: HTMLButtonElement | null = null;
let codeCanvasCloseButton: HTMLButtonElement | null = null;
let codeEditorWrapper: HTMLDivElement | null = null;
let codeCanvasInlinePreviewIframe: HTMLIFrameElement | null = null;
let codeCanvasToggleViewButton: HTMLButtonElement | null = null;
let codeCanvasEnterFullscreenButton: HTMLButtonElement | null = null;

let fullScreenPreviewOverlay: HTMLDivElement | null = null;
let fullScreenPreviewIframe: HTMLIFrameElement | null = null;
let fullScreenPreviewCloseButton: HTMLButtonElement | null = null;

let codeCanvasViewMode: 'code' | 'preview' = 'code';
let debounceTimer: number | undefined;

// Image Studio Elements
let imageStudioPromptInput: HTMLTextAreaElement | null = null;
let imageStudioEngineSelect: HTMLSelectElement | null = null;
let imageStudioAspectRatioSelect: HTMLSelectElement | null = null;
let imageStudioGenerateButton: HTMLButtonElement | null = null;
let imageStudioLoadingIndicator: HTMLDivElement | null = null;
let imageStudioErrorMessageElement: HTMLDivElement | null = null;
let imageStudioGridElement: HTMLDivElement | null = null;
let imageStudioDownloadAllButton: HTMLButtonElement | null = null;
let currentGeneratedImagesData: { base64: string, prompt: string, mimeType: string }[] = [];

// Sign-In Screen Elements
let signinEmailInput: HTMLInputElement | null = null;
let signinPasswordInput: HTMLInputElement | null = null;
let signinButton: HTMLButtonElement | null = null;
let signupButton: HTMLButtonElement | null = null;
let authErrorMessageElement: HTMLElement | null = null;

// Create Tool Screen Elements (New)
let createToolScreenElement: HTMLElement | null = null;
let toolNameInput: HTMLInputElement | null = null;
let toolInstructionsInput: HTMLTextAreaElement | null = null;
let toolKnowledgeInput: HTMLTextAreaElement | null = null;
let saveToolButton: HTMLButtonElement | null = null;
let createToolBackButton: HTMLButtonElement | null = null;
let createToolErrorMessageElement: HTMLElement | null = null;
let chatListCreateToolButton: HTMLButtonElement | null = null; // For mobile header

// Chat History Interfaces
interface ChatMessage {
  id: string;
  sender: 'User' | 'Nova' | 'System' | 'Nova (Tool Mode)';
  text: string;
  timestamp: number;
  sources?: { uri: string, title: string }[];
  detectedLanguage?: 'en' | 'ar' | 'unknown';
  messageType?: 'text' | 'image';
  imageData?: {
      base64: string;
      mimeType: string;
      promptForImage: string;
  };
  userUploadedFile?: {
      name: string;
      type: 'image' | 'text' | 'other';
      isImage: boolean;
  };
}


interface ChatSession {
  id:string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: number;
  aiToneUsed?: string;
  basedOnToolId?: string;
}

// User Profile Interface for Memory
interface UserProfile {
    name?: string;
    interests: string[];
    preferences: { [key: string]: string };
    facts: string[];
}

// Manual Memory Interface (New)
interface SavedMemory {
    id: string;
    text: string;
    sender: string;
    chatId: string | null;
    originalMessageId: string;
    timestamp: number;
    userId: string;
}

// Custom Tool Interface (New)
interface CustomTool {
    id: string;
    name: string;
    instructions: string;
    knowledge?: string;
    icon?: string;
    lastUsed?: number;
}

// Staged File Interface (New)
interface StagedFile {
    name: string;
    type: 'text' | 'image';
    content: string;
    mimeType: string;
}


// Global State
let currentScreen = SPLASH_SCREEN_ID;
const screens = [SPLASH_SCREEN_ID, ONBOARDING_SCREEN_ID, SIGNIN_SCREEN_ID, CHAT_LIST_SCREEN_ID, CHAT_SCREEN_ID, SETTINGS_SCREEN_ID, PROFILE_SCREEN_ID, WEBVIEW_SCREEN_ID, IMAGE_VIEWER_SCREEN_ID, CODE_CANVAS_SCREEN_ID, IMAGE_STUDIO_SCREEN_ID, CREATE_TOOL_SCREEN_ID, MEMORIES_SCREEN_ID];
let ai: GoogleGenAI;
let geminiChat: Chat;
let isLoading = false;
let isImageLoading = false;
let geminiInitialized = false;
let processLogVisible = false;
let simulatedProcessInterval: number | undefined;


let chatSessions: ChatSession[] = [];
let currentChatSessionId: string | null = null;
let userProfile: UserProfile = { interests: [], preferences: {}, facts: [] };
let savedMemories: SavedMemory[] = [];
let customTools: CustomTool[] = [];
let stagedFile: StagedFile | null = null;


// Feature States
let isListening = false;
let ttsEnabled = false;
let currentAiTone = 'friendly';
let darkModeEnabled = true;
let voiceModeActive = false;
let manualTTScancelForMic = false;
let internetSearchEnabled = false;
let deepThinkingEnabled = false;
let currentImageEngine = 'standard';
let currentChatIsBasedOnTool: string | null = null;
let currentCreativityLevel: 'focused' | 'balanced' | 'inventive' = 'balanced'; // New for temperature control


// Firebase State
let firebaseApp: any;
let firebaseAuth: any;
let currentUser: any = null;


// Web Speech API
// Fix: Use any for SpeechRecognition and related event types if specific types are not globally available or cause issues
declare var SpeechRecognition: any;
declare var webkitSpeechRecognition: any;
declare var SpeechRecognitionEvent: any;
declare var SpeechSynthesisErrorEvent: any; // Added for tts error event type
declare var SpeechRecognitionErrorEvent: any;
// For PDF and Excel export
declare var html2pdf: any;
declare var XLSX: any;


const WebSpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; // Renamed to avoid conflict
// Fix: Use 'any' for recognition type if WebSpeechRecognition constructor type is problematic
let recognition: any;
if (WebSpeechRecognition) {
    recognition = new WebSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.lang = navigator.language || 'en-US';
}

// --- START OF MOVED FUNCTIONS (Gemini Integration, Chat Utilities, etc.) ---

// --- Language Detection ---
function detectMessageLanguage(text: string): 'ar' | 'en' | 'unknown' {
    if (!text) return 'unknown';
    const arabicRegex = /[\u0600-\u06FF]/;
    if (arabicRegex.test(text)) {
        return 'ar';
    }
    return 'en';
}

function getSystemInstruction(tone: string, profile: UserProfile, isDeepThinking: boolean, isInternetSearch: boolean, isToolChat = false): string {
    let baseInstruction = "";

    if (!isToolChat) {
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

    if (isDeepThinking) { // Enhanced Deep Thinking Prompt
        baseInstruction += `\n\nIMPORTANT: The user has enabled "Deep Thinking Mode". Your process should be:
1. Thorough Analysis: Carefully examine the user's query, breaking it down into its core components. Identify any nuances, implicit questions, or underlying needs.
2. Knowledge Retrieval & Synthesis: Access and synthesize relevant information from your knowledge base. If the query is complex or requires diverse information, pull from multiple areas.
3. Multi-perspective Consideration: Explore different angles, viewpoints, or interpretations related to the query. If applicable, consider potential pros and cons, alternative solutions, or broader implications.
4. Structured Reasoning: Formulate your response with clear, logical steps. If you're providing an explanation or argument, ensure your reasoning is easy to follow.
5. Comprehensive & Insightful Output: Aim to provide a response that is not just accurate but also insightful, offering depth and context beyond a superficial answer. Anticipate potential follow-up questions if appropriate.
When generating long reports, maintain coherence across segments and critically review your output for accuracy and completeness before finalizing each part. If continuing a previous thought, ensure seamless integration.
Do not explicitly state these steps in your response, but use them to guide your thought process.`;
    }
    if (isInternetSearch && !isToolChat) { // Internet search is usually for general queries, not tool-specific ones unless tool itself uses it
         baseInstruction += `\n\nIMPORTANT: The user has enabled "Internet Search". Use Google Search to find up-to-date information when the query seems to require it (e.g., recent events, specific facts not in your base knowledge). When you use search results, you MUST cite your sources. After providing your answer, list the URLs of the websites you used under a "Sources:" heading.`;
    }
     else if (voiceModeActive) { // Only if neither deep thinking nor internet search is active
        baseInstruction += `\n\nThis is a voice conversation, so try to keep responses relatively concise and conversational for a better spoken experience.`;
    }


    let profileInfo = "\n\nTo help personalize your responses, remember the following about the user (use this information subtly and naturally, do not explicitly state 'I remember you like X'):";
    let hasProfileData = false;
    if (currentUser?.displayName || profile.name) {
        profileInfo += `\n- Their name is ${currentUser?.displayName || profile.name}. Address them by their name occasionally if it feels natural.`;
        hasProfileData = true;
    } else if (currentUser?.email && !profile.name) { // Only use email part if name is truly unknown
         profileInfo += `\n- You can refer to them by the first part of their email: ${currentUser.email.split('@')[0]}.`;
         hasProfileData = true;
    }

    if (profile.interests && profile.interests.length > 0) { profileInfo += `\n- They are interested in: ${profile.interests.join(', ')}.`; hasProfileData = true; }
    if (profile.preferences && Object.keys(profile.preferences).length > 0) {
        profileInfo += `\n- Preferences: ${Object.entries(profile.preferences).map(([k,v]) => `${k}: ${v}`).join('; ')}.`;
        hasProfileData = true;
    }
    if (profile.facts && profile.facts.length > 0) { profileInfo += `\n- Other facts about them: ${profile.facts.join('; ')}.`; hasProfileData = true; }

    // Include recent manually saved memories
    const userMemories = savedMemories.filter(m => m.userId === currentUser?.uid);
    if (userMemories.length > 0) {
        profileInfo += "\n\nHere are some specific things the user has asked you to remember (their saved memories). Prioritize these if relevant:";
        userMemories.sort((a,b) => b.timestamp - a.timestamp).slice(0, 5).forEach(mem => { // Most recent 5
            profileInfo += `\n- Regarding a previous point by ${mem.sender}: "${mem.text.substring(0,150)}${mem.text.length > 150 ? '...' : ''}" (Saved on: ${new Date(mem.timestamp).toLocaleDateString()})`;
        });
        hasProfileData = true;
    }


    if (hasProfileData) {
        baseInstruction += profileInfo;
    } else if (!isToolChat) { // Only add this if no profile data AND not a tool chat
        baseInstruction += "\n\nYou don't have specific profile information for this user yet. Try to learn about them if they share details.";
    }
    baseInstruction += "\nFormat your responses using Markdown. This includes tables, lists, code blocks (e.g., ```html ... ```), bold, italic, etc., where appropriate for clarity and structure. Ensure code blocks are properly formatted and language-tagged if known."
    baseInstruction += "\n\nIf the user asks you to 'generate a storyboard' or 'create a storyboard from a script', first provide a textual breakdown of the script into scenes and describe the visual elements for each panel/shot in text. Do not attempt to generate images directly for the storyboard in this initial text response. The user can then use dedicated image generation tools (like the in-chat image button or image studio) to visualize each described panel using your textual descriptions as prompts."

    return baseInstruction;
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

function loadChat(sessionId: string) {
  if (!currentUser) {
      displaySystemMessage("Please sign in to load chats.", CHAT_SCREEN_ID);
      showScreen(SIGNIN_SCREEN_ID);
      return;
  }
  const session = chatSessions.find(s => s.id === sessionId);
  if (!session) {
    createNewChatSession(); // Or show an error / go to chat list
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

  const history: Content[] = session.messages
    .filter(msg => msg.sender !== 'System') // Exclude system messages from Gemini history
    .map(msg => {
        const parts: Part[] = [];
        if (msg.messageType === 'image' && msg.imageData) {
            parts.push({ text: msg.imageData.promptForImage || "[AI generated an image based on previous prompt]" });
        } else if (msg.userUploadedFile) {
            parts.push({ text: `[User uploaded file: ${msg.userUploadedFile.name}] ${msg.text || ""}`.trim() });
        } else { // This handles msg.text for non-image, non-file messages
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
          const baseSystemForTool = getSystemInstruction(currentAiTone, userProfile, deepThinkingEnabled, internetSearchEnabled, true);
          systemInstruction = `${tool.instructions}\n\n${baseSystemForTool}`;
          if (tool.knowledge) {
              systemInstruction += `\n\nConsider the following initial knowledge for this task:\n${tool.knowledge}`;
          }
      } else { // Tool not found, maybe it was deleted. Revert to normal chat for this session.
          console.warn(`Tool with ID ${currentChatIsBasedOnTool} not found for loaded chat. Reverting to default instructions.`);
          currentChatIsBasedOnTool = null; // Clear the tool association
          session.basedOnToolId = undefined; // Remove from session too
          systemInstruction = getSystemInstruction(session.aiToneUsed || currentAiTone, userProfile, deepThinkingEnabled, internetSearchEnabled);
      }
  } else {
      systemInstruction = getSystemInstruction(session.aiToneUsed || currentAiTone, userProfile, deepThinkingEnabled, internetSearchEnabled);
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
        msg.sender === 'User' ? 'user' : (msg.sender === 'System' ? 'ai' : 'ai'), // System messages rendered as AI for UI
        false, null, msg.sender === 'System', // isInitialSystemMessage true if sender is 'System'
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

async function generateChatTitle(firstUserMsg: string, firstAiMsg: string): Promise<string> {
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
        let title = response.text.trim().replace(/^["']|["']$/g, ""); // Remove surrounding quotes
        // Basic validation for the title
        if (!title || title.toLowerCase().startsWith("title:") || title.length < 3 || title.length > 50) {
            title = defaultTitle;
        }
        return title.length > 35 ? title.substring(0,32) + "..." : title; // Ensure not too long for UI
    } catch (error) {
        console.error("Error generating chat title:", error);
        return defaultTitle;
    }
}

// --- Gemini Integration ---
function initializeGeminiSDK(): boolean {
  if (!GEMINI_API_KEY) {
    const commonErrorMessage = "Error: API Key not configured. Please contact support or check documentation.";
    if (currentScreen === CHAT_SCREEN_ID) {
        displaySystemMessage(commonErrorMessage, CHAT_SCREEN_ID, 'en');
        disableChatInput(true, false); // Pass false for imageLoading
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
        disableChatInput(false, false); // Ensure chat input is enabled if successful
    } else if (currentScreen === IMAGE_STUDIO_SCREEN_ID && imageStudioGenerateButton) {
        imageStudioGenerateButton.disabled = false; // Enable generate button
        if(imageStudioErrorMessageElement && imageStudioErrorMessageElement.textContent === "Error: API Key not configured. Please contact support or check documentation.") {
            imageStudioErrorMessageElement.style.display = 'none'; // Clear error
        }
    }
    return true;
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
     const commonErrorMessage = "Error: Could not initialize AI. Please check your API key and network connection.";
    if (currentScreen === CHAT_SCREEN_ID) {
        displaySystemMessage(commonErrorMessage, CHAT_SCREEN_ID, 'en');
        disableChatInput(true, false); // Pass false for imageLoading
    } else if (currentScreen === IMAGE_STUDIO_SCREEN_ID) {
        if(imageStudioErrorMessageElement) {
            imageStudioErrorMessageElement.textContent = commonErrorMessage;
            imageStudioErrorMessageElement.style.display = 'block';
        }
        if(imageStudioGenerateButton) imageStudioGenerateButton.disabled = true;
    } else {
         console.error(commonErrorMessage); // Or alert, or some other UI feedback
    }
    geminiInitialized = false;
    return false;
  }
}

function scrollToBottomChat() {
  if (chatMessagesContainer) chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

function disableChatInput(textLoading: boolean, imageLoading: boolean) {
    isLoading = textLoading;
    isImageLoading = imageLoading;
    const anyLoading = isLoading || isImageLoading;

    if (isLoading) { // Text content is loading
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
            novaProcessingIndicatorElement.style.display = 'flex';
            novaProcessingIndicatorElement.classList.add('visible');
        }
        if (novaImageProcessingIndicatorElement) { // Hide image indicator if text is loading
             novaImageProcessingIndicatorElement.style.display = 'none';
             novaImageProcessingIndicatorElement.classList.remove('visible');
        }
        if (processLogVisible) startSimulatedProcessLog(); // Start log for text processing
    } else if (isImageLoading) { // Image content is loading
        if (novaImageProcessingIndicatorElement) {
            novaImageProcessingIndicatorElement.style.display = 'flex';
            novaImageProcessingIndicatorElement.classList.add('visible');
        }
         if (novaProcessingIndicatorElement) { // Hide text indicator if image is loading
            novaProcessingIndicatorElement.style.display = 'none';
            novaProcessingIndicatorElement.classList.remove('visible');
        }
        stopSimulatedProcessLog(); // Stop log if only image loading
    } else { // No loading
        if (novaProcessingIndicatorElement) {
            novaProcessingIndicatorElement.style.display = 'none';
            novaProcessingIndicatorElement.classList.remove('visible');
        }
        if (novaImageProcessingIndicatorElement) {
            novaImageProcessingIndicatorElement.style.display = 'none';
            novaImageProcessingIndicatorElement.classList.remove('visible');
        }
        stopSimulatedProcessLog(); // Stop log when nothing is loading
    }

  if (chatInput && !voiceModeActive) chatInput.disabled = anyLoading;
  else if (chatInput && voiceModeActive) chatInput.disabled = true; // Voice mode always disables text input

  if (sendButton) sendButton.disabled = anyLoading;
  if (micButton) micButton.disabled = anyLoading; // General loading disables mic unless it's already listening
  if (codeCanvasButton) codeCanvasButton.disabled = anyLoading;
  if (generateImageChatButtonElement) generateImageChatButtonElement.disabled = anyLoading;
  if (uploadFileButton) uploadFileButton.disabled = anyLoading;


  // Visual feedback for disabled state
  sendButton?.classList.toggle('opacity-50', anyLoading);
  sendButton?.classList.toggle('cursor-not-allowed', anyLoading);
  micButton?.classList.toggle('opacity-50', anyLoading && !isListening); // Only dim if not already listening
  micButton?.classList.toggle('cursor-not-allowed', anyLoading && !isListening);

  codeCanvasButton?.classList.toggle('opacity-50', anyLoading);
  codeCanvasButton?.classList.toggle('cursor-not-allowed', anyLoading);
  generateImageChatButtonElement?.classList.toggle('opacity-50', anyLoading);
  generateImageChatButtonElement?.classList.toggle('cursor-not-allowed', anyLoading);
  uploadFileButton?.classList.toggle('opacity-50', anyLoading);
  uploadFileButton?.classList.toggle('cursor-not-allowed', anyLoading);
}


function displaySystemMessage(text: string, screenIdContext: string, lang: 'en' | 'ar' | 'unknown' = 'en') {
    if (screenIdContext === CHAT_SCREEN_ID && chatMessagesContainer) {
         const systemMessageId = `sys-msg-${Date.now()}`;
         // Render system messages with 'ai' type for visual consistency but distinct sender
         appendMessage("System", text, 'ai', false, null, true, null, lang, systemMessageId, 'text');
    } else {
        // Fallback for system messages when not in chat screen (e.g., console log or a global alert)
        console.warn(`System Message (screen: ${screenIdContext}): ${text}`);
        // Optionally, you could have a global toast/notification system here
    }
}

function appendMessage(
  senderName: string,
  textOrData: string, // Can be markdown text, or for images, it's often empty or a placeholder
  type: 'user' | 'ai', // 'system' messages are handled by senderName="System" and type='ai'
  isStreaming: boolean = false,
  existingMessageDiv: HTMLDivElement | null = null,
  isInitialSystemMessage: boolean = false, // Specifically for the first greeting or system error messages
  sources: { uri: string, title: string }[] | null = null,
  detectedLang?: 'en' | 'ar' | 'unknown',
  messageId?: string,
  messageType: 'text' | 'image' = 'text', // Added to distinguish content
  imageData?: { base64: string, mimeType: string, promptForImage: string }, // For AI generated images
  userUploadedFile?: { name: string, type: 'image' | 'text' | 'other', isImage: boolean } // For user uploads
): HTMLDivElement | null {
  if (!chatMessagesContainer) return null;

  let messageWrapper: HTMLDivElement;
  let messageContentHolder: HTMLDivElement; // This will hold the text or image
  let aiMessageContentDiv: HTMLDivElement | null = null; // Special container for AI message bubble styling
  let contentWrapperDiv: HTMLDivElement; // Wraps sender name + content holder

  const language = detectedLang || detectMessageLanguage(typeof textOrData === 'string' ? textOrData : (imageData?.promptForImage || userUploadedFile?.name || ""));
  const domId = messageId || existingMessageDiv?.id || `msg-${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  if (existingMessageDiv && messageType === 'text') { // Streaming update to an existing text message
    messageWrapper = existingMessageDiv;
    const existingTextEl = messageWrapper.querySelector<HTMLDivElement>('.message-text');
    if (existingTextEl && isStreaming) {
        existingTextEl.innerHTML = renderMarkdownToHTML(textOrData as string); // textOrData is string here
        existingTextEl.dir = language === 'ar' ? 'rtl' : 'ltr';
    }
    // Image messages are typically not streamed like text, they appear once fully loaded.
  } else { // New message
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

    messageContentHolder = document.createElement('div'); // Generic holder

    if (type === 'ai') {
        aiMessageContentDiv = document.createElement('div'); // Bubble for AI
        aiMessageContentDiv.className = 'ai-message-content bg-[#1A3A35] text-white rounded-xl rounded-bl-none shadow-md overflow-hidden lg:rounded-lg';
    } else { // User message bubble
        messageContentHolder.className = 'message-text text-base lg:text-lg font-normal leading-relaxed flex rounded-xl px-4 py-3 shadow-md break-words rounded-br-none bg-[#19e5c6] text-[#0C1A18]';
    }


    if (messageType === 'text') {
        messageContentHolder.classList.add('message-text', 'text-base', 'lg:text-lg', 'font-normal', 'leading-relaxed', 'break-words');
        if (type === 'ai' && aiMessageContentDiv) { // Apply padding inside AI bubble for text
            messageContentHolder.classList.add('px-4', 'py-3', 'lg:px-5', 'lg:py-4');
        }
        let currentText = textOrData as string;
        if (userUploadedFile) { // Prepend file info if it's a user message with a file
            const filePreamble = `Analyzing ${userUploadedFile.isImage ? "image" : "file"}: <i>${escapeHTML(userUploadedFile.name)}</i>.\n`;
            currentText = `${filePreamble}${textOrData as string}`; // textOrData is user's query text
             messageContentHolder.innerHTML = renderMarkdownToHTML(currentText);
        } else {
            messageContentHolder.innerHTML = renderMarkdownToHTML(textOrData as string);
        }
    } else if (messageType === 'image' && imageData) { // AI generated image
        messageContentHolder.classList.add('ai-message-image-container', 'p-3'); // Padding for the image container

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

        // Download button for the image
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

    // Assemble the message structure
    if (type === 'user') {
      messageWrapper.classList.add('justify-end');
      contentWrapperDiv.classList.add('items-end');
      avatarDiv.style.backgroundImage = `url("${USER_AVATAR_URL}")`;
      contentWrapperDiv.appendChild(senderNamePara);
      contentWrapperDiv.appendChild(messageContentHolder); // User bubble is messageContentHolder itself
      messageWrapper.appendChild(contentWrapperDiv);
      messageWrapper.appendChild(avatarDiv);
    } else { // AI or System message
      messageWrapper.classList.add('justify-start');
      contentWrapperDiv.classList.add('items-start');
      avatarDiv.style.backgroundImage = `url("${AI_AVATAR_URL}")`;

      if (senderName === "System") { // Special styling for system messages
         avatarDiv.style.opacity = "0.6";
         if (aiMessageContentDiv) aiMessageContentDiv.classList.add('opacity-90', 'italic', 'bg-[#222]'); // Darker, italic for system
         else messageContentHolder.classList.add('opacity-90', 'italic'); // Should not happen if type is 'ai'
      }
      contentWrapperDiv.appendChild(senderNamePara);
      if(aiMessageContentDiv) { // AI messages use the styled bubble
        aiMessageContentDiv.appendChild(messageContentHolder);
        contentWrapperDiv.appendChild(aiMessageContentDiv);
      } else { // Should not be reached for type 'ai' as aiMessageContentDiv is created
        contentWrapperDiv.appendChild(messageContentHolder);
      }
      messageWrapper.appendChild(avatarDiv);
      messageWrapper.appendChild(contentWrapperDiv);
    }
    chatMessagesContainer.appendChild(messageWrapper);
  }


  // --- Render Sources (for AI text messages) ---
  if (type === 'ai' && messageType === 'text' && sources && sources.length > 0 && chatMessagesContainer) {
    const sourcesContainerId = domId + '-sources';
    let sourcesContainer = document.getElementById(sourcesContainerId) as HTMLDivElement | null;

    if (!sourcesContainer) { // Create if doesn't exist
        sourcesContainer = document.createElement('div');
        sourcesContainer.id = sourcesContainerId;
        sourcesContainer.className = 'chat-message-external-sources ml-[calc(2.5rem+0.75rem)] mr-4 my-1 p-2 bg-[#102824] rounded-md text-xs'; // Adjust margin to align with AI text
        if (language === 'ar') sourcesContainer.dir = 'rtl';

        // Insert after the main message bubble
        if (messageWrapper.nextSibling) {
            chatMessagesContainer.insertBefore(sourcesContainer, messageWrapper.nextSibling);
        } else {
            chatMessagesContainer.appendChild(sourcesContainer);
        }
    }

    sourcesContainer.innerHTML = ''; // Clear previous sources if any (e.g., from streaming updates)

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
        a.target = "_blank"; // Open in new tab
        a.rel = "noopener noreferrer"; // Security for new tab links

        li.appendChild(a);

        // Optionally display domain
        try {
            const domain = new URL(source.uri).hostname.replace(/^www\./, '');
            const domainSpan = document.createElement('span');
            domainSpan.className = 'source-domain text-gray-400 ml-1'; // Style for domain
            domainSpan.textContent = `(${domain})`;
            li.appendChild(domainSpan);
        } catch (e) { /* ignore invalid URL for domain extraction */ }

        ol.appendChild(li);
    });
    sourcesContainer.appendChild(ol);

    // Add to process log if visible
    if (processLogVisible) {
        sources.forEach(source => addProcessLogEntry(`Source: ${source.title || source.uri}`, 'source', source.uri));
    }
  } else if (type === 'ai' && (!sources || sources.length === 0) && chatMessagesContainer) { // No sources or sources removed
    const sourcesContainerId = domId + '-sources';
    const existingSourcesContainer = document.getElementById(sourcesContainerId);
    if (existingSourcesContainer) {
        existingSourcesContainer.remove(); // Remove the sources block if it exists but is no longer needed
    }
  }

  // Add action buttons for AI messages only on final append (not streaming)
  if (type === 'ai' && !isStreaming && !isInitialSystemMessage && senderName !== "System" && aiMessageContentDiv) {
      let actionsContainer = messageWrapper.querySelector<HTMLDivElement>('.message-actions-container');
      if (!actionsContainer) {
          actionsContainer = document.createElement('div');
          actionsContainer.className = 'message-actions-container mt-2'; // Styling in CSS
          // Insert after the AI message bubble (aiMessageContentDiv)
          if (contentWrapperDiv && aiMessageContentDiv.parentNode === contentWrapperDiv) {
              contentWrapperDiv.appendChild(actionsContainer);
          } else { // Fallback if structure is different, though unlikely
               messageWrapper.appendChild(actionsContainer); // This might place it outside the colored bubble.
          }
      }
      actionsContainer.innerHTML = ''; // Clear existing buttons if re-rendering

      // Copy Button
      const copyButton = document.createElement('button');
      copyButton.className = 'message-action-btn copy-answer-btn';
      copyButton.innerHTML = `<span class="material-symbols-outlined text-sm">content_copy</span> Copy Answer`;
      copyButton.onclick = () => {
          const textToCopy = messageContentHolder.innerText; // Or .innerHTML if HTML is desired
          navigator.clipboard.writeText(textToCopy).then(() => {
              const originalText = copyButton.innerHTML;
              copyButton.innerHTML = `<span class="material-symbols-outlined text-sm">check_circle</span> Copied!`;
              (copyButton as HTMLButtonElement).disabled = true;
              setTimeout(() => {
                  copyButton.innerHTML = originalText;
                  (copyButton as HTMLButtonElement).disabled = false;
              }, 2000);
          }).catch(err => console.error('Failed to copy text: ', err));
      };
      actionsContainer.appendChild(copyButton);

      // Continue Button (if applicable for text messages)
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


      // Save to Memory Button
      const saveMemoryButton = document.createElement('button');
      saveMemoryButton.className = 'message-action-btn save-memory-btn';
      saveMemoryButton.innerHTML = `<span class="material-symbols-outlined text-sm">bookmark_add</span> Save to Memory`;
      saveMemoryButton.dataset.messageId = domId;
      saveMemoryButton.onclick = () => {
          const textToSave = (messageType === 'image' && imageData) ? `[Image: ${imageData.promptForImage}]` : (textOrData as string);
          handleSaveToMemory(domId, textToSave, senderName , currentChatSessionId);
      };
      actionsContainer.appendChild(saveMemoryButton);


      // Export PDF Button (only for text messages)
      if (messageType === 'text') {
          const exportPdfButton = document.createElement('button');
          exportPdfButton.className = 'message-action-btn export-pdf-btn';
          exportPdfButton.innerHTML = `<span class="material-symbols-outlined text-sm">picture_as_pdf</span> Export PDF`;
          exportPdfButton.onclick = () => {
              // Assuming html2pdf is globally available from CDN
              if (typeof html2pdf !== 'undefined') {
                  const elementToExport = messageContentHolder; // The div containing the rendered markdown
                  const filename = `nova-chat-${senderName.toLowerCase().replace(/\s/g, '-')}-${Date.now()}.pdf`;
                  html2pdf().from(elementToExport).set({
                      margin: [10, 10, 10, 10], // top, left, bottom, right
                      filename: filename,
                      image: { type: 'jpeg', quality: 0.98 },
                      html2canvas: { scale: 2, useCORS: true, letterRendering: true }, // Ensure images are rendered
                      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                  }).save();
              } else {
                  console.error("html2pdf library not found.");
                  alert("PDF export functionality is currently unavailable.");
              }
          };
          actionsContainer.appendChild(exportPdfButton);

          // Export Excel Button (if message contains a table)
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

      // Resume Builder Download Button
      const toolForThisChat = customTools.find(t => t.id === currentChatIsBasedOnTool);
      if (toolForThisChat && toolForThisChat.name === "Resume Builder" && (textOrData as string).includes("<!-- START RESUME HTML -->")) {
          const resumeHtmlMatch = (textOrData as string).match(/<!-- START RESUME HTML -->([\s\S]*?)<!-- END RESUME HTML -->/);
          if (resumeHtmlMatch && resumeHtmlMatch[1]) {
              const resumeHtmlContent = resumeHtmlMatch[1].trim();
              const downloadResumeBtn = document.createElement('button');
              // Use existing styling for resume button if available, or define a new prominent one
              downloadResumeBtn.className = 'message-action-btn resume-download-btn bg-[#19e5c6] text-[#0C1A18] hover:bg-opacity-90 py-2 px-4 text-sm';
              downloadResumeBtn.innerHTML = `<span class="material-symbols-outlined text-base mr-1">picture_as_pdf</span> Download Resume as PDF`;
              downloadResumeBtn.onclick = () => {
                  if (typeof html2pdf !== 'undefined') {
                      const filename = `Nova-Resume-${currentUser?.displayName || 'User'}-${Date.now()}.pdf`;
                      const element = document.createElement('div');
                      element.innerHTML = resumeHtmlContent; // Put the extracted HTML into a temporary div for html2pdf

                      // Basic styling for the PDF (can be enhanced)
                      const style = document.createElement('style');
                      style.innerHTML = `
                          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                          h1, h2, h3 { color: #19e5c6; margin-bottom: 0.5em; }
                          h1 { font-size: 24px; border-bottom: 2px solid #19e5c6; padding-bottom: 0.3em; }
                          h2 { font-size: 18px; margin-top: 1em; }
                          h3 { font-size: 16px; font-style: italic; }
                          ul { list-style-type: disc; margin-left: 20px; }
                          p { margin-bottom: 0.5em; }
                          .section { margin-bottom: 1.5em; }
                          .contact-info { margin-bottom: 1em; text-align: center; }
                      `;
                      element.prepend(style); // Prepend style to be part of the HTML for PDF conversion

                      html2pdf().from(element).set({
                          margin: 15, // Margins in mm
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
              // Append to actionsContainer or below the message bubble as preferred
              actionsContainer.appendChild(downloadResumeBtn);
          }
      }

  }


  // --- Save to Chat History (if not streaming and not initial system message) ---
  if (!isStreaming && !isInitialSystemMessage && senderName !== "System") { // Don't save transient system messages to history
    let textForHistory: string;
    if (messageType === 'image' && imageData) {
        textForHistory = `[AI Image for: ${imageData.promptForImage}]`; // Placeholder for history
    } else if (userUploadedFile) {
        textForHistory = `[File: ${userUploadedFile.name}] ${textOrData as string}`;
    }
    else {
        textForHistory = textOrData as string;
    }

    const msgToSave: ChatMessage = {
        id: domId,
        sender: senderName as ChatMessage['sender'], // Cast as senderName can be "System"
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
        if (existingMsgIndex !== -1) { // Should ideally not happen if IDs are unique for new messages
            session.messages[existingMsgIndex] = msgToSave;
        } else {
            session.messages.push(msgToSave);
        }
        session.lastUpdated = Date.now();
      }
    } else if (type === 'user' && currentUser) { // First user message in a new chat
      currentChatSessionId = `session-${Date.now()}`;
      const toolForTitle = currentChatIsBasedOnTool ? customTools.find(t=>t.id === currentChatIsBasedOnTool) : null;
      const newSession: ChatSession = {
        id: currentChatSessionId,
        title: currentChatIsBasedOnTool ? `Tool: ${toolForTitle?.name || 'Unnamed Tool'}` : "New Chat...", // Placeholder title
        messages: [msgToSave], // Add the first user message
        lastUpdated: Date.now(),
        aiToneUsed: currentAiTone, // Store the tone used for this session
        basedOnToolId: currentChatIsBasedOnTool || undefined
      };
      chatSessions.push(newSession);
      if (chatScreenTitleElement) chatScreenTitleElement.textContent = newSession.title;
    }
    saveChatSessionsToLocalStorage();
    if (currentScreen === CHAT_LIST_SCREEN_ID || currentScreen === CHAT_SCREEN_ID) { // Update list if visible
        renderChatList();
    }
  }

  scrollToBottomChat();
  return messageWrapper;
}

function escapeHTML(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function renderMarkdownToHTML(markdownText: string): string {
    let html = markdownText;

    // 1. Temporarily replace code blocks to protect them from markdown parsing
    const codeBlockPlaceholders: string[] = [];
    html = html.replace(/```(\w*)\n([\s\S]*?)\n```/g, (match, lang, rawCode) => {
        const languageClass = lang ? `language-${lang.trim()}` : '';
        const trimmedRawCode = rawCode.trim(); // Trim whitespace around the raw code
        const escapedCodeForDisplay = escapeHTML(trimmedRawCode); // Escape for display inside <code>
        const escapedCodeForDataAttr = escapeHTML(trimmedRawCode); // Escape for data attribute

        // Toolbar for code blocks
        const toolbarHtml = `
            <div class="code-block-toolbar">
                ${lang ? `<span class="code-block-lang">${escapeHTML(lang.trim())}</span>` : ''}
                <button class="copy-code-btn" data-code="${escapedCodeForDataAttr}" aria-label="Copy code snippet">
                    <span class="material-symbols-outlined">content_copy</span>
                    <span>Copy</span>
                </button>
                <button class="preview-code-btn" data-code="${escapedCodeForDataAttr}" aria-label="Preview code snippet in canvas">
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


    // 2. Temporarily replace inline code
    const inlineCodes: string[] = [];
    html = html.replace(/`([^`]+)`/g, (match, code) => {
        inlineCodes.push(`<code>${escapeHTML(code)}</code>`);
        return `%%INLINECODE_${inlineCodes.length - 1}%%`;
    });

    // 3. Escape HTML characters in the remaining text to prevent XSS if markdown is malformed
    html = escapeHTML(html);

    // 4. Process tables (must be before paragraph wrapping)
    // More robust table regex: accounts for optional spaces and variations in separator lines
    html = html.replace(/^\|(.+)\|\r?\n\|([\s\S]+?)\|\r?\n((?:\|.*\|\r?\n?)*)/gm, (tableMatch) => {
        const rows = tableMatch.trim().split(/\r?\n/);
        if (rows.length < 2) return tableMatch; // Not enough rows for a header and separator

        const headerCells = rows[0].slice(1, -1).split('|').map(s => s.trim());
        const separatorLine = rows[1].slice(1, -1).split('|').map(s => s.trim());

        // Validate separator line
        if (headerCells.length !== separatorLine.length || !separatorLine.every(s => /^\s*:?-+:?\s*$/.test(s))) {
            return tableMatch; // Invalid separator, treat as normal text
        }

        let tableHtml = '<div class="table-wrapper"><table class="markdown-table">';
        // Table Head
        tableHtml += '<thead><tr>';
        headerCells.forEach(header => {
            tableHtml += `<th>${header}</th>`; // Already escaped
        });
        tableHtml += '</tr></thead>';

        // Table Body
        tableHtml += '<tbody>';
        for (let i = 2; i < rows.length; i++) {
            if (!rows[i].trim().startsWith('|') || !rows[i].trim().endsWith('|')) continue; // Skip malformed rows
            tableHtml += '<tr>';
            rows[i].slice(1, -1).split('|').forEach(cell => {
                tableHtml += `<td>${cell.trim()}</td>`; // Already escaped
            });
            tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table></div>';
        return tableHtml;
    });


    // 5. Process block elements like headings, blockquotes, lists, hr
    html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
    html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Blockquotes (handle multiple lines correctly)
    html = html.replace(/^\s*&gt; (.*$)/gim, '<p>%%BLOCKQUOTE_LINE%%$1</p>'); // Mark lines
    html = html.replace(/(<p>%%BLOCKQUOTE_LINE%%.*?<\/p>)+/g, (match) => { // Group consecutive lines
        return `<blockquote>${match.replace(/<p>%%BLOCKQUOTE_LINE%%(.*?)<\/p>/g, '<p>$1</p>')}</blockquote>`;
    });
    html = html.replace(/<\/blockquote>\s*<blockquote>/gim, '</blockquote><blockquote>'); // Merge adjacent blockquotes

    html = html.replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm, '<hr>'); // Horizontal Rules

    // Unordered Lists (more robust)
    html = html.replace(/^\s*([*\-+]) +(.*)/gm, (match, bullet, item) => `%%UL_START%%<li>${item.trim()}</li>`);
    html = html.replace(/(%%UL_START%%(<li>.*?<\/li>)+)/g, '<ul>$2</ul>'); // Group list items
    html = html.replace(/<\/ul>\s*<ul>/g, ''); // Merge adjacent ULs

    // Ordered Lists (more robust)
    html = html.replace(/^\s*(\d+)\. +(.*)/gm, (match, number, item) => `%%OL_START%%<li>${item.trim()}</li>`);
    html = html.replace(/(%%OL_START%%(<li>.*?<\/li>)+)/g, '<ol>$2</ol>'); // Group list items
    html = html.replace(/<\/ol>\s*<ol>/g, ''); // Merge adjacent OLs


    // 6. Wrap remaining lines in <p> tags, carefully avoiding double-wrapping block elements
    html = html.split(/\r?\n/).map(paragraph => {
      paragraph = paragraph.trim();
      if (!paragraph) return ''; // Skip empty lines
      // Check if it's already a block element or a placeholder
      if (paragraph.match(/^<\/?(h[1-6]|ul|ol|li|blockquote|hr|table|div class="table-wrapper"|div class="code-block-wrapper")/) ||
          paragraph.startsWith('%%CODEBLOCK_WRAPPER_') ||
          paragraph.startsWith('%%INLINECODE_') ||
          paragraph.startsWith('%%UL_START%%') || paragraph.startsWith('%%OL_START%%')) {
          return paragraph;
      }
      return `<p>${paragraph}</p>`; // Wrap in paragraph
    }).join('');

    // Cleanup for list placeholders if any remained (e.g. single list item)
    html = html.replace(/%%UL_START%%<li>(.*?)<\/li>/g, '<ul><li>$1</li></ul>');
    html = html.replace(/%%OL_START%%<li>(.*?)<\/li>/g, '<ol><li>$1</li></ol>');


    // 7. Process inline elements like links, bold, italic, strikethrough
    // Links (target _blank and rel noopener for security)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        const decodedText = text; // Text is already HTML escaped from step 3
        const decodedUrl = url.replace(/&amp;/g, '&'); // Decode &amp; back to & for URL
        const classAttr = (decodedUrl.startsWith('http:') || decodedUrl.startsWith('https:')) ? `class="webview-link" data-url="${escapeHTML(decodedUrl)}"` : '';
        return `<a href="${escapeHTML(decodedUrl)}" ${classAttr} target="_blank" rel="noopener noreferrer">${decodedText}</a>`;
    });

    html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>'); // Bold **
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');   // Bold __

    // Italic * and _ (careful not to mess with existing HTML tags if any sneaked through)
    // This regex is a bit more careful about word boundaries / surrounding characters
    html = html.replace(/(^|[^\*])\*([^\*]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');
    html = html.replace(/(^|[^_])_([^_]+)_([^_]|$)/g, '$1<em>$2</em>$3');


    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>'); // Strikethrough

    // 8. Restore inline code and code blocks
    html = html.replace(/%%INLINECODE_(\d+)%%/g, (match, index) => inlineCodes[parseInt(index)]);
    html = html.replace(/%%CODEBLOCK_WRAPPER_(\d+)%%/g, (match, index) => codeBlockPlaceholders[parseInt(index)]);

    // 9. Final cleanup
    html = html.replace(/<p>\s*<\/p>/g, ''); // Remove empty paragraphs
    html = html.replace(/<p><br\s*\/?>\s*<\/p>/g, ''); // Remove paragraphs with only a <br>
    // Remove excessive newlines between block elements that might have been introduced
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
  let currentStagedFile = stagedFile; // Capture staged file at the moment of sending

  if (!userMessageText && !currentStagedFile) { // Nothing to send
    if (chatInput) chatInput.placeholder = "Please type a message or upload a file.";
    return;
  }
  if (chatInput) chatInput.placeholder = "Ask Nova anything..."; // Reset placeholder


  if (!geminiInitialized && !initializeGeminiSDK()) {
    displaySystemMessage("AI Service is not ready. Message not sent.", CHAT_SCREEN_ID);
    return;
  }

  const userMessageId = `msg-user-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
  let fullMessageForDisplay = userMessageText; // For UI display

  // Construct parts for Gemini API
  const geminiMessageParts: Part[] = [];

  if (currentStagedFile) {
    if (currentStagedFile.type === 'image') {
        geminiMessageParts.push({
            inlineData: {
                mimeType: currentStagedFile.mimeType,
                data: currentStagedFile.content // Base64 data
            }
        });
        fullMessageForDisplay = `[Image: ${currentStagedFile.name}] ${userMessageText}`.trim(); // For UI
    } else { // Text file
        geminiMessageParts.push({ text: `Context from file "${currentStagedFile.name}":\n${currentStagedFile.content}` });
         fullMessageForDisplay = `[File: ${currentStagedFile.name}] ${userMessageText}`.trim(); // For UI
    }
    // Add user's text query if it exists, or a default query for the file
    if (userMessageText) {
        geminiMessageParts.push({ text: userMessageText });
    } else if (currentStagedFile.type === 'image') {
        geminiMessageParts.push({ text: "Describe this image."}); // Default query for image
        if (!userMessageText) fullMessageForDisplay = `[Image: ${currentStagedFile.name}] Describe this image.`;
    } else { // Text file with no specific user query
         geminiMessageParts.push({ text: "What can you tell me about the content of this file?" });
         if (!userMessageText) fullMessageForDisplay = `[File: ${currentStagedFile.name}] What about this file?`;
    }

  } else { // No file, just text
      geminiMessageParts.push({ text: userMessageText });
  }


  const userMessageLang = detectMessageLanguage(userMessageText || (currentStagedFile?.name || ""));

  // Ensure chat session exists or create new one
  if (currentChatIsBasedOnTool && !currentChatSessionId) { // Starting a new chat with a tool
        currentChatSessionId = `session-tool-${currentChatIsBasedOnTool}-${Date.now()}`;
        const tool = customTools.find(t => t.id === currentChatIsBasedOnTool);
        const newSession: ChatSession = {
            id: currentChatSessionId,
            title: tool ? `Tool: ${tool.name}` : "Tool Chat",
            messages: [], // Will be populated by appendMessage
            lastUpdated: Date.now(),
            aiToneUsed: currentAiTone,
            basedOnToolId: currentChatIsBasedOnTool
        };
        chatSessions.push(newSession);
        if (chatScreenTitleElement) chatScreenTitleElement.textContent = newSession.title;
  } else if (!geminiChat || !currentChatSessionId) { // New general chat, or if geminiChat is somehow not initialized
    const systemInstruction = getSystemInstruction(currentAiTone, userProfile, deepThinkingEnabled, internetSearchEnabled);
    geminiChat = ai.chats.create({
        model: TEXT_MODEL_NAME,
        config: { systemInstruction }
    });
     if (!currentChatSessionId) { // Truly a new chat session
        currentChatSessionId = `session-${Date.now()}`;
        const newSession: ChatSession = {
            id: currentChatSessionId,
            title: "New Chat...", // Default title, will be updated
            messages: [],
            lastUpdated: Date.now(),
            aiToneUsed: currentAiTone,
        };
        chatSessions.push(newSession);
        if (chatScreenTitleElement) chatScreenTitleElement.textContent = newSession.title;
     }
  }

  appendMessage("User", fullMessageForDisplay, 'user', false, null, false, null, userMessageLang, userMessageId, 'text', undefined, currentStagedFile ? {name: currentStagedFile.name, type: currentStagedFile.type, isImage: currentStagedFile.type === 'image'} : undefined);
  if (chatInput) chatInput.value = ""; // Clear input
  stagedFile = null; // Clear staged file after sending
  updateStagedFilePreview();
  disableChatInput(true, false); // Text is loading, no image loading initially

  let aiMessageDiv: HTMLDivElement | null = null;
  let fullResponseText = "";
  let isFirstAIMessageInNewChat = false;
  let groundingSources: { uri: string, title: string }[] | null = null;
  let aiResponseLang: 'en' | 'ar' | 'unknown' = 'unknown';
  const aiMessageId = `msg-ai-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;


  // Check if this is the first AI message in a new chat session (for title generation)
  if (currentChatSessionId) {
    const session = chatSessions.find(s => s.id === currentChatSessionId);
    // A session is new if it has only one message (the user's message just added) or no AI messages yet
    if (session && session.messages.filter(m => m.sender === 'Nova' || m.sender === 'Nova (Tool Mode)').length === 0) {
        isFirstAIMessageInNewChat = true;
    }
  }

  try {
    // Fix: Pass geminiMessageParts (Part[]) directly as the message content.
    // The 'user' role is implicit when sending a message via the Chat object.
    const sendMessageParams: SendMessageParameters = {
        message: geminiMessageParts
    };

    const perMessageConfig: GenerateContentParameters['config'] = {};
    let configApplied = false;

    if (internetSearchEnabled) {
        perMessageConfig.tools = [{ googleSearch: {} }];
        configApplied = true;
    }

    // Thinking Config: Apply only for gemini-2.5-flash, adjust based on deepThinking/voiceMode/creativity
    if (TEXT_MODEL_NAME === 'gemini-2.5-flash-preview-04-17') {
      if (deepThinkingEnabled) {
        // For deep thinking, we want the model to use its budget (default behavior)
        // So, no need to set thinkingConfig here unless to explicitly ensure it's not 0.
        // Omitting thinkingConfig lets it use the default (enabled).
      } else if (voiceModeActive || currentCreativityLevel === 'focused') {
        // For voice mode or focused creativity, disable thinking for lower latency
        perMessageConfig.thinkingConfig = { thinkingBudget: 0 };
        configApplied = true;
      }
      // Otherwise (balanced/inventive creativity without voice mode and deep thinking disabled),
      // we also want the default thinking behavior (enabled), so omit thinkingConfig.
    }

    // Temperature based on creativity level
    switch(currentCreativityLevel) {
        case 'focused': perMessageConfig.temperature = 0.2; configApplied = true; break;
        case 'balanced': perMessageConfig.temperature = 0.7; configApplied = true; break; // Default-ish
        case 'inventive': perMessageConfig.temperature = 1.0; configApplied = true; break;
    }


    if (configApplied) {
        sendMessageParams.config = perMessageConfig;
    }

    const result = await geminiChat.sendMessageStream(sendMessageParams);

    for await (const chunk of result) {
      const chunkText = chunk.text; // Access text directly
      if (chunkText) {
        fullResponseText += chunkText;
        if (aiResponseLang === 'unknown' && fullResponseText.length > 10) { // Detect lang once enough text
            aiResponseLang = detectMessageLanguage(fullResponseText);
        }
        const aiSenderName = currentChatIsBasedOnTool ? "Nova (Tool Mode)" : "Nova";
        if (!aiMessageDiv) { // First chunk, create message div
          aiMessageDiv = appendMessage(aiSenderName, fullResponseText, 'ai', true, null, false, null, aiResponseLang, aiMessageId, 'text');
        } else { // Subsequent chunks, update existing div
          appendMessage(aiSenderName, fullResponseText, 'ai', true, aiMessageDiv, false, null, aiResponseLang, aiMessageId, 'text');
        }
        scrollToBottomChat();
      }

      // Check for grounding metadata (Google Search sources)
      if (chunk.candidates && chunk.candidates[0]?.groundingMetadata?.groundingChunks) {
          const newSources = chunk.candidates[0].groundingMetadata.groundingChunks
              .map(gc => ({ uri: gc.web?.uri || gc.retrievedContext?.uri || '', title: gc.web?.title || gc.retrievedContext?.uri || '' }))
              .filter(s => s.uri); // Ensure URI exists

          if (newSources.length > 0) {
              // Merge and deduplicate sources
              groundingSources = [...(groundingSources || []), ...newSources].reduce((acc: {uri: string, title: string}[], current) => {
                  if (!acc.find(item => item.uri === current.uri)) {
                      acc.push(current);
                  }
                  return acc;
              }, []);

              // Re-append message with updated sources if div exists
              if (aiMessageDiv && groundingSources && groundingSources.length > 0) {
                const aiSenderName = currentChatIsBasedOnTool ? "Nova (Tool Mode)" : "Nova";
                appendMessage(aiSenderName, fullResponseText, 'ai', true, aiMessageDiv, false, groundingSources, aiResponseLang, aiMessageId, 'text');
              }
              // Log new sources to process log
              if (processLogVisible && groundingSources && groundingSources.length > 0) {
                    newSources.forEach(source => addProcessLogEntry(`Found source: ${source.title || source.uri}`, 'source', source.uri));
              }
          }
      }
    }

    // After loop, finalize message append (sets isStreaming to false) and TTS
    if (ttsEnabled && fullResponseText) {
        // Basic cleanup for TTS: remove HTML tags and normalize newlines
        const textForSpeech = fullResponseText
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<p.*?>/gi, "\n")
            .replace(/<\/p>/gi, "\n")
            .replace(/<[^>]+(>|$)/g, "") // Strip all other HTML tags
            .replace(/\n\s*\n/g, "\n") // Collapse multiple newlines
            .trim();
        speak(textForSpeech, true, aiResponseLang); // isAiMessageForVoiceMode = true
    }

    // Final append to save to history and add action buttons
    if (fullResponseText && currentChatSessionId) {
        const session = chatSessions.find(s => s.id === currentChatSessionId);
        if (session) {
            const aiSenderName = currentChatIsBasedOnTool ? "Nova (Tool Mode)" : "Nova";
             if (aiMessageDiv) { // If div was created during streaming
                appendMessage(aiSenderName, fullResponseText, 'ai', false, aiMessageDiv, false, groundingSources, aiResponseLang, aiMessageId, 'text');
            } else { // If response was empty but sources exist, or some other edge case
                appendMessage(aiSenderName, fullResponseText, 'ai', false, null, false, groundingSources, aiResponseLang, aiMessageId, 'text');
            }

            if (isFirstAIMessageInNewChat && !session.basedOnToolId) { // Only generate title for new, non-tool chats
                const userMsgForTitle = session.messages.find(m => m.sender === 'User')?.text || fullMessageForDisplay;
                const newTitle = await generateChatTitle(userMsgForTitle, fullResponseText);
                session.title = newTitle;
                if(chatScreenTitleElement) chatScreenTitleElement.textContent = newTitle;
                 saveChatSessionsToLocalStorage(); // Save updated title
                 renderChatList(); // Update chat list UI
            }
            // Extract user info (if not a tool-based chat, as tools have specific contexts)
            if (!session.basedOnToolId) {
                 await extractAndStoreUserInfo(session);
            }
        }
    }

  } catch (error: any) {
    console.error("Error sending message to Gemini:", error);
    let errorMessage = "Sorry, I encountered an error processing your request. Please try again.";
    if (error && error.message) {
        if (error.message.includes("API key not valid")) {
            errorMessage = "There's an issue with the API configuration. Please contact support.";
        } else if (error.message.toLowerCase().includes("safety") || error.message.includes(" हिंसात्मक ")) { // More robust safety check
             errorMessage = "Your request could not be processed due to safety guidelines. Please rephrase your message.";
        }
        // Potentially more error parsing here based on common Gemini API errors
    }

    const errLang = detectMessageLanguage(errorMessage);
    const errorMsgId = `err-${aiMessageId}`; // Unique ID for error message
    const aiSenderName = currentChatIsBasedOnTool ? "Nova (Tool Mode)" : "Nova";

    appendMessage(aiSenderName, errorMessage, 'ai', false, null, true, null, errLang, errorMsgId, 'text'); // isInitialSystemMessage = true for errors

    if (ttsEnabled) speak(errorMessage, false, errLang); // Don't trigger mic for error messages
  } finally {
    disableChatInput(false, false); // Reset loading state
    if(chatInput && !voiceModeActive) { // If not in voice mode, focus input
        chatInput.focus();
    }
    // If in voice mode, and TTS is done, and not already listening, start listening again
    else if (voiceModeActive && !window.speechSynthesis.speaking && !isListening && currentScreen === CHAT_SCREEN_ID) {
         handleMicInput();
    }
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
    // Append user's prompt as a regular text message first
    appendMessage("User", prompt, 'user', false, null, false, null, userMessageLang, userMessageId, 'text');
    chatInput.value = ""; // Clear input
    disableChatInput(false, true); // Set imageLoading to true

    const aiImageId = `msg-ai-img-${Date.now()}`; // Unique ID for the AI image message

    try {
        const response = await ai.models.generateImages({
            model: IMAGE_MODEL_NAME,
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: "1:1" }, // Example config
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const imgData = response.generatedImages[0];
            const imageDataPayload = {
                base64: imgData.image.imageBytes, // This is the base64 string
                mimeType: imgData.image.mimeType || 'image/jpeg', // Default mimeType
                promptForImage: prompt // Store the original prompt with the image data
            };

            // Append the AI message with type 'image' and the imageDataPayload
            appendMessage("Nova", "", 'ai', false, null, false, null, 'en', aiImageId, 'image', imageDataPayload);

            // Save to chat history
            if (currentChatSessionId) {
                const session = chatSessions.find(s => s.id === currentChatSessionId);
                if (session) {
                    const aiImageMessageForHistory: ChatMessage = {
                        id: aiImageId,
                        sender: 'Nova',
                        text: `[AI generated image for prompt: ${prompt.substring(0,50)}...]`, // Placeholder text for history
                        timestamp: Date.now(),
                        messageType: 'image',
                        imageData: imageDataPayload, // Store full image data in history object
                        detectedLanguage: 'en' // Language of the prompt, or 'en' if image
                    };
                    session.messages.push(aiImageMessageForHistory);
                    session.lastUpdated = Date.now();
                    saveChatSessionsToLocalStorage();
                    renderChatList(); // Update chat list if open
                }
            } else { // Create a new chat session if one doesn't exist (e.g., first message is image gen)
                currentChatSessionId = `session-img-${Date.now()}`;
                const newSession: ChatSession = {
                    id: currentChatSessionId,
                    title: `Image: ${prompt.substring(0,20)}...`, // Title based on prompt
                    messages: [ // Include the user's prompt message and the AI's image message
                        { id: userMessageId, sender: 'User', text: prompt, timestamp: Date.now()-100, detectedLanguage: userMessageLang, messageType: 'text'},
                        { id: aiImageId, sender: 'Nova', text: `[AI image for: ${prompt.substring(0,50)}...]`, timestamp: Date.now(), messageType: 'image', imageData: imageDataPayload, detectedLanguage: 'en' }
                    ],
                    lastUpdated: Date.now(),
                    aiToneUsed: currentAiTone, // Use current global tone
                };
                chatSessions.push(newSession);
                if (chatScreenTitleElement) chatScreenTitleElement.textContent = newSession.title;
                saveChatSessionsToLocalStorage();
                renderChatList();
            }
        } else {
            displaySystemMessage("Sorry, I couldn't generate an image for that prompt. Please try a different prompt or check the image model.", CHAT_SCREEN_ID, 'en');
        }

    } catch (error: any) {
        console.error("Error generating image in chat:", error);
        let errMsg = "Failed to generate image. Please try again.";
        if (error instanceof Error) errMsg = `Image Generation Error: ${error.message}`;
        if (error.message && (error.message.toLowerCase().includes("safety") || error.message.includes("प्रोम्प्ट में मौजूद नहीं किया जा सका"))) { // Check for safety related errors
            errMsg = "The image could not be generated due to safety guidelines. Please try a different prompt.";
        }
        displaySystemMessage(errMsg, CHAT_SCREEN_ID, 'en');
    } finally {
        disableChatInput(false, false); // Reset loading state
        if (chatInput && !voiceModeActive) chatInput.focus(); // Refocus input if not in voice mode
    }
}

// --- END OF MOVED FUNCTIONS ---


// --- START OF MOVED/NEWLY ADDED FUNCTIONS ---

// Fix: Define updateStagedFilePreview function
function updateStagedFilePreview() {
    if (stagedFilePreviewElement) {
        const fileNameSpan = stagedFilePreviewElement.querySelector<HTMLSpanElement>('.staged-file-name');
        const fileTypeSpan = stagedFilePreviewElement.querySelector<HTMLSpanElement>('.staged-file-type');

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

// Fix: Define setCodeCanvasView function
function setCodeCanvasView(mode: 'code' | 'preview') {
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

// Fix: Define handleMicInput function
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
    } catch (e: any) {
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

// Fix: Define addProcessLogEntry function
function addProcessLogEntry(text: string, type: string = 'info', url?: string) {
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

// Fix: Define startSimulatedProcessLog function
function startSimulatedProcessLog() {
    if (!processLogVisible || (!deepThinkingEnabled && !internetSearchEnabled)) {
        if (simulatedProcessInterval) clearInterval(simulatedProcessInterval);
        simulatedProcessInterval = undefined;
        return;
    }
    clearProcessLog();

    const steps: string[] = [];
    if (internetSearchEnabled) steps.push("Formulating search queries...", "Searching the web...", "Reviewing search results...");
    if (deepThinkingEnabled) steps.push("Accessing knowledge base...", "Analyzing information...", "Considering multiple perspectives...", "Synthesizing insights...");

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
            stopSimulatedProcessLog();
        }
    }, 1200 + Math.random() * 500);
}

// Fix: Define stopSimulatedProcessLog function
function stopSimulatedProcessLog() {
    if (simulatedProcessInterval) {
        clearInterval(simulatedProcessInterval);
        simulatedProcessInterval = undefined;
    }
}

// Fix: Define openInAppImageViewer function
function openInAppImageViewer(imageUrl: string) {
    if (imageViewerScreenElement && imageViewerImg) {
        imageViewerImg.src = imageUrl;
        showScreen(IMAGE_VIEWER_SCREEN_ID);
    } else {
        alert(`Image viewer placeholder: ${imageUrl}`);
    }
}

// Fix: Define downloadImageWithBase64 function
function downloadImageWithBase64(base64Data: string, mimeType: string, filename: string) {
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${base64Data}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Fix: Define speak function
function speak(text: string, isAiMessageForVoiceMode: boolean, lang: 'en' | 'ar' | 'unknown' = 'en') {
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
        if ((event as SpeechSynthesisErrorEvent).error === 'interrupted') {
            return;
        }
        if ((event as SpeechSynthesisErrorEvent).error === 'language-unavailable' || (event as SpeechSynthesisErrorEvent).error === 'voice-unavailable') {
            displaySystemMessage(`Voice for ${targetLang} is not available on your device. TTS for this message is skipped.`, CHAT_SCREEN_ID, 'en');
        }
        if (ttsEnabled && voiceModeActive && isAiMessageForVoiceMode && !isListening && currentScreen === CHAT_SCREEN_ID) {
            handleMicInput();
        }
    };

    window.speechSynthesis.speak(utterance);
}


// Fix: Define clearProcessLog function
function clearProcessLog() {
    if (processLogListElement) processLogListElement.innerHTML = '';
}

// Fix: Define renderCodeToIframe function
function renderCodeToIframe() {
    if (codeCanvasTextarea && codeCanvasInlinePreviewIframe) {
        const codeToRun = codeCanvasTextarea.value;
        codeCanvasInlinePreviewIframe.srcdoc = codeToRun;
    }
}

// Fix: Define renderCodeToIframeDebounced function
function renderCodeToIframeDebounced() {
    clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
        renderCodeToIframe();
    }, 500);
}


// Fix: Define openInAppWebView function
function openInAppWebView(url: string) {
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

// Fix: Define toggleProcessLogPanel function
function toggleProcessLogPanel(forceState?: boolean) {
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

    if (processLogVisible && (deepThinkingEnabled || internetSearchEnabled || stagedFile)) {
        startSimulatedProcessLog();
    } else {
        stopSimulatedProcessLog();
    }
}

// Fix: Define handleFileUpload function
function handleFileUpload(event: Event) {
    if (!currentUser) {
        displaySystemMessage("Please sign in to upload files.", CHAT_SCREEN_ID);
        showScreen(SIGNIN_SCREEN_ID);
        return;
    }
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const textBasedTypes = [
        'text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json',
        'application/xml', 'application/x-python-code', 'text/markdown', 'text/csv',
    ];
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
    const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
            const fileContent = e.target?.result as string;
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
            const base64Content = (e.target?.result as string).split(',')[1];
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
        fileInputHidden.value = '';
    }
}

// Fix: Define displayGeneratedImages function (for Image Studio)
function displayGeneratedImages(imagesData: { base64: string, prompt: string, mimeType: string }[]) {
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

// Fix: Define handleGenerateImages function (for Image Studio)
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
        const imageGenConfig: any = {
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
    } catch (error: any) {
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

// Fix: Define setupEventListeners function
function setupEventListeners() {
    if (window.speechSynthesis && typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }
    window.speechSynthesis.getVoices();

    aiToneRadios?.forEach(radio => {
        radio.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            currentAiTone = target.value;
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

    // Settings Screen: Creativity Level Select (New)
    creativityLevelSelect?.addEventListener('change', () => {
        if (!creativityLevelSelect) return;
        currentCreativityLevel = creativityLevelSelect.value as 'focused' | 'balanced' | 'inventive';
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

    function handleNavClick(targetScreen: string | null | undefined, currentActiveScreenBeforeNav: string) {
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
      const buttonItem = item as HTMLButtonElement;
      buttonItem.addEventListener('click', () => {
        const targetScreen = buttonItem.dataset.target;
        handleNavClick(targetScreen, currentScreen);
      });
    });

    document.querySelectorAll('#desktop-sidebar .sidebar-nav-item').forEach(item => {
        const buttonItem = item as HTMLButtonElement;
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
      const target = event.target as HTMLElement;
      if (target.classList.contains('webview-link') && target.dataset.url) {
          event.preventDefault();
          openInAppWebView(target.dataset.url);
      }
      const downloadButton = target.closest('.download-in-chat-image-btn');
      if (downloadButton instanceof HTMLElement && downloadButton.dataset.base64 && downloadButton.dataset.mime) {
          const base64 = downloadButton.dataset.base64;
          const mimeType = downloadButton.dataset.mime;
          const promptForImage = downloadButton.dataset.prompt || 'generated-image';
          const filename = `nova-chat-image-${promptForImage.substring(0,20).replace(/\s+/g, '_')}.jpeg`;
          downloadImageWithBase64(base64, mimeType, filename);
      }
    });

    chatMessagesContainer?.addEventListener('click', (event) => {
        const targetElement = event.target as HTMLElement;
        const previewButton = targetElement.closest('.preview-code-btn');
        const copyButton = targetElement.closest('.copy-code-btn');

        if (previewButton instanceof HTMLElement && codeCanvasTextarea) {
            const rawCode = previewButton.dataset.code;
            if (rawCode) {
                codeCanvasTextarea.value = rawCode;
                showScreen(CODE_CANVAS_SCREEN_ID);
                setCodeCanvasView('preview');
                renderCodeToIframe();
            }
        } else if (copyButton instanceof HTMLElement) {
            const rawCode = copyButton.dataset.code;
            if (rawCode && navigator.clipboard) {
                navigator.clipboard.writeText(rawCode).then(() => {
                    const originalContent = copyButton.innerHTML;
                    copyButton.innerHTML = `<span class="material-symbols-outlined" style="font-size:1em; vertical-align: middle; line-height:1;">check_circle</span> <span style="vertical-align: middle;">Copied!</span>`;
                    (copyButton as HTMLButtonElement).disabled = true;
                    setTimeout(() => {
                        copyButton.innerHTML = originalContent;
                        (copyButton as HTMLButtonElement).disabled = false;
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

    imageStudioGenerateButton?.addEventListener('click', handleGenerateImages);
    imageStudioDownloadAllButton?.addEventListener('click', () => {
        currentGeneratedImagesData.forEach((imgData, index) => {
            const promptPart = imgData.prompt.substring(0, 20).replace(/\s+/g, '_');
            downloadImageWithBase64(imgData.base64, imgData.mimeType, `nova-image-${promptPart}-${index + 1}.jpeg`);
        });
    });
    imageStudioEngineSelect?.addEventListener('change', (event) => {
        const target = event.target as HTMLSelectElement;
        currentImageEngine = target.value;
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

        // Fix: Use 'any' for SpeechRecognitionEvent if specific type is not available
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (chatInput) chatInput.value = transcript;
            if (voiceModeActive) {
                handleSendMessage();
            }
        };
        // Fix: Use 'any' for SpeechRecognitionErrorEvent if specific type is not available
        recognition.onerror = (event: any) => {
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

// --- END OF MOVED/NEWLY ADDED FUNCTIONS ---


// --- Initialization ---
function initializeApp() {
  chatMessagesContainer = document.getElementById('chat-messages-container') as HTMLDivElement | null;
  chatInput = document.getElementById('chat-input') as HTMLInputElement | null;
  sendButton = document.getElementById('send-chat-button') as HTMLButtonElement | null;
  suggestedPromptButtons = document.querySelectorAll('.suggested-prompt-btn');
  micButton = document.getElementById('mic-button') as HTMLButtonElement | null;
  if (micButton) {
    micButtonContainer = micButton.parentElement?.parentElement as HTMLDivElement | null;
  }
  voiceModeToggle = document.getElementById('voice-mode-toggle') as HTMLButtonElement | null;
  chatListItemsContainer = document.getElementById('chat-list-items-container') as HTMLDivElement | null;
  chatScreenTitleElement = document.getElementById('chat-screen-title') as HTMLElement | null;
  novaProcessingIndicatorElement = document.getElementById('nova-processing-indicator') as HTMLDivElement | null;
  novaImageProcessingIndicatorElement = document.getElementById('nova-image-processing-indicator') as HTMLDivElement | null;

  processLogPanelElement = document.getElementById('process-log-panel') as HTMLDivElement | null;
  processLogListElement = document.getElementById('process-log-list') as HTMLUListElement | null;
  toggleProcessLogButtonElement = document.getElementById('toggle-process-log-btn') as HTMLButtonElement | null;
  processLogCloseButtonElement = document.getElementById('process-log-close-btn') as HTMLButtonElement | null;
  generateImageChatButtonElement = document.getElementById('generate-image-chat-button') as HTMLButtonElement | null;
  uploadFileButton = document.getElementById('upload-file-button') as HTMLButtonElement | null;
  fileInputHidden = document.getElementById('file-input-hidden') as HTMLInputElement | null;
  stagedFilePreviewElement = document.getElementById('staged-file-preview') as HTMLDivElement | null;
  stagedFileClearButton = document.getElementById('staged-file-clear-button') as HTMLButtonElement | null;


  aiToneRadios = document.querySelectorAll('input[name="ai_tone"]');
  darkModeToggle = document.getElementById('setting-dark-mode-toggle') as HTMLInputElement | null;
  ttsToggle = document.getElementById('setting-tts-toggle') as HTMLInputElement | null;
  internetSearchToggle = document.getElementById('setting-internet-search-toggle') as HTMLInputElement | null;
  deepThinkingToggle = document.getElementById('setting-deep-thinking-toggle') as HTMLInputElement | null;
  creativityLevelSelect = document.getElementById('setting-creativity-level') as HTMLSelectElement | null; // New


  profileUserName = document.getElementById('profile-user-name');
  profileUserEmail = document.getElementById('profile-user-email');
  profileInterests = document.getElementById('profile-interests');
  profilePreferences = document.getElementById('profile-preferences');
  profileFacts = document.getElementById('profile-facts');
  logoutButton = document.getElementById('logout-button') as HTMLButtonElement | null;
  viewMemoriesButton = document.getElementById('view-memories-btn') as HTMLButtonElement | null;

  memoriesListContainer = document.getElementById('memories-list-container') as HTMLDivElement | null;
  memoriesBackButton = document.getElementById('memories-back-btn') as HTMLButtonElement | null;

  webviewScreenElement = document.getElementById(WEBVIEW_SCREEN_ID);
  webviewFrame = document.getElementById('webview-frame') as HTMLIFrameElement | null;
  webviewTitle = document.getElementById('webview-title');
  webviewLoading = document.getElementById('webview-loading');
  webviewCloseBtn = document.getElementById('webview-close-btn');

  imageViewerScreenElement = document.getElementById(IMAGE_VIEWER_SCREEN_ID);
  imageViewerImg = document.getElementById('image-viewer-img') as HTMLImageElement | null;
  imageViewerCloseBtn = document.getElementById('image-viewer-close-btn');

  onboardingDots = document.querySelectorAll('#onboarding-dots .onboarding-dot');
  onboardingNextBtn = document.getElementById('onboarding-next-btn');
  onboardingSkipBtn = document.getElementById('onboarding-skip-btn');

  codeCanvasButton = document.getElementById('code-canvas-button') as HTMLButtonElement | null;
  codeCanvasScreenElement = document.getElementById(CODE_CANVAS_SCREEN_ID);
  codeCanvasTextarea = document.getElementById('code-canvas-textarea') as HTMLTextAreaElement | null;
  codeCanvasCopyToChatButton = document.getElementById('code-canvas-copy-to-chat-btn') as HTMLButtonElement | null;
  codeCanvasCloseButton = document.getElementById('code-canvas-close-btn') as HTMLButtonElement | null;
  codeEditorWrapper = document.getElementById('code-editor-wrapper') as HTMLDivElement | null;
  codeCanvasInlinePreviewIframe = document.getElementById('code-canvas-inline-preview-iframe') as HTMLIFrameElement | null;
  codeCanvasToggleViewButton = document.getElementById('code-canvas-toggle-view-btn') as HTMLButtonElement | null;
  codeCanvasEnterFullscreenButton = document.getElementById('code-canvas-enter-fullscreen-btn') as HTMLButtonElement | null;

  fullScreenPreviewOverlay = document.getElementById('full-screen-preview-overlay') as HTMLDivElement | null;
  fullScreenPreviewIframe = document.getElementById('full-screen-preview-iframe') as HTMLIFrameElement | null;
  fullScreenPreviewCloseButton = document.getElementById('full-screen-preview-close-btn') as HTMLButtonElement | null;

  imageStudioPromptInput = document.getElementById('image-studio-prompt-input') as HTMLTextAreaElement | null;
  imageStudioEngineSelect = document.getElementById('image-studio-engine-select') as HTMLSelectElement | null;
  imageStudioAspectRatioSelect = document.getElementById('image-studio-aspect-ratio-select') as HTMLSelectElement | null;
  imageStudioGenerateButton = document.getElementById('image-studio-generate-btn') as HTMLButtonElement | null;
  imageStudioLoadingIndicator = document.getElementById('image-studio-loading-indicator') as HTMLDivElement | null;
  imageStudioErrorMessageElement = document.getElementById('image-studio-error-message') as HTMLDivElement | null;
  imageStudioGridElement = document.getElementById('image-studio-grid') as HTMLDivElement | null;
  imageStudioDownloadAllButton = document.getElementById('image-studio-download-all-btn') as HTMLButtonElement | null;

  signinEmailInput = document.getElementById('signin-email-input') as HTMLInputElement | null;
  signinPasswordInput = document.getElementById('signin-password-input') as HTMLInputElement | null;
  signinButton = document.getElementById('signin-button') as HTMLButtonElement | null;
  signupButton = document.getElementById('signup-button') as HTMLButtonElement | null;
  authErrorMessageElement = document.getElementById('auth-error-message') as HTMLElement | null;

  createToolScreenElement = document.getElementById(CREATE_TOOL_SCREEN_ID) as HTMLElement | null;
  toolNameInput = document.getElementById('tool-name-input') as HTMLInputElement | null;
  toolInstructionsInput = document.getElementById('tool-instructions-input') as HTMLTextAreaElement | null;
  toolKnowledgeInput = document.getElementById('tool-knowledge-input') as HTMLTextAreaElement | null;
  saveToolButton = document.getElementById('save-tool-button') as HTMLButtonElement | null;
  createToolBackButton = document.getElementById('create-tool-back-btn') as HTMLButtonElement | null;
  createToolErrorMessageElement = document.getElementById('create-tool-error-message') as HTMLElement | null;
  chatListCreateToolButton = document.getElementById('chat-list-create-tool-btn') as HTMLButtonElement | null;


  if (typeof process === 'undefined') {
    // @ts-ignore
    window.process = { env: {} };
  }
   if (!GEMINI_API_KEY) {
      console.warn("API_KEY environment variable is not set. Gemini API calls will fail.");
  }

  initFirebaseAuth();

  window.addEventListener('load', () => {
    if(currentScreen === CHAT_SCREEN_ID) scrollToBottomChat();
  });
  updateStagedFilePreview();
  console.log("Nova AI Mobile Initialized (v1.9.1 - Advanced Controls).");
}

// --- Firebase Authentication ---
function initFirebaseAuth() {
    try {
        // @ts-ignore
        firebaseApp = firebase.initializeApp(firebaseConfig);
        // @ts-ignore
        firebaseAuth = firebase.auth();

        firebaseAuth.onAuthStateChanged((user: any) => {
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
        .then((userCredential: any) => {
            currentUser = userCredential.user;
            console.log("User signed up successfully:", currentUser);
        })
        .catch((error: any) => {
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
        .then((userCredential: any) => {
            currentUser = userCredential.user;
            console.log("User signed in successfully:", currentUser);
        })
        .catch((error: any) => {
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
            if (chatMessagesContainer) chatMessagesContainer.innerHTML = '';
        })
        .catch((error: any) => {
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
            } else {
                currentAiTone = defaultAiTone;
                saveSetting('aiTone', currentAiTone);
            }
        } catch (e) {
            if (typeof storedTone === 'string' && validAiTones.includes(storedTone)) {
                currentAiTone = storedTone;
                saveSetting('aiTone', currentAiTone);
            } else {
                currentAiTone = defaultAiTone;
                localStorage.removeItem('aiTone');
                saveSetting('aiTone', currentAiTone);
            }
        }
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

    const storedCreativityLevel = localStorage.getItem('currentCreativityLevel') as 'focused' | 'balanced' | 'inventive' | null;
    currentCreativityLevel = storedCreativityLevel || 'balanced';

}

function applySettings() {
    (document.querySelector(`input[name="ai_tone"][value="${currentAiTone}"]`) as HTMLInputElement)?.setAttribute('checked', 'true');
    aiToneRadios?.forEach(radio => {
        radio.checked = radio.value === currentAiTone;
    });

    if (darkModeToggle) darkModeToggle.checked = darkModeEnabled;
    document.body.classList.toggle('light-mode', !darkModeEnabled);

    if (ttsToggle) ttsToggle.checked = ttsEnabled;
    if (internetSearchToggle) internetSearchToggle.checked = internetSearchEnabled;
    if (deepThinkingToggle) deepThinkingToggle.checked = deepThinkingEnabled;
    if (creativityLevelSelect) creativityLevelSelect.value = currentCreativityLevel; // New

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

function saveSetting(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
}

// --- User Profile (Memory) Logic ---
function loadUserProfile() {
    const storedProfile = localStorage.getItem('userProfileData');
    if (storedProfile) {
        userProfile = JSON.parse(storedProfile);
    }
    if (currentUser) {
        if (profileUserEmail) profileUserEmail.textContent = currentUser.email;
        if (profileUserName && currentUser.displayName) profileUserName.textContent = currentUser.displayName;
        else if (profileUserName && currentUser.email) profileUserName.textContent = currentUser.email.split('@')[0];
    }
}

function saveUserProfile() {
    localStorage.setItem('userProfileData', JSON.stringify(userProfile));
}

async function extractAndStoreUserInfo(chatSession: ChatSession) {
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

    let geminiResponse: GenerateContentResponse | undefined;
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

        if (Object.keys(extractedData).length === 0 || (extractedData as any).noNewInfo) {
            return;
        }

        let profileUpdated = false;
        if (extractedData.userName && !userProfile.name) {
            userProfile.name = extractedData.userName;
            profileUpdated = true;
        }
        if (extractedData.newInterests && Array.isArray(extractedData.newInterests)) {
            const uniqueNewInterests = extractedData.newInterests.filter((interest: string) => !userProfile.interests.includes(interest));
            if (uniqueNewInterests.length > 0) {
                userProfile.interests.push(...uniqueNewInterests);
                profileUpdated = true;
            }
        }
        if (extractedData.newFacts && Array.isArray(extractedData.newFacts)) {
            const uniqueNewFacts = extractedData.newFacts.filter((fact: string) => !userProfile.facts.includes(fact));
            if (uniqueNewFacts.length > 0) {
                userProfile.facts.push(...uniqueNewFacts);
                profileUpdated = true;
            }
        }
        if (extractedData.updatedPreferences && typeof extractedData.updatedPreferences === 'object') {
            for (const [key, value] of Object.entries(extractedData.updatedPreferences)) {
                if (userProfile.preferences[key] !== value) {
                    userProfile.preferences[key] = value as string;
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
        if (profileUserName) profileUserName.textContent = currentUser.displayName || currentUser.email?.split('@')[0] || "User Name";
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
function showScreen(screenId: string) {
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
    const toneInput = document.querySelector(`input[name="ai_tone"][value="${currentAiTone}"]`) as HTMLInputElement;
    if (toneInput) toneInput.checked = true;
    if (darkModeToggle) darkModeToggle.checked = darkModeEnabled;
    if (ttsToggle) ttsToggle.checked = ttsEnabled;
    if (internetSearchToggle) internetSearchToggle.checked = internetSearchEnabled;
    if (deepThinkingToggle) deepThinkingToggle.checked = deepThinkingEnabled;
    if (creativityLevelSelect) creativityLevelSelect.value = currentCreativityLevel; // New
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
  } else if (screenId === MEMORIES_SCREEN_ID) {
    renderMemoriesScreen();
  } else if (screenId === CREATE_TOOL_SCREEN_ID) {
    if (toolNameInput) toolNameInput.value = '';
    if (toolInstructionsInput) toolInstructionsInput.value = '';
    if (toolKnowledgeInput) toolKnowledgeInput.value = '';
    if (createToolErrorMessageElement) createToolErrorMessageElement.style.display = 'none';
  }
}

function updateNavigationActiveState(activeScreenId: string) {
    document.querySelectorAll('.bottom-nav').forEach(nav => {
        nav.querySelectorAll('.nav-item').forEach(item => {
            const button = item as HTMLButtonElement;
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

            const span = button.querySelector('span:last-child:not(.material-symbols-outlined)') as HTMLElement;
            if (span) {
                span.classList.toggle('font-medium', isActive);
                span.classList.toggle('text-[#19E5C6]', isActive);
                span.classList.toggle('text-[#7A9A94]', !isActive);
            }
        });
    });

    document.querySelectorAll('#desktop-sidebar .sidebar-nav-item').forEach(item => {
        const button = item as HTMLButtonElement;
        let itemTarget = button.dataset.target;
        const effectiveTarget = itemTarget === 'chat-list-screen-home' ? CHAT_LIST_SCREEN_ID : itemTarget;

        const isActive = (effectiveTarget === activeScreenId) ||
                         (item.id === 'sidebar-new-chat-nav-btn' && activeScreenId === CHAT_SCREEN_ID && !currentChatSessionId && !currentChatIsBasedOnTool) ||
                         (item.id === 'sidebar-create-tool-nav-btn' && activeScreenId === CREATE_TOOL_SCREEN_ID);

        button.classList.toggle('active', isActive);
        button.querySelector('.material-symbols-outlined')?.classList.toggle('filled', isActive);
    });
}


// --- Splash Screen Logic ---
function initSplash() {
  showScreen(SPLASH_SCREEN_ID);
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
  const titleEl = document.getElementById('onboarding-title') as HTMLElement;
  const mainTextEl = document.getElementById('onboarding-main-text') as HTMLElement;
  const subTextEl = document.getElementById('onboarding-sub-text') as HTMLElement;
  const imageEl = document.getElementById('onboarding-image') as HTMLElement;

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

function deleteChatSession(sessionId: string) {
    const sessionToDelete = chatSessions.find(s => s.id === sessionId);
    if (!sessionToDelete) return;

    const confirmDelete = confirm(`هل أنت متأكد أنك تريد حذف دردشة "${sessionToDelete.title}"؟ هذا الإجراء لا يمكن التراجع عنه.`);
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

    const newTool: CustomTool = {
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

function startChatWithTool(toolId: string) {
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

    let systemInstruction = tool.instructions;
    const baseSystemInstruction = getSystemInstruction(currentAiTone, userProfile, deepThinkingEnabled, internetSearchEnabled, true);
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
function saveMemory(memory: SavedMemory) {
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
function handleSaveToMemory(messageId: string, messageText: string, sender: string, chatId: string | null) {
    if (!currentUser) return;
    const memory: SavedMemory = {
        id: `mem-${Date.now()}`,
        text: messageText,
        sender: sender,
        chatId: chatId || currentChatSessionId,
        originalMessageId: messageId,
        timestamp: Date.now(),
        userId: currentUser.uid
    };
    saveMemory(memory);
    // This button might be dynamically created now, so query it by messageId context if possible
    const saveBtn = document.querySelector(`.message-action-btn.save-memory-btn[data-message-id="${messageId}"]`) as HTMLButtonElement;
    if (saveBtn) {
        const originalText = saveBtn.querySelector('span:not(.material-symbols-outlined)')?.textContent || "Save to Memory";
        saveBtn.innerHTML = `<span class="material-symbols-outlined text-sm">bookmark_added</span> Saved!`;
        (saveBtn as HTMLButtonElement).disabled = true;
        setTimeout(() => {
             saveBtn.innerHTML = `<span class="material-symbols-outlined text-sm">bookmark_add</span> ${originalText}`;
             (saveBtn as HTMLButtonElement).disabled = false;
        }, 2000);
    }
    addProcessLogEntry(`Message saved to memory: "${messageText.substring(0, 30)}..."`);
}

function renderMemoriesScreen() {
    if (!memoriesListContainer) return;
    memoriesListContainer.innerHTML = '';
    if (savedMemories.length === 0) {
        memoriesListContainer.innerHTML = `<p class="text-center text-[#7A9A94] p-8">No memories saved yet.</p>`;
        return;
    }
    const userMemories = savedMemories.filter(m => m.userId === currentUser?.uid);
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


function getRelativeTime(timestamp: number): string {
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

// Fix: Improve type safety for combinedItems in renderChatList
type CombinedListItem = ChatSession | (CustomTool & { type: 'tool'; lastUpdated: number });

function renderChatList() {
  if (!chatListItemsContainer) return;
  chatListItemsContainer.innerHTML = '';

  if (!currentUser) {
      chatListItemsContainer.innerHTML = `<p class="text-center text-[#7A9A94] p-8 lg:p-12">Please sign in to see your chats & tools.</p>`;
      return;
  }

  const combinedItems: CombinedListItem[] = [];
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

    // Fix: Use a type guard to determine itemType
    const itemType = 'messages' in item ? 'chat' : 'tool';

    itemOuterDiv.dataset.id = item.id;
    itemOuterDiv.dataset.type = itemType;

    itemOuterDiv.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.delete-chat-btn') || (e.target as HTMLElement).closest('.delete-tool-btn')) {
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
        // Item is CustomTool & { type: 'tool'; lastUpdated: number }
        const toolItem = item as (CustomTool & { type: 'tool'; lastUpdated: number });
        iconDiv.innerHTML = `<span class="material-symbols-outlined text-3xl">${toolItem.icon || 'construction'}</span>`;
        titleH3.textContent = `Tool: ${toolItem.name}`;
        subTextP.textContent = toolItem.instructions.substring(0, 50) + (toolItem.instructions.length > 50 ? "..." : "");
    } else {
        // Item is ChatSession
        const chatSessionItem = item as ChatSession;
        iconDiv.innerHTML = `<svg fill="currentColor" height="28px" viewBox="0 0 256 256" width="28px" xmlns="http://www.w3.org/2000/svg"><path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128ZM84,116a12,12,0,1,0,12,12A12,12,0,0,0,84,116Zm88,0a12,12,0,1,0,12,12A12,12,0,0,0,172,116Zm60,12A104,104,0,0,1,79.12,219.82L45.07,231.17a16,16,0,0,1-20.24-20.24l11.35-34.05A104,104,0,1,1,232,128Zm-16,0A88,88,0,1,0,51.81,172.06a8,8,0,0,1,.66,6.54L40,216,77.4,203.53a7.85,7.85,0,0,1,2.53-.42,8,8,0,0,1,4,1.08A88,88,0,0,0,216,128Z"></path></svg>`;
        titleH3.textContent = chatSessionItem.title;

        let lastMeaningfulMessage = 'No messages yet';
        if (chatSessionItem.messages && chatSessionItem.messages.length > 0) {
            const lastMsg = chatSessionItem.messages[chatSessionItem.messages.length - 1];
            if (lastMsg.messageType === 'image' && lastMsg.imageData?.promptForImage) {
                lastMeaningfulMessage = `[Image: ${lastMsg.imageData.promptForImage.substring(0,30)}...]`;
            } else if (lastMsg.userUploadedFile?.name) {
                lastMeaningfulMessage = `[${lastMsg.userUploadedFile.isImage ? "Image" : "File"}: ${lastMsg.userUploadedFile.name}] ${lastMsg.text.substring(0,30)}...`;
            }
            else {
                lastMeaningfulMessage = lastMsg.text;
            }
        }
        subTextP.textContent = lastMeaningfulMessage;
        const lastMessageLang = chatSessionItem.messages && chatSessionItem.messages.length > 0 ? detectMessageLanguage(chatSessionItem.messages[chatSessionItem.messages.length - 1].text) : 'unknown';
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
    timeDiv.textContent = getRelativeTime(item.lastUpdated); // item will always have lastUpdated due to CombinedListItem type

    const deleteButton = document.createElement('button');
    const itemName = itemType === 'tool' ? (item as CustomTool).name : (item as ChatSession).title;
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