import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  JWT_SECRET: z.string().min(32).refine((value) => !value.startsWith('replace-with-')),
  SETUP_KEY: z.string().min(16).refine((value) => !value.startsWith('replace-with-')),
  SQLITE_PATH: z.string().min(1).default('./data/framework.sqlite'),
  ADMIN_ORIGIN: z.url(),
});

export type AppConfig = {
  port: number;
  jwtSecret: string;
  setupKey: string;
  sqlitePath: string;
  adminOrigin: string;
};

export function loadConfig(): AppConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const names = parsed.error.issues.map((issue) => issue.path.join('.'));
    throw new Error(`环境变量配置无效：${[...new Set(names)].join('、')}`);
  }

  return {
    port: parsed.data.PORT,
    jwtSecret: parsed.data.JWT_SECRET,
    setupKey: parsed.data.SETUP_KEY,
    sqlitePath: path.resolve(parsed.data.SQLITE_PATH),
    adminOrigin: parsed.data.ADMIN_ORIGIN.replace(/\/$/, ''),
  };
}
