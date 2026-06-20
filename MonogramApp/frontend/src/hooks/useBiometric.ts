import { useState, useEffect, useCallback } from 'react';

interface BiometricState {
  isSupported: boolean;
  isEnabled: boolean;
  isAvailable: boolean;
  isMobile: boolean;
  deviceType: 'iphone' | 'android' | 'windows' | 'mac' | 'unknown';
  biometricType: 'face' | 'fingerprint' | 'iris' | 'none';
}

export const useBiometric = () => {
  const [state, setState] = useState<BiometricState>({
    isSupported: false,
    isEnabled: false,
    isAvailable: false,
    isMobile: false,
    deviceType: 'unknown',
    biometricType: 'none'
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // РћРїСЂРµРґРµР»РµРЅРёРµ СѓСЃС‚СЂРѕР№СЃС‚РІР°
  const detectDevice = useCallback((): { isMobile: boolean; deviceType: BiometricState['deviceType'] } => {
    const ua = navigator.userAgent;
    
    if (/iPhone|iPad|iPod/i.test(ua)) {
      return { isMobile: true, deviceType: 'iphone' };
    }
    if (/Android/i.test(ua)) {
      return { isMobile: true, deviceType: 'android' };
    }
    if (/Windows/i.test(ua)) {
      return { isMobile: false, deviceType: 'windows' };
    }
    if (/Mac/i.test(ua)) {
      return { isMobile: false, deviceType: 'mac' };
    }
    return { isMobile: false, deviceType: 'unknown' };
  }, []);

  // РћРїСЂРµРґРµР»РµРЅРёРµ С‚РёРїР° Р±РёРѕРјРµС‚СЂРёРё (СѓРїСЂРѕС‰С‘РЅРЅР°СЏ РїСЂРѕРІРµСЂРєР°)
  const detectBiometricType = useCallback((): BiometricState['biometricType'] => {
    const ua = navigator.userAgent;
    
    if (/iPhone|iPad/i.test(ua)) {
      return 'face';
    }
    if (/Android/i.test(ua)) {
      return 'fingerprint';
    }
    if (/Windows/i.test(ua) && (window as any).windows) {
      return 'fingerprint';
    }
    return 'none';
  }, []);

  // РџСЂРѕРІРµСЂРєР° РїРѕРґРґРµСЂР¶РєРё Р±РёРѕРјРµС‚СЂРёРё
  const checkSupport = useCallback(async () => {
    const { isMobile, deviceType } = detectDevice();
    const biometricType = detectBiometricType();
    // РќР° РІРµР±Рµ Р±РёРѕРјРµС‚СЂРёСЏ СЂР°Р±РѕС‚Р°РµС‚ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· WebAuthn, С‡С‚Рѕ СЃР»РѕР¶РЅРѕ, РїРѕСЌС‚РѕРјСѓ РїРѕРєР° РѕС‚РєР»СЋС‡Р°РµРј
    const isSupported = false; // РћС‚РєР»СЋС‡Р°РµРј Р±РёРѕРјРµС‚СЂРёСЋ РЅР° РІРµР±Рµ
    
    setState(prev => ({
      ...prev,
      isSupported,
      isAvailable: isSupported,
      isMobile,
      deviceType,
      biometricType
    }));
  }, [detectDevice, detectBiometricType]);

  // Р—Р°РіСЂСѓР·РєР° РЅР°СЃС‚СЂРѕРµРє
  useEffect(() => {
    checkSupport();
    
    const saved = localStorage.getItem('biometric_enabled');
    setState(prev => ({ ...prev, isEnabled: saved === 'true' }));
  }, [checkSupport]);

  // РђСѓС‚РµРЅС‚РёС„РёРєР°С†РёСЏ (Р·Р°РіР»СѓС€РєР°, С‚Р°Рє РєР°Рє РЅР° РІРµР±Рµ Р±РёРѕРјРµС‚СЂРёСЏ РЅРµ СЂР°Р±РѕС‚Р°РµС‚)
  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !state.isEnabled) {
      return true;
    }
    
    setIsAuthenticating(true);
    
    // РќР° РІРµР±Рµ Р±РёРѕРјРµС‚СЂРёСЏ РЅРµ СЂР°Р±РѕС‚Р°РµС‚, РїСЂРѕСЃС‚Рѕ Р·Р°РїСЂР°С€РёРІР°РµРј PIN
    const pin = prompt('Р’РІРµРґРёС‚Рµ PIN-РєРѕРґ РґР»СЏ РІС…РѕРґР°:');
    const success = pin === localStorage.getItem('user_pin');
    
    setIsAuthenticating(false);
    return success;
  }, [state.isSupported, state.isEnabled]);

  // Р’РєР»СЋС‡РµРЅРёРµ/РІС‹РєР»СЋС‡РµРЅРёРµ Р±РёРѕРјРµС‚СЂРёРё
  const toggle = useCallback(async () => {
    const newValue = !state.isEnabled;
    
    if (newValue && state.isSupported) {
      const pin = prompt('РЎРѕР·РґР°Р№С‚Рµ PIN-РєРѕРґ РґР»СЏ РІС…РѕРґР° (Р·Р°РїР°СЃРЅРѕР№ РІР°СЂРёР°РЅС‚):');
      if (pin && pin.length >= 4) {
        localStorage.setItem('user_pin', pin);
      } else {
        return;
      }
    } else if (!newValue) {
      localStorage.removeItem('user_pin');
    }
    
    setState(prev => ({ ...prev, isEnabled: newValue }));
    localStorage.setItem('biometric_enabled', String(newValue));
  }, [state.isSupported, state.isEnabled]);

  const reset = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: false }));
    localStorage.removeItem('biometric_enabled');
    localStorage.removeItem('user_pin');
  }, []);

  return {
    ...state,
    isAuthenticating,
    authenticate,
    toggle,
    reset,
    isBiometricAvailable: state.isSupported && state.isAvailable,
    canUseBiometric: state.isSupported && state.isEnabled
  };
};

export default useBiometric;
