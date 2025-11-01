'use client';

import { useState } from 'react';
import { SimpleHomeScreen } from './SimpleHomeScreen';
import { SmartDashboard } from './SmartDashboard';
import { HelpOverlay } from './HelpOverlay';
import { SendMoneyOptions } from './SendMoneyOptions';
import { LanguageSelector } from './LanguageSelector';
import { InsightsScreen } from './InsightsScreen';
import { ChatAdvisorScreen } from './ChatAdvisorScreen';

interface AdaptDashboardProps {
  balance?: string;
  userName?: string;
  userId?: string;
  onNavigateToFeature?: (feature: 'circulars' | 'forms' | 'credit') => void;
}

export default function AdaptDashboard({ 
  balance, 
  userName, 
}: AdaptDashboardProps) {
  // Avoid hydration mismatch: detect client and only render full UI on client
  const isClient = typeof window !== 'undefined';
  const [viewMode, setViewMode] = useState<'simple' | 'smart'>(
    isClient && window.innerWidth >= 1024 ? 'smart' : 'simple'
  );
  const [currentScreen, setCurrentScreen] = useState<'home' | 'sendMoney' | 'insights' | 'advisor'>('home');
  const [showHelp, setShowHelp] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('hi');

  const handleViewToggle = () => {
    setViewMode(viewMode === 'simple' ? 'smart' : 'simple');
  };

  const handleSendMoney = () => {
    setCurrentScreen('sendMoney');
  };

  // Voice is integrated into Advisor now; route voice actions to Advisor chat
  const handleVoiceCommand = () => {
    setCurrentScreen('advisor');
  };

  const handleInsights = () => {
    setCurrentScreen('insights');
  };

  const handleAdvisor = () => {
    setCurrentScreen('advisor');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setShowLanguageSelector(false);
  };

  if (!isClient) return null;

  return (
    <div className="relative min-h-screen">
        {/* Language Selector Modal */}
        {showLanguageSelector && (
          <LanguageSelector
            currentLanguage={selectedLanguage}
            onLanguageSelect={handleLanguageChange}
            onClose={() => setShowLanguageSelector(false)}
          />
        )}

        {/* Help Overlay */}
        {showHelp && (
          <HelpOverlay
            onClose={() => setShowHelp(false)}
            viewMode={viewMode}
          />
        )}

        {/* Main Content */}
        {currentScreen === 'home' && (
          viewMode === 'simple' ? (
            <SimpleHomeScreen
              onSendMoney={handleSendMoney}
              onVoiceCommand={handleVoiceCommand}
              onInsights={handleInsights}
              onAdvisor={handleAdvisor}
              onToggleView={handleViewToggle}
              onShowHelp={() => setShowHelp(true)}
              onShowLanguage={() => setShowLanguageSelector(true)}
              language={selectedLanguage}
              balance={balance}
              userName={userName}
            />
          ) : (
            <SmartDashboard
              onSendMoney={handleSendMoney}
              onVoiceCommand={handleVoiceCommand}
              onInsights={handleInsights}
              onAdvisor={handleAdvisor}
              onToggleView={handleViewToggle}
              onShowHelp={() => setShowHelp(true)}
              onShowLanguage={() => setShowLanguageSelector(true)}
              language={selectedLanguage}
              balance={balance}
              userName={userName}
            />
          )
        )}

        {/* No separate voice screen; mic is available inside Advisor chat */}

        {currentScreen === 'sendMoney' && (
          <SendMoneyOptions
            onBack={handleBackToHome}
            language={selectedLanguage}
          />
        )}

        {currentScreen === 'insights' && (
          <InsightsScreen
            onBack={handleBackToHome}
            language={selectedLanguage}
          />
        )}

        {currentScreen === 'advisor' && (
          <ChatAdvisorScreen
            onBack={handleBackToHome}
            language={selectedLanguage}
          />
        )}
    </div>
  );
}
