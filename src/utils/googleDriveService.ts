/**
 * src/utils/googleDriveService.ts
 *
 * Google Drive API v3 client with server-side token exchange.
 * Uses Supabase Edge Function to keep client_secret secure.
 */

import { GOOGLE_CLIENT_ID } from '../config/googleConfig';
import { supabase } from '@/integrations/supabase/client';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const OAUTH_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
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
  expiresAt: number;
}

// ─── Token store ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'gdrive_tokens';
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

export function isGoogleDriveConnected(): boolean {
  loadTokens();
  return !!tokens && tokens.expiresAt > Date.now();
}

export function setDriveFolderId(id: string): void {
  localStorage.setItem(FOLDER_KEY, id);
}

export function getDriveFolderId(): string | null {
  return localStorage.getItem(FOLDER_KEY);
}

export function disconnectGoogleDrive(): void {
  tokens = null;
  sessionStorage.removeItem(STORAGE_KEY);
}

// ─── OAuth flow ───────────────────────────────────────────────────────────────

export async function initGoogleDriveAuth(redirectUri: string): Promise<void> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      'Google Client ID is not set. Open src/config/googleConfig.ts and paste your Client ID.'
    );
  }

  // Validate redirect URI against the current origin to prevent open redirect
  const allowedOrigin = window.location.origin;
  if (!redirectUri.startsWith(allowedOrigin)) {
    throw new Error('Invalid redirect URI.');
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.file',
    access_type: 'offline',
    prompt: 'consent',
  });

  window.location.href = `${OAUTH_AUTH_URL}?${params}`;
}

export async function handleOAuthCallback(code: string, redirectUri: string): Promise<void> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('OAuth flow broken — missing client ID.');
  }

  // Call Supabase Edge Function to exchange code for tokens
  const { data, error } = await supabase.functions.invoke('google-oauth', {
    body: { code, redirectUri },
  });

  if (error || !data) {
    throw new Error(data?.error || error?.message || 'Token exchange failed');
  }

  tokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? undefined,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };

  saveTokens();
}

// ─── Token refresh ────────────────────────────────────────────────────────────

async function refreshAccessToken(): Promise<string> {
  if (!tokens?.refreshToken) {
    throw new Error('Session expired. Please reconnect Google Drive.');
  }

  // Refresh tokens also go through Edge Function for security
  const { data, error } = await supabase.functions.invoke('google-oauth-refresh', {
    body: { refreshToken: tokens.refreshToken },
  });

  if (error || !data) {
    throw new Error('Failed to refresh token. Please reconnect Google Drive.');
  }

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

export async function getPublicUrl(fileId: string): Promise<string> {
  const token = await getAccessToken();

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
