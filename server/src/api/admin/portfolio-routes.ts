import { Router } from 'express';
import { ok } from '../types';
import { parseInput } from '../validation';
import { requireAuth } from '../../middleware/auth.middleware';
import { AuthService } from '../../services/auth.service';
import {
  ProfileSettingsService,
  profileSettingsSchema,
} from '../../services/profile-settings.service';
import {
  adminWorkListQuerySchema,
  reorderWorksSchema,
  workInputSchema,
  WorkService,
  workUuidSchema,
} from '../../services/work.service';

export function createAdminPortfolioRoutes(
  auth: AuthService,
  works: WorkService,
  profileSettings: ProfileSettingsService,
): Router {
  const routes = Router();
  routes.use(requireAuth(auth));

  routes.get('/works', (req, res) => {
    const query = parseInput(adminWorkListQuerySchema, req.query);
    res.json(ok(works.listAdmin(query)));
  });

  routes.put('/works/reorder', (req, res) => {
    const { items } = parseInput(reorderWorksSchema, req.body);
    works.reorder(items);
    res.locals.operationTargetId = items.map((item) => item.uuid).join(',');
    res.json(ok(null, '作品排序已更新'));
  });

  routes.get('/works/:uuid', (req, res) => {
    const uuid = parseInput(workUuidSchema, req.params.uuid);
    res.json(ok(works.getAdminByUuid(uuid)));
  });

  routes.post('/works', (req, res) => {
    const input = parseInput(workInputSchema, req.body);
    const created = works.create(input);
    res.locals.operationTargetId = created.uuid;
    res.status(201).json(ok(created, '作品已创建'));
  });

  routes.put('/works/:uuid', (req, res) => {
    const uuid = parseInput(workUuidSchema, req.params.uuid);
    const input = parseInput(workInputSchema, req.body);
    const updated = works.update(uuid, input);
    res.locals.operationTargetId = updated.uuid;
    res.json(ok(updated, '作品已更新'));
  });

  routes.delete('/works/:uuid', (req, res) => {
    const uuid = parseInput(workUuidSchema, req.params.uuid);
    works.delete(uuid);
    res.locals.operationTargetId = uuid;
    res.json(ok(null, '作品已删除'));
  });

  routes.get('/profile-settings', (_req, res) => {
    res.json(ok(profileSettings.get()));
  });

  routes.put('/profile-settings', (req, res) => {
    const input = parseInput(profileSettingsSchema, req.body);
    res.json(ok(profileSettings.update(input), '主页配置已保存'));
  });

  return routes;
}
