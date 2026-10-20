import { Router } from 'express';
import { parseInput } from './validation';
import { ok } from './types';
import { authenticatedUser, requireUser } from '../middleware/user-auth.middleware';
import { UserService, userLoginSchema, userRegisterSchema } from '../services/user.service';

/** 挂载于 /api/v1/users。 */
export function createUserRoutes(users: UserService): Router {
  const routes = Router();
  routes.post('/register', async (req, res) => {
    const input = parseInput(userRegisterSchema, req.body);
    res.status(201).json(ok(await users.register(input), '注册成功'));
  });
  routes.post('/login', async (req, res) => {
    const input = parseInput(userLoginSchema, req.body);
    res.json(ok(await users.login(input), '登录成功'));
  });
  routes.get('/me', requireUser(users), (_req, res) => {
    res.json(ok(authenticatedUser(res)));
  });
  return routes;
}
