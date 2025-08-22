

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
    id: string;
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


const API_KEY = "AIzaSyDWoUYK44lTPqOGmbsSQm4ZkKcmr_1jHdM";
// if (!API_KEY) {
//     throw new Error("API_KEY environment variable is not set.");
// }
const ai = new GoogleGenAI({ apiKey: API_KEY });

const modelConfig = {
    safetySettings: [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
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
        ? "You are Nova AI, a genius-level AI agent. Your primary language is Arabic. You don't just answer questions; you perform tasks. Analyze the user's request and provide the most effective output."
        : "You are Nova AI, a genius-level AI agent. Your primary language is English. You don't just answer questions; you perform tasks. Analyze the user's request and provide the most effective output.";
    
    if (activeTool) {
        instruction = activeTool.prompt; // Tool prompt takes highest precedence
        // Add language instruction to tool prompt if not present
        if (!/primary language is (Arabic|English)/i.test(instruction)) {
            instruction += ` Your primary language for responding is ${language === 'ar' ? 'Arabic' : 'English'}.`;
        }
    }
    
    instruction += `\n\n**Core Task Directives & Rich Content Formatting:**
- Your response format MUST match ONE of the following types based on the user's request:
- **1. Plain Text:** For simple questions and conversational replies.
- **2. News Report (JSON):** If the query is about news, current events, or requires web search. Use the Google Search tool, then respond ONLY with this JSON: \`{"type": "news_report", "title": "A summary title of the search results", "summary": "A concise summary of the findings.", "articles": [{"headline": "Article Title", "source": "Website Name", "snippet": "A brief relevant snippet...", "link": "https://example.com/article-url"}]}\`. Populate from search results.
- **3. Table (JSON):** If the request involves organizing data in a tabular format. Respond ONLY with this JSON: \`{"type": "table", "title": "A descriptive title", "data": [["Header 1", "Header 2"], ["Row 1 Cell 1", "Row 1 Cell 2"]]}\`.
- **4. Chart (JSON):** For data visualization requests. Respond ONLY with this JSON: \`{"type": "chart", "title": "A descriptive title", "data": {"chartType": "bar|pie|line", "chartData": {...}}}\` (Chart.js format).
- **5. Report (JSON):** For summaries or structured documents. Respond ONLY with this JSON: \`{"type": "report", "title": "A descriptive title", "data": [{"section": "Section 1 Title", "content": "Section 1 text..."}, {"section": "Section 2 Title", "content": "..."}]}\`.
- **6. Resume (JSON):** If the user asks to create a CV or resume, ensure you gather and include all key sections. The result MUST be professional and ATS-friendly. Do NOT ask for a photo; the user will upload it separately. Respond ONLY with this JSON, using detailed examples: \`{"type": "resume", "name": "Full Name", "title": "Professional Job Title", "contact": {"email": "professional.email@example.com", "phone": "+1234567890", "linkedin": "linkedin.com/in/username", "github": "github.com/username", "website": "yourportfolio.com"}, "summary": "A brief but impactful professional summary highlighting 3-4 key skills and achievements relevant to the target job.", "experience": [{"title": "Senior Software Engineer", "company": "Innovatech Solutions", "location": "San Francisco, CA", "dates": "Jan 2020 - Present", "responsibilities": ["Led the development of a scalable microservices architecture, resulting in a 40% improvement in application performance.", "Mentored a team of 5 junior developers, improving team productivity by 25%.", "Collaborated with product managers to define feature requirements and technical specifications."]}, {"title": "Software Developer", "company": "Data Systems Inc.", "location": "Boston, MA", "dates": "Jun 2018 - Dec 2019", "responsibilities": ["Developed and maintained RESTful APIs for a client-facing financial data platform.", "Wrote unit and integration tests, increasing code coverage from 70% to 92%."]}], "education": [{"degree": "B.Sc. in Computer Science", "institution": "University of Technology", "dates": "Sep 2014 - May 2018", "details": "Graduated with High Honors (GPA: 3.9/4.0)."}], "skills": [{"category": "Programming Languages", "items": ["JavaScript (ES6+)", "TypeScript", "Python", "Java", "SQL"]}, {"category": "Frameworks & Libraries", "items": ["React", "Node.js", "Express.js", "Spring Boot"]}, {"category": "Databases", "items": ["PostgreSQL", "MongoDB", "Redis"]}, {"category": "Tools & Platforms", "items": ["Docker", "Kubernetes", "AWS", "Git", "JIRA"]}], "projects": [{"name": "Open Source Contribution", "description": "Contributed a major feature to a popular open-source library, which was merged and is now used by thousands of developers.", "link": "github.com/project/pull/123"}]}\`.
- **7. Code Project (JSON):** If the user asks to program something. Generate the necessary code file(s) and a structured review. Respond ONLY with this JSON: \`{"type": "code_project", "title": "Project Title", "files": [{"filename": "index.html", "language": "html", "code": "..."}], "review": {"overview": "...", "strengths": ["..."], "improvements": ["..."], "nextSteps": ["..."]}}\`.
- **8. Study Mode (Multi-step JSON):**
    - **Step 1: Explanation.** If the user wants to learn/study a topic, your first response MUST be a JSON object of type 'study_explanation'. The 'explanation' field should be a detailed string using Markdown for headings, lists, **tables**, code blocks (\`\`\`lang...), and LaTeX math formulas ($$...$$). Example: \`{"type": "study_explanation", "topic": "Photosynthesis", "explanation": "# Photosynthesis\\n## ...\\n| Input | Output |\\n|---|---|\\n| CO2 | O2 |"}\`
    - **Step 2: Review.** If the user asks for a review of the topic, respond ONLY with this JSON: \`{"type": "study_review", "topic": "Topic Name", "review": {"title": "Key Takeaways", "points": ["Point 1", "Point 2"]}}\`
    - **Step 3: Quiz.** If the user asks for a quiz, respond ONLY with this JSON: \`{"type": "study_quiz", "topic": "Topic Name", "quiz": [{"type": "multiple_choice|short_answer", "question": "Question text?", "options": ["Option A", "Option B"], "correctAnswer": "Correct Answer Text or Index"}]}\`
- **CRITICAL:** When a JSON format is required, your entire response MUST be the JSON object and nothing else. No introductory text, no explanations.`;


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