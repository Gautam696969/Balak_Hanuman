import React from 'react';
import { useMatch } from './context/MatchContext';
import { Setup } from './pages/Setup';
import { Live } from './pages/Live';
import { ScorecardPage } from './pages/Scorecard';
import { History } from './pages/History';
import { Result } from './pages/Result';
import { BottomNav } from './components/BottomNav';

export const AppContent: React.FC = () => {
  const { match, activeTab } = useMatch();

  // If no match is created yet and user isn't on history tab, show Setup
  if (!match) {
    if (activeTab === 'history') {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          <History />
          <BottomNav />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Setup />
        <BottomNav />
      </div>
    );
  }

  // If match has completed and user is on the scoring tab, show Result summary
  if (match.status === 'completed' && activeTab === 'scoring') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Result />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {activeTab === 'scoring' && <Live />}
      {activeTab === 'scorecard' && <ScorecardPage />}
      {activeTab === 'history' && <History />}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
