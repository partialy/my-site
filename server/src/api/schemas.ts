import { z } from 'zod';

const username = z.string().min(3).max(32).regex(/^[A-Za-z0-9_]+$/, '只能使用字母、数字和下划线');
const password = z.string().min(12).max(128);

export const setupAdminSchema = z.strictObject({
  username,
  password,
  setupKey: z.string().min(1),
});

export const loginSchema = z.strictObject({ username, password });

export const changePasswordSchema = z.strictObject({
  oldPassword: z.string().min(1),
  newPassword: password,
}).refine((value) => value.oldPassword !== value.newPassword, {
  path: ['newPassword'],
  message: '新密码不能与原密码相同',
});

export type SetupAdminRequest = z.infer<typeof setupAdminSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
