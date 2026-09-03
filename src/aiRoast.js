require('dotenv').config();

const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const fallbackMessages = [
    "The compiler is disappointed in you.",
    "That error was personal.",
    "Your code needs emotional support.",
    "Even the semicolon gave up.",
    "💀 EMOTIONAL DAMAGE!"
];

async function generateEmotionalDamage(errorInfo) {

    try {

        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',

            contents: `You are the AI inside a ridiculous coding IDE called "Emotional Damage IDE".

Your job is to emotionally roast a programmer when their code has an error.

Coding information:
Language: ${errorInfo.language || "Unknown"}
Error: ${errorInfo.error || "Unknown error"}
Number of errors: ${errorInfo.errorCount || 1}

Generate:
1. EMOTIONAL DAMAGE percentage
2. A funny reaction to the error
3. A short sarcastic message
4. A verdict

Keep it short, funny and suitable for a college hackathon demo.
Do NOT give a solution to the coding error.`
        });

        return response.text;

    } catch (error) {

        console.error("Gemini error:", error.message);

        return fallbackMessages[
            Math.floor(Math.random() * fallbackMessages.length)
        ];
    }
}

module.exports = {
    generateEmotionalDamage
};