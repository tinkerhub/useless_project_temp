require('dotenv').config();

const { GoogleGenAI } = require('@google/generative-ai');

// Check API key before creating the AI client
const apiKey = process.env.GEMINI_API_KEY;

let ai = null;

if (apiKey) {
    ai = new GoogleGenAI({
        apiKey: apiKey
    });
}

const fallbackMessages = [
    "The compiler is disappointed in you.",
    "That error was personal.",
    "Your code needs emotional support.",
    "Even the semicolon gave up.",
    "💀 EMOTIONAL DAMAGE!",
    "I've seen better code written by a calculator.",
    "Your debugger just submitted its resignation.",
    "This code has more problems than a group project.",
    "The compiler read your code and chose violence.",
    "Somewhere, a programmer just felt a disturbance in the Force.",
    "Your code isn't broken. It was never emotionally stable.",
    "Congratulations! You discovered a bug nobody asked for.",
    "Even Stack Overflow doesn't know what you're doing.",
    "Your indentation has entered witness protection.",
    "This code needs a therapist, not a debugger.",
    "The syntax is fighting for its life.",
    "Your keyboard deserves compensation for this.",
    "The code works perfectly... in an alternate universe.",
    "ERROR 404: Programming ability not found.",
    "The compiler would like to speak to your manager."
];

function randomFallback() {
    return fallbackMessages[
        Math.floor(Math.random() * fallbackMessages.length)
    ];
}

async function generateEmotionalDamage(errorInfo = {}) {

    // 1. Check if API key exists
    if (!apiKey) {
        console.error("Gemini API error: GEMINI_API_KEY is missing.");
        return "🔑 EMOTIONAL DAMAGE: API key missing. Even Gemini gave up on you.";
    }

    // 2. Validate input
    if (!errorInfo || typeof errorInfo !== "object") {
        console.error("Invalid error information received.");
        return randomFallback();
    }

    const language = errorInfo.language || "Unknown";
    const error = errorInfo.error || "Unknown error";
    const errorCount = errorInfo.errorCount || 1;

    try {

        const prompt = `You are the AI inside a ridiculous coding IDE called "Emotional Damage IDE".

Your job is to emotionally roast a programmer when their code has an error.

Coding information:
Language: ${language}
Error: ${error}
Number of errors: ${errorCount}

Generate:
1. EMOTIONAL DAMAGE percentage
2. A funny reaction to the error
3. A short sarcastic message
4. A verdict

Keep it short, funny and suitable for a college hackathon demo.
Do NOT give a solution to the coding error.
Do NOT be offensive or hateful.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt
        });

        // 3. Check whether Gemini actually returned text
        if (!response) {
            console.error("Gemini returned an empty response.");
            return randomFallback();
        }

        const roast = response.text;

        if (!roast || typeof roast !== "string" || roast.trim() === "") {
            console.error("Gemini response contained no usable text.");
            return randomFallback();
        }

        return roast.trim();

    } catch (error) {

        // 4. Handle different types of API errors
        console.error("Gemini error:", error);

        if (error.message) {
            console.error("Gemini error message:", error.message);
        }

        // Authentication/API key problem
        if (
            error.message?.includes("API key") ||
            error.message?.includes("401") ||
            error.message?.includes("403")
        ) {
            return "🔑 GEMINI REJECTED YOU. Check your API key.";
        }

        // Rate limit
        if (
            error.message?.includes("429") ||
            error.message?.toLowerCase().includes("quota")
        ) {
            return "⏳ TOO MANY ROASTS. Even Gemini needs a break.";
        }

        // Model problem
        if (
            error.message?.includes("model") ||
            error.message?.includes("404")
        ) {
            return "🤖 GEMINI GOT CONFUSED. The selected AI model is unavailable.";
        }

        // Network problem
        if (
            error.message?.toLowerCase().includes("network") ||
            error.message?.toLowerCase().includes("fetch") ||
            error.message?.toLowerCase().includes("timeout")
        ) {
            return "📡 NO INTERNET. Your code couldn't even reach the roast server.";
        }

        // General fallback
        return randomFallback();
    }
}

module.exports = {
    generateEmotionalDamage
};