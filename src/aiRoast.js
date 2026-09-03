require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/genai');

const client = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

async function getRoast(codeSnippet) {
  const prompt = `Roast this code brutally but humorously:\n${codeSnippet}`;
  const result = await client.generateText({ model: "gemini-pro", prompt });
  return result.output || "Emotional Damage!";
}

module.exports = { getRoast };
