import fs from 'fs';
import path from 'path';

export interface ProcessedFile {
  filename: string;
  mimeType: string;
  size: number;
  textContent: string;
  isImage: boolean;
  imageBase64?: string;
}

export function extractTextContent(filePath: string, mimeType: string): string {
  const ext = path.extname(filePath).toLowerCase();

  const textTypes = ['.txt', '.md', '.json', '.csv', '.html', '.css', '.js', '.ts', '.py', '.java', '.xml', '.yaml', '.yml'];
  if (textTypes.includes(ext) || mimeType.startsWith('text/') || mimeType === 'application/json') {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.length > 50000 ? content.substring(0, 50000) + '\n\n(文件过大，已截断)' : content;
  }

  const unsupported = ['.pdf', '.docx', '.xlsx', '.pptx', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
  if (unsupported.includes(ext)) {
    return `[文件: ${path.basename(filePath)}] - 此文件类型需要通过专门的解析器处理`;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.length > 50000 ? content.substring(0, 50000) + '\n\n(文件过大，已截断)' : content;
  } catch {
    return `[文件: ${path.basename(filePath)}] - 无法读取此文件`;
  }
}

export function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function encodeImageBase64(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return data.toString('base64');
}

export function cleanupTempFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // ignore
  }
}
