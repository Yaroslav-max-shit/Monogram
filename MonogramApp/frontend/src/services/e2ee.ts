// Combined E2EE service - existing functions + new E2EEService class

let currentUserId: number | null = null;

export async function initE2EE(userId: number): Promise<boolean> {
  try {
    currentUserId = userId;
    await e2ee.generateKeyPair(String(userId));
    localStorage.setItem('e2ee_initialized', 'true');
    return true;
  } catch {
    return false;
  }
}

export function isE2EEEnabled(chatId: number): boolean {
  return localStorage.getItem(`e2ee_chat_${chatId}`) === 'enabled';
}

export function loadE2EESettings(): { enabled: boolean } {
  return { enabled: localStorage.getItem('e2ee_initialized') === 'true' };
}

export function setE2EEEnabled(chatId: number, enabled: boolean): void {
  localStorage.setItem(`e2ee_chat_${chatId}`, enabled ? 'enabled' : 'disabled');
}

export function resetE2EEKeys(): void {
  localStorage.removeItem('e2ee_initialized');
}

export async function encryptMessageForChat(chatId: number, text: string): Promise<string> {
  const key = localStorage.getItem(`e2ee_key_${chatId}`);
  if (!key) return text;
  try {
    const result = await e2ee.encrypt(key, text);
    return JSON.stringify(result);
  } catch {
    return text;
  }
}

export async function decryptMessageFromChat(chatId: number, payload: string): Promise<string> {
  try {
    const parsed = JSON.parse(payload);
    if (!parsed.iv || !parsed.ciphertext) return payload;
    const key = localStorage.getItem(`e2ee_key_${chatId}`);
    if (!key) return payload;
    return await e2ee.decrypt(key, parsed.iv, parsed.ciphertext);
  } catch {
    return payload;
  }
}

// New E2EEService class (Signal Protocol-like)
class E2EEService {
  private keyPairs: Map<string, CryptoKeyPair> = new Map();
  private sharedSecrets: Map<string, CryptoKey> = new Map();

  async generateKeyPair(userId: string): Promise<CryptoKeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true, ['deriveKey', 'deriveBits']
    );
    this.keyPairs.set(userId, keyPair);
    return keyPair;
  }

  async deriveSharedSecret(myId: string, theirPublicKey: JsonWebKey): Promise<CryptoKey> {
    const myKeyPair = this.keyPairs.get(myId);
    if (!myKeyPair) throw new Error('No key pair for ' + myId);
    const theirKey = await crypto.subtle.importKey(
      'jwk', theirPublicKey,
      { name: 'ECDH', namedCurve: 'P-256' },
      false, ['deriveKey']
    );
    const sharedSecret = await crypto.subtle.deriveKey(
      { name: 'ECDH', public: theirKey },
      myKeyPair.privateKey,
      { name: 'AES-GCM', length: 256 },
      false, ['encrypt', 'decrypt']
    );
    const pairId = [myId, theirPublicKey.x].sort().join(':');
    this.sharedSecrets.set(pairId, sharedSecret);
    return sharedSecret;
  }

  async encrypt(peerId: string, plaintext: string): Promise<{ iv: string; ciphertext: string }> {
    const secret = this.sharedSecrets.get(peerId);
    if (!secret) throw new Error('No shared secret for ' + peerId);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, secret, encoded);
    return {
      iv: btoa(String.fromCharCode(...iv)),
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
    };
  }

  async decrypt(peerId: string, iv: string, ciphertext: string): Promise<string> {
    const secret = this.sharedSecrets.get(peerId);
    if (!secret) throw new Error('No shared secret for ' + peerId);
    const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    const ctBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, secret, ctBytes);
    return new TextDecoder().decode(plaintext);
  }

  async exportPublicKey(userId: string): Promise<JsonWebKey | null> {
    const keyPair = this.keyPairs.get(userId);
    if (!keyPair) return null;
    return await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  }

  hasKeyPair(userId: string): boolean {
    return this.keyPairs.has(userId);
  }

  hasSharedSecret(peerId: string): boolean {
    return this.sharedSecrets.has(peerId);
  }
}

export const e2ee = new E2EEService();

export default {
  initE2EE,
  encryptMessageForChat,
  decryptMessageFromChat,
  isE2EEEnabled,
  loadE2EESettings,
  setE2EEEnabled,
  resetE2EEKeys,
  e2ee,
};