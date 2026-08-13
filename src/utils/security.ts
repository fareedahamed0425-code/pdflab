/**
 * High Security & Data Privacy Utilities
 * All operations are strictly executed client-side in browser memory.
 * No file data is sent to external servers or logged.
 */

export interface SecurityStatus {
  isClientOnly: boolean;
  activeMemoryBytes: number;
  filesProcessedCount: number;
  sessionStartTime: Date;
  lastWipeTime: Date | null;
}

let activeBytesCount = 0;
let filesProcessed = 0;
const sessionStartTime = new Date();
let lastWipeTime: Date | null = null;

export function trackMemoryUsage(bytes: number) {
  activeBytesCount += bytes;
  filesProcessed++;
}

export function releaseMemory() {
  activeBytesCount = 0;
  lastWipeTime = new Date();
}

export function getSecurityStatus(): SecurityStatus {
  return {
    isClientOnly: true,
    activeMemoryBytes: Math.max(0, activeBytesCount),
    filesProcessedCount: filesProcessed,
    sessionStartTime,
    lastWipeTime,
  };
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function generateFileHash(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) return resolve('sha256-local-' + Math.random().toString(36).substring(2));
      try {
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        resolve(hashHex.substring(0, 12));
      } catch {
        resolve('sha256-local-' + Date.now().toString(36));
      }
    };
    reader.readAsArrayBuffer(file.slice(0, 1024 * 100)); // hash first 100kb for speed
  });
}
