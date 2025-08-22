/* tslint:disable */
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { GenerateVideosParameters, GoogleGenAI } from '@google/genai';

let apiKey = '';
const API_KEY_STORAGE_KEY = 'nova-api-key';

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      resolve(url.split(',')[1]);
    };
    reader.readAsDataURL(blob);
  });
}

async function generateContent(
  prompt: string,
  imageBytes: string,
  updateStatus: (status: string) => void,
) {
  if (!apiKey) {
    throw new Error('API Key is not set. Please set it in the settings.');
  }
  const ai = new GoogleGenAI({ apiKey });

  const config: GenerateVideosParameters = {
    model: 'veo-2.0-generate-001',
    prompt,
    config: {
      numberOfVideos: 1,
    },
  };

  if (imageBytes) {
    config.image = {
      imageBytes,
      mimeType: 'image/png', // Assuming PNG, adjust if other types are allowed
    };
  }

  let operation = await ai.models.generateVideos(config);

  const loadingMessages = [
    'Warming up the AI core',
    'Analyzing your prompt',
    'Generating visual concepts',
    'Rendering video frames',
    'This can take a few minutes',
    'Finalizing the details',
  ];
  let messageIndex = 0;

  while (!operation.done) {
    console.log('Waiting for completion...');
    updateStatus(loadingMessages[messageIndex % loadingMessages.length]);
    messageIndex++;
    await delay(10000); // Poll every 10 seconds
    operation = await ai.operations.getVideosOperation({ operation });
  }

  // Check for errors in the completed operation
  if (operation.error) {
    console.error('Video generation operation failed:', operation.error);
    throw new Error(
      String(operation.error.message ||
        'The video generation process encountered an unknown error.'),
    );
  }

  const videos = operation.response?.generatedVideos;
  if (videos === undefined || videos.length === 0) {
    console.error(
      'Video generation finished but returned no videos. Full operation object:',
      operation,
    );
    throw new Error(
      'No videos were generated. This could be due to the prompt being rejected for safety reasons. Please try a different prompt.',
    );
  }

  // Assuming one video for now
  const videoData = videos[0];
  const url = decodeURIComponent(videoData.video.uri);
  const res = await fetch(`${url}&key=${apiKey}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch video: ${res.statusText}`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// DOM Elements
const upload = document.querySelector('#file-input') as HTMLInputElement;
const imgEl = document.querySelector('#img') as HTMLImageElement;
const promptEl = document.querySelector('#prompt-input') as HTMLTextAreaElement;
const generateButton = document.querySelector(
  '#generate-button',
) as HTMLButtonElement;
const statusEl = document.querySelector('#status') as HTMLDivElement;
const videoEl = document.querySelector('#video') as HTMLVideoElement;
const quotaErrorEl = document.querySelector('#quota-error') as HTMLDivElement;
const quotaManageKeyButton = document.querySelector(
  '#open-key',
) as HTMLButtonElement;
const outputPlaceholder = document.querySelector(
  '#output-placeholder',
) as HTMLDivElement;
const mainContent = document.querySelector('.main-content') as HTMLElement;

// API Key Modal Elements
const modal = document.querySelector('#api-key-modal') as HTMLDivElement;
const apiKeyInput = document.querySelector(
  '#api-key-input',
) as HTMLInputElement;
const saveApiKeyButton = document.querySelector(
  '#save-api-key-button',
) as HTMLButtonElement;
const settingsButton = document.querySelector(
  '#settings-button',
) as HTMLButtonElement;

let base64data = '';
let prompt = '';

// --- API Key Management ---
function showApiKeyModal() {
  modal.classList.add('visible');
  mainContent.classList.add('content-disabled');
}

function hideApiKeyModal() {
  modal.classList.remove('visible');
  mainContent.classList.remove('content-disabled');
}

function saveApiKey() {
  const key = apiKeyInput.value.trim();
  if (key) {
    apiKey = key;
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
    hideApiKeyModal();
  } else {
    alert('Please enter a valid API key.');
  }
}

// --- App Logic ---
upload.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      imgEl.src = event.target.result as string;
      imgEl.style.display = 'block';
    };
    reader.readAsDataURL(file);
    base64data = await blobToBase64(file);
  }
});

promptEl.addEventListener('input', () => {
  prompt = promptEl.value;
});

generateButton.addEventListener('click', () => {
  if (!prompt.trim()) {
    alert('Please enter a prompt.');
    return;
  }
  generate();
});

function setUIState(state: 'idle' | 'loading' | 'error' | 'success') {
  generateButton.disabled = state === 'loading';
  upload.disabled = state === 'loading';
  promptEl.disabled = state === 'loading';

  outputPlaceholder.style.display =
    state === 'idle' || state === 'error' ? 'flex' : 'none';
  statusEl.style.display = state === 'loading' ? 'block' : 'none';
  videoEl.style.display = state === 'success' ? 'block' : 'none';
  quotaErrorEl.style.display = 'none'; // Reset quota error on new generation
}

async function generate() {
  if (!apiKey) {
    showApiKeyModal();
    return;
  }

  setUIState('loading');
  videoEl.src = '';
  statusEl.innerText = 'Initializing';

  try {
    const videoUrl = await generateContent(prompt, base64data, (status) => {
      statusEl.innerText = status;
    });
    videoEl.src = videoUrl;
    setUIState('success');
  } catch (e) {
    setUIState('error');
    let errorMessage: string;
    if (e instanceof Error) {
      errorMessage = e.message;
    } else {
      errorMessage = String(e);
    }
    console.error('Generation failed:', e);

    // Try to parse specific API errors
    try {
      if (errorMessage.includes('429')) {
        // A simple check for quota error in the string
        quotaErrorEl.style.display = 'block';
        outputPlaceholder.style.display = 'none'; // Hide placeholder to show error
        return; // Don't show generic error message
      }
    } catch (parseError) {
      // Not a JSON error, continue
    }
    statusEl.innerText = `Error: ${errorMessage}`;
    statusEl.style.display = 'block'; // Show error in status element
  }
}

function init() {
  const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
  if (savedKey) {
    apiKey = savedKey;
    apiKeyInput.value = savedKey;
    hideApiKeyModal();
  } else {
    showApiKeyModal();
  }

  saveApiKeyButton.addEventListener('click', saveApiKey);
  settingsButton.addEventListener('click', showApiKeyModal);
  quotaManageKeyButton.addEventListener('click', showApiKeyModal);

  setUIState('idle');
}

init();
