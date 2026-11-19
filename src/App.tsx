import React, { useState, useEffect } from 'react';
import { useMatch } from './context/MatchContext';
import { Setup } from './pages/Setup';
import { Live } from './pages/Live';
import { ScorecardPage } from './pages/Scorecard';
import { History } from './pages/History';
import { Result } from './pages/Result';
import { SpectatorView } from './pages/SpectatorView';
import { BottomNav } from './components/BottomNav';
import { AppHeader } from './components/AppHeader';
import { ErrorBoundary } from './components/ErrorBoundary';

export const AppContent: React.FC = () => {
  const { match, activeTab } = useMatch();
  const [spectatorMatchId, setSpectatorMatchId] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('matchId') || params.get('liveMatchId');
    } catch {
      return null;
    }
  });

  // Listen for popstate / URL changes
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setSpectatorMatchId(params.get('matchId') || params.get('liveMatchId'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleExitSpectator = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('matchId');
      url.searchParams.delete('liveMatchId');
      url.searchParams.delete('view');
      window.history.replaceState({}, '', url.pathname);
    } catch {
      // ignore
    }
    setSpectatorMatchId(null);
  };

  // If viewing as spectator via share link
  if (spectatorMatchId) {
    return (
      <ErrorBoundary>
        <SpectatorView
          matchId={spectatorMatchId}
          onExitSpectatorMode={handleExitSpectator}
        />
      </ErrorBoundary>
    );
  }

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
        <ErrorBoundary>
          {renderPage()}
        </ErrorBoundary>
      </div>
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
