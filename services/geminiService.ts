import { GoogleGenAI, Type } from "@google/genai";
// FIX: Add imports for new types and constants.
import type { Correction, FileInfo, ChatMessage } from '../types';
// FIX: Add RE_SYSTEM_INSTRUCTION to imports.
import { GEMINI_MODEL, SYSTEM_INSTRUCTION, RE_SYSTEM_INSTRUCTION } from '../constants';

let ai: GoogleGenAI | null = null;

/**
 * Initializes the GoogleGenAI client with a user-provided API key.
 * @param apiKey The user's Gemini API key.
 */
export const initializeGeminiClient = (apiKey: string): void => {
  if (!apiKey) {
    throw new Error("API key is missing.");
  }
  ai = new GoogleGenAI({ apiKey });
};


const responseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            incorrect: {
                type: Type.STRING,
                description: 'মূল লেখা থেকে নেওয়া সঠিক ভুল শব্দটি বা বাক্যাংশ।',
            },
            correct: {
                type: Type.STRING,
                description: 'ভুল শব্দ বা বাক্যাংশের জন্য প্রস্তাবিত সঠিক সংস্করণ।',
            },
            explanation: {
                type: Type.STRING,
                description: 'মূল লেখাটি কেন ভুল ছিল তার একটি সংক্ষিপ্ত ব্যাখ্যা (যেমন, বানান ভুল, ব্যাকরণগত ত্রুটি)।',
            },
        },
        required: ["incorrect", "correct", "explanation"],
    },
};

/**
 * Checks Bengali text for spelling and grammar errors using the Gemini API.
 * @param text The Bengali text to check.
 * @returns A promise that resolves to an array of Correction objects.
 */
export const checkBengaliText = async (text: string): Promise<Correction[]> => {
  if (!ai) {
    throw new Error("Gemini client is not initialized. Please provide a valid API key.");
  }
  if (!text.trim()) {
    return [];
  }

  const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Please check the following Bengali text for errors: "${text}"`,
      config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.2,
      }
  });

  const jsonText = response.text.trim();
  if (!jsonText) {
    return [];
  }
  
  try {
    const parsedResponse = JSON.parse(jsonText);
  
    if (Array.isArray(parsedResponse)) {
      // Basic validation
      return parsedResponse.filter(item => 
        item && typeof item.incorrect === 'string' && typeof item.correct === 'string' && typeof item.explanation === 'string'
      );
    }
  } catch (e) {
    console.error("Failed to parse JSON response:", jsonText);
  }

  return [];
};

// FIX: Add missing getGuidance function for the file analyzer chat feature.
/**
 * Gets guidance from Gemini for reverse engineering a file.
 * @param fileInfo The basic info of the file being analyzed.
 * @param history The chat history.
 * @param question The user's latest question (already included in history).
 * @returns A promise that resolves to the assistant's response.
 */
export const getGuidance = async (fileInfo: FileInfo, history: ChatMessage[], question: string): Promise<string> => {
    if (!ai) {
        throw new Error("Gemini client is not initialized. Please provide a valid API key.");
    }

    const fileDataContext = `
Context for my questions: I am analyzing an executable file with the following properties:
- File Name: ${fileInfo.name}
- File Size: ${fileInfo.size} bytes
- A sample of extracted strings from the file:
\`\`\`
${fileInfo.extractedStrings.slice(0, 50).join('\n')}
${fileInfo.extractedStrings.length > 50 ? '\n... (and more strings were found)' : ''}
\`\`\`
`;

    // Convert our app's chat history to Gemini's format.
    const contents = history.slice(1).map((msg, index) => {
        let text = msg.content;
        // Prepend the file context to the first user message in the history.
        if (index === 0 && msg.role === 'user') {
            text = `${fileDataContext}\n\nMy first question is: ${msg.content}`;
        }
        return {
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text }],
        };
    });

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: contents,
            config: {
                systemInstruction: RE_SYSTEM_INSTRUCTION,
                temperature: 0.5,
            }
        });

        return response.text;
    } catch (e) {
        console.error("Failed to get guidance from Gemini:", e);
        return "Sorry, I encountered an error while trying to get a response. Please check the console for details.";
    }
};
