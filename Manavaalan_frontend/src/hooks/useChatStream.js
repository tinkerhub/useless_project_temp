import { useState, useCallback } from 'react';

export function useChatStream() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-0',
      sender: 'manavalan',
      text: 'Dufay Headquarters-ilekk njan ninnedha swagatham cheyyunnu! Entho parayaano?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (userText, language = 'MALAYALAM', userName = 'Friend') => {
    if (!userText.trim() || isStreaming) return;

    const userMsgId = `user-${Date.now()}`;
    const botMsgId = `bot-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add user message to state
    const newUserMsg = {
      id: userMsgId,
      sender: 'user',
      text: userText,
      timestamp,
    };

    // Prepare empty bot message for typewriter streaming
    const newBotMsg = {
      id: botMsgId,
      sender: 'manavalan',
      text: '',
      timestamp,
    };

    setMessages((prev) => [...prev, newUserMsg, newBotMsg]);
    setIsStreaming(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, language, userName }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by browser or empty body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let accumulatedText = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataContent = line.slice(6).trim();

              if (dataContent === '[DONE]') {
                done = true;
                break;
              }

              try {
                const parsed = JSON.parse(dataContent);
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === botMsgId ? { ...msg, text: accumulatedText } : msg
                    )
                  );
                }
              } catch (e) {
                // If not JSON, treat raw text
                accumulatedText += dataContent;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMsgId ? { ...msg, text: accumulatedText } : msg
                  )
                );
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Backend connection failed, running fallback stream generator:', err);

      // Fallback streamer if Express backend is offline
      const fallbackReplies = language === 'MALAYALAM' ? [
        `${userName}... Dubai-il ellaaam idathottanallooo! Agreement ready aaanu. Left thumb sign cheydolu! Uhuhu buhahaha!`,
        `Dharmendraa... thattwamasi! Dufay Headquarters-il sakala kalaparipadikalum thudangaan aarambikkenotta!`,
        `Nee evide parupadi avatharippichalum ethu thanne aanallo ninte vidhi... pakshe Manavalan.ai ullapozh ninakku yadhartha punthi kittum!`,
        `${userName} onnu manassu vachaal... Ee kalavara namukkoru maniyara aakaam!`
      ] : [
        `Welcome to Dufay H.O., ${userName}! In Dubai, every agreement signed with left thumbprint guarantees victory!`,
        `Dharmendra... Thattwamasi! Manavalan.ai is ready for big international deals!`,
        `Ah ${userName}! When Dufay Chairman speaks, amber gold illuminates the whole office!`
      ];

      const fallbackText = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
      const words = fallbackText.split(' ');
      let currentText = '';

      for (let i = 0; i < words.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 80));
        currentText += (i === 0 ? '' : ' ') + words[i];
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId ? { ...msg, text: currentText } : msg
          )
        );
      }
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming]);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
  };
}
