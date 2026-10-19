import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(32);
  const hash = await scrypt(password, salt, KEY_LENGTH) as Buffer;
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, saltText, hashText] = encoded.split('$');
  if (algorithm !== 'scrypt' || !saltText || !hashText) return false;
  const salt = Buffer.from(saltText, 'base64url');
  const expected = Buffer.from(hashText, 'base64url');
  if (expected.length !== KEY_LENGTH || salt.length !== 32) return false;
  const actual = await scrypt(password, salt, KEY_LENGTH) as Buffer;
  return timingSafeEqual(actual, expected);
}
