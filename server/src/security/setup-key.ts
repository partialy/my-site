import { createHash, timingSafeEqual } from 'node:crypto';

export function verifySetupKey(provided: string, configured: string): boolean {
  const actual = createHash('sha256').update(provided).digest();
  const expected = createHash('sha256').update(configured).digest();
  return timingSafeEqual(actual, expected);
}
