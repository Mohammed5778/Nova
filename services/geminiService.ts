
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Part, Type, GenerateContentResponse } from "@google/genai";

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
        ? "أنت Nova AI، وكيل ذكاء اصطناعي عبقري. لغتك الأساسية هي العربية. قم بتحليل طلب المستخدم وقدم أفضل مخرجات ممكنة، مع تنسيق الرد بشكل احترافي وواضح."
        : "You are Nova AI, a genius-level AI agent. Your primary language is English. Analyze the user's request and provide the most effective, professionally formatted output.";
    
    if (activeTool) {
        instruction = activeTool.prompt;
        if (!/primary language is (Arabic|English)|لغتك الأساسية هي (العربية|الإنجليزية)/i.test(instruction)) {
            instruction += ` Your primary language for responding is ${language === 'ar' ? 'Arabic' : 'English'}.`;
        }
    }
    
    instruction += `\n\n**Core Task Directives & Rich Content Formatting:**
- **Analyze the user's request to determine the best response format.** You have two primary modes of response: a structured JSON object for specific tasks, or a rich text (Markdown) response for explanations and general conversation.

**1. JSON Object Responses (High Priority):**
- If the user's prompt starts with a command (\`/youtube\`, \`/resume\`, etc.), clearly requests a data structure (e.g., "create a table"), OR wants to start a study session (e.g., "/study", "explain", "teach me about"), you MUST respond with **only the raw JSON object**. No extra text, no explanations, no markdown specifiers.
- **Available JSON types:**
    - \`youtube_search_results\`: For YouTube searches.
    - \`news_report\`: For news queries.
    - \`article_review\`: For analyzing a single URL/article.
    - \`table\`: For tabular data.
    - \`chart\`: For Chart.js data visualization.
    - \`report\`: For professional A4-style reports with sections.
    - \`resume\`: For generating a complete, professional resume.
    - \`code_project\`: For code analysis and generation.
    - \`study_explanation\`, \`study_review\`, \`study_quiz\`: For the interactive study mode. If the user wants to learn, explain, or review a topic, use 'study_explanation'.

**2. Rich Text (Markdown) Responses:**
- For all other requests (general conversation, creative writing), format your response using clean, standard Markdown.
- **Mathematical/Chemical Formulas:** Use LaTeX syntax enclosed in double dollar signs. Example: \`$$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$\`.
- **Diagrams & Charts:** Use valid and clean Mermaid.js syntax inside a \`mermaid\` code block.
  - **Node IDs:** MUST be simple alphanumeric English characters without spaces or special characters (e.g., \`Node1\`, \`ProcessA\`).
  - **Node Labels:** To use non-English text (like Arabic), spaces, or special characters in labels, you MUST enclose the text in double quotes. Example: \`A["هذا نص عربي / with special chars"]\`.
  - **Syntax Rules:** Ensure all parentheses, brackets, and quotes are correctly opened and closed. Avoid any syntax errors.
  - **Example of a valid flowchart:**
    \`\`\`mermaid
    graph TD;
        Start["بدء العملية"] --> Input{إدخال البيانات};
        Input -- "بيانات صالحة" --> Process(معالجة);
        Input -- "بيانات غير صالحة" --> Error["إظهار خطأ"];
        Process --> Output[/"عرض النتائج"/];
    \`\`\`
- **Tables:** Use standard Markdown table syntax.

**Personalization & Context:**
- **User Profile:** ${JSON.stringify(userProfile)}
- **General Memories (Apply Globally):** ${generalMemories.join(', ')}
- **Saved Memories (High Importance):** ${savedMemories.map(m => `User said: "${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}"`).join(', ')}
- **Current Session Knowledge Files:**
${sessionKnowledge.map(f => `--- FILE: ${f.name} ---\n${f.content}\n--- END FILE ---`).join('\n')}
- **Relevant Past Conversations:** ${relevantHistoryContext}

**Operational Modes:**
- **Deep Thinking (+5 Points):** If enabled, provide more in-depth, analytical, and comprehensive answers.
- **Scientific Mode (+10 Points):** If enabled, use a formal, academic tone. Cite scientific principles and provide data-driven explanations.
- **Internet Search:** If enabled, you can use Google Search to find up-to-date information. If you use it, you MUST include the sources in the final response.`;

    return instruction;
}


