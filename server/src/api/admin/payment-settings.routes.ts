import { Router } from 'express';
import { parseInput } from '../validation';
import { ok } from '../types';
import { requireAuth } from '../../middleware/auth.middleware';
import { AuthService } from '../../services/auth.service';
import {
  PaymentSettingsService, alipaySettingsSchema, wechatPaySettingsSchema,
} from '../../services/payment-settings.service';

export function createPaymentSettingsRoutes(auth: AuthService, settings: PaymentSettingsService): Router {
  const routes = Router();
  routes.use(requireAuth(auth));

  routes.get('/alipay', (_req, res) => res.json(ok(settings.getAlipay())));
  routes.put('/alipay', (req, res) => {
    res.json(ok(settings.updateAlipay(parseInput(alipaySettingsSchema, req.body)), '支付宝设置已保存'));
  });

  routes.get('/wechat', (_req, res) => res.json(ok(settings.getWechat())));
  routes.put('/wechat', (req, res) => {
    res.json(ok(settings.updateWechat(parseInput(wechatPaySettingsSchema, req.body)), '微信支付设置已保存'));
  });
  return routes;
}
