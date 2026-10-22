import { Router } from 'express';
import { parseInput } from '../validation';
import { ok } from '../types';
import { requireAuth } from '../../middleware/auth.middleware';
import { AuthService } from '../../services/auth.service';
import { UserService, userIdSchema, userListQuerySchema, userProfileSchema, userRegisterSchema, userStatusSchema } from '../../services/user.service';

/** 挂载于 /api/v1/admin/users。 */
export function createAdminUserRoutes(auth: AuthService, users: UserService): Router {
  const routes = Router();
  routes.use(requireAuth(auth));
  routes.get('/', (req, res) => {
    res.json(ok(users.list(parseInput(userListQuerySchema, req.query))));
  });
  routes.post('/', async (req, res) => {
    const input = parseInput(userRegisterSchema, req.body);
    const user = await users.register(input);
    res.locals.operationTargetId = String(user.id);
    res.status(201).json(ok(user, '用户已注册'));
  });
  routes.get('/:id', (req, res) => {
    res.json(ok(users.detail(parseInput(userIdSchema, req.params.id))));
  });
  routes.put('/:id/profile', (req, res) => {
    const id = parseInput(userIdSchema, req.params.id);
    const input = parseInput(userProfileSchema, req.body);
    res.json(ok(users.updateProfile(id, input), '用户资料已更新'));
  });
  routes.put('/:id/status', (req, res) => {
    const id = parseInput(userIdSchema, req.params.id);
    const { status } = parseInput(userStatusSchema, req.body);
    res.json(ok(users.setStatus(id, status), status === 'disabled' ? '用户已禁用' : '用户已启用'));
  });
  return routes;
}
