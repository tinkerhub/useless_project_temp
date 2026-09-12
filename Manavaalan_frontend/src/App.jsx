import React, { useState } from 'react';
import { IntroFlow } from './components/IntroFlow';
import { Page5Chat } from './components/Page5Chat';

export default function App() {
  const [userConfig, setUserConfig] = useState(null);

  if (!userConfig) {
    return (
      <IntroFlow
        onCompleteOnboarding={(config) => {
          // Receives { userName: string, language: 'Malayalam' | 'English', initialGreeting: string }
          setUserConfig(config);
        }}
      />
    );
  }

  return (
    <Page5Chat
      language={userConfig.language || 'MALAYALAM'}
      userName={userConfig.userName || 'Friend'}
      initialGreeting={userConfig.initialGreeting}
      onRestartOnboarding={() => setUserConfig(null)}
    />
  );
}
