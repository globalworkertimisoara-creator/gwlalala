/**
 * src/utils/googleDriveService.ts
 *
 * Google Drive API v3 client.
 * Uses OAuth2 with PKCE — no backend server needed.
 *
 * Token lifecycle:
 *   • PKCE flow → no client secret on the frontend.
 *   • Access token lasts ~1 hour.  If a refresh token is returned
 *     it is used automatically; otherwise the user re-authenticates.
 *   • Tokens are persisted in sessionStorage (cleared on tab close).
 */

import { GOOGLE_CLIENT_ID } from '../config/googleConfig';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const OAUTH_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string; // Drive returns size as string
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
}

export interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
}

interface Tokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms
}

// ─── In-memory + sessionStorage token store ──────────────────────────────────

const STORAGE_KEY = 'gdrive_tokens';
const VERIFIER_KEY = 'gdrive_pkce_verifier';
const FOLDER_KEY = 'gdrive_folder_id';

let tokens: Tokens | null = null;

function loadTokens(): void {
  if (tokens) return;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw) tokens = JSON.parse(raw);
}

function saveTokens(): void {
  if (tokens) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

// ─── Public helpers ───────────────────────────────────────────────────────────

/** Whether we currently have a non-expired access token */
export function isGoogleDriveConnected(): boolean {
  loadTokens();
  return !!tokens && tokens.expiresAt > Date.now();
}

/** Save / retrieve the target folder ID */
export function setDriveFolderId(id: string): void {
  localStorage.setItem(FOLDER_KEY, id);
}

export function getDriveFolderId(): string | null {
  return localStorage.getItem(FOLDER_KEY);
}

/** Clear tokens — effectively "disconnect" */
export function disconnectGoogleDrive(): void {
  tokens = null;
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
}

// ─── OAuth PKCE flow ──────────────────────────────────────────────────────────

/**
 * Redirects the browser to Google's consent screen.
 * After the user grants access, Google redirects back to `redirectUri`
 * with a `code` query parameter.  Call `handleOAuthCallback` with that code.
 */
export async function initGoogleDriveAuth(redirectUri: string): Promise<void> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      'Google Client ID is not configured.\nUpdate src/config/googleConfig.ts with your OAuth Client ID.'
    );
  }

  const verifier = generateVerifier();
  const challenge = await generateChallenge(verifier);
  sessionStorage.setItem(VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.file',
    access_type: 'offline',
    prompt: 'consent',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `${OAUTH_AUTH_URL}?${params}`;
}

/**
 * Exchanges the authorization `code` (from the redirect URL) for tokens.
 * Call this once after the OAuth redirect lands back in your app.
 */
export async function handleOAuthCallback(code: string, redirectUri: string): Promise<void> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY);

  if (!GOOGLE_CLIENT_ID || !verifier) {
    throw new Error('OAuth flow broken — missing client ID or PKCE verifier.');
  }

  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }).toString(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Google auth failed: ${err.error_description || err.error}`);
  }

  const data = await res.json();

  tokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? undefined,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };

  saveTokens();
  sessionStorage.removeItem(VERIFIER_KEY);
}

// ─── Internal: token refresh & retrieval ──────────────────────────────────────

async function refreshAccessToken(): Promise<string> {
  if (!tokens?.refreshToken) {
    throw new Error('Session expired. Please reconnect Google Drive.');
  }

  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: tokens.refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      grant_type: 'refresh_token',
    }).toString(),
  });

  if (!res.ok) throw new Error('Failed to refresh token. Please reconnect Google Drive.');

  const data = await res.json();
  tokens!.accessToken = data.access_token;
  tokens!.expiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
  saveTokens();
  return data.access_token;
}

async function getAccessToken(): Promise<string> {
  loadTokens();
  if (!tokens) throw new Error('Not connected. Please connect Google Drive first.');
  if (tokens.expiresAt <= Date.now()) return refreshAccessToken();
  return tokens.accessToken;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Uploads a file to Google Drive.
 *   • < 5 MB  → single multipart request  (fast, simple)
 *   • ≥ 5 MB  → resumable chunked upload  (progress reported, survives interrupts)
 *
 * @param folderId  - Optional.  Overrides the saved folder ID.
 * @param onProgress - Called during large uploads with percentage.
 */
export async function uploadToDrive(
  file: File,
  folderId?: string | null,
  onProgress?: (progress: UploadProgress) => void
): Promise<DriveFile> {
  const token = await getAccessToken();
  const targetFolder = folderId ?? getDriveFolderId() ?? undefined;

  return file.size < 5 * 1024 * 1024
    ? simpleUpload(file, token, targetFolder)
    : resumableUpload(file, token, targetFolder, onProgress);
}

async function simpleUpload(file: File, token: string, folderId?: string): Promise<DriveFile> {
  const metadata: Record<string, unknown> = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
  };
  if (folderId) metadata.parents = [folderId];

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch(
    `${DRIVE_API}/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink,createdTime`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Upload failed: ${err.error?.message ?? 'Unknown error'}`);
  }
  return res.json();
}

async function resumableUpload(
  file: File,
  token: string,
  folderId: string | undefined,
  onProgress?: (progress: UploadProgress) => void
): Promise<DriveFile> {
  const metadata: Record<string, unknown> = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
  };
  if (folderId) metadata.parents = [folderId];

  // 1. Initiate — get session URI
  const initRes = await fetch(`${DRIVE_API}/files?uploadType=resumable`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Type': file.type || 'application/octet-stream',
      'X-Upload-Content-Length': String(file.size),
    },
    body: JSON.stringify(metadata),
  });

  if (!initRes.ok) throw new Error('Failed to start resumable upload.');
  const sessionUri = initRes.headers.get('location')!;

  // 2. Upload in 2 MB chunks
  const CHUNK = 2 * 1024 * 1024;
  let uploaded = 0;

  while (uploaded < file.size) {
    const end = Math.min(uploaded + CHUNK, file.size);
    const chunk = file.slice(uploaded, end);

    const res = await fetch(sessionUri, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes ${uploaded}-${end - 1}/${file.size}`,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: chunk,
    });

    uploaded = end;
    onProgress?.({
      bytesUploaded: uploaded,
      totalBytes: file.size,
      percentage: Math.round((uploaded / file.size) * 100),
    });

    if (res.status === 200 || res.status === 201) return res.json();
    if (res.status !== 308) throw new Error(`Upload chunk failed (status ${res.status}).`);
  }

  throw new Error('Resumable upload ended without a completion response.');
}

/**
 * Makes a Drive file publicly viewable and returns its direct URL.
 */
export async function getPublicUrl(fileId: string): Promise<string> {
  const token = await getAccessToken();

  // Grant public read
  await fetch(`${DRIVE_API}/files/${fileId}/permissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });

  const res = await fetch(`${DRIVE_API}/files/${fileId}?fields=webViewLink,webContentLink`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.webContentLink || data.webViewLink;
}

/**
 * Lists files inside a Drive folder.
 */
export async function listFilesInFolder(folderId: string): Promise<DriveFile[]> {
  const token = await getAccessToken();
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);

  const res = await fetch(
    `${DRIVE_API}/files?q=${q}&fields=files(id,name,mimeType,size,webViewLink,createdTime)&orderBy=createdTime desc`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error('Failed to list files.');
  const data = await res.json();
  return data.files ?? [];
}

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

function generateVerifier(): string {
  const arr = new Uint8Array(48);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replace(/[+/=]/g, '');
}

async function generateChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/[+/=]/g, '');
}
