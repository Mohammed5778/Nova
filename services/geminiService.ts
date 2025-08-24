import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Part, Type } from "@google/genai";

// TYPES
interface ChatSettings {
    useInternetSearch: boolean;
    useDeepThinking: boolean;
    useScientificMode: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string | object;
}

interface ChatSession {
    id:string;
    title: string;
    messages: Message[];
    settings: ChatSettings;
    toolId?: string;
    knowledgeFiles?: { name: string; content: string; }[];
}

interface CustomTool {
    id: string;
    name: string;
    icon: string;
    prompt: string;
    knowledge?: {
        name: string;
        content: string;
    }[];
}


const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    // In a real app, you might want to show this to the user in a less disruptive way.
    alert("Gemini API key is not configured. Please set the API_KEY environment variable.");
    throw new Error("API_KEY environment variable is not set.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

const modelConfig = {
    safetySettings: [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
    ],
};


function findRelevantPastConversations(
    currentPrompt: string,
    allSessions: Record<string, ChatSession>,
): string {
    const promptWords = new Set(currentPrompt.toLowerCase().split(/\s+/).filter(w => w.length > 3 && isNaN(Number(w))));
    if (promptWords.size === 0) return "";

    const relevantExchanges: string[] = [];
    
    // Iterate over sessions in reverse chronological order
    const sessionIds = Object.keys(allSessions).sort().reverse();

    for (const sessionId of sessionIds) {
        if (relevantExchanges.length >= 3) break; // Limit the number of snippets

        const session = allSessions[sessionId];
        for (let i = 0; i < session.messages.length; i++) {
            const msg = session.messages[i];
            if (msg.role === 'user' && typeof msg.content === 'string') {
                const messageWords = new Set(msg.content.toLowerCase().split(/\s+/));
                const intersection = [...promptWords].filter(word => messageWords.has(word));
                
                if (intersection.length > 1) { // Require at least two common words
                    let exchange = `User: "${msg.content}"`;
                    if (i + 1 < session.messages.length && session.messages[i+1].role === 'model' && typeof session.messages[i+1].content === 'string') {
                        exchange += `\nAssistant: "${session.messages[i+1].content}"`;
                    }
                    relevantExchanges.unshift(exchange); // Add to the beginning to keep recent ones
                    if (relevantExchanges.length >= 3) break;
                }
            }
        }
    }
    
    if (relevantExchanges.length === 0) return "";

    return `\n\n**Relevant information from past conversations:**\n${relevantExchanges.join('\n---\n')}`;
}

function buildGeniusAgentInstruction(
    settings: ChatSettings,
    userProfile: Record<string, any>,
    generalMemories: string[],
    activeTool: CustomTool | undefined,
    sessionKnowledge: { name: string; content: string }[],
    savedMemories: Message[],
    relevantHistoryContext: string,
    language: 'ar' | 'en'
): string {
    let instruction = language === 'ar' 
        ? "أنت Nova AI، وكيل ذكاء اصطناعي عبقري. لغتك الأساسية هي العربية. أنت لا تجيب على الأسئلة فحسب؛ بل تنفذ المهام. قم بتحليل طلب المستخدم وقدم أفضل مخرجات ممكنة."
        : "You are Nova AI, a genius-level AI agent. Your primary language is English. You don't just answer questions; you perform tasks. Analyze the user's request and provide the most effective output.";
    
    if (activeTool) {
        instruction = activeTool.prompt; // Tool prompt takes highest precedence
        // Add language instruction to tool prompt if not present
        if (!/primary language is (Arabic|English)|لغتك الأساسية هي (العربية|الإنجليزية)/i.test(instruction)) {
            instruction += ` Your primary language for responding is ${language === 'ar' ? 'Arabic' : 'English'}.`;
        }
    }
    
    instruction += `\n\n**Core Task Directives & Rich Content Formatting:**
- Your response format MUST match ONE of the following types based on the user's request.
- **1. Explicit Commands:** If the user prompt starts with a command like \`/youtube\`, \`/resume\`, \`/report\`, \`/project\`, \`/chart\`, \`/table\`, prioritize generating the corresponding JSON format.
- **2. Implicit Requests:** If no command is given, infer the best format from the context.
- **3. Plain Text:** For simple questions, conversational replies, or when no other format fits.

**JSON Formats (ONLY respond with the raw JSON object if one of these is chosen):**
- **YouTube Search:** \`{"type": "youtube_search_results", "query": "...", "videos": [{"title": "...", "videoId": "...", "channel": "...", "description": "...", "thumbnailUrl": "..."}]}\`. Use your search tool to find real YouTube videos and their info.
- **News Report:** \`{"type": "news_report", "title": "...", "summary": "...", "articles": [{"headline": "...", "source": "...", "snippet": "...", "link": "..."}]}\`. Use this for news queries or when using the search tool.
- **Table:** \`{"type": "table", "title": "...", "data": [["Header 1"], ["Row 1 Cell 1"]]}\`.
- **Chart:** \`{"type": "chart", "title": "...", "data": {"chartType": "bar|pie|line", "chartData": {...}}}\` (Chart.js format).
- **Report:** \`{"type": "report", "title": "...", "data": [{"section": "Section 1", "content": "..."}]}\`.
- **Resume:** \`{"type": "resume", "name": "Full Name", "title": "Professional Title", "contact": {...}, "summary": "...", "experience": [{...}], "education": [{...}], "skills": [{...}]}\`. Ensure it's professional and ATS-friendly.
- **Code Project:** \`{"type": "code_project", "title": "Project Title", "files": [{"filename": "...", "language": "...", "code": "..."}], "review": {...}}\`.
- **Study Mode (Multi-step):**
    - **Explanation:** \`{"type": "study_explanation", "topic": "...", "explanation": "..."}\` (Use Markdown in 'explanation').
    - **Review:** \`{"type": "study_review", "topic": "...", "review": {"title": "...", "points": [...]}}\`.
    - **Quiz:** \`{"type": "study_quiz", "topic": "...", "quiz": [{"type": "...", "question": "...", "options": [...], "correctAnswer": "..."}]}\`.
- **CRITICAL:** When a JSON format is required, your entire response MUST be the JSON object and nothing else. No introductory text, no explanations, no markdown specifiers.`;


    // Combine all knowledge sources for the AI.
    let knowledgeBase = '';

    if (activeTool?.knowledge && activeTool.knowledge.length > 0) {
        knowledgeBase += "\n\n**Specialized Tool Knowledge:** You have the following information to use as your primary source of truth for this task.\n";
        activeTool.knowledge.forEach(k => {
            knowledgeBase += `\n--- START OF ${k.name} ---\n${k.content}\n--- END OF ${k.name} ---\n`;
        });
    }

    if (sessionKnowledge.length > 0) {
        knowledgeBase += "\n\n**Knowledge from this session's files:** Prioritize this information for the current query.\n";
        sessionKnowledge.forEach(k => {
             knowledgeBase += `\n--- START OF ${k.name} ---\n${k.content}\n--- END OF ${k.name} ---\n`;
        });
    }

    if (knowledgeBase) {
        instruction += `\n\n--- KNOWLEDGE BASE ---\n${knowledgeBase}\n--- END KNOWLEDGE BASE ---`;
    }

    // Combine all memory sources
    let memoryBase = '';
    if (Object.keys(userProfile).length > 0) {
        memoryBase += `\n\n*   **About the User:** ${JSON.stringify(userProfile)}`;
    }
    if (generalMemories.length > 0) {
        memoryBase += `\n*   **General Notes:**\n    - ${generalMemories.join('\n    - ')}`;
    }
    if (savedMemories.length > 0) {
        const mems = savedMemories.map(m => typeof m.content === 'string' ? `"${m.content}"` : `"${(m.content as any).title}"`).join(', ');
        memoryBase += `\n*   **User's Saved Memories:** ${mems}`;
    }
    if (relevantHistoryContext) {
        memoryBase += relevantHistoryContext;
    }

    if (memoryBase) {
        instruction += `\n\n--- MEMORY & CONTEXT ---\nUse the following information to personalize your response and maintain context:\n${memoryBase}\n--- END MEMORY & CONTEXT ---`;
    }

    
    if (settings.useDeepThinking) {
        instruction += "\n\n**Mode: Deep Thinking.** Provide detailed, analytical, and comprehensive answers. Explore multiple perspectives and explain your reasoning.";
    }

    if (settings.useScientificMode) {
        instruction += "\n\n**Mode: Scientific.** Structure your response like an academic paper: Abstract, Introduction, Methodology, Results/Analysis, Conclusion. Use formal language.";
    }
    
    return instruction;
}

export async function getAiResponseStream(
    userMessageParts: Part[],
    history: Message[], // This history INCLUDES the last user message
    settings: ChatSettings,
    userProfile: Record<string, any>,
    generalMemories: string[],
    activeTool: CustomTool | undefined,
    allSessions: Record<string, ChatSession>,
    savedMemories: Message[],
    sessionKnowledge: { name: string; content: string }[],
    language: 'ar' | 'en'
) {
    const modelName = 'gemini-2.5-flash';

    const historyForApi = history.slice(0, -1);

    const chatHistory = historyForApi.filter(m => m.id !== 'init' && m.id !== 'init-temp').map(m => ({
        role: m.role as 'user' | 'model',
        parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
    }));
    
    const userContent = { role: 'user' as const, parts: userMessageParts };
    const contents = [...chatHistory, userContent];
    
    const userPromptText = userMessageParts.find(p => p.text)?.text || '';
    const relevantHistoryContext = findRelevantPastConversations(userPromptText, allSessions);

    const systemInstruction = buildGeniusAgentInstruction(
        settings, 
        userProfile, 
        generalMemories, 
        activeTool, 
        sessionKnowledge,
        savedMemories,
        relevantHistoryContext,
        language
    );

    const request = {
        model: modelName,
        contents: contents,
        config: {
            ...modelConfig,
            systemInstruction: systemInstruction,
            ...(settings.useInternetSearch && { tools: [{ googleSearch: {} }] }),
        }
    };

    const responseStream = await ai.models.generateContentStream(request);

    async function* stream() {
        for await (const chunk of responseStream) {
            const sources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web) || null;
            yield { text: chunk.text, sources };
        }
    }
    return stream();
}


