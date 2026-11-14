import React, { useState } from 'react';
import { Undo2, Flag } from 'lucide-react';
import { useMatch } from '../context/MatchContext';
import { useHaptic } from '../hooks/useHaptic';
import { ScoreHeader } from '../components/ScoreHeader';
import { BallTimeline } from '../components/BallTimeline';
import { RunPad } from '../components/RunPad';
import { ExtrasPad } from '../components/ExtrasPad';
import { WicketModal } from '../components/WicketModal';
import { NextBowlerSheet } from '../components/NextBowlerSheet';
import { NextBatterSheet } from '../components/NextBatterSheet';
import { InMatchEditModal } from '../components/InMatchEditModal';
import { InningsBreakModal } from '../components/InningsBreakModal';
import { ExtraType } from '../types/cricket';

export const Live: React.FC = () => {
  const {
    match,
    dispatch,
    historyStack,
    showNewBowlerModal,
    showNewBatsmanModal,
  } = useMatch();
  const { undo: triggerUndoHaptic, tap } = useHaptic();

  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showInMatchMenu, setShowInMatchMenu] = useState(false);
  const [showMidOverBowlerChange, setShowMidOverBowlerChange] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showEndInningsConfirm, setShowEndInningsConfirm] = useState(false);

  // Quick player rename dialog state
  const [quickRenameData, setQuickRenameData] = useState<{
    playerId: string;
    teamId: 'teamA' | 'teamB';
    currentName: string;
  } | null>(null);
  const [quickRenameValue, setQuickRenameValue] = useState('');

  if (!match) return null;

  const handleScoreRuns = (runs: number) => {
    dispatch({ type: 'ADD_RUNS', payload: { runs } });
  };

  const handleScoreExtra = (
    extraType: ExtraType,
    additionalRuns: number,
    runsOffBat?: number
  ) => {
    dispatch({
      type: 'ADD_EXTRA',
      payload: { extraType, additionalRuns, runsOffBat },
    });
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    triggerUndoHaptic();
    dispatch({ type: 'UNDO' });
  };

  const handleResetMatch = () => {
    tap();
    dispatch({ type: 'RESET' });
    setShowResetConfirm(false);
  };

  const handleManualEndInnings = () => {
    tap();
    dispatch({ type: 'END_INNINGS' });
    setShowEndInningsConfirm(false);
  };

  const handleQuickRename = (playerId: string, teamId: 'teamA' | 'teamB', currentName: string) => {
    tap();
    setQuickRenameData({ playerId, teamId, currentName });
    setQuickRenameValue(currentName);
  };

  const handleSaveQuickRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRenameData || !quickRenameValue.trim()) return;
    tap();
    dispatch({
      type: 'EDIT_PLAYER_NAME',
      payload: {
        teamId: quickRenameData.teamId,
        playerId: quickRenameData.playerId,
        newName: quickRenameValue.trim(),
      },
    });
    setQuickRenameData(null);
  };

  const isPadDisabled = showNewBowlerModal || showNewBatsmanModal;

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 pb-20">
      {/* 1. Header Bar + 2. Score Card + 3. Batting Spreadsheet Table + 4. Bowler Row */}
      <ScoreHeader
        onOpenInMatchMenu={() => setShowInMatchMenu(true)}
        onConfirmReset={() => setShowResetConfirm(true)}
        onRequestChangeBowler={() => setShowMidOverBowlerChange(true)}
        onQuickRenamePlayer={handleQuickRename}
      />

      {/* Main Content */}
      <div className="flex-1 p-3 flex flex-col gap-3">
        {/* 5. "This over" Chips */}
        <BallTimeline />

        {/* 6. Sticky Scoring Pad (Disabled if waiting for next bowler/batter) */}
        <div
          className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-sm space-y-2.5 transition-opacity ${
            isPadDisabled ? 'opacity-40 pointer-events-none' : ''
          }`}
        >
          {/* Header Row: Label & Undo Ghost Button */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
              Scoring
            </span>

            {/* Undo: Ghost button with icon on top-right */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyStack.length === 0}
              className={`h-7 px-2 rounded flex items-center gap-1 text-xs font-medium transition-colors ${
                historyStack.length > 0
                  ? 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
              }`}
              title="Undo last delivery"
            >
              <Undo2 size={16} strokeWidth={1.75} />
              <span>Undo ({historyStack.length})</span>
            </button>
          </div>

          {/* Row 1: 0 1 2 3 4 6 */}
          <RunPad onScoreRuns={handleScoreRuns} />

          {/* Row 2: Wd Nb B Lb */}
          <ExtrasPad onScoreExtra={handleScoreExtra} />

          {/* Row 3: WICKET button (Full-width outlined button, border red-600, text red-600, bg-white, fills red-50 on press) */}
          <button
            type="button"
            onClick={() => {
              tap();
              setShowWicketModal(true);
            }}
            className="w-full h-12 rounded-md border border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-slate-900 hover:bg-red-50/50 dark:hover:bg-red-950/20 active:bg-red-50 dark:active:bg-red-950/30 text-sm font-semibold tracking-wider uppercase transition-colors duration-150 flex items-center justify-center select-none"
            aria-label="Record Wicket"
          >
            Wicket
          </button>

          {/* Innings declaration option */}
          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowEndInningsConfirm(true)}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 transition-colors"
            >
              <Flag size={13} strokeWidth={1.75} />
              <span>Declare Innings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Wicket Bottom Sheet Modal */}
      <WicketModal
        isOpen={showWicketModal}
        onClose={() => setShowWicketModal(false)}
      />

      {/* Next Batter Sheet (after wicket or retired hurt) */}
      <NextBatterSheet
        isOpen={showNewBatsmanModal}
      />

      {/* 2. Over End -> Next Bowler Input (cannot be dismissed until bowler chosen) */}
      <NextBowlerSheet
        isOpen={showNewBowlerModal && !showNewBatsmanModal}
      />

      {/* Mid-Over Bowler Change Sheet */}
      <NextBowlerSheet
        isOpen={showMidOverBowlerChange}
        isMidOverChange
        onClose={() => setShowMidOverBowlerChange(false)}
      />

      {/* Full In-Match Editor Modal */}
      <InMatchEditModal
        isOpen={showInMatchMenu}
        onClose={() => setShowInMatchMenu(false)}
        onRequestChangeBowler={() => setShowMidOverBowlerChange(true)}
      />

      {/* Innings Break Screen Modal */}
      <InningsBreakModal />

      {/* Quick Player Rename Modal */}
      {quickRenameData && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <form
            onSubmit={handleSaveQuickRename}
            className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-lg p-4 border border-slate-200 dark:border-slate-800 shadow-sm animate-fadeIn"
          >
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Rename Player
            </h3>
            <input
              type="text"
              autoFocus
              value={quickRenameValue}
              onChange={(e) => setQuickRenameValue(e.target.value)}
              className="w-full h-10 px-3 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setQuickRenameData(null)}
                className="flex-1 h-9 rounded-md border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-9 rounded-md bg-emerald-700 text-white text-xs font-medium"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-lg p-4 border border-slate-200 dark:border-slate-800 shadow-sm animate-fadeIn text-center">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Reset Match?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Current match data and timeline will be reset.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 h-10 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetMatch}
                className="flex-1 h-10 rounded-md border border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-slate-900 hover:bg-red-50 text-xs font-semibold transition-colors"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual End Innings Confirm Dialog */}
      {showEndInningsConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-lg p-4 border border-slate-200 dark:border-slate-800 shadow-sm animate-fadeIn text-center">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Conclude Innings?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to declare or end this innings?
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowEndInningsConfirm(false)}
                className="flex-1 h-10 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleManualEndInnings}
                className="flex-1 h-10 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition-colors"
              >
                Conclude
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
