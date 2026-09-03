require('dotenv').config();

const {
    GoogleGenerativeAI
} = require('@google/generative-ai');

const apiKey =
    process.env.GEMINI_API_KEY;

let ai = null;

if (apiKey) {
    ai = new GoogleGenerativeAI(apiKey);
}


/* ================================================
   FALLBACK ROASTS
================================================ */

const roasts = {

    syntax: [
        '💀 Your syntax has officially betrayed you.',
        '😮‍💨 The compiler sighed before reporting this.',
        '🚨 Syntax crime detected. Confidence deleted.',
        'Your brackets are having an identity crisis.',
        'Even the semicolon is disappointed.',
        'The code works beautifully... if you ignore the error.'
    ],

    deletion: [
        '🎻 You deleted the code. The code is mourning.',
        'That was not refactoring. That was a massacre.',
        'You did not edit the code. You erased its future.',
        'Somewhere, a variable is crying.',
        'The codebase has entered its grieving period.'
    ],

    inactivity: [
        '🥱 You stopped coding. Even your IDE fell asleep.',
        '30 seconds of silence. Are you debugging or contemplating life?',
        'Your keyboard has not moved. Neither has your productivity.',
        'The code is waiting. Patiently.',
        'Programmer status: emotionally AFK.'
    ]
};


function fallback(type) {

    const list =
        roasts[type] ||
        roasts.syntax;

    return list[
        Math.floor(
            Math.random() * list.length
        )
    ];
}


/* ================================================
   AI ROAST
================================================ */

async function generateEmotionalDamage(
    type,
    details
) {

    details = details || {};

    if (!ai) {
        return fallback(type);
    }

    let prompt = '';

    if (type === 'syntax') {

        prompt =
            'You are the AI inside a funny VS Code extension called Emotional Damage IDE. ' +
            'A programmer has made a syntax error. ' +
            'Language: ' +
            (details.language || 'Unknown') +
            '. Error: ' +
            (details.error || 'Unknown') +
            '. Give a funny college-hackathon-friendly roast. ' +
            'Include an emotional damage percentage, a sarcastic roast, and a verdict. ' +
            'Do not give the solution. Keep it under 70 words.';
    }

    else if (type === 'deletion') {

        prompt =
            'You are the AI inside Emotional Damage IDE. ' +
            'The programmer deleted ' +
            (details.lines || 3) +
            ' lines of code. ' +
            'Give a dramatic funny roast. ' +
            'Include an emotional damage percentage and verdict. ' +
            'Do not give coding advice. Keep it under 70 words.';
    }

    else {

        prompt =
            'You are the AI inside Emotional Damage IDE. ' +
            'The programmer stopped typing for 30 seconds. ' +
            'Give a funny sarcastic roast. ' +
            'Include an emotional damage percentage and verdict. ' +
            'Keep it under 70 words.';
    }

    try {

        const model =
            ai.getGenerativeModel({
                model: 'gemini-1.5-flash'
            });

        const result =
            await model.generateContent(
                prompt
            );

        const text =
            result.response.text();

        if (!text || !text.trim()) {
            return fallback(type);
        }

        return text.trim();

    } catch (error) {

        console.error(
            'Gemini error:',
            error.message
        );

        return fallback(type);
    }
}


module.exports = {
    generateEmotionalDamage
};