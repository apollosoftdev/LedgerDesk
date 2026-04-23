import CryptoJS from 'crypto-js';
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import { deleteSetting, getSetting, setSetting } from './settings';

// These MUST match the Windows LedgerDesk.KeyGen / LicenseService salts byte-for-byte.
const SALT = 'LedgerDesk-2026-License-Salt';
const SN_SALT = 'LedgerDesk-2026-SN-Salt';

const SN_KEY = 'license_sn_source';         // raw device id we hash into the SN
const CHALLENGE_KEY = 'license_challenge';
const LICENSE_KEY = 'license_key';

/** Returns the HMAC-SHA256 of `data` (string) keyed by `key` (string), as a byte array. */
function hmacSha256Bytes(key: string, data: string): number[] {
  const wa = CryptoJS.HmacSHA256(data, key);
  const hex = wa.toString(CryptoJS.enc.Hex); // 64 hex chars
  const out: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    out.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return out;
}

/**
 * Stable per-install device id. Preference order:
 *   1. Android ID (ANDROID_ID, 64-bit hex) from expo-application
 *   2. Cached random id we persist on first run (survives as long as the app is installed)
 * The raw value is never shown to the user — it's folded through HMAC to form the SN.
 */
async function getRawDeviceId(): Promise<string> {
  const cached = await getSetting(SN_KEY);
  if (cached) return cached;

  let raw: string | null = null;
  try {
    raw = Application.getAndroidId();
  } catch {
    raw = null;
  }
  if (!raw) {
    const rand = await Crypto.getRandomBytesAsync(16);
    raw = Array.from(rand).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  raw = raw.toUpperCase().replace(/[^A-F0-9]/g, '');
  await setSetting(SN_KEY, raw);
  return raw;
}

/** Matches C# LicenseService.GenerateSerialNumber exactly. */
export function generateSerialNumber(deviceIdRaw: string): string {
  const normalized = deviceIdRaw.toUpperCase().replace(/[-:]/g, '');
  const bytes = hmacSha256Bytes(SN_SALT, normalized);
  let sb = '';
  for (let i = 0; i < 8; i++) {
    sb += bytes[i].toString(16).padStart(2, '0').toUpperCase();
    if (i % 2 === 1 && i < 7) sb += '-';
  }
  return sb;
}

export async function getSerialNumber(): Promise<string> {
  const raw = await getRawDeviceId();
  return generateSerialNumber(raw);
}

/** Matches C# LicenseService.GenerateKey exactly. */
export function generateKey(serialNumber: string, challenge: string): string {
  const input = serialNumber.toUpperCase().replace(/-/g, '') + ':' + challenge;
  const bytes = hmacSha256Bytes(SALT, input);
  let sb = '';
  for (let i = 0; i < 25; i++) {
    sb += String(bytes[i % bytes.length] % 10);
    if (i % 5 === 4 && i < 24) sb += '-';
  }
  return sb;
}

async function generateChallenge(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(4);
  let n = 0;
  for (let i = 0; i < 4; i++) n = (n << 8) | bytes[i];
  // 1000..9999 — matches RandomNumberGenerator.GetInt32(1000, 10000) in C#.
  const code = ((n >>> 0) % 9000) + 1000;
  const s = String(code);
  await setSetting(CHALLENGE_KEY, s);
  return s;
}

export async function getOrCreateChallenge(): Promise<string> {
  const existing = await getSetting(CHALLENGE_KEY);
  if (existing) return existing;
  return generateChallenge();
}

export async function validateKey(input: string): Promise<boolean> {
  const sn = await getSerialNumber();
  const challenge = await getOrCreateChallenge();
  const expected = generateKey(sn, challenge);
  return input.trim() === expected;
}

export async function isActivated(): Promise<boolean> {
  const stored = await getSetting(LICENSE_KEY);
  if (!stored) return false;
  const sn = await getSerialNumber();
  const challenge = (await getSetting(CHALLENGE_KEY)) ?? '';
  if (!challenge) return false;
  return stored === generateKey(sn, challenge);
}

export async function activate(key: string): Promise<boolean> {
  if (!(await validateKey(key))) return false;
  await setSetting(LICENSE_KEY, key.trim());
  return true;
}

export async function deactivate(): Promise<void> {
  await deleteSetting(LICENSE_KEY);
  await deleteSetting(CHALLENGE_KEY);
}

export async function getStoredKey(): Promise<string | null> {
  return getSetting(LICENSE_KEY);
}