export async function generateImage(
    prompt: string,
    aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4',
    numberOfImages: number
): Promise<string[]> {
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
          numberOfImages: numberOfImages,
          outputMimeType: 'image/png',
          aspectRatio: aspectRatio,
        },
    });

    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
}

export async function generateVideo(
    prompt: string,
    imageBytes: string | null,
    onProgress: (message: string) => void
): Promise<string> {
    
    const params: any = {
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
        },
    };

    if (imageBytes) {
        params.image = {
            imageBytes: imageBytes,
            mimeType: 'image/png', // Assuming PNG for simplicity
        };
    }
    
    let operation = await ai.models.generateVideos(params);
    
    const loadingMessages = [
        "Warming up the AI core...",
        "Analyzing your prompt...",
        "Generating visual concepts...",
        "Rendering initial video frames...",
        "This can take a few minutes, please wait...",
        "Adding details and motion...",
        "Finalizing the video output...",
        "Almost there, polishing the result...",
    ];
    let messageIndex = 0;
    
    while (!operation.done) {
        onProgress(loadingMessages[messageIndex % loadingMessages.length]);
        messageIndex++;
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
        console.error('Video generation failed:', operation.error);
        throw new Error(operation.error.message ? String(operation.error.message) : 'Video generation failed with an unknown error.');
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error('Video generation finished but no video URL was returned. The prompt may have been blocked.');
    }
    
    onProgress("Downloading generated video...");
    const response = await fetch(`${downloadLink}&key=${API_KEY}`);
    if (!response.ok) {
        throw new Error(`Failed to download video file: ${response.statusText}`);
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

export async function enhancePromptForImage(originalPrompt: string, style: string): Promise<string> {
    const styleInstructions: { [key: string]: string } = {
        photorealistic: "ultra photorealistic, 8k, sharp focus, detailed, professional photography, high quality texture, canon eos r5",
        cinematic: "cinematic lighting, movie still, film grain, dynamic composition, masterpiece, 8k, ultra-detailed, dramatic, emotional, color grading",
        fantasy: "fantasy art, epic, mystical, glowing, intricate details, highly detailed, by artists like Greg Rutkowski and Artgerm, trending on Artstation",
        anime: "anime style, key visual, vibrant colors, detailed illustration, by Makoto Shinkai and Studio Ghibli, beautiful scenery",
        digital_art: "digital painting, concept art, smooth, sharp focus, illustration, artstation trending, beautiful, elegant",
        '3d_model': "3D model, blender render, octane render, unreal engine 5, hyper-detailed, polished, realistic materials, 4k"
    };

    const enhancementPrompt = `
    Translate and enhance the following user prompt into a single, cohesive, highly detailed English paragraph for a sophisticated AI image generator.
    The final output MUST be in English.
    The desired style is: "${style}".
    Integrate these keywords to achieve the style: "${styleInstructions[style] || ''}".
    The final prompt should be a creative and descriptive interpretation of the user's idea, fused with the stylistic elements.
    ONLY return the final enhanced English prompt paragraph. Do not include any other text, explanations, or quotes.

    User Prompt: "${originalPrompt}"
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: enhancementPrompt,
        });
        return response.text.trim();
    } catch (e) {
        console.error("Error enhancing prompt:", e);
        // Fallback to simple translation/prefixing if enhancement fails
        return `A ${style} image of ${originalPrompt}`; 
    }
}


export async function extractUserInfo(lastUserMessage: string, lastModelResponse: string): Promise<object> {
    const modelName = 'gemini-2.5-flash';
    const prompt = `Analyze the following conversation and extract any new personal information the user has revealed about themselves (e.g., name, interests, job, location, preferences). If no new personal information is revealed, return an empty JSON object {}.

    CONVERSATION:
    User: "${lastUserMessage}"
    Assistant: "${lastModelResponse}"
    
    EXTRACTED_USER_INFO_JSON:`;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                ...modelConfig,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "The user's name, if explicitly mentioned." },
                        interests: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A list of the user's interests, hobbies, or favorite topics, if mentioned.",
                        },
                        profession: { type: Type.STRING, description: "The user's profession or job title, if mentioned." },
                        facts: {
                             type: Type.ARRAY,
                             items: {type: Type.STRING},
                             description: "Any other personal facts or preferences mentioned by the user."
                        }
                    },
                    nullable: true,
                },
            }
        });
        const jsonText = response.text.trim();
        return jsonText ? JSON.parse(jsonText) : {};
    } catch (e) {
        console.error("Could not extract user info:", e);
        return {};
    }
}