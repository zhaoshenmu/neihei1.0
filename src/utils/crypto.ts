/**
 * crypto.ts
 *
 * 轻量级 API Key 加密工具
 * 使用 Web Crypto API（AES-GCM）在浏览器端加密/解密
 *
 * 加密密钥由设备指纹 + 固定 salt 派生，
 * 同一台机器可解密，跨设备无法解密（自动清空）
 *
 * 加密格式：encrypted:base64(iv+ciphertext)
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const SALT = 'NeiHeiKeyStore_v1';
const PREFIX = 'encrypted:';

/** 生成设备指纹（用于派生加密密钥） */
async function getDeviceFingerprint(): Promise<string> {
  // 组合多个浏览器特征
  const traits = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    screen.width,
    screen.height,
    screen.colorDepth,
    // 使用 navigator.mediaDevices 的 deviceId 需要权限，不强制
  ];
  const raw = traits.join('|||');
  const encoder = new TextEncoder();
  const data = encoder.encode(raw + SALT);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** 从主密钥派生 AES 密钥 */
async function deriveKey(masterKey: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterKey),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * 加密 API Key
 * @param plaintext 明文 API Key
 * @returns 加密后的字符串（含 encrypted: 前缀）
 */
export async function encryptKey(plaintext: string): Promise<string> {
  if (!plaintext) return '';
  try {
    const fingerprint = await getDeviceFingerprint();
    const key = await deriveKey(fingerprint);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encoder.encode(plaintext),
    );
    // 合并 iv + ciphertext，base64 编码
    const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    const base64 = btoa(String.fromCharCode(...combined));
    return PREFIX + base64;
  } catch (err) {
    console.error('加密失败:', err);
    return '';
  }
}

/**
 * 解密 API Key
 * @param encrypted 加密后的字符串（含 encrypted: 前缀）
 * @returns 明文 API Key，解密失败返回 null
 */
export async function decryptKey(encrypted: string): Promise<string | null> {
  if (!encrypted) return null;
  if (!encrypted.startsWith(PREFIX)) return encrypted; // 非加密格式，直接返回
  try {
    const fingerprint = await getDeviceFingerprint();
    const key = await deriveKey(fingerprint);
    const base64 = encrypted.slice(PREFIX.length);
    const combined = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext,
    );
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.warn('解密失败（可能跨设备或密钥变更）:', err);
    return null;
  }
}

/**
 * 判断字符串是否为加密格式
 */
export function isEncrypted(str: string): boolean {
  return str.startsWith(PREFIX);
}