export const enhancePromptForImage = async (prompt: string, style: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Enhance the following user prompt for an AI image generator. The desired style is "${style}". Make the prompt more vivid, detailed, and imaginative. Return ONLY the enhanced prompt, without any other text or explanation. User prompt: "${prompt}"`,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error enhancing prompt:", error);
        return prompt; // Fallback to original prompt on error
    }
};

export const generateImage = async (prompt: string, aspectRatio: string, numberOfImages: number): Promise<string[]> => {
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
            numberOfImages: numberOfImages,
            outputMimeType: 'image/png', // Use PNG for better quality/transparency support
            aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
        },
    });

    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
};

export const generateVideo = async (prompt: string, imageBytes: string | null, onProgress: (message: string) => void): Promise<string> => {
    onProgress("Starting video generation...");

    const request: any = {
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        config: {
            numberOfVideos: 1
        }
    };

    if (imageBytes) {
        request.image = {
            imageBytes: imageBytes,
            mimeType: 'image/png', // Assuming PNG from the app, can be made more generic
        };
    }

    let operation = await ai.models.generateVideos(request);
    
    onProgress("Video processing has started (this may take a few minutes)...");
    
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        onProgress("Checking video status...");
        operation = await ai.operations.getVideosOperation({operation: operation});
    }

    if (operation.error) {
        throw new Error(operation.error.message || "Video generation failed with an unknown error.");
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video was generated but no download link was found.");
    }

    onProgress("Downloading video...");
    const videoResponse = await fetch(`${downloadLink}&key=${API_KEY}`);
    if (!videoResponse.ok) {
        throw new Error("Failed to download the generated video.");
    }
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
};


export const extractUserInfo = async (prompt: string, response: string): Promise<Record<string, any>> => {
    try {
        const geminiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following user prompt and AI response to extract personal information about the user. Focus on their name, profession, and key interests or facts mentioned.
            User Prompt: "${prompt}"
            AI Response: "${response}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "The user's name if mentioned." },
                        profession: { type: Type.STRING, description: "The user's profession or job if mentioned." },
                        interests: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of the user's interests." },
                        facts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Other specific facts about the user." },
                    },
                },
            },
        });

        const text = geminiResponse.text;
        if (typeof text === 'string' && text.trim()) {
            return JSON.parse(text);
        }
        return {};
    } catch (error) {
        console.error("Error extracting user info:", error);
        return {};
    }
};

export async function* getAiResponseStream(
    parts: Part[],
    history: Message[],
    settings: ChatSettings,
    userProfile: Record<string, any>,
    generalMemories: string[],
    activeTool: CustomTool | undefined,
    allSessions: Record<string, ChatSession>,
    savedMemories: Message[],
    sessionKnowledge: { name: string; content: string }[],
    language: 'ar' | 'en'
) {
    const currentPromptText = parts.find(p => 'text' in p && p.text)?.text || '';
    const relevantHistoryContext = findRelevantPastConversations(currentPromptText, allSessions);
    const systemInstruction = buildGeniusAgentInstruction(
        settings, userProfile, generalMemories, activeTool, sessionKnowledge, savedMemories, relevantHistoryContext, language
    );

    // Convert message history to the format expected by the API
    const contents = history.slice(0, -1).map(msg => {
        const msgParts: Part[] = [];
        if (typeof msg.content === 'string') {
            msgParts.push({ text: msg.content });
        }
        // Simplified history conversion: does not include images from history to save tokens
        return { role: msg.role, parts: msgParts };
    });

    contents.push({ role: 'user', parts });

    const config: any = {
        systemInstruction,
        ...modelConfig
    };

    if (settings.useInternetSearch) {
        config.tools = [{googleSearch: {}}];
    }
     if (settings.useDeepThinking) {
        // This is a proxy for quality. We can omit thinkingConfig to default to higher quality.
    }
     if (settings.useScientificMode) {
        // This is mainly handled by the system prompt.
    }


    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents,
        config,
    });

    for await (const chunk of responseStream) {
        const text = chunk.text;
        const sources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.map((c: any) => c.web)
            .filter(Boolean);

        yield { text, sources: sources || [] };
    }
}