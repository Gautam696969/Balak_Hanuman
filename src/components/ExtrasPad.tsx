import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ExtraType } from '../types/cricket';
import { useMatch } from '../context/MatchContext';
import { useHaptic } from '../hooks/useHaptic';

interface ExtrasPadProps {
  onScoreExtra: (
    extraType: ExtraType,
    additionalRuns: number,
    runsOffBat?: number,
    isZeroRunExtra?: boolean
  ) => void;
}

export const ExtrasPad: React.FC<ExtrasPadProps> = ({ onScoreExtra }) => {
  const { match } = useMatch();
  const { tap, boundary } = useHaptic();
  const [activeModal, setActiveModal] = useState<'wd' | 'nb' | 'b' | 'lb' | null>(null);

  const widePenalty = match?.rules.wideRuns !== undefined ? match.rules.wideRuns : 1;
  const noBallPenalty = match?.rules.noBallRuns !== undefined ? match.rules.noBallRuns : 1;

  const handleSimpleWide = (additionalRuns: number) => {
    tap();
    onScoreExtra('wd', additionalRuns);
    setActiveModal(null);
  };

  const handleZeroRunWide = () => {
    tap();
    onScoreExtra('wd', 0, 0, true);
    setActiveModal(null);
  };

  const handleZeroRunNoBall = () => {
    tap();
    onScoreExtra('nb', 0, 0, true);
    setActiveModal(null);
  };

  const handleNoBall = (runsOffBat: number, isBye: boolean = false) => {
    if (runsOffBat === 4 || runsOffBat === 6) {
      boundary();
    } else {
      tap();
    }

    if (isBye) {
      onScoreExtra('nb', runsOffBat, 0);
    } else {
      onScoreExtra('nb', 0, runsOffBat);
    }
    setActiveModal(null);
  };

  const handleByeLegBye = (type: 'b' | 'lb', runs: number) => {
    tap();
    onScoreExtra(type, runs);
    setActiveModal(null);
  };

  return (
    <div>
      {/* Row 2: Wd Nb B Lb (4 columns, smaller, height 40px, bg-slate-100, text-slate-700, rounded-md) */}
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => {
            tap();
            setActiveModal('wd');
          }}
          className="h-10 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors duration-150 active:bg-slate-200 dark:active:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60"
          aria-label="Wide"
        >
          Wd
        </button>

        <button
          type="button"
          onClick={() => {
            tap();
            setActiveModal('nb');
          }}
          className="h-10 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors duration-150 active:bg-slate-200 dark:active:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60"
          aria-label="No Ball"
        >
          Nb
        </button>

        <button
          type="button"
          onClick={() => {
            tap();
            setActiveModal('b');
          }}
          className="h-10 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors duration-150 active:bg-slate-200 dark:active:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60"
          aria-label="Byes"
        >
          B
        </button>

        <button
          type="button"
          onClick={() => {
            tap();
            setActiveModal('lb');
          }}
          className="h-10 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors duration-150 active:bg-slate-200 dark:active:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60"
          aria-label="Leg Byes"
        >
          Lb
        </button>
      </div>

      {/* Modal Sheet for Wide Options */}
      {activeModal === 'wd' && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center backdrop-blur-[2px]">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-xl p-4 border-t border-slate-200 dark:border-slate-800 shadow-sm animate-fadeIn">
            <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Wide Ball Options {widePenalty > 0 ? `(+${widePenalty} Penalty)` : '(0 Penalty)'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {/* Option: Wide with No Run and No Ball Count */}
              <button
                type="button"
                onClick={handleZeroRunWide}
                className="w-full h-12 rounded-md border-2 border-amber-500 bg-amber-50/80 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-left px-3 flex items-center justify-between transition-colors shadow-xs active:scale-[0.99]"
              >
                <div>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                    Wide: 0 Run &amp; No Ball Count
                  </span>
                  <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 block">
                    No run awarded &bull; Delivery not counted (Re-bowled)
                  </span>
                </div>
                <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded">
                  0 Run
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Wide Only', runs: 0, sub: `${widePenalty} run total` },
                  { label: 'Wide + 1 Run', runs: 1, sub: `${widePenalty + 1} runs total` },
                  { label: 'Wide + 2 Runs', runs: 2, sub: `${widePenalty + 2} runs total` },
                  { label: 'Wide + 3 Runs', runs: 3, sub: `${widePenalty + 3} runs total` },
                  { label: 'Wide + 4 (Four)', runs: 4, sub: `${widePenalty + 4} runs total` },
                ].map(({ label, runs, sub }) => (
                  <button
                    key={runs}
                    onClick={() => handleSimpleWide(runs)}
                    className="h-11 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-left px-3 flex flex-col justify-center transition-colors active:bg-slate-100"
                  >
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{label}</span>
                    <span className="text-[10px] text-slate-400">{sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sheet for No Ball Options */}
      {activeModal === 'nb' && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center backdrop-blur-[2px]">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-xl p-4 border-t border-slate-200 dark:border-slate-800 shadow-sm animate-fadeIn">
            <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                No Ball Options {noBallPenalty > 0 ? `(+${noBallPenalty} Penalty)` : '(0 Penalty)'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            <div className="mt-3">
              {/* Option: No Ball with No Run and No Ball Count */}
              <button
                type="button"
                onClick={handleZeroRunNoBall}
                className="w-full h-12 mb-3 rounded-md border-2 border-amber-500 bg-amber-50/80 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-left px-3 flex items-center justify-between transition-colors shadow-xs active:scale-[0.99]"
              >
                <div>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                    No Ball: 0 Run &amp; No Ball Count
                  </span>
                  <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 block">
                    No run awarded &bull; Delivery not counted (Re-bowled)
                  </span>
                </div>
                <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded">
                  0 Run
                </span>
              </button>

              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
                Runs off the Bat:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { r: 0, label: 'Nb (0)', sub: `${noBallPenalty} run` },
                  { r: 1, label: 'Nb + 1', sub: `${noBallPenalty + 1} runs` },
                  { r: 2, label: 'Nb + 2', sub: `${noBallPenalty + 2} runs` },
                  { r: 3, label: 'Nb + 3', sub: `${noBallPenalty + 3} runs` },
                  { r: 4, label: 'Nb + 4', sub: `${noBallPenalty + 4} runs` },
                  { r: 6, label: 'Nb + 6', sub: `${noBallPenalty + 6} runs` },
                ].map(({ r, label, sub }) => (
                  <button
                    key={r}
                    onClick={() => handleNoBall(r, false)}
                    className="h-11 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-center flex flex-col items-center justify-center transition-colors active:bg-slate-100"
                  >
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{label}</span>
                    <span className="text-[10px] text-slate-400">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">Byes on No Ball:</span>
              <div className="flex gap-1.5">
                {[1, 2, 4].map((byeRun) => (
                  <button
                    key={byeRun}
                    onClick={() => handleNoBall(byeRun, true)}
                    className="h-8 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Nb + {byeRun} B
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sheet for Byes / Leg Byes */}
      {(activeModal === 'b' || activeModal === 'lb') && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center backdrop-blur-[2px]">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-xl p-4 border-t border-slate-200 dark:border-slate-800 shadow-sm animate-fadeIn">
            <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {activeModal === 'b' ? 'Byes (Legal Ball)' : 'Leg Byes (Legal Ball)'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-3">
              {[1, 2, 3, 4].map((run) => (
                <button
                  key={run}
                  onClick={() => handleByeLegBye(activeModal, run)}
                  className="h-11 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-sm flex items-center justify-center active:bg-slate-100 tabular-nums"
                >
                  {run} {run === 1 ? 'run' : 'runs'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
