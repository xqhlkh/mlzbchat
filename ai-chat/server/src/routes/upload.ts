import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { extractTextContent, isImageType, encodeImageBase64, cleanupTempFile } from '../utils/file-handler';
import { config } from '../config';

const router = Router();
const uploadDir = path.join(os.tmpdir(), 'ai-chat-uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage, limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (_req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`不支持的文件类型: ${file.mimetype}`));
  },
});

router.post('/file', upload.array('files', 10), (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) return res.status(400).json({ error: '请选择要上传的文件' });
  try {
    const results = files.map(file => {
      const isImage = isImageType(file.mimetype);
      const content = isImage ? '' : extractTextContent(file.path, file.mimetype);
      const result: any = { name: file.originalname, size: file.size, mimeType: file.mimetype, content, isImage };
      if (isImage) { result.imageBase64 = encodeImageBase64(file.path); result.content = `[图片文件: ${file.originalname}]`; }
      cleanupTempFile(file.path);
      return result;
    });
    res.json({ files: results });
  } catch (err: any) {
    for (const f of files) cleanupTempFile(f.path);
    res.status(500).json({ error: err.message || '文件处理失败' });
  }
});

export default router;
