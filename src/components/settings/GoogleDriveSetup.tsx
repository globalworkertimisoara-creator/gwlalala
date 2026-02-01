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

import { useState, useEffect } from 'react';
import { Cloud, CheckCircle, XCircle, ExternalLink, HelpCircle } from 'lucide-react';
import {
  initGoogleDriveAuth,
  handleOAuthCallback,
  isGoogleDriveConnected,
  disconnectGoogleDrive,
  getDriveFolderId,
  setDriveFolderId,
} from '@/utils/googleDriveService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function GoogleDriveSetup() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [folderId, setFolderIdState] = useState(getDriveFolderId() ?? '');
  const [folderSaved, setFolderSaved] = useState(false);

  // ── On mount: check for OAuth callback or existing connection ──────────────
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        try {
          await handleOAuthCallback(code, window.location.origin);
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
      await initGoogleDriveAuth(window.location.origin);
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
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Checking Google Drive…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Cloud className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Google Drive Storage
              <Badge variant={connected ? 'default' : 'secondary'} className="text-xs">
                {connected ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> Connected</>
                ) : (
                  <><XCircle className="h-3 w-3 mr-1" /> Not connected</>
                )}
              </Badge>
            </CardTitle>
            <CardDescription>
              Store uploaded files and videos on your Google Drive.
              Videos are compressed automatically before uploading.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error */}
        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Not connected → Connect button */}
        {!connected && (
          <Button onClick={handleConnect} className="w-full">
            Connect Google Drive
          </Button>
        )}

        {/* Connected → Folder picker + Disconnect */}
        {connected && (
          <div className="space-y-4">
            {/* Folder ID */}
            <div className="space-y-2">
              <Label htmlFor="folder-id">
                Upload Folder ID <span className="text-muted-foreground">(optional)</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="folder-id"
                  value={folderId}
                  onChange={(e) => setFolderIdState(e.target.value)}
                  placeholder="Paste folder ID here"
                  className="flex-1"
                />
                <Button variant="secondary" onClick={handleSaveFolder}>
                  {folderSaved ? '✓ Saved' : 'Save'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Open a folder in Drive → copy the ID from the URL after <code className="bg-muted px-1 rounded">/folders/</code>
              </p>
            </div>

            {/* Disconnect */}
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDisconnect}>
              Disconnect Google Drive
            </Button>
          </div>
        )}

        {/* Setup hint */}
        <div className="flex items-start gap-1.5 border-t pt-4">
          <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Need to set up a Google Cloud project first?{' '}
            <a
              href="https://console.cloud.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-primary hover:underline"
            >
              Open Google Cloud Console <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
