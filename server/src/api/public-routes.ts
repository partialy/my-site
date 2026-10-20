import { Router } from 'express';
import { parseInput } from './validation';
import { ok } from './types';
import { FileService, fileIdSchema } from '../services/file.service';
import { SiteSettingsService, siteTargetSchema } from '../services/site-settings.service';
import { VisitService, visitInputSchema } from '../services/visit.service';

export function createPublicRoutes(siteSettings: SiteSettingsService, files: FileService, visits: VisitService): Router {
  const routes = Router();

  routes.get('/site-settings', (_req, res) => {
    res.json(ok(siteSettings.get()));
  });

  routes.get('/site-settings/:target/icon', async (req, res) => {
    const target = parseInput(siteTargetSchema, req.params.target);
    const icon = await siteSettings.readIcon(target);
    res.set('Content-Type', icon.mime);
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cache-Control', 'no-cache');
    res.send(icon.bytes);
  });

  routes.get('/files/:id/content', async (req, res) => {
    const { item, bytes } = await files.read(parseInput(fileIdSchema, req.params.id));
    res.set('Content-Type', item.mimeType);
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Content-Length', String(item.size));
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(bytes);
  });

  routes.post('/visits', (req, res) => {
    const input = parseInput(visitInputSchema, req.body);
    const result = visits.record(input, {
      ip: req.ip ?? null,
      userAgent: req.get('user-agent')?.slice(0, 500) ?? null,
    });
    res.status(result.recorded ? 201 : 200).json(ok(result));
  });

  return routes;
}
