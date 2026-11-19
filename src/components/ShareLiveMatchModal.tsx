import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageSquare, Database, RefreshCw } from 'lucide-react';
import { Match } from '../types/cricket';
import { isFirebaseConfigured, syncMatchToCloud } from '../services/firebase';

interface ShareLiveMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onOpenFirebaseConfig: () => void;
}

export const ShareLiveMatchModal: React.FC<ShareLiveMatchModalProps> = ({
  isOpen,
  onClose,
  match,
  onOpenFirebaseConfig,
}) => {
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  // Direct shareable spectator link
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  const spectatorUrl = `${origin}${pathname}?matchId=${encodeURIComponent(match.id)}&view=spectator`;

  const shareText = `🏏 Watch Live Cricket Match!\n*${match.teamA.name} vs ${match.teamB.name}*\nLive ball-by-ball score and commentary here:\n${spectatorUrl}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(spectatorUrl);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = spectatorUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${match.teamA.name} vs ${match.teamB.name} - Live Score`,
          text: `Watch live cricket match: ${match.teamA.name} vs ${match.teamB.name}`,
          url: spectatorUrl,
        });
      } catch (err) {
        // Share cancelled or not supported
      }
    } else {
      handleCopyLink();
    }
  };

  const handleForceSync = async () => {
    setSyncing(true);
    setSyncFeedback(null);
    const result = await syncMatchToCloud(match);
    setSyncing(false);
    if (result.success) {
      setSyncFeedback('Match synced to cloud successfully!');
    } else {
      setSyncFeedback(result.error || 'Failed to sync. Check Firebase setup.');
    }
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const isConfigured = isFirebaseConfigured();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-sm shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Share2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Share Live Match
              </h2>
              <p className="text-[11px] text-slate-500">
                Spectators can watch live ball-by-ball
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5 text-xs">
          {/* Match Info Pill */}
          <div className="p-3 rounded-lg bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/50 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
                {match.teamA.name} vs {match.teamB.name}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {match.date} &bull; {match.rules.totalOvers} Overs
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white uppercase tracking-wider animate-pulse">
              Live
            </span>
          </div>

          {/* Cloud Sync Status */}
          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Realtime Cloud Status:
              </span>
              {isConfigured ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Config Required
                </span>
              )}
            </div>

            {isConfigured ? (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500">
                  Scores update automatically on viewers devices
                </span>
                <button
                  type="button"
                  onClick={handleForceSync}
                  disabled={syncing}
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-600 dark:text-orange-400 hover:underline"
                >
                  <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
                  Sync Now
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500">
                  Firebase needed for cloud broadcast
                </span>
                <button
                  type="button"
                  onClick={onOpenFirebaseConfig}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                >
                  <Database size={11} />
                  Configure
                </button>
              </div>
            )}

            {syncFeedback && (
              <p className="text-[10px] text-orange-600 dark:text-orange-400 font-medium pt-1">
                {syncFeedback}
              </p>
            )}
          </div>

          {/* Shareable Link Box */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Direct Spectator Link
            </label>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <input
                type="text"
                readOnly
                value={spectatorUrl}
                className="bg-transparent flex-1 text-[11px] font-mono text-slate-700 dark:text-slate-300 outline-hidden select-all truncate px-1"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="h-7 px-2.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-medium text-[11px] flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-2xs shrink-0"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* WhatsApp Direct Share Button */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full h-11 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <MessageSquare size={17} fill="currentColor" />
            Share Live on WhatsApp
          </button>

          {/* Other apps share button */}
          {typeof navigator.share === 'function' && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full h-9 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Share2 size={14} />
              Share via other Apps...
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

