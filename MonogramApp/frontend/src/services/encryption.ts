// ============================================
//   E2E ШИФРОВАНИЕ — AES-GCM 256-bit
// ============================================

const ENCRYPTION_KEY = 'monogram-e2e-key-2024-secure-v2-final';

// ============================================
//   УТИЛИТЫ ДЛЯ КОНВЕРТАЦИИ
// ============================================

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Получаем ключ шифрования
const getKey = async (): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('monogram-salt-v2'),
      iterations: 200000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// ============================================
//   ШИФРОВАНИЕ / ДЕШИФРОВАНИЕ ТЕКСТА (AES-GCM)
// ============================================

export const encryptMessage = async (plaintext: string): Promise<string> => {
  try {
    const key = await getKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    let binary = '';
    for (let i = 0; i < combined.length; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error('Ошибка шифрования:', error);
    return plaintext;
  }
};

export const decryptMessage = async (encryptedBase64: string): Promise<string> => {
  if (!encryptedBase64) return encryptedBase64;
  
  try {
    const key = await getKey();
    const binary = atob(encryptedBase64);
    const binaryLength = binary.length;
    const bytes = new Uint8Array(binaryLength);
    for (let i = 0; i < binaryLength; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    // Создаём ArrayBuffer для iv (первые 12 байт)
    const ivBuffer = new ArrayBuffer(12);
    const iv = new Uint8Array(ivBuffer);
    for (let i = 0; i < 12; i++) {
      iv[i] = bytes[i];
    }
    
    // Создаём ArrayBuffer для данных (остальные байты)
    const dataBuffer = new ArrayBuffer(binaryLength - 12);
    const data = new Uint8Array(dataBuffer);
    for (let i = 12; i < binaryLength; i++) {
      data[i - 12] = bytes[i];
    }
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      dataBuffer
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Ошибка расшифровки:', error);
    return encryptedBase64;
  }
};

// ============================================
//   ПРОСТОЕ XOR ШИФРОВАНИЕ ДЛЯ localStorage
// ============================================

export function encryptData(data: string, password: string): string {
  if (!data) return data;
  let result = '';
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ password.charCodeAt(i % password.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(result);
}

export function decryptData(encryptedData: string, password: string): string {
  if (!encryptedData) return encryptedData;
  try {
    const data = atob(encryptedData);
    let result = '';
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ password.charCodeAt(i % password.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch {
    return encryptedData;
  }
}

// ============================================
//   ШИФРОВАНИЕ / ДЕШИФРОВАНИЕ ФАЙЛОВ
// ============================================

export const encryptFile = async (file: File | Blob): Promise<{ encrypted: Blob; iv: Uint8Array }> => {
  try {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const fileBuffer = await file.arrayBuffer();
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      fileBuffer
    );
    
    return {
      encrypted: new Blob([encrypted], { type: 'application/octet-stream' }),
      iv
    };
  } catch (error) {
    console.error('Ошибка шифрования файла:', error);
    throw error;
  }
};

export const decryptFile = async (
  encryptedBlob: Blob, 
  iv: Uint8Array, 
  originalType: string = 'application/octet-stream'
): Promise<Blob> => {
  try {
    const key = await getKey();
    const encryptedBuffer = await encryptedBlob.arrayBuffer();
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      encryptedBuffer
    );
    
    return new Blob([decrypted], { type: originalType });
  } catch (error) {
    console.error('Ошибка расшифровки файла:', error);
    throw error;
  }
};

export const encryptFileToBase64 = async (file: File | Blob): Promise<string> => {
  try {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const fileBuffer = await file.arrayBuffer();
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      fileBuffer
    );

    const encryptedView = new Uint8Array(encrypted);
    const combined = new Uint8Array(iv.length + encryptedView.length);
    combined.set(iv, 0);
    combined.set(encryptedView, iv.length);
    
    let binary = '';
    for (let i = 0; i < combined.length; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error('Ошибка шифрования файла в base64:', error);
    throw error;
  }
};

export const decryptFileFromBase64 = async (
  base64Data: string, 
  originalType: string = 'application/octet-stream'
): Promise<Blob> => {
  try {
    const key = await getKey();
    const binaryString = atob(base64Data);
    const binaryLength = binaryString.length;
    const bytes = new Uint8Array(binaryLength);
    for (let i = 0; i < binaryLength; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const ivBuffer = new ArrayBuffer(12);
    const iv = new Uint8Array(ivBuffer);
    for (let i = 0; i < 12; i++) {
      iv[i] = bytes[i];
    }
    
    const dataBuffer = new ArrayBuffer(binaryLength - 12);
    for (let i = 12; i < binaryLength; i++) {
      const view = new Uint8Array(dataBuffer);
      view[i - 12] = bytes[i];
    }
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      dataBuffer
    );
    
    return new Blob([decrypted], { type: originalType });
  } catch (error) {
    console.error('Ошибка расшифровки файла из base64:', error);
    throw error;
  }
};

// ============================================
//   ШИФРОВАНИЕ / ДЕШИФРОВАНИЕ JSON
// ============================================

export const encryptJSON = async (data: object): Promise<string> => {
  const jsonString = JSON.stringify(data);
  return encryptMessage(jsonString);
};

export const decryptJSON = async <T = object>(encryptedData: string): Promise<T> => {
  const jsonString = await decryptMessage(encryptedData);
  return JSON.parse(jsonString) as T;
};

// ============================================
//   ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ
// ============================================

export const generateChatKey = async (): Promise<string> => {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const exported = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exported);
};

export const hashFile = async (file: File | Blob): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return arrayBufferToBase64(hash);
};

export const isEncrypted = (data: string): boolean => {
  if (!data || data.length < 24) return false;
  const trimmed = data.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('<')) return false;
  return /^[A-Za-z0-9+/=]+$/.test(trimmed);
};

// ============================================
//   ЭКСПОРТ
// ============================================

export default {
  encryptMessage,
  decryptMessage,
  encryptFile,
  decryptFile,
  encryptFileToBase64,
  decryptFileFromBase64,
  encryptJSON,
  decryptJSON,
  encryptData,
  decryptData,
  arrayBufferToBase64,
  generateChatKey,
  hashFile,
  isEncrypted,
};