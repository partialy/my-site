import type { FileItem } from '../../api/files';

export function isImage(file: FileItem): boolean {
  return file.mimeType.startsWith('image/');
}

export function acceptsMime(mime: string, accept?: string[]): boolean {
  if (!accept?.length) return true;
  const actual = mime === 'image/vnd.microsoft.icon' ? 'image/x-icon' : mime;
  return accept.some((allowed) => allowed === actual || allowed === mime ||
    (allowed.endsWith('/*') && actual.startsWith(allowed.slice(0, -1))));
}

export function formatFileSize(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
