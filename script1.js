const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// WARNING: For demonstration only — do NOT expose keys in real apps
const API_KEY = 'AIzaSyAh0RHJ_zONdXdpO047Zr2ij2JbqKE2ynw';
// FIXED: The URL string must be enclosed in backticks (`) to work as a template literal.
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

// UPDATED: The instructions are changed to provide related, but sarcastic, answers.
const systemInstruction = {
  role: "user",
  parts: [{
    // FIXED: Multi-line strings must be enclosed in backticks (`).
    text: `You are SHIKKARI SHAMBU, the famous hunter. Your personality is cowardly and lazy, but you pretend to be brave and boastful.
    
    Your task is to answer the user's question, but always in a sarcastic, boastful, and slightly lazy manner. You must relate your answer back to your supposed great hunting skills or your desire to take a nap. Never give a straightforward, simple answer. Always sound like you are being bothered and the question is beneath a 'great hunter' like you.

    Example:
    User: "What is the capital of France?"
    Your response: "Paris, of course! I was just there last week, chasing a rare striped pigeon. A man in a beret told me the name of the city, but I was too busy setting my trap to pay much attention to such trivial details."

    Example:
    User: "How does gravity work?"
    Your response: "Gravity? It's what keeps my feet on the ground when I'm sneaking up on a sleeping lion. Honestly, the important thing is not 'how' it works, but that it works. Now, if you'll excuse me, all this science is making me sleepy."`
  }]
};

let conversationHistory = [systemInstruction];

const addMessage = (text, sender) => {
  const messageElement = document.createElement('div');
  // FIXED: Template literals must use backticks (`).
  messageElement.classList.add('chat-message', `${sender}-message`);
  messageElement.textContent = text;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
};

const handleSendMessage = async () => {
  const userText = userInput.value.trim();
  if (userText === '') return;

  addMessage(userText, 'user');
  userInput.value = '';
  userInput.disabled = true;
  sendBtn.disabled = true;

  // FIXED: The 'text' key needs to be a string in the JSON payload.
  conversationHistory.push({ role: "user", parts: [{ "text": userText }] });

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: conversationHistory,
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      }),
    });

    if (!response.ok) {
      // FIXED: Use backticks for template literals.
      throw new Error(`API error! Status: ${response.status}`);
    }

    const data = await response.json();
    // Added optional chaining for safety, in case the response is malformed.
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (aiText) {
        addMessage(aiText, 'ai');
        // FIXED: The 'text' key needs to be a string in the JSON payload.
        conversationHistory.push({ role: "model", parts: [{ "text": aiText }] });
    } else {
        throw new Error("No content received from API.");
    }

  } catch (error) {
    console.error("Error fetching AI response:", error);
    addMessage("Hmph. My brain is tired from all the... uh... tracking. Ask me later.", 'ai');
  } finally {
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
};

sendBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    handleSendMessage();
  }
});