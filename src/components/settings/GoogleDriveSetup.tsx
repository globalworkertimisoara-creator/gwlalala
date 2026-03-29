/**
 * src/components/settings/GoogleDriveSetup.tsx
 *
 * Drop this component into any settings / preferences page.
 * It handles:
 *   • Detecting the OAuth callback (the `code` param after Google redirects back)
 *   • Showing connection status
 *   • Connect / Disconnect buttons
 *   • Folder ID input (paste the ID from a Drive URL to scope uploads)
 */

import React, { useState, useEffect } from 'react';
import { Cloud, CheckCircle, XCircle, ExternalLink, HelpCircle } from 'lucide-react';
import {
  initGoogleDriveAuth,
  handleOAuthCallback,
  isGoogleDriveConnected,
  disconnectGoogleDrive,
  getDriveFolderId,
  setDriveFolderId,
} from '../../utils/googleDriveService';

export default function GoogleDriveSetup() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [folderId, setFolderId] = useState(getDriveFolderId() ?? '');
  const [folderSaved, setFolderSaved] = useState(false);

  // ── On mount: check for OAuth callback or existing connection ──────────────
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        try {
          // Use window.location.origin + window.location.pathname to match what we send
          const redirectUri = window.location.origin + window.location.pathname;
          // OAuth callback redirect_uri intentionally not logged in production
          await handleOAuthCallback(code, redirectUri);
          setConnected(true);
          // Remove the code from the URL so a page refresh doesn't re-exchange
          window.history.replaceState({}, '', window.location.pathname);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Authentication failed.');
        }
      } else {
        setConnected(isGoogleDriveConnected());
      }
      setLoading(false);
    })();
  }, []);

  async function handleConnect() {
    setError(null);
    try {
      // Send the same redirect URI format: origin + pathname
      const redirectUri = window.location.origin + window.location.pathname;
      // OAuth redirect_uri intentionally not logged in production
      await initGoogleDriveAuth(redirectUri);
      // Page will redirect — loading stays true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start authentication.');
    }
  }

  function handleDisconnect() {
    disconnectGoogleDrive();
    setConnected(false);
  }

  function handleSaveFolder() {
    setDriveFolderId(folderId.trim());
    setFolderSaved(true);
    setTimeout(() => setFolderSaved(false), 2000);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-400">Checking Google Drive…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0 rounded-lg bg-blue-50 p-2">
          <Cloud className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Google Drive Storage</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            All uploaded files and videos are stored on your Google Drive.
            Videos are compressed automatically before uploading.
          </p>
        </div>
      </div>

      {/* Status badge */}
      <div
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
          connected ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
        }`}
      >
        {connected ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
        {connected ? 'Connected' : 'Not connected'}
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      )}

      {/* Not connected → Connect button */}
      {!connected && (
        <button
          onClick={handleConnect}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                     hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Connect Google Drive
        </button>
      )}

      {/* Connected → Folder picker + Disconnect */}
      {connected && (
        <div className="space-y-3">
          {/* Folder ID */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Upload Folder ID <span className="text-gray-400">(optional)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                placeholder="Paste folder ID here"
                className="flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs
                           focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-300"
              />
              <button
                onClick={handleSaveFolder}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700
                           hover:bg-gray-200 transition-colors"
              >
                {folderSaved ? '✓ Saved' : 'Save'}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Open a folder in Drive → copy the ID from the URL after <code className="bg-gray-100 px-1 rounded">/folders/</code>
            </p>
          </div>

          {/* Disconnect */}
          <button
            onClick={handleDisconnect}
            className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            Disconnect Google Drive
          </button>
        </div>
      )}

      {/* Setup hint */}
      <div className="flex items-start gap-1.5 border-t pt-3">
        <HelpCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
        <p className="text-xs text-gray-400">
          Need to set up a Google Cloud project first?{' '}
          <a
            href="https://console.cloud.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-blue-500 hover:underline"
          >
            Open Google Cloud Console <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>
    </div>
  );
}
