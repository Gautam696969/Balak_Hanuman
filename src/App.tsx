import React from 'react';
import { useMatch } from './context/MatchContext';
import { Setup } from './pages/Setup';
import { Live } from './pages/Live';
import { ScorecardPage } from './pages/Scorecard';
import { History } from './pages/History';
import { Result } from './pages/Result';
import { BottomNav } from './components/BottomNav';
import { AppHeader } from './components/AppHeader';

export const AppContent: React.FC = () => {
  const { match, activeTab } = useMatch();

  const renderPage = () => {
    // If no match is created yet and user isn't on history tab, show Setup
    if (!match) {
      if (activeTab === 'history') {
        return <History />;
      }
      return <Setup />;
    }

    // If match has completed and user is on the scoring tab, show Result summary
    if (match.status === 'completed' && activeTab === 'scoring') {
      return <Result />;
    }

    if (activeTab === 'scoring') return <Live />;
    if (activeTab === 'scorecard') return <ScorecardPage />;
    if (activeTab === 'history') return <History />;
    return <Setup />;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <AppHeader />
      <div className="flex-1">
        {renderPage()}
      </div>
      <BottomNav />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
