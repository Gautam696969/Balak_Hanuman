import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Database, HelpCircle } from 'lucide-react';
import {
  getFirebaseConfig,
  saveFirebaseConfig,
  isFirebaseConfigured,
  getFirebaseDb,
  FirebaseConfig,
} from '../services/firebase';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [databaseURL, setDatabaseURL] = useState('');
  const [projectId, setProjectId] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [appId, setAppId] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [jsonConfigInput, setJsonConfigInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      const cfg = getFirebaseConfig();
      if (cfg) {
        setApiKey(cfg.apiKey || '');
        setDatabaseURL(cfg.databaseURL || '');
        setProjectId(cfg.projectId || '');
        setAuthDomain(cfg.authDomain || '');
        setAppId(cfg.appId || '');
      }
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleJsonPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonConfigInput(val);
    try {
      // Look for JSON object or js object
      const cleaned = val.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
      const parsed = JSON.parse(cleaned);
      if (parsed.databaseURL || parsed.projectId || parsed.apiKey) {
        if (parsed.apiKey) setApiKey(parsed.apiKey);
        if (parsed.databaseURL) setDatabaseURL(parsed.databaseURL);
        if (parsed.projectId) setProjectId(parsed.projectId);
        if (parsed.authDomain) setAuthDomain(parsed.authDomain);
        if (parsed.appId) setAppId(parsed.appId);
        setStatusMessage({
          type: 'success',
          text: 'Firebase config parsed successfully from JSON!',
        });
      }
    } catch {
      // Ignore intermediate typing
    }
  };

  const handleSave = () => {
    if (!databaseURL.trim() && !projectId.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please provide at least a Database URL or Project ID.',
      });
      return;
    }

    const config: FirebaseConfig = {
      apiKey: apiKey.trim(),
      databaseURL: databaseURL.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim(),
      appId: appId.trim(),
    };

    saveFirebaseConfig(config);

    // Verify DB init
    const db = getFirebaseDb();
    if (db) {
      setStatusMessage({
        type: 'success',
        text: 'Firebase connected and saved successfully!',
      });
      if (onConfigSaved) onConfigSaved();
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setStatusMessage({
        type: 'error',
        text: 'Could not connect with provided config. Check Database URL and API Key.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Database size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Firebase Realtime Live Sync
              </h2>
              <p className="text-[11px] text-slate-500">
                Connect Firebase for live spectator sharing
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
        <div className="p-4 space-y-3.5 overflow-y-auto text-xs flex-1">
          {/* Status Banner */}
          <div
            className={`p-2.5 rounded-lg border flex items-center justify-between ${
              isFirebaseConfigured()
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {isFirebaseConfigured() ? (
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle size={16} className="text-amber-600 dark:text-amber-400" />
              )}
              <span className="font-semibold text-xs">
                {isFirebaseConfigured()
                  ? 'Cloud Sync: Configured'
                  : 'Cloud Sync: Not configured yet'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-1 text-[11px] font-medium underline text-slate-600 dark:text-slate-400 hover:text-orange-600"
            >
              <HelpCircle size={13} />
              {showHelp ? 'Hide guide' : 'Setup guide'}
            </button>
          </div>

          {/* Setup Guide */}
          {showHelp && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
              <p className="font-bold text-slate-900 dark:text-slate-100">
                Quick 2-minute Firebase setup:
              </p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>
                  Go to{' '}
                  <span className="font-mono text-orange-600 dark:text-orange-400 font-semibold">
                    console.firebase.google.com
                  </span>{' '}
                  and click <strong>Add project</strong>.
                </li>
                <li>
                  Under Build menu, click <strong>Realtime Database</strong> &rarr;{' '}
                  <strong>Create Database</strong>.
                </li>
                <li>
                  Choose location and select <strong>Start in test mode</strong> (or allow read/write).
                </li>
                <li>
                  Go to <strong>Project Settings &rarr; General &rarr; Your apps</strong> (Web icon) and copy your config.
                </li>
              </ol>
            </div>
          )}

          {/* Quick Paste JSON */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Quick Paste Firebase Config Object (JSON)
            </label>
            <textarea
              rows={2}
              value={jsonConfigInput}
              onChange={handleJsonPaste}
              placeholder='Paste { "apiKey": "...", "databaseURL": "...", "projectId": "..." }'
              className="w-full text-[11px] font-mono p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-orange-500 resize-none"
            />
          </div>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="shrink mx-2 text-[10px] uppercase font-semibold text-slate-400">
              Or enter fields manually
            </span>
            <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* Inputs */}
          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Database URL <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={databaseURL}
                onChange={(e) => setDatabaseURL(e.target.value)}
                placeholder="https://your-project-default-rtdb.firebaseio.com"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  API Key <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project ID <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="my-cricket-app"
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Auth Domain (Optional)
                </label>
                <input
                  type="text"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  placeholder="project.firebaseapp.com"
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  App ID (Optional)
                </label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1:123456789:web:..."
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Feedback Message */}
          {statusMessage && (
            <div
              className={`p-2 rounded-lg text-xs font-medium ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300'
                  : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-200 border border-red-300'
              }`}
            >
              {statusMessage.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2 bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-9 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 h-9 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs shadow-xs"
          >
            Save &amp; Connect
          </button>
        </div>
      </div>
    </div>
  );
};

