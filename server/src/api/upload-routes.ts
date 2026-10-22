import { Router, raw } from 'express';
import { parseInput } from './validation';
import { ok } from './types';
import { ApiError } from './api-error';
import { ApiCode } from './codes';
import { requestRateLimit } from '../middleware/rate-limit.middleware';
import { FileService, completeUploadSchema, fileMimeTypes, maxFileBytes, prepareUploadSchema,
  type FileMimeType } from '../services/file.service';

/** 挂载于公开 /api/v1/uploads，供管理端与业务前端共用。 */
export function createUploadRoutes(files: FileService): Router {
  const routes = Router();
  routes.post('/prepare', requestRateLimit(20, 60_000), (req, res) => {
    const input = files.uploadStrategy().strategy === 'qiniu'
      ? parseInput(prepareUploadSchema, req.body) : undefined;
    res.json(ok(files.prepareUpload(input)));
  });

  routes.post('/complete', requestRateLimit(20, 60_000), async (req, res) => {
    const item = await files.completeUpload(parseInput(completeUploadSchema, req.body));
    res.status(201).json(ok(item, '文件已上传'));
  });

  routes.post('/local', requestRateLimit(20, 60_000), raw({ type: () => true, limit: maxFileBytes }), async (req, res) => {
    const mime = req.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
    if (!fileMimeTypes.includes(mime as FileMimeType) || !Buffer.isBuffer(req.body)) {
      throw new ApiError(415, ApiCode.ValidationError, '不支持的文件类型', { fieldErrors: { file: ['只支持 PNG、JPEG、WebP、ICO、GIF、PDF'] } });
    }
    const encodedName = req.get('x-file-name');
    let name: string;
    try { name = encodedName ? decodeURIComponent(encodedName) : ''; }
    catch { throw new ApiError(400, ApiCode.ValidationError, '文件名编码无效', { fieldErrors: { name: ['文件名编码无效'] } }); }
    res.status(201).json(ok(await files.upload(name, mime as FileMimeType, req.body), '文件已上传'));
  });
  return routes;
}
