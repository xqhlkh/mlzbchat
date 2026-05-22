import fs from 'fs';
import path from 'path';

export function extractTextContent(filePath: string, mimeType: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const textExts = ['.txt', '.md', '.json', '.csv', '.html', '.css', '.js', '.ts', '.py', '.java', '.xml', '.yaml', '.yml'];
  if (textExts.includes(ext) || mimeType.startsWith('text/') || mimeType === 'application/json') {
    const c = fs.readFileSync(filePath, 'utf-8');
    return c.length > 50000 ? c.substring(0, 50000) + '\n\n(文件过大，已截断)' : c;
  }
  try {
    const c = fs.readFileSync(filePath, 'utf-8');
    return c.length > 50000 ? c.substring(0, 50000) + '\n\n(文件过大，已截断)' : c;
  } catch { return `[文件: ${path.basename(filePath)}] - 无法读取`; }
}

export function isImageType(mimeType: string): boolean { return mimeType.startsWith('image/'); }
export function encodeImageBase64(filePath: string): string { return fs.readFileSync(filePath).toString('base64'); }
export function cleanupTempFile(filePath: string): void { try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {} }
