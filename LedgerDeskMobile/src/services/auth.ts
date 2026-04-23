import * as Crypto from 'expo-crypto';
import { getSetting, setSetting, deleteSetting } from './settings';

const SALT = 'LedgerDesk-Password-Salt';

async function hashPassword(password: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password + SALT,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
}

export async function isPasswordSet(): Promise<boolean> {
  const hash = await getSetting('password_hash');
  return !!hash && hash.length > 0;
}

export async function setPassword(password: string): Promise<void> {
  const hash = await hashPassword(password);
  await setSetting('password_hash', hash);
}

export async function verifyPassword(password: string): Promise<boolean> {
  const stored = await getSetting('password_hash');
  if (!stored) return false;
  const input = await hashPassword(password);
  return stored === input;
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
  if (!(await verifyPassword(oldPassword))) return false;
  await setPassword(newPassword);
  return true;
}

export async function clearPassword(): Promise<void> {
  await deleteSetting('password_hash');
}
