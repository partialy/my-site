import { z } from 'zod';
import { ApiError } from './api-error';
import { ApiCode } from './codes';
import type { ValidationErrorData } from './types';

export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const fieldErrors: ValidationErrorData['fieldErrors'] = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? 'body');
    (fieldErrors[field] ??= []).push(issue.message);
  }
  throw new ApiError(400, ApiCode.ValidationError, '参数校验失败', { fieldErrors });
}
