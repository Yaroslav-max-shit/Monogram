import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeContext';
import Icon from './Icon';
import ProfileModal from './ProfileModal';
import apiClient from '../services/api';
import { setLanguage, t, getLanguage } from '../services/i18n';
import { isE2EEEnabled, setE2EEEnabled } from '../services/e2ee';
import './SettingsModal.css';
import { QRCodeSVG } from 'qrcode.react';
import QRScanner from './QRScanner';
import SessionManager from './Security/SessionManager';
import { disconnect } from '../services/socket';
import { clearSession } from '../services/cookies';
import StickerPackCreator from './Stickers/StickerPackCreator';
import { APP_ICONS, setAppIcon } from '../services/appIcon';
import { StorageInfo } from './StorageInfo';
import QuickReplies from './QuickReplies';
import { setCustomSound, resetCustomSound } from '../services/sounds';

interface SettingsModalProps {
  onClose: () => void;
  e2eeEnabled?: boolean;
  onToggleE2EE?: (enabled: boolean) => void;
  biometricSupported?: boolean;
  biometricEnabled?: boolean;
  onToggleBiometric?: () => void;
  isMobile?: boolean;
  isPremium?: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose, 
  e2eeEnabled: externalE2EE = true, 
  onToggleE2EE,
  biometricSupported = false,
  biometricEnabled = false,
  onToggleBiometric,
  isMobile = false,
  isPremium = false,
}) => {
  const { darkMode, toggleDarkMode, themeMode, setThemeMode, accentColor, setAccentColor } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [wallpapers, setWallpapers] = useState<any[]>([]);
  const [wallpaperLoading, setWallpaperLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [showStickerPackCreator, setShowStickerPackCreator] = useState(false);
  
  // Язык
  const [currentLanguage, setCurrentLanguage] = useState<string>(getLanguage());
  
  // Настройки
  const [readReceipts, setReadReceipts] = useState(true);
  const [lastSeenPrivacy, setLastSeenPrivacy] = useState<'everyone' | 'contacts' | 'nobody'>('everyone');
  const [phonePrivacy, setPhonePrivacy] = useState<'everyone' | 'contacts' | 'nobody'>('contacts');
  const [photoPrivacy, setPhotoPrivacy] = useState<'everyone' | 'contacts' | 'nobody'>('everyone');
  const [autoDownloadMedia, setAutoDownloadMedia] = useState(true);
  const [autoPlayGIFs, setAutoPlayGIFs] = useState(true);
  const [saveToGallery, setSaveToGallery] = useState(false);
  const [notificationSound, setNotificationSound] = useState('default');
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [messagePreview, setMessagePreview] = useState(true);
  const [showForwardedTag, setShowForwardedTag] = useState(true);
  const [showEditedTag, setShowEditedTag] = useState(true);
  const [doubleClickReaction, setDoubleClickReaction] = useState(true);
  const [typingIndicator, setTypingIndicator] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [spellCheck, setSpellCheck] = useState(true);
  const [autoCorrect, setAutoCorrect] = useState(true);
  const [suggestEmoji, setSuggestEmoji] = useState(true);
  const [suggestStickers, setSuggestStickers] = useState(true);
  const [linkPreview, setLinkPreview] = useState(true);
  const [cacheSize, setCacheSize] = useState(0);
  const [muteWhenOnline, setMuteWhenOnline] = useState(false);
  const [smartNotifications, setSmartNotifications] = useState(false);
  const [delayedRead, setDelayedRead] = useState(() => localStorage.getItem('delayed_read') === 'true');
  
  const [settings, setSettings] = useState({
    theme: 'dark',
    language: 'ru',
    fontSize: 14,
    scale: 100,
    notificationsEnabled: true,
    soundEnabled: true,
    animationsEnabled: true,
    wallpaper: 'default',
    customWallpapers: [],
  });

  useEffect(() => {
    loadUserData();
    loadSettings();
    loadWallpapers();
    loadCacheSize();
  }, []);

  const loadUserData = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      setUserData(res.data);
    } catch (error) {
      console.error('Ошибка загрузки пользователя:', error);
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/settings/');
      if (res.data) {
        setSettings(prev => ({ ...prev, ...res.data }));
        setReadReceipts(res.data.read_receipts ?? true);
        setLastSeenPrivacy(res.data.last_seen_privacy ?? 'everyone');
        setPhonePrivacy(res.data.phone_privacy ?? 'contacts');
        setPhotoPrivacy(res.data.photo_privacy ?? 'everyone');
        setAutoDownloadMedia(res.data.auto_download_media ?? true);
        setAutoPlayGIFs(res.data.auto_play_gifs ?? true);
        setSaveToGallery(res.data.save_to_gallery ?? false);
        setNotificationSound(res.data.notification_sound ?? 'default');
        setVibrationEnabled(res.data.vibration_enabled ?? true);
        setMessagePreview(res.data.message_preview ?? true);
        setShowForwardedTag(res.data.show_forwarded_tag ?? true);
        setShowEditedTag(res.data.show_edited_tag ?? true);
        setDoubleClickReaction(res.data.double_click_reaction ?? true);
        setTypingIndicator(res.data.typing_indicator ?? true);
        setOnlineStatus(res.data.online_status ?? true);
        setSpellCheck(res.data.spell_check ?? true);
        setAutoCorrect(res.data.auto_correct ?? true);
        setSuggestEmoji(res.data.suggest_emoji ?? true);
        setSuggestStickers(res.data.suggest_stickers ?? true);
        setLinkPreview(res.data.link_preview ?? true);
        setMuteWhenOnline(res.data.muteWhenOnline ?? false);
        setSmartNotifications(res.data.smartNotifications ?? false);
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCacheSize = async () => {
    try {
      const res = await apiClient.get('/settings/cache-size');
      setCacheSize(res.data.size || 0);
    } catch (error) {
      console.warn('Cache size endpoint not available yet');
      setCacheSize(0);
    }
  };

  const saveSettings = async (newSettings: any) => {
    setSaving(true);
    try {
      await apiClient.put('/settings/', newSettings);
      setSettings(prev => ({ ...prev, ...newSettings }));
      applySettings({ ...settings, ...newSettings });
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    } finally {
      setSaving(false);
    }
  };

  const applySettings = (newSettings: any) => {
    if (newSettings.theme === 'dark') {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode', 'amoled-mode');
      setThemeMode('dark');
    } else if (newSettings.theme === 'light') {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode', 'amoled-mode');
      setThemeMode('light');
    } else if (newSettings.theme === 'amoled') {
      document.body.classList.add('amoled-mode');
      document.body.classList.remove('dark-mode', 'light-mode');
      setThemeMode('amoled');
    } else if (newSettings.theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode', 'amoled-mode');
      } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode', 'amoled-mode');
      }
    } else if (newSettings.theme === 'high-contrast') {
      document.body.classList.add('high-contrast');
      document.body.classList.remove('dark-mode', 'light-mode', 'amoled-mode');
    }
    
    if (newSettings.accentColor) {
      setAccentColor(newSettings.accentColor);
    }
    
    if (newSettings.language) {
      setLanguage(newSettings.language as any);
      setCurrentLanguage(newSettings.language);
    }
    
    document.documentElement.style.fontSize = `${newSettings.fontSize}px`;
    
    if (newSettings.scale !== 100) {
      document.body.style.zoom = `${newSettings.scale / 100}`;
    } else {
      document.body.style.zoom = '';
    }
    
    localStorage.setItem('monogram_settings', JSON.stringify(newSettings));
  };

  const loadWallpapers = async () => {
    setWallpaperLoading(true);
    const builtIn = [
      { id: 'default', name: 'По умолчанию', preview: 'linear-gradient(135deg, #667eea, #764ba2)', type: 'gradient' },
      { id: 'dark', name: 'Тёмный', preview: '#1a1a2e', type: 'color' },
      { id: 'ocean', name: 'Океан', preview: 'linear-gradient(135deg, #0c3483, #a2b6df)', type: 'gradient' },
      { id: 'sunset', name: 'Закат', preview: 'linear-gradient(135deg, #f12711, #f5af19)', type: 'gradient' },
      { id: 'forest', name: 'Лес', preview: 'linear-gradient(135deg, #134e5e, #71b280)', type: 'gradient' },
      { id: 'night', name: 'Ночь', preview: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', type: 'gradient' },
    ];

    if (isPremium) {
      builtIn.push(
        { id: 'premium1', name: 'Золотой', preview: 'linear-gradient(135deg, #ffd700, #ff8c00)', type: 'gradient' },
        { id: 'premium2', name: 'Космос', preview: 'linear-gradient(135deg, #20002c, #cbb4d4)', type: 'gradient' },
      );
    }

    try {
      const res = await apiClient.get('/settings/wallpapers');
      const customItems = (res.data || []).map((url: string, i: number) => ({
        id: `custom_${i}`,
        name: `Мои обои ${i + 1}`,
        url,
        isCustom: true,
        preview: url,
        type: 'image'
      }));
      setWallpapers([...builtIn, ...customItems]);
    } catch (error) {
      setWallpapers(builtIn);
    }
    setWallpaperLoading(false);
  };

  const selectWallpaper = (wallpaper: any) => {
    if (wallpaper.isCustom && wallpaper.url) {
      saveSettings({ wallpaper: wallpaper.url });
    } else {
      saveSettings({ wallpaper: wallpaper.id });
    }
  };

  const uploadWallpaper = async (file: File) => {
    const formData = new FormData();
    formData.append('wallpaper', file);
    try {
      const res = await apiClient.post('/settings/wallpaper', formData);
      const newCustom = [...settings.customWallpapers, res.data.url];
      await saveSettings({ customWallpapers: newCustom });
      loadWallpapers();
    } catch (error) {
      alert('Ошибка загрузки обоев');
    }
  };

  const clearCache = async () => {
    if (confirm('Очистить кэш сообщений?')) {
      try {
        await apiClient.post('/settings/clear-cache');
        loadCacheSize();
      } catch (error) {
        alert('Ошибка очистки кэша');
      }
    }
  };

  const languages = [
    { code: 'ru', name: 'Русский', native: 'Русский', flag: '🇷🇺' },
    { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'uk', name: 'Українська', native: 'Українська', flag: '🇺🇦' },
    { code: 'be', name: 'Беларуская', native: 'Беларуская', flag: '🇧🇾' },
    { code: 'kk', name: 'Қазақша', native: 'Қазақша', flag: '🇰🇿' },
    { code: 'uz', name: 'Oʻzbekcha', native: 'Oʻzbekcha', flag: '🇺🇿' },
    { code: 'de', name: 'Deutsch', native: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', native: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', native: 'Español', flag: '🇪🇸' },
    { code: 'tr', name: 'Türkçe', native: 'Türkçe', flag: '🇹🇷' },
    { code: 'zh', name: '中文', native: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', native: 'العربية', flag: '🇸🇦' },
  ];

  const notificationSounds = [
    { id: 'default', name: 'Стандартный', icon: 'bell' },
    { id: 'bell', name: 'Колокольчик', icon: 'bell' },
    { id: 'ping', name: 'Пинг', icon: 'send' },
    { id: 'silent', name: 'Без звука', icon: 'volume-off' },
  ];

  const fontSizeOptions = [
    { value: 12, label: '12px', preview: 'Маленький' },
    { value: 14, label: '14px', preview: 'Стандартный' },
    { value: 16, label: '16px', preview: 'Средний' },
    { value: 18, label: '18px', preview: 'Крупный' },
    { value: 20, label: '20px', preview: 'Очень крупный' },
  ];

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getTitle = (): string => {
    const titles: Record<string, string> = {
      profile: 'Профиль',
      appearance: 'Оформление',
      notifications: 'Уведомления',
      privacy: 'Конфиденциальность',
      data: 'Данные и память',
      chats: 'Чаты',
      messages: 'Сообщения',
      stickers: 'Стикеры',
      language: 'Язык',
      wallpapers: 'Фон чата',
      sessions: 'Устройства',
      premium: 'Premium',
      sounds: 'Звуки',
      appicon: 'Иконка приложения',
      storage: 'Память',
      quickreplies: 'Быстрые ответы',
    };
    return titles[activeSection || ''] || 'Настройки';
  };

  const handleLanguageChange = (langCode: string) => {
    setCurrentLanguage(langCode as any);
    saveSettings({ language: langCode });
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="settings-modal-header">
            <button className="settings-close-btn" onClick={onClose}>✕</button>
            <h2>Настройки</h2>
            <div style={{ width: 36 }} />
          </div>
          <div className="settings-loading">
            <div className="loading-spinner" />
            <p>Загрузка настроек...</p>
          </div>
        </div>
      </div>
    );
  }

  if (showProfile || showEditProfile) {
    return (
      <ProfileModal 
        onClose={() => {
          setShowProfile(false);
          setShowEditProfile(false);
          loadUserData();
        }} 
        userData={userData}
        onSave={() => loadUserData()}
      />
    );
  }

  if (showQR) {
    return (
      <div className="modal-overlay" onClick={() => setShowQR(false)}>
        <div className="qr-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Мой QR-код</h2>
            <button className="modal-close-btn" onClick={() => setShowQR(false)}>✕</button>
          </div>
          <div className="qr-body">
            <div className="qr-avatar">
              {userData?.avatar_url ? (
                <img src={userData.avatar_url} alt="" />
              ) : (
                <div className="qr-avatar-placeholder">
                  {userData?.first_name?.charAt(0) || userData?.username?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div className="qr-name">{userData?.first_name} {userData?.last_name}</div>
            <div className="qr-username">@{userData?.username}</div>
            
            <div className="qr-code-wrapper">
              <div className="qr-logo-overlay">
                <img src="/assets/images/icon-32.png" alt="M" />
              </div>
              <QRCodeSVG 
                value={`https://f1w6ggb2-5173.euw.devtunnels.ms/invite/${userData.id || userData.username}`}
                size={200}
                level="H"
                includeMargin={true}
                bgColor="white"
                fgColor="black"
              />
            </div>
            
            <button className="scan-qr-btn" onClick={() => { setShowQR(false); setTimeout(() => setShowScanner(true), 100); }}>
              <Icon name="camera" size={18} /> Сканировать QR-код
            </button>
            
            <button className="copy-link-btn" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/invite/${userData?.id || userData?.username}`);

            }}>
              <Icon name="copy" size={18} /> Скопировать ссылку
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showStickerPackCreator) {
    return <StickerPackCreator onClose={() => setShowStickerPackCreator(false)} />;
  }

  if (showDeleteConfirm) {
    return (
      <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
        <div className="confirm-modal" onClick={e => e.stopPropagation()}>
          <div className="confirm-icon danger">
            <Icon name="delete" size={40} />
          </div>
          <h3>Удалить аккаунт?</h3>
          <p>Это действие нельзя отменить. Все ваши сообщения, чаты и данные будут удалены навсегда.</p>
          <div className="confirm-actions">
            <button className="confirm-btn cancel" onClick={() => setShowDeleteConfirm(false)}>Отмена</button>
            <button className="confirm-btn danger" onClick={async () => {
              try {
                await apiClient.delete('/auth/me');
                localStorage.clear();
                window.location.href = '/';
              } catch (error) {
                alert('Не удалось удалить аккаунт');
              }
            }}>Удалить навсегда</button>
          </div>
        </div>
      </div>
    );
  }

  if (showLogoutConfirm) {
    return (
      <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
        <div className="confirm-modal" onClick={e => e.stopPropagation()}>
          <div className="confirm-icon">
            <Icon name="logout" size={40} />
          </div>
          <h3>Выйти из аккаунта?</h3>
          <p>Вы будете перенаправлены на страницу входа.</p>
          <div className="confirm-actions">
            <button className="confirm-btn cancel" onClick={() => setShowLogoutConfirm(false)}>Отмена</button>
            <button className="confirm-btn primary" onClick={async () => {
              try {
                await apiClient.post('/auth/logout');
              } catch {}
              disconnect();
              clearSession();
              window.location.href = '/';
            }}>Выйти</button>
          </div>
        </div>
      </div>
    );
  }

  // Главное меню настроек
  if (!activeSection) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="settings-modal-header">
            <div style={{ width: 36 }} />
            <h2>Настройки</h2>
            <button className="settings-close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="settings-modal-body">
            <div className="settings-main-list">
              {/* Профиль */}
              <div className="settings-main-item" onClick={() => setActiveSection('profile')}>
                <div className="settings-item-icon">
                  <Icon name="profile" size={22} />
                </div>
                <div className="settings-item-info">
                  <div className="settings-item-title">Профиль</div>
                  <div className="settings-item-desc">Имя, фото, username</div>
                </div>
                <Icon name="arrow-right" size={18} className="settings-item-arrow" />
              </div>

              {/* Оформление */}
              <div className="settings-main-item" onClick={() => setActiveSection('appearance')}>
                <div className="settings-item-icon">
                  <Icon name="paint" size={22} />
                </div>
                <div className="settings-item-info">
                  <div className="settings-item-title">Оформление</div>
                  <div className="settings-item-desc">Тема, размер текста, обои</div>
                </div>
                <Icon name="arrow-right" size={18} className="settings-item-arrow" />
              </div>

              {/* Уведомления */}
              <div className="settings-main-item" onClick={() => setActiveSection('notifications')}>
                <div className="settings-item-icon">
                  <Icon name="bell" size={22} />
                </div>
                <div className="settings-item-info">
                  <div className="settings-item-title">Уведомления</div>
                  <div className="settings-item-desc">Звук, вибрация, предпросмотр</div>
                </div>
                <Icon name="arrow-right" size={18} className="settings-item-arrow" />
              </div>

              {/* Конфиденциальность */}
              <div className="settings-main-item" onClick={() => setActiveSection('privacy')}>
                <div className="settings-item-icon">
                  <Icon name="lock" size={22} />
                </div>
                <div className="settings-item-info">
                  <div className="settings-item-title">Конфиденциальность</div>
                  <div className="settings-item-desc">Кто видит фото, статус</div>
                </div>
                <Icon name="arrow-right" size={18} className="settings-item-arrow" />
              </div>

              {/* Данные и память */}
              <div className="settings-main-item" onClick={() => setActiveSection('data')}>
                <div className="settings-item-icon">
                  <Icon name="folder" size={22} />
                </div>
                <div className="settings-item-info">
                  <div className="settings-item-title">Данные и память</div>
                  <div className="settings-item-desc">Кэш, автозагрузка</div>
                </div>
                <Icon name="arrow-right" size={18} className="settings-item-arrow" />
              </div>

              <div className="settings-divider" />

              {/* Чаты */}
              <div className="settings-main-item" onClick={() => setActiveSection('chats')}>
                <div className="settings-item-icon">
                  <Icon name="send" size={22} />
                </div>
                <div className="settings-item-info">
                  <div className="settings-item-title">Чаты</div>
                  <div className="settings-item-desc">Статус "печатает", ссылки</div>
                </div>
                <Icon name="arrow-right" size={18} className="settings-item-arrow" />
              </div>

              {/* Сообщения */}
              <div className="settings-main-item" onClick={() => setActiveSection('messages')}>
                <div className="settings-item-icon">
                  <Icon name="note" size={22} />
                </div>
                <div className="settings-item-info">
                  <div className="settings-item-title">Сообщения</div>
                  <div className="settings-item-desc">Реакции, теги, автоисправление</div>
                </div>
                <Icon name="arrow-right" size={18} className="settings-item-arrow" />
              </div>

              {/* Стикеры */}
              <div className="settings-main-item" onClick={() => setActiveSection('stickers')}>
                <div className="settings-item-icon">
                  <Icon name="emoji" size={22} />
                </div>
                <div className="settings-item-info">
                  <div className="settings-item-title">Стикеры и эмодзи</div>
                  <div className="settings-item-desc">Подсказки, управление паками</div>
                </div>
                <Icon name="arrow-right" size={18} className="settings-item-arrow" />
              </div>

              <div className="settings-divider" />

              {/* Язык */}
              <div className="settings-main-item" onClick={() => setActiveSection('language')}>
                <div className="settings-item-icon">
                  <Icon name="globe" size={22} />
                </div>
                <div className="settings-item-info">
                  <div className="settings-item-title">Язык</div>
                  <div className="settings-item-desc">
                    {languages.find(l => l.code === currentLanguage)?.native || 'Русский'}
                  </div>
                </div>
                <Icon name="arrow-right" size={18} className="settings-item-arrow" />
              </div>

              {/* Фон чата */}
              <div className="settings-main-item" onClick={() => setActiveSection('wallpapers')}>
                <div className="settings-item-icon">
                  <Icon name="picture" size={22} />
                </div>
                <div className="settings-item-info">
                  <div className="settings-item-title">Фон чата</div>
                  <div className="settings-item-desc">Градиенты, свои обои</div>
                </div>
                <Icon name="arrow-right" size={18} className="settings-item-arrow" />
              </div>

              {/* Активные сессии */}
              <div className="settings-main-item" onClick={() => setActiveSection('sessions')}>
                <div className="settings-item-icon">
                  <Icon name="phone" size={22} />
                </div>
                <div className="settings-item-info">
                  <div className="settings-item-title">Устройства</div>
                  <div className="settings-item-desc">Устройства и завершение</div>
                </div>
                <Icon name="arrow-right" size={18} className="settings-item-arrow" />
              </div>

              {!isPremium && (
                <>
                  <div className="settings-divider" />
                  <div className="settings-main-item premium" onClick={() => setActiveSection('premium')}>
                    <div className="settings-item-icon">
                      <Icon name="crown" size={22} color="#f59e0b" />
                    </div>
                    <div className="settings-item-info">
                      <div className="settings-item-title">Premium</div>
                      <div className="settings-item-desc">Больше возможностей</div>
                    </div>
                    <span className="premium-badge-small">🔥</span>
                    <Icon name="arrow-right" size={18} className="settings-item-arrow" />
                  </div>
                </>
              )}

              <div className="settings-divider" />

              <div className="settings-main-item" onClick={() => setActiveSection('sounds')}>
                <div className="settings-item-icon">
                  <Icon name="bell" size={22} />
                </div>
                <div className="settings-item-info">
                  <div className="settings-item-title">Звуки</div>
                  <div className="settings-item-desc">Пользовательские звуки уведомлений</div>
                </div>
                <Icon name="arrow-right" size={18} className="settings-item-arrow" />
              </div>

              <div className="settings-main-item" onClick={() => setActiveSection('appicon')}>
                <div className="settings-item-icon">
                  <Icon name="picture" size={22} />
                </div>
                <div className="settings-item-info">
                  <div className="settings-item-title">Иконка приложения</div>
                  <div className="settings-item-desc">Сменить значок Monogram</div>
                </div>
                <Icon name="arrow-right" size={18} className="settings-item-arrow" />
              </div>

              <div className="settings-main-item" onClick={() => setActiveSection('storage')}>
                <div className="settings-item-icon">
                  <Icon name="folder" size={22} />
                </div>
                <div className="settings-item-info">
                  <div className="settings-item-title">Память</div>
                  <div className="settings-item-desc">Использование и очистка кэша</div>
                </div>
                <Icon name="arrow-right" size={18} className="settings-item-arrow" />
              </div>

              <div className="settings-main-item" onClick={() => setActiveSection('quickreplies')}>
                <div className="settings-item-icon">
                  <Icon name="send" size={22} />
                </div>
                <div className="settings-item-info">
                  <div className="settings-item-title">Быстрые ответы</div>
                  <div className="settings-item-desc">Шаблоны сообщений</div>
                </div>
                <Icon name="arrow-right" size={18} className="settings-item-arrow" />
              </div>

              <div className="settings-divider" />

              {/* Выйти */}
              <div className="settings-main-item danger" onClick={() => setShowLogoutConfirm(true)}>
                <div className="settings-item-icon">
                  <Icon name="logout" size={22} />
                </div>
                <div className="settings-item-info">
                  <div className="settings-item-title">Выйти</div>
                  <div className="settings-item-desc">Завершить сессию</div>
                </div>
                <Icon name="arrow-right" size={18} className="settings-item-arrow" />
              </div>

              {/* Удалить аккаунт */}
              <div className="settings-main-item danger" onClick={() => setShowDeleteConfirm(true)}>
                <div className="settings-item-icon">
                  <Icon name="delete" size={22} />
                </div>
                <div className="settings-item-info">
                  <div className="settings-item-title">Удалить аккаунт</div>
                  <div className="settings-item-desc">Безвозвратно удалить все данные</div>
                </div>
                <Icon name="arrow-right" size={18} className="settings-item-arrow" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === РАЗДЕЛ ПРОФИЛЬ ===
  if (activeSection === 'profile') {
    return (
      <div className="modal-overlay" onClick={() => setActiveSection(null)}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="settings-modal-header">
            <button className="settings-back-btn" onClick={() => setActiveSection(null)}>
              <Icon name="arrow" size={20} />
            </button>
            <h2>{getTitle()}</h2>
            <button className="settings-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="settings-modal-body settings-content-scroll">
            <div className="profile-section">
              <div className="profile-header">
                <div className="profile-avatar-large" onClick={() => setShowEditProfile(true)}>
                  {userData?.avatar_url ? (
                    <img src={userData.avatar_url} alt="" />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      {userData?.first_name?.charAt(0) || userData?.username?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="avatar-edit-overlay">
                    <Icon name="edit" size={16} />
                  </div>
                </div>
                <div className="profile-info">
                  <h3>{userData?.first_name} {userData?.last_name}</h3>
                  <p className="profile-username">@{userData?.username}</p>
                  {isPremium && <div className="premium-badge">⭐ Premium</div>}
                </div>
              </div>
              
              <div className="settings-group">
                <div className="settings-row">
                  <div className="settings-row-label">Email</div>
                  <div className="settings-row-value">{userData?.email || 'Не указан'}</div>
                </div>
                <div className="settings-row">
                  <div className="settings-row-label">Телефон</div>
                  <div className="settings-row-value">{userData?.phone || 'Не указан'}</div>
                </div>
                <div className="settings-row">
                  <div className="settings-row-label">Дата регистрации</div>
                  <div className="settings-row-value">
                    {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : 'Неизвестно'}
                  </div>
                </div>
              </div>
              
              <div className="settings-actions">
                <button className="settings-action-btn" onClick={() => setShowEditProfile(true)}>
                  <Icon name="edit" size={18} /> Редактировать профиль
                </button>
                <button className="settings-action-btn" onClick={() => setShowQR(true)}>
                  <Icon name="qr" size={18} /> Мой QR-код
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === РАЗДЕЛ ОФОРМЛЕНИЕ ===
  if (activeSection === 'appearance') {
    return (
      <div className="modal-overlay" onClick={() => setActiveSection(null)}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="settings-modal-header">
            <button className="settings-back-btn" onClick={() => setActiveSection(null)}>
              <Icon name="arrow" size={20} />
            </button>
            <h2>{getTitle()}</h2>
            <button className="settings-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="settings-modal-body settings-content-scroll">
            <div className="settings-group">
              <h4>Тема</h4>
              <div className="theme-options">
                <div className={`theme-option ${themeMode === 'dark' ? 'selected' : ''}`} onClick={() => { saveSettings({ theme: 'dark' }); setThemeMode('dark'); }}>
                  <div className="theme-preview dark" />
                  <span>Тёмная</span>
                  {settings.theme === 'dark' && <Icon name="checkmark" size={16} className="theme-check" />}
                </div>
                <div className={`theme-option ${themeMode === 'light' ? 'selected' : ''}`} onClick={() => { saveSettings({ theme: 'light' }); setThemeMode('light'); }}>
                  <div className="theme-preview light" />
                  <span>Светлая</span>
                  {themeMode === 'light' && <Icon name="checkmark" size={16} className="theme-check" />}
                </div>
                <div className={`theme-option ${themeMode === 'amoled' ? 'selected' : ''}`} onClick={() => { saveSettings({ theme: 'amoled' }); setThemeMode('amoled'); }}>
                  <div className="theme-preview" style={{ background: '#000', border: '1px solid #222' }} />
                  <span>AMOLED тема</span>
                  {themeMode === 'amoled' && <Icon name="checkmark" size={16} className="theme-check" />}
                </div>
                <div className={`theme-option ${settings.theme === 'system' ? 'selected' : ''}`} onClick={() => saveSettings({ theme: 'system' })}>
                  <div className="theme-preview system" />
                  <span>Системная</span>
                  {settings.theme === 'system' && <Icon name="checkmark" size={16} className="theme-check" />}
                </div>
                <div className={`theme-option ${settings.theme === 'high-contrast' ? 'selected' : ''}`} onClick={() => {
                  saveSettings({ theme: 'high-contrast' });
                  document.body.classList.add('high-contrast');
                }}>
                  <div className="theme-preview" style={{ background: '#fff', border: '2px solid #000' }} />
                  <span>Высокий контраст</span>
                  {settings.theme === 'high-contrast' && <Icon name="checkmark" size={16} className="theme-check" />}
                </div>
              </div>
              
              <div className="settings-group">
                <h4>Акцентный цвет</h4>
                <div className="accent-color-grid">
                  {[
                    { name: 'Синий', color: '#667eea' },
                    { name: 'Зелёный', color: '#4CAF50' },
                    { name: 'Розовый', color: '#E91E63' },
                    { name: 'Фиолетовый', color: '#9C27B0' },
                    { name: 'Оранжевый', color: '#FF9800' },
                    { name: 'Красный', color: '#F44336' },
                    { name: 'Бирюзовый', color: '#00BCD4' },
                    { name: 'Салатовый', color: '#8BC34A' },
                  ].map(c => (
                    <div
                      key={c.color}
                      className={`accent-color-option ${accentColor === c.color ? 'selected' : ''}`}
                      onClick={() => {
                        setAccentColor(c.color);
                        saveSettings({ accentColor: c.color });
                      }}
                      title={c.name}
                    >
                      <div className="accent-color-circle" style={{ background: c.color }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="settings-group">
              <h4>Размер текста</h4>
              <div className="font-size-slider">
                <input
                  type="range"
                  min={12}
                  max={20}
                  step={1}
                  value={settings.fontSize}
                  onChange={(e) => saveSettings({ fontSize: Number(e.target.value) })}
                />
                <div className="font-size-value">{settings.fontSize}px</div>
              </div>
              <div className="font-size-preview">
                <span style={{ fontSize: `${settings.fontSize}px` }}>Пример текста сообщения</span>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Анимации интерфейса</div>
                  <div className="settings-toggle-desc">Плавные анимации при переходах</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={settings.animationsEnabled} onChange={e => saveSettings({ animationsEnabled: e.target.checked })} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">E2EE шифрование</div>
                  <div className="settings-toggle-desc">Сквозное шифрование сообщений</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={externalE2EE} onChange={e => onToggleE2EE?.(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === РАЗДЕЛ УВЕДОМЛЕНИЯ ===
  if (activeSection === 'notifications') {
    return (
      <div className="modal-overlay" onClick={() => setActiveSection(null)}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="settings-modal-header">
            <button className="settings-back-btn" onClick={() => setActiveSection(null)}>
              <Icon name="arrow" size={20} />
            </button>
            <h2>{getTitle()}</h2>
            <button className="settings-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="settings-modal-body settings-content-scroll">
            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Push-уведомления</div>
                  <div className="settings-toggle-desc">Получать уведомления о новых сообщениях</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={settings.notificationsEnabled} onChange={e => saveSettings({ notificationsEnabled: e.target.checked })} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Предпросмотр сообщений</div>
                  <div className="settings-toggle-desc">Показывать текст в уведомлении</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={messagePreview} onChange={e => setMessagePreview(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Вибрация</div>
                  <div className="settings-toggle-desc">Вибрировать при новых сообщениях</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={vibrationEnabled} onChange={e => setVibrationEnabled(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Не присылать уведомления когда я онлайн</div>
                  <div className="settings-toggle-desc">Отключить звук и push уведомления при активном использовании</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={muteWhenOnline} onChange={async (e) => {
                    setMuteWhenOnline(e.target.checked);
                    await apiClient.post('/settings/smart-notifications', {
                      mute_when_online: e.target.checked,
                      smart_notifications: smartNotifications,
                    });
                  }} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Умные уведомления</div>
                  <div className="settings-toggle-desc">Не присылать уведомления в активные часы</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={smartNotifications} onChange={async (e) => {
                    setSmartNotifications(e.target.checked);
                    await apiClient.post('/settings/smart-notifications', {
                      mute_when_online: muteWhenOnline,
                      smart_notifications: e.target.checked,
                    });
                  }} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="settings-group">
              <h4>Звук уведомления</h4>
              {notificationSounds.map(sound => (
                <div key={sound.id} className={`sound-option ${notificationSound === sound.id ? 'selected' : ''}`} onClick={() => setNotificationSound(sound.id)}>
                  <Icon name={sound.icon} size={18} />
                  <span>{sound.name}</span>
                  {notificationSound === sound.id && <Icon name="checkmark" size={16} className="check-icon" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === РАЗДЕЛ КОНФИДЕНЦИАЛЬНОСТЬ ===
  if (activeSection === 'privacy') {
    return (
      <div className="modal-overlay" onClick={() => setActiveSection(null)}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="settings-modal-header">
            <button className="settings-back-btn" onClick={() => setActiveSection(null)}>
              <Icon name="arrow" size={20} />
            </button>
            <h2>{getTitle()}</h2>
            <button className="settings-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="settings-modal-body settings-content-scroll">
            <div className="settings-group">
              <div className="settings-select">
                <div className="settings-select-label">Фото профиля</div>
                <div className="settings-select-desc">Кто может видеть мою аватарку</div>
                <select value={photoPrivacy} onChange={e => setPhotoPrivacy(e.target.value as any)}>
                  <option value="everyone">Все</option>
                  <option value="contacts">Мои контакты</option>
                  <option value="nobody">Никто</option>
                </select>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-select">
                <div className="settings-select-label">Последняя активность</div>
                <div className="settings-select-desc">Кто видит когда я был в сети</div>
                <select value={lastSeenPrivacy} onChange={e => setLastSeenPrivacy(e.target.value as any)}>
                  <option value="everyone">Все</option>
                  <option value="contacts">Мои контакты</option>
                  <option value="nobody">Никто</option>
                </select>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-select">
                <div className="settings-select-label">Номер телефона</div>
                <div className="settings-select-desc">Кто может видеть мой номер</div>
                <select value={phonePrivacy} onChange={e => setPhonePrivacy(e.target.value as any)}>
                  <option value="everyone">Все</option>
                  <option value="contacts">Мои контакты</option>
                  <option value="nobody">Никто</option>
                </select>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Читать статус</div>
                  <div className="settings-toggle-desc">Показывать, что вы прочитали сообщение</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={readReceipts} onChange={e => setReadReceipts(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Статус "в сети"</div>
                  <div className="settings-toggle-desc">Показывать что вы онлайн</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={onlineStatus} onChange={e => setOnlineStatus(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            {isPremium && (
              <div className="settings-group">
                <div className="settings-toggle">
                  <div>
                    <div className="settings-toggle-label">Невидимка</div>
                    <div className="settings-toggle-desc">Никто не видит что вы онлайн</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" onChange={async (e) => {
                      try {
                        const res = await apiClient.post('/premium/invisible');
                        alert(res.data.is_invisible ? 'Невидимка включена' : 'Невидимка отключена');
                      } catch { alert('Требуется Premium'); }
                    }} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
            )}

            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Откладывать прочтение</div>
                  <div className="settings-toggle-desc">Задержка 2 секунды перед отметкой прочитанных</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={delayedRead} onChange={e => {
                    const v = e.target.checked;
                    setDelayedRead(v);
                    localStorage.setItem('delayed_read', String(v));
                  }} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === РАЗДЕЛ ДАННЫЕ И ПАМЯТЬ ===
  if (activeSection === 'data') {
    return (
      <div className="modal-overlay" onClick={() => setActiveSection(null)}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="settings-modal-header">
            <button className="settings-back-btn" onClick={() => setActiveSection(null)}>
              <Icon name="arrow" size={20} />
            </button>
            <h2>{getTitle()}</h2>
            <button className="settings-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="settings-modal-body settings-content-scroll">
            <div className="settings-stats">
              <div className="stat-card">
                <Icon name="folder" size={24} />
                <div className="stat-value">{formatBytes(cacheSize)}</div>
                <div className="stat-label">Кэш</div>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Автозагрузка медиа</div>
                  <div className="settings-toggle-desc">Автоматически загружать фото и видео</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={autoDownloadMedia} onChange={e => setAutoDownloadMedia(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Автовоспроизведение GIF</div>
                  <div className="settings-toggle-desc" />
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={autoPlayGIFs} onChange={e => setAutoPlayGIFs(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Сохранять в галерею</div>
                  <div className="settings-toggle-desc">Сохранять медиа в галерею устройства</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={saveToGallery} onChange={e => setSaveToGallery(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <button className="clear-cache-btn" onClick={clearCache}>
              <Icon name="delete" size={18} /> Очистить кэш
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === РАЗДЕЛ ЧАТЫ ===
  if (activeSection === 'chats') {
    return (
      <div className="modal-overlay" onClick={() => setActiveSection(null)}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="settings-modal-header">
            <button className="settings-back-btn" onClick={() => setActiveSection(null)}>
              <Icon name="arrow" size={20} />
            </button>
            <h2>{getTitle()}</h2>
            <button className="settings-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="settings-modal-body settings-content-scroll">
            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Показывать статус "печатает"</div>
                  <div className="settings-toggle-desc" />
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={typingIndicator} onChange={e => setTypingIndicator(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Предпросмотр ссылок</div>
                  <div className="settings-toggle-desc">Показывать превью ссылок в сообщениях</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={linkPreview} onChange={e => setLinkPreview(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Закреплённые чаты сверху</div>
                  <div className="settings-toggle-desc" />
                </div>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === РАЗДЕЛ СООБЩЕНИЯ ===
  if (activeSection === 'messages') {
    return (
      <div className="modal-overlay" onClick={() => setActiveSection(null)}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="settings-modal-header">
            <button className="settings-back-btn" onClick={() => setActiveSection(null)}>
              <Icon name="arrow" size={20} />
            </button>
            <h2>{getTitle()}</h2>
            <button className="settings-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="settings-modal-body settings-content-scroll">
            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Двойной клик для реакции</div>
                  <div className="settings-toggle-desc">Ставить ❤️ двойным кликом по сообщению</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={doubleClickReaction} onChange={e => setDoubleClickReaction(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Показывать тег "Переслано"</div>
                  <div className="settings-toggle-desc">Отмечать пересланные сообщения</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={showForwardedTag} onChange={e => setShowForwardedTag(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Показывать тег "Изменено"</div>
                  <div className="settings-toggle-desc">Отмечать отредактированные сообщения</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={showEditedTag} onChange={e => setShowEditedTag(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Проверка орфографии</div>
                  <div className="settings-toggle-desc">Подчёркивать ошибки</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={spellCheck} onChange={e => setSpellCheck(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Автоисправление</div>
                  <div className="settings-toggle-desc">Автоматически исправлять опечатки</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={autoCorrect} onChange={e => setAutoCorrect(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === РАЗДЕЛ СТИКЕРЫ ===
  if (activeSection === 'stickers') {
    return (
      <div className="modal-overlay" onClick={() => setActiveSection(null)}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="settings-modal-header">
            <button className="settings-back-btn" onClick={() => setActiveSection(null)}>
              <Icon name="arrow" size={20} />
            </button>
            <h2>{getTitle()}</h2>
            <button className="settings-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="settings-modal-body settings-content-scroll">
            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Предлагать эмодзи</div>
                  <div className="settings-toggle-desc">Показывать подсказки эмодзи</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={suggestEmoji} onChange={e => setSuggestEmoji(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">Предлагать стикеры</div>
                  <div className="settings-toggle-desc">По вводимому тексту</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={suggestStickers} onChange={e => setSuggestStickers(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="settings-group">
              <button className="settings-link-btn" onClick={() => setShowStickerPackCreator(true)}>
                <Icon name="emoji" size={18} /> Управлять стикер-паками
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === РАЗДЕЛ ЯЗЫК ===
  if (activeSection === 'language') {
    return (
      <div className="modal-overlay" onClick={() => setActiveSection(null)}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="settings-modal-header">
            <button className="settings-back-btn" onClick={() => setActiveSection(null)}>
              <Icon name="arrow" size={20} />
            </button>
            <h2>{getTitle()}</h2>
            <button className="settings-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="settings-modal-body settings-content-scroll">
            {languages.map(lang => (
              <div key={lang.code} className={`language-option ${currentLanguage === lang.code ? 'selected' : ''}`} onClick={() => handleLanguageChange(lang.code)}>
                <span className="language-flag">{lang.flag}</span>
                <div className="language-info">
                  <div className="language-name">{lang.native}</div>
                  <div className="language-name-en">{lang.name}</div>
                </div>
                {currentLanguage === lang.code && <Icon name="checkmark" size={18} className="check-icon" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // === РАЗДЕЛ ФОН ЧАТА ===
  if (activeSection === 'wallpapers') {
    return (
      <div className="modal-overlay" onClick={() => setActiveSection(null)}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="settings-modal-header">
            <button className="settings-back-btn" onClick={() => setActiveSection(null)}>
              <Icon name="arrow" size={20} />
            </button>
            <h2>{getTitle()}</h2>
            <button className="settings-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="settings-modal-body settings-content-scroll">
            <div className="wallpapers-header">
              <button className="upload-wallpaper-btn" onClick={() => fileInputRef.current?.click()}>
                <Icon name="upload" size={16} /> Загрузить обои
              </button>
              <input type="file" ref={fileInputRef} onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) await uploadWallpaper(file);
              }} accept="image/*" hidden />
            </div>

            <div className="wallpapers-grid">
              {wallpapers.map((wp, idx) => (
                <div key={wp.id} className={`wallpaper-card ${settings.wallpaper === wp.id || settings.wallpaper === wp.url ? 'selected' : ''}`} onClick={() => selectWallpaper(wp)}>
                  <div className="wallpaper-preview" style={
                    wp.type === 'image' && wp.preview?.startsWith('http') 
                      ? { backgroundImage: `url(${wp.preview})`, backgroundSize: 'cover' } 
                      : { background: wp.preview || 'var(--bg-primary)' }
                  } />
                  <div className="wallpaper-name">{wp.name}</div>
                  {(settings.wallpaper === wp.id || settings.wallpaper === wp.url) && <div className="wallpaper-check"><Icon name="checkmark" size={12} /></div>}
                  {wp.isCustom && (
                    <button className="wallpaper-delete-btn" onClick={async (e) => { 
                      e.stopPropagation(); 
                      const newCustom = settings.customWallpapers.filter((_, i) => i !== idx); 
                      await saveSettings({ customWallpapers: newCustom }); 
                      loadWallpapers(); 
                    }}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {wallpaperLoading && <div className="wallpapers-loading">Загрузка...</div>}
          </div>
        </div>
      </div>
    );
  }

  // === РАЗДЕЛ АКТИВНЫЕ СЕССИИ ===
  if (activeSection === 'sessions') {
    return (
      <div className="modal-overlay" onClick={() => setActiveSection(null)}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="settings-modal-header">
            <button className="settings-back-btn" onClick={() => setActiveSection(null)}>
              <Icon name="arrow" size={20} />
            </button>
            <h2>{getTitle()}</h2>
            <button className="settings-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="settings-modal-body settings-content-scroll">
            <SessionManager onOpenScanner={() => setShowScanner(true)} />
          </div>
        </div>
      </div>
    );
  }

  // === РАЗДЕЛ ЗВУКИ ===
  if (activeSection === 'sounds') {
    return (
      <div className="modal-overlay" onClick={() => setActiveSection(null)}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="settings-modal-header">
            <button className="settings-back-btn" onClick={() => setActiveSection(null)}>
              <Icon name="arrow" size={20} />
            </button>
            <h2>{getTitle()}</h2>
            <button className="settings-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="settings-modal-body settings-content-scroll">
            <div className="settings-group">
              <h4>Звук сообщения</h4>
              <div className="settings-row">
                <span>Загрузить свой</span>
                <input type="file" accept="audio/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                      const res = await apiClient.post('/settings/sound/message', formData);
                      setCustomSound('message', res.data.path);
                    } catch {}
                  }
                }} />
                <button onClick={() => resetCustomSound('message')}>Сбросить</button>
              </div>
            </div>
            <div className="settings-group">
              <h4>Звук группы</h4>
              <div className="settings-row">
                <input type="file" accept="audio/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                      const res = await apiClient.post('/settings/sound/group', formData);
                      setCustomSound('group', res.data.path);
                    } catch {}
                  }
                }} />
                <button onClick={() => resetCustomSound('group')}>Сбросить</button>
              </div>
            </div>
            <div className="settings-group">
              <h4>Звук звонка</h4>
              <div className="settings-row">
                <input type="file" accept="audio/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                      const res = await apiClient.post('/settings/sound/call', formData);
                      setCustomSound('call', res.data.path);
                    } catch {}
                  }
                }} />
                <button onClick={() => resetCustomSound('call')}>Сбросить</button>
              </div>
            </div>
            <div className="settings-group">
              <h4>Звук уведомления</h4>
              <div className="settings-row">
                <input type="file" accept="audio/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                      const res = await apiClient.post('/settings/sound/notification', formData);
                      setCustomSound('notification', res.data.path);
                    } catch {}
                  }
                }} />
                <button onClick={() => resetCustomSound('notification')}>Сбросить</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === РАЗДЕЛ ИКОНКА ПРИЛОЖЕНИЯ ===
  if (activeSection === 'appicon') {
    return (
      <div className="modal-overlay" onClick={() => setActiveSection(null)}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="settings-modal-header">
            <button className="settings-back-btn" onClick={() => setActiveSection(null)}>
              <Icon name="arrow" size={20} />
            </button>
            <h2>{getTitle()}</h2>
            <button className="settings-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="settings-modal-body settings-content-scroll">
            <div className="settings-group">
              {APP_ICONS.map(icon => (
                <div key={icon.path} className="app-icon-option" onClick={() => { setAppIcon(icon.path); setActiveSection(null); }}>
                  <img src={icon.path} alt={icon.name} className="app-icon-preview" />
                  <span>{icon.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === РАЗДЕЛ ПАМЯТЬ ===
  if (activeSection === 'storage') {
    return (
      <div className="modal-overlay" onClick={() => setActiveSection(null)}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="settings-modal-header">
            <button className="settings-back-btn" onClick={() => setActiveSection(null)}>
              <Icon name="arrow" size={20} />
            </button>
            <h2>{getTitle()}</h2>
            <button className="settings-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="settings-modal-body settings-content-scroll">
            <StorageInfo />
          </div>
        </div>
      </div>
    );
  }

  // === РАЗДЕЛ БЫСТРЫЕ ОТВЕТЫ ===
  if (activeSection === 'quickreplies') {
    return (
      <div className="modal-overlay" onClick={() => setActiveSection(null)}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="settings-modal-header">
            <button className="settings-back-btn" onClick={() => setActiveSection(null)}>
              <Icon name="arrow" size={20} />
            </button>
            <h2>{getTitle()}</h2>
            <button className="settings-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="settings-modal-body settings-content-scroll">
            <QuickReplies onSelect={(text) => navigator.clipboard.writeText(text)} />
          </div>
        </div>
      </div>
    );
  }

  // Показываем QR-сканер
  if (showScanner) {
    return (
      <QRScanner 
        onClose={() => setShowScanner(false)}
        onScanSuccess={(result) => {
          console.debug('QR scanned:', result);
          setShowScanner(false);
        }}
      />
    );
  }

  // === РАЗДЕЛ PREMIUM ===
  if (activeSection === 'premium') {
    return (
      <div className="modal-overlay" onClick={() => setActiveSection(null)}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="settings-modal-header">
            <button className="settings-back-btn" onClick={() => setActiveSection(null)}>
              <Icon name="arrow" size={20} />
            </button>
            <h2>{getTitle()}</h2>
            <button className="settings-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="settings-modal-body settings-content-scroll premium-content">
            <div className="premium-header">
              <Icon name="crown" size={64} />
              <h2>Monogram Premium</h2>
              <p>Раскройте все возможности общения</p>
            </div>

            <div className="premium-plans">
              <div className="premium-plan">
                <div className="plan-price">49 ₽</div>
                <div className="plan-period">в месяц</div>
                <button className="plan-btn" onClick={() => alert("Оплата будет доступна в ближайшее время!")}>Выбрать</button>
              </div>
              <div className="premium-plan featured">
                <div className="plan-badge">🔥 Выгодно</div>
                <div className="plan-price">499 ₽</div>
                <div className="plan-period">в год</div>
                <div className="plan-old-price">588 ₽</div>
                <button className="plan-btn primary" onClick={() => alert("Оплата будет доступна в ближайшее время!")}>Выбрать</button>
              </div>
            </div>

            <div className="premium-features">
              <div className="premium-feature"><Icon name="checkmark" size={18} /> Безлимитные обои</div>
              <div className="premium-feature"><Icon name="checkmark" size={18} /> Свои реакции-фото</div>
              <div className="premium-feature"><Icon name="checkmark" size={18} /> Premium бейдж</div>
              <div className="premium-feature"><Icon name="checkmark" size={18} /> Безлимитные истории</div>
              <div className="premium-feature"><Icon name="checkmark" size={18} /> Бизнес-профиль</div>
              <div className="premium-feature"><Icon name="checkmark" size={18} /> Эмодзи-статус</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SettingsModal;

