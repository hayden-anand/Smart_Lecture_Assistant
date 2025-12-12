import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SummaryData, ToneAnalysisData } from '../types';

const summarySchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A concise summary of the lecture in 5-10 bullet points."
        },
        key_terms: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of key terms and their definitions."
        },
        action_items: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of action items or follow-up tasks."
        },
    },
    required: ["summary", "key_terms", "action_items"],
};

export const summarizeTranscript = async (ai: GoogleGenAI, transcript: string): Promise<SummaryData> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Here is a lecture transcript. Create concise, exam-ready notes from it. Keep formulas/notation verbatim. No chit-chat. Provide short bullets for each section.\n\nTranscript:\n${transcript}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: summarySchema,
            },
        });

        const jsonString = response.text.trim();
        const parsedData = JSON.parse(jsonString);
        
        if (parsedData.summary && parsedData.key_terms && parsedData.action_items) {
             return parsedData as SummaryData;
        } else {
            throw new Error("Invalid summary data structure from API");
        }
    } catch (error) {
        console.error("Error summarizing transcript:", error);
        throw new Error("Failed to process summary from AI.");
    }
};

export const askQuestion = async (
    ai: GoogleGenAI, 
    transcript: string, 
    history: { user: string; ai: string }[],
    question: string
): Promise<string> => {
    try {
        const chatHistoryForModel = history.flatMap(turn => [
            { role: 'user', parts: [{ text: turn.user }] },
            { role: 'model', parts: [{ text: turn.ai }] }
        ]);

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: chatHistoryForModel,
            config: {
                systemInstruction: `You are a helpful assistant for a student. Your goal is to answer questions based *only* on the provided lecture transcript. If the answer is not in the transcript, say "I cannot find an answer to that in the lecture notes." Do not make information up. Here is the transcript:\n\n${transcript}`,
            }
        });


        const response = await chat.sendMessage({ 
            message: question,
        });

        return response.text;
    } catch (error) {
        console.error("Error asking question:", error);
        throw new Error("Failed to get answer from AI.");
    }
};

export const translateText = async (ai: GoogleGenAI, text: string, language: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Translate the following text to ${language}. Only provide the translated text, with no additional commentary or explanations.\n\n---\n\n${text}`,
        });
        return response.text;
    } catch (error) {
        console.error(`Error translating text to ${language}:`, error);
        throw new Error("Failed to translate text.");
    }
};

export const getSuggestedQuestions = async (ai: GoogleGenAI, transcript: string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the following lecture transcript, generate 3 insightful questions a student might ask to better understand the material. Return the questions as a JSON array of strings.\n\nTranscript:\n${transcript}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
            },
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error generating suggested questions:", error);
        return [];
    }
};

const toneSchema = {
    type: Type.OBJECT,
    properties: {
        tone: { type: Type.STRING, description: "The overall tone of the lecture (e.g., Formal, Casual, Enthusiastic)." },
        context: { type: Type.STRING, description: "The context of the lecture (e.g., Introductory, Technical Deep-Dive, Review)." },
        mood: { type: Type.STRING, description: "The mood conveyed by the speaker (e.g., Serious, Humorous, Encouraging)." },
    },
    required: ["tone", "context", "mood"],
};

export const analyzeTone = async (ai: GoogleGenAI, transcript: string): Promise<ToneAnalysisData> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the tone, context, and mood of the following lecture transcript. Provide a concise, one- or two-word answer for each category.\n\nTranscript:\n${transcript}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: toneSchema,
            },
        });
        const jsonString = response.text.trim();
        const parsedData = JSON.parse(jsonString);
        return parsedData as ToneAnalysisData;
    } catch (error) {
        console.error("Error analyzing tone:", error);
        throw new Error("Failed to analyze tone from AI.");
    }
};