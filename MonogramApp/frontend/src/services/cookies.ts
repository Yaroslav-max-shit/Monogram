// Ключ для шифрования
const ENCRYPTION_KEY = 'monogram-secure-key-2024-!@#$%^&*()';

// Преобразуем строковый ключ в CryptoKey
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
      salt: encoder.encode('monogram-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// Шифрование
const encrypt = async (text: string): Promise<string> => {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(text)
  );
  
  // Возвращаем iv + зашифрованные данные
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
};

// Дешифрование
const decrypt = async (text: string): Promise<string> => {
  try {
    const key = await getKey();
    const combined = Uint8Array.from(atob(text), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('❌ Ошибка дешифрования:', error);
    return '';
  }
};

// Установка зашифрованной куки
const setEncryptedCookie = async (name: string, value: string, days: number = 30) => {
  try {
    const encrypted = await encrypt(value);
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(encrypted)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
  } catch (error) {
    console.error('❌ Ошибка шифрования куки:', error);
  }
};

// Получение и расшифровка куки
const getEncryptedCookie = async (name: string): Promise<string | null> => {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    if (!match) return null;
    
    const encrypted = decodeURIComponent(match[1]);
    const decrypted = await decrypt(encrypted);
    return decrypted || null;
  } catch (error) {
    console.error('❌ Ошибка чтения куки:', error);
    return null;
  }
};

// Удаление куки
const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; Secure`;
};

// ============================================
// СОХРАНЕНИЕ И ЗАГРУЗКА СЕССИИ
// ============================================

// Сохранить сессию
export const saveSession = async (
    token: string, 
    user: { 
        id: number; 
        username: string; 
        firstName: string;
        lastName?: string;
        avatar_url?: string;
    }
) => {
    // console.log('🔐 Сохраняю сессию (шифрую)...');
    
    // Сохраняем в зашифрованные куки
    await setEncryptedCookie('token', token);
    await setEncryptedCookie('user', JSON.stringify(user));
    
    // Дублируем в localStorage (тоже шифруем)
    try {
        const encryptedToken = await encrypt(token);
        const encryptedUser = await encrypt(JSON.stringify(user));
        localStorage.setItem('monogram_token', encryptedToken);
        localStorage.setItem('monogram_user', encryptedUser);
    } catch (error) {
        console.error('❌ Ошибка сохранения в localStorage:', error);
    }
    
    // console.log('✅ Сессия сохранена (зашифрована)');
};

// Получить сессию
export const getSession = async (): Promise<{ token: string; user: any } | null> => {
    try {
        // console.log('🔓 Загружаю сессию (расшифровываю)...');
        
        // Пробуем из localStorage (быстрее)
        let encryptedToken = localStorage.getItem('monogram_token');
        let encryptedUser = localStorage.getItem('monogram_user');
        
        if (encryptedToken && encryptedUser) {
            try {
                const token = await decrypt(encryptedToken);
                const userStr = await decrypt(encryptedUser);
                if (token && userStr) {
                    const user = JSON.parse(userStr);
                    return { token, user };
                }
            } catch (error) {
                console.warn('Не удалось расшифровать localStorage:', error);
            }
        }
        
        // Пробуем из куки
        const cookieToken = await getEncryptedCookie('token');
        const cookieUserStr = await getEncryptedCookie('user');
        
        if (cookieToken && cookieUserStr) {
            try {
                const token = cookieToken;
                const user = JSON.parse(cookieUserStr);
                
                // Восстанавливаем в localStorage
                if (!encryptedToken) {
                    localStorage.setItem('monogram_token', await encrypt(token));
                    localStorage.setItem('monogram_user', await encrypt(cookieUserStr));
                }
                
                return { token, user };
            } catch (error) {
                console.error('Ошибка парсинга пользователя:', error);
            }
        }
        
        return null;
    } catch (error) {
        console.error('❌ Ошибка загрузки сессии:', error);
        return null;
    }
};

// Удалить сессию (выход)
export const clearSession = () => {
    // console.log('🗑️ Очищаю сессию...');
    
    // Удаляем куки
    deleteCookie('token');
    deleteCookie('user');
    
    // Удаляем localStorage
    localStorage.removeItem('monogram_token');
    localStorage.removeItem('monogram_user');
    localStorage.removeItem('monogram_settings');
    
    // console.log('✅ Сессия очищена');
};

// Сохранить настройки (без шифрования — не критично)
export const saveSettings = (settings: any) => {
    localStorage.setItem('monogram_settings', JSON.stringify(settings));
};

// Получить настройки
export const getSettings = () => {
    try {
        const saved = localStorage.getItem('monogram_settings');
        return saved ? JSON.parse(saved) : { 
            darkMode: true, 
            fontSize: 14, 
            notifications: true, 
            sounds: true, 
            chatBackground: 'default' 
        };
    } catch {
        return { 
            darkMode: true, 
            fontSize: 14, 
            notifications: true, 
            sounds: true, 
            chatBackground: 'default' 
        };
    }
};