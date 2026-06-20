// App.tsx — ИСПРАВЛЕННАЯ ВЕРСИЯ
import React, { useState, useEffect, useCallback, useRef } from 'react';

// Компоненты
import NotFound from './components/NotFound';
import AdminPanel from './components/AdminPanel';
import ProfileModal from './components/ProfileModal';
const SettingsModal = React.lazy(() => import('./components/SettingsModal'));
import NotificationsModal from './components/NotificationsModal';
import InviteModal from './components/InviteModal';
import AddChatModal from './components/AddChatModal';
import GroupModal from './components/GroupModal';
import ChannelModal from './components/ChannelModal';
import ChatInfoModal from './components/ChatInfoModal';
import ConfirmModal from './components/ConfirmModal';
import QRScanner from './components/QRScanner';
import QRLogin from './components/Auth/QRLogin';
const PremiumModal = React.lazy(() => import('./components/Premium/PremiumModal'));
import NewDeviceAlert from './components/Security/NewDeviceAlert';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import HamburgerMenu from './components/UI/HamburgerMenu';
import CompleteRegistration from './components/CompleteRegistration';
import RegisterUsername from './components/RegisterUsername';
import WelcomeScreen from './components/WelcomeScreen';
import VerifyPage from './pages/VerifyPage';

// Сервисы
import { getSession, clearSession, saveSession } from './services/cookies';
import { connectToServer, onMessage, disconnect } from './services/socket';
import { initE2EE, isE2EEEnabled, loadE2EESettings, setE2EEEnabled, resetE2EEKeys } from './services/e2ee';
import { checkPremium, PREMIUM_FEATURES } from './services/premium';
import { useAdaptiveLayout } from './hooks/useAdaptiveLayout';
import { useBiometric } from './hooks/useBiometric';
import apiClient from './services/api';
import Icon from './components/Icon';
import { QRCodeSVG } from 'qrcode.react';
import PwaInstallBanner from './components/PWA/PwaInstallBanner';
import InstallPage from './pages/InstallPage';
const ForwardDialog = React.lazy(() => import('./components/ForwardDialog'));
const CallScreen = React.lazy(() => import('./components/CallScreen'));
const SharePage = React.lazy(() => import('./pages/SharePage'));
const GroupCallScreen = React.lazy(() => import('./components/GroupCallScreen'));
import SecuritySettings from './components/SecuritySettings';
import { saveDraft, getDraft } from './utils/features';
import ToastContainer from './components/Toast';
import { useToast } from './hooks/useToast';
import { requestNotificationPermission, showDesktopNotification } from './services/notifications';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { handleDeepLink } from './services/deeplink';

import './App.css';
import './styles/adaptive.css';
import './styles/index.css';
import './styles/features.css';
import './styles/pwa-install.css';
import './styles/high-contrast.css';

declare global {
  interface Window {
    updatePreloadProgress?: (percent: number, status?: string) => void;
  }
}

interface ChatInfo {
  id: number;
  name: string;
  lastMessage?: string;
  time?: string;
  type?: 'private' | 'group' | 'channel';
  unreadCount?: number;
  isPinned?: boolean;
}

interface UserData {
  id: number;
  username: string;
  avatar?: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  is_premium?: boolean;
  premium_until?: string;
}

interface NewDeviceInfo {
  device: string;
  location: string;
  ip: string;
  time: string;
  sessionId: string;
}

// Константы
const FRONTEND_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const App: React.FC = () => {
  // ============================================
  // СОСТОЯНИЯ
  // ============================================
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeChat, setActiveChat] = useState<{ id: number; name: string; type?: string } | null>(null);
  const [savedChats, setSavedChats] = useState<ChatInfo[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  
  // Модальные окна
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddChat, setShowAddChat] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [showChannel, setShowChannel] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showQRLogin, setShowQRLogin] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [forwardMessageId, setForwardMessageId] = useState<number | null>(null);

  // QuarkPay
  const [showQuarkPayConnect, setShowQuarkPayConnect] = useState(false);
  const [quarkPayConnected, setQuarkPayConnected] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  
  // Безопасность
  const [showNewDeviceAlert, setShowNewDeviceAlert] = useState(false);
  const [newDeviceInfo, setNewDeviceInfo] = useState<NewDeviceInfo | null>(null);
  const [e2eeEnabled, setE2eeEnabled] = useState(() => loadE2EESettings().enabled);
  const { isSupported: biometricSupported, isEnabled: biometricEnabled, isMobile, authenticate: biometricAuth, toggle: toggleBiometric } = useBiometric();
  
  // Приглашения и ошибки
  const [inviteUsername, setInviteUsername] = useState<string | null>(null);
  const [inviteUserData, setInviteUserData] = useState<{ firstName: string; lastName: string; avatarUrl?: string; bio?: string } | null>(null);
  const [inviteError, setInviteError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // Админ
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  
  // QR сессия
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<string>('waiting');
  
  // Google регистрация
  const [showCompleteRegistration, setShowCompleteRegistration] = useState(false);
  const [completeRegistrationData, setCompleteRegistrationData] = useState<{
    email: string;
    googleId: string;
    firstName: string;
    lastName: string;
    avatar: string;
  } | null>(null);
  
  // Адаптивность
  const { isMobile: isMobileLayout, sidebarOpen, toggleSidebar, closeSidebar } = useAdaptiveLayout();

  // Call state
  const [activeCall, setActiveCall] = useState<{
    chatId: number;
    userId: number;
    peerId: number;
    peerName: string;
  } | null>(null);

  // Group call state
  const [groupCall, setGroupCall] = useState<{ roomId: string; userId: number } | null>(null);

  // Toast уведомления
  const { toasts, addToast, removeToast } = useToast();

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================
  useKeyboardNav({
    onEscape: useCallback(() => {
      setShowProfile(false);
      setShowSettings(false);
      setShowNotifications(false);
      setShowAddChat(false);
      setShowGroup(false);
      setShowChannel(false);
      setShowChatInfo(false);
      setShowLogoutConfirm(false);
      setShowQR(false);
      setShowScanner(false);
      setShowQRLogin(false);
      setShowPremium(false);
      setForwardMessageId(null);
      setShowNewDeviceAlert(false);
      setShowAdmin(false);
    }, []),
    enabled: isLoggedIn,
  });

  // ============================================
  // ЗАГРУЗКА ПРЕМИУМ СТАТУСА
  // ============================================
  const loadPremiumStatus = useCallback(async () => {
    if (userData?.id) {
      const premium = await checkPremium(userData.id);
      setIsPremium(premium);
      setUserData(prev => prev ? { ...prev, is_premium: premium } : prev);
    }
  }, [userData?.id]);

  // ============================================
  // ЗАГРУЗКА ЧАТОВ
  // ============================================

  const loadUserChats = useCallback(async () => {
    try {
      const response = await apiClient.get('/chats/');
      const FAVORITES_ID = userData?.id ? userData.id * 1000000 + 999999 : 999999;
      if (response.data && Array.isArray(response.data)) {
        let chats = response.data
          .filter((chat: any) => chat.id && chat.name)
          .map((chat: any) => ({
            id: chat.id,
            name: chat.name || `Чат ${chat.id}`,
            type: chat.type || 'private',
            lastMessage: '',
            time: '',
            unreadCount: 0,
            isPinned: false,
          }));
        
        const hasFavorites = chats.some(c => c.id === FAVORITES_ID);
        const hasMonogram = chats.some(c => c.id === 999998);
        
        if (!hasFavorites) {
          chats.unshift({ 
            id: FAVORITES_ID, 
            name: 'Избранное', 
            type: 'private', 
            lastMessage: 'Сохранённые сообщения', 
            time: '',
            unreadCount: 0,
            isPinned: false,
          });
        }
        if (!hasMonogram) {
          chats.unshift({ 
            id: 999998, 
            name: 'Monogram', 
            type: 'channel', 
            lastMessage: 'Новости мессенджера', 
            time: '',
            unreadCount: 0,
            isPinned: false,
          });
        }
        
        setSavedChats(chats);
      }
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
    }
  }, []);

  // ============================================
  // ГЕНЕРАЦИЯ ID ЧАТА
  // ============================================
  const generatePrivateChatId = useCallback((user1: string, user2: string): number => {
    const sorted = [user1.toLowerCase(), user2.toLowerCase()].sort();
    let hash = 0;
    const str = sorted.join('-');
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % 900000 + 100000;
  }, []);

  const handleArchiveChat = async (chatId: number) => {
    try {
      await apiClient.post(`/chats/${chatId}/archive`);
      loadUserChats();
    } catch (error) {
      console.error('Ошибка архивации чата:', error);
    }
  };

  const handleMuteChat = async (chatId: number, duration: number) => {
    try {
      await apiClient.post(`/chats/${chatId}/mute`, { duration_minutes: duration });
      loadUserChats();
    } catch (error) {
      console.error('Ошибка отключения звука:', error);
    }
  };

  // ============================================
  // ОБРАБОТЧИКИ СООБЩЕНИЙ
  // ============================================
  const handleIncomingMessage = useCallback((msg: any) => {
    setSavedChats(prev => {
      const chatId = msg.chat_id;
      if (!chatId) return prev;
      const exists = prev.find(c => c.id === chatId);
      
      if (exists) {
        return prev.map(c => 
          c.id === chatId ? { 
            ...c, 
            lastMessage: msg.content?.substring(0, 30) || 'Новое сообщение',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unreadCount: (c.unreadCount || 0) + 1 
          } : c
        );
      }
      
      // Новый чат — загружаем имя собеседника
      const chatName = msg.chat_name || msg.sender_name || `Чат ${chatId}`;
      
      return [{
        id: chatId,
        name: chatName,
        type: msg.chat_type || 'private',
        lastMessage: msg.content?.substring(0, 30) || 'Новое сообщение',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unreadCount: 1,
        isPinned: false,
      }, ...prev];
    });
  }, []);

  // ============================================
  // ПРОВЕРКА АДМИНА
  // ============================================
  const checkAdmin = useCallback(async () => {
    try {
      const res = await apiClient.get('/auth/admin/check');
      setIsAdmin(res.data.is_admin);
    } catch {
      setIsAdmin(false);
    }
    setAdminChecked(true);
  }, []);

  // ============================================
  // ПРОВЕРКА НОВОГО УСТРОЙСТВА
  // ============================================
  const checkNewDevice = useCallback(async () => {
    try {
      const res = await apiClient.get('/auth/sessions/check-new');
      if (res.data.new_device && res.data.user_active_days > 1) {
        setNewDeviceInfo({
          device: res.data.device,
          location: res.data.location,
          ip: res.data.ip,
          time: res.data.time,
          sessionId: res.data.session_id,
        });
        setShowNewDeviceAlert(true);
      }
    } catch (error) {
      console.error('Ошибка проверки устройства:', error);
    }
  }, []);

  const handleConfirmDevice = async () => {
    try {
      await apiClient.post('/auth/sessions/confirm', { session_id: newDeviceInfo?.sessionId });
      setShowNewDeviceAlert(false);
      setNewDeviceInfo(null);
    } catch (error) {
      console.error('Ошибка подтверждения:', error);
    }
  };

  const handleDenyDevice = async () => {
    try {
      await apiClient.delete(`/auth/sessions/${newDeviceInfo?.sessionId}`);
      setShowNewDeviceAlert(false);
      setNewDeviceInfo(null);
      alert('Сессия завершена. Неизвестное устройство отключено.');
    } catch (error) {
      console.error('Ошибка завершения сессии:', error);
    }
  };

  // ============================================
  // QR ЛОГИН ФУНКЦИИ
  // ============================================
  const createQRSession = async () => {
    try {
      const response = await apiClient.post('/auth/qr/create');
      setQrSessionId(response.data.session_id);
      return response.data.qr_link;
    } catch (error) {
      console.error('Ошибка создания QR сессии:', error);
      return `${FRONTEND_URL}/qr/test`;
    }
  };

  const checkQrStatus = useCallback(async (sessionId: string) => {
    try {
      const response = await apiClient.get(`/auth/qr/status/${sessionId}`);
      setQrStatus(response.data.status);
      
      if (response.data.status === 'confirmed') {
        // Вход подтверждён, перенаправляем
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Ошибка проверки статуса QR:', error);
    }
  }, []);

  // ============================================
  // ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
  // ============================================
  useEffect(() => {
    const initApp = async () => {
      window.updatePreloadProgress?.(70, 'Загрузка профиля...');
      
      if (biometricSupported && biometricEnabled && isMobile) {
        const authSuccess = await biometricAuth();
        if (!authSuccess) {
          window.location.href = '/';
          return;
        }
      }

      const path = window.location.pathname;

      // /login → / (login page не используется, показываем WelcomeScreen)
      if (path === '/login') {
        window.location.href = '/';
        return;
      }

      // /install/android → InstallPage
      if (path === '/install/android') {
        setIsLoading(false);
        return;
      }

      const inviteMatch = path.match(/^\/invite\/([^\/]+)$/);
      const inviteLoginMatch = path.match(/^\/invite\/login\/([^\/]+)$/);
      const qrLoginMatch = path.match(/^\/qr-login\/(.+)$/);
      const verifyMatch = path.match(/^\/verify\/(.+)$/);
      
      // Обработка верификации email
      if (verifyMatch) {
        const token = verifyMatch[1];
        try {
          const response = await apiClient.get(`/auth/verify/${token}`);
          if (response.data?.token) {
            await saveSession(response.data.token, { id: 0, username: '', firstName: '', lastName: '' });
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ type: 'REGISTRATION_SUCCESS', token: response.data.token }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          }
        } catch (error) {
          console.error('Verification error:', error);
          setNotFound(true);
        }
        return;
      }

      // Обработка QR-регистрации (со сканера телефона)
      const qrMatch = path.match(/^\/qr\/register\/(.+)$/);
      if (qrMatch) {
          const sessionId = qrMatch[1];
          
          // Проверяем, есть ли уже сессия
          const session = await getSession();
          if (session) {
              setIsLoggedIn(true);
              setUserData(session.user);
              connectToServer(session.user.id);
              onMessage(handleIncomingMessage);
              await loadUserChats();
              await loadPremiumStatus();
              // Не показываем тост, просто показываем мессенджер
          } else {
              // Показываем тост только если нет сессии
              const toast = document.createElement('div');
              toast.className = 'custom-toast info';
              toast.textContent = 'Чтобы войти в аккаунт через QR-код, перейдите в Настройки → Устройства → Сканировать QR-код';
              toast.style.cssText = `
                  position: fixed;
                  bottom: 30px;
                  left: 50%;
                  transform: translateX(-50%);
                  background: #4b5563;
                  color: white;
                  padding: 12px 24px;
                  border-radius: 50px;
                  z-index: 100000;
                  font-size: 14px;
                  animation: slideUp 0.3s ease;
              `;
              document.body.appendChild(toast);
              setTimeout(() => toast.remove(), 8000);
          }
          return;
      }

      // Обработка QR-входа (с компа после сканирования)
      // Deep link handling
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const deeplinkUrl = urlParams.get('monogram');
        if (deeplinkUrl) handleDeepLink(deeplinkUrl);
      } catch {}
      try {
        (navigator as any).registerProtocolHandler?.('monogram', window.location.origin + '/%s');
      } catch {}

      if (qrLoginMatch) {
        const sessionId = qrLoginMatch[1];
        try {
          await apiClient.post('/auth/qr/confirm-mobile', { session_id: sessionId });
          window.location.href = '/';
          return;
        } catch {
          window.location.href = '/';
          return;
        }
      }

      if (path === '/verify-success') {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
          await saveSession(token, { id: 0, username: '', firstName: '', lastName: '' });
          window.location.href = '/';
        }
      }

      if (path === '/google-success') {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token === 'error' || !token) {
          alert('Ошибка входа через Google');
          window.location.href = '/';
          return;
        }
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            await saveSession(token, {
              id: payload.user_id,
              username: payload.username || '',
              firstName: payload.first_name || '',
              lastName: payload.last_name || '',
            });
            window.location.href = '/';
          } catch (e) {
            console.error('Google callback error:', e);
            window.location.href = '/';
          }
          return;
        }
      }

      if (path === '/google-register') {
        const params = new URLSearchParams(window.location.search);
        const email = params.get('email') || '';
        const googleId = params.get('google_id') || '';
        const firstName = params.get('first_name') || '';
        const lastName = params.get('last_name') || '';
        const avatar = params.get('avatar') || '';
        
        setCompleteRegistrationData({ email, googleId, firstName, lastName, avatar });
        setShowCompleteRegistration(true);
        setIsLoading(false);
        return;
      }

      if (path === '/register-username') {
        setIsLoading(false);
        return;
      }

      if (path === '/share') {
        setIsLoading(false);
        return;
      }

      if (path === '/ya-success') {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const msg = params.get('message');
        
        if (token === 'error') {
          alert(msg || 'Ошибка входа через Яндекс');
          window.location.href = '/';
          return;
        }
        
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          await saveSession(token, {
            id: payload.user_id,
            username: '',
            firstName: '',
            lastName: '',
          });
          window.location.href = '/';
          return;
        }
      }

      // Загружаем сессию перед обработкой маршрутов
      const session = await getSession();

      // Обработка /invite/login/TOKEN — неавторизованный пользователь с приглашением
      if (inviteLoginMatch) {
        const token = inviteLoginMatch[1];
        const pending = sessionStorage.getItem('invite_pending_' + token);
        if (pending) {
          sessionStorage.setItem('pendingInvite', pending);
          sessionStorage.removeItem('invite_pending_' + token);
        }
        window.history.replaceState({}, '', '/');
        setIsLoading(false);
        return;
      }

      // Обработка приглашений для неавторизованных
      if (!session && inviteMatch) {
        const val = inviteMatch[1];
        const token = crypto.randomUUID();
        sessionStorage.setItem('invite_pending_' + token, val);
        window.location.href = '/invite/login/' + token;
        return;
      }

      // Обработка приглашений для авторизованных
      if (inviteMatch) {
        const val = inviteMatch[1];
        try {
          const r = await apiClient.get(`/users/public/${val}`);
          if (r.data) {
            setInviteUsername(val);
            setInviteUserData({
              firstName: r.data.first_name || '',
              lastName: r.data.last_name || '',
              avatarUrl: r.data.avatar_url || '',
              bio: r.data.bio || '',
            });
            window.history.replaceState({}, '', '/');
          } else {
            setInviteError(true);
          }
        } catch {
          setInviteError(true);
        }
      } else if (path === '/config') {
        setShowAdmin(true);
      } else if (path !== '/' && !path.startsWith('/assets') && !path.startsWith('/qr')) {
        setNotFound(true);
      }

      window.updatePreloadProgress?.(85, 'Подключение к серверу...');
      
      if (session) {
        setIsLoggedIn(true);
        setUserData(session.user);
        
        await initE2EE(session.user.id);
        connectToServer(session.user.id);
        onMessage(handleIncomingMessage);
        await loadUserChats();
        await loadPremiumStatus();
        await checkNewDevice();
        requestNotificationPermission();
        
        if (window.location.pathname === '/config') checkAdmin();
      }
      
      window.updatePreloadProgress?.(100, 'Готово!');
      setIsLoading(false);
    };
    
    initApp();
    
    const notificationHandler = () => setShowNotifications(true);
    const qrHandler = () => setShowQR(true);
    
    window.addEventListener('open-notifications', notificationHandler);
    window.addEventListener('open-qr-from-profile', qrHandler);
    
    // Navigate event from deeplink
    const navigateHandler = (e: Event) => {

      const detail = (e as CustomEvent).detail;

      if (!detail) return;

      if (detail.type === 'user') {
        handleStartChat(detail.username);
      } else if (detail.type === 'chat') {
        const existing = savedChats.find(c => c.id === detail.chatId);
        if (existing) setActiveChat(existing);
      } else if (detail.type === 'join') {
        // handle join
      }
    };
    window.addEventListener('navigate', navigateHandler as EventListener);
    
    return () => {
      window.removeEventListener('open-notifications', notificationHandler);
      window.removeEventListener('open-qr-from-profile', qrHandler);
      window.removeEventListener('navigate', navigateHandler as EventListener);
    };
  }, [handleIncomingMessage, loadUserChats, checkAdmin, biometricSupported, biometricEnabled, isMobile, biometricAuth, e2eeEnabled, loadPremiumStatus, checkNewDevice]);

  // U20: Unread count in browser title
  useEffect(() => {
    const totalUnread = savedChats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    document.title = totalUnread > 0
      ? `(${totalUnread}) Monogram`
      : 'Monogram';
  }, [savedChats]);

  // Desktop notifications when tab is not focused
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const msgHandler = (msg: any) => {
          if (msg.content) {
            showDesktopNotification('Monogram', {
              body: msg.content.substring(0, 100),
              tag: `msg-${msg.id || Date.now()}`,
            });
          }
        };
        window.addEventListener('new-message', () => {});
        return () => window.removeEventListener('new-message', () => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ============================================
  // НАСТРОЙКИ E2EE
  // ============================================
  const handleToggleE2EE = async (enabled: boolean) => {
    setE2eeEnabled(enabled);
    setE2EEEnabled(0, enabled);
    if (isLoggedIn && userData) {
      await initE2EE(userData.id);
      disconnect();
      connectToServer(userData.id);
    }
  };

  // ============================================
  // ДЕЙСТВИЯ С ЧАТАМИ
  // ============================================
  const handleStartChat = useCallback((username: string) => {
    const chatId = generatePrivateChatId(userData?.username || '', username);
    const existing = savedChats.find(c => c.id === chatId);
    
    if (existing) {
      setActiveChat(existing);
    } else {
      const newChat: ChatInfo = {
        id: chatId,
        name: username.charAt(0).toUpperCase() + username.slice(1),
        lastMessage: 'Начните общение',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'private',
        unreadCount: 0,
        isPinned: false,
      };
      setSavedChats(prev => [...prev, newChat]);
      setActiveChat(newChat);
    }
    setInviteUsername(null);
    window.history.replaceState({}, '', '/');
  }, [userData?.username, savedChats, generatePrivateChatId]);

  const handleAddNewChat = useCallback((chat: ChatInfo) => {
    if (!savedChats.find(c => c.id === chat.id)) {
      setSavedChats(prev => [...prev, chat]);
    }
    setActiveChat(chat);
  }, [savedChats]);

  const handlePinChat = async (chatId: number, isPinned: boolean) => {
    setSavedChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, isPinned } : chat
    ));
    
    try {
      await apiClient.post('/chats/pin', { chat_id: chatId, is_pinned: isPinned });
    } catch (error) {
      console.error('Ошибка закрепления чата:', error);
    }
  };

  // ============================================
  // АВТОРИЗАЦИЯ
  // ============================================
  const handleLogin = useCallback(() => {
    getSession().then(session => {
      if (session) {
        setIsLoggedIn(true);
        setUserData(session.user);
        connectToServer(session.user.id);
        onMessage(handleIncomingMessage);
        setTimeout(loadUserChats, 500);
        if (window.location.pathname === '/config') checkAdmin();

        // Проверяем, есть ли отложенное приглашение
        const pendingUsername = sessionStorage.getItem('pendingInvite');
        if (pendingUsername) {
          sessionStorage.removeItem('pendingInvite');
          apiClient.get(`/users/public/${pendingUsername}`).then(r => {
            if (r.data) {
              setInviteUsername(pendingUsername);
              setInviteUserData({
                firstName: r.data.first_name || '',
                lastName: r.data.last_name || '',
                avatarUrl: r.data.avatar_url || '',
                bio: r.data.bio || '',
              });
            }
          }).catch(() => {});
        }
      }
    });
  }, [handleIncomingMessage, loadUserChats, checkAdmin]);

  const handleLogout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {}
    disconnect();
    clearSession();
    setIsLoggedIn(false);
    setUserData(null);
    setSavedChats([]);
    setActiveChat(null);
    setShowLogoutConfirm(false);
    window.location.href = '/';
  }, []);

  // ============================================
  // QR-КОД ДЕЙСТВИЯ
  // ============================================
  const handleOpenQR = useCallback(() => {
    setShowQR(true);
  }, []);

  const handleCloseQR = useCallback(() => {
    setShowQR(false);
  }, []);

  const handleOpenScanner = useCallback(() => {
    setShowQR(false);
    setTimeout(() => setShowScanner(true), 200);
  }, []);

  const handleCopyInviteLink = useCallback(() => {
    const link = `${FRONTEND_URL}/invite/${userData?.username}`;
    navigator.clipboard.writeText(link);
  }, [userData?.username]);

  // ============================================
  // РЕНДЕР QR МОДАЛКИ (С ССЫЛКОЙ ДЛЯ ВХОДА)
  // ============================================
  const renderQRModal = () => {
    const qrValue = `${FRONTEND_URL}/qr/register/${qrSessionId || 'test'}`;
    
    return (
      <div className="modal-overlay qr-fullscreen-overlay" onClick={handleCloseQR}>
        <div className="qr-fullscreen" onClick={e => e.stopPropagation()}>
          <button className="qr-close-btn" onClick={handleCloseQR} aria-label="Закрыть QR">✕</button>
          
          <div className="qr-avatar-section">
            <div className="qr-avatar-circle">
              {userData?.avatar ? (
                <img src={userData.avatar} alt="" />
              ) : (
                <span>{userData?.username?.charAt(0)?.toUpperCase() || 'M'}</span>
              )}
            </div>
            <h2>{userData?.username}</h2>
            <p>@{userData?.username}</p>
            {isPremium && <div className="premium-badge">💎 Premium</div>}
          </div>
          
          <div className="qr-code-wrapper" style={{
            borderRadius: '24px',
            overflow: 'hidden',
            background: 'white',
            padding: '16px',
            boxShadow: '0 8px 28px rgba(0, 0, 0, 0.12)'
          }}>
            <QRCodeSVG 
              value={qrValue}
              size={250}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
              style={{ borderRadius: '16px' }}
            />
            <div className="qr-logo-overlay" style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img src="/assets/images/icon-32.png" alt="M" style={{ width: '32px', height: '32px' }} />
            </div>
          </div>
          
          <div className="qr-actions">
            <button className="qr-action-btn primary" onClick={handleCopyInviteLink}>
              <Icon name="copy" size={18} /> Скопировать ссылку
            </button>
            <button className="qr-action-btn secondary" onClick={handleOpenScanner}>
              <Icon name="camera" size={18} /> Сканировать QR
            </button>
            <button className="qr-action-btn premium" onClick={() => setShowQRLogin(true)}>
              <Icon name="qr" size={18} /> Вход по QR
            </button>
          </div>
          
          <p className="qr-hint">
            Отсканируйте QR-код в разделе<br/>
            <strong>Настройки → Устройства → Сканировать QR-код</strong><br/>
            чтобы войти в аккаунт на этом устройстве
          </p>
        </div>
      </div>
    );
  };

  // ============================================
  // РЕНДЕР (УСЛОВНЫЙ)
  // ============================================

  if (showCompleteRegistration && completeRegistrationData) {
    return (
      <CompleteRegistration
        email={completeRegistrationData.email}
        googleId={completeRegistrationData.googleId}
        firstName={completeRegistrationData.firstName}
        lastName={completeRegistrationData.lastName}
        avatarUrl={completeRegistrationData.avatar}
        onComplete={async (token) => {
          await saveSession(token, { id: 0, username: '', firstName: '', lastName: '' });
          if (window.opener && !window.opener.closed) {
            window.opener.location.href = '/';
            window.close();
          } else {
            window.location.href = '/';
          }
        }}
      />
    );
  }

  const registerMatch = window.location.pathname === '/register-username';
  if (registerMatch) {
    return <RegisterUsername />;
  }

  if (window.location.pathname === '/install/android') {
    return <InstallPage />;
  }

  const shareMatch = window.location.pathname === '/share';
  if (shareMatch) {
    return (
      <React.Suspense fallback={<div className="loading-spinner" />}>
        <SharePage />
      </React.Suspense>
    );
  }

  if (showAdmin && isLoggedIn) {
    if (!adminChecked) {
      return (
        <div className="loading-screen">
          <img src="/assets/images/icon-192.png" alt="Monogram" style={{ width: 120, height: 120 }} />
          <h1>Проверка прав...</h1>
          <div className="loading-bar"><div className="loading-progress" /></div>
        </div>
      );
    }
    if (!isAdmin) {
      return (
        <div className="admin-access-denied">
          <div className="admin-access-denied-card">
            <div className="admin-access-denied-icon">🔒</div>
            <h1>Доступ запрещён</h1>
            <p>На эту страницу могут попасть только администраторы.</p>
            <div className="admin-access-denied-actions">
              <button className="admin-access-denied-btn primary" onClick={() => { window.location.href = '/'; setShowAdmin(false); }}>Перейти в мессенджер</button>
              <button className="admin-access-denied-btn secondary" onClick={() => setShowLogoutConfirm(true)}>Выйти</button>
            </div>
          </div>
        </div>
      );
    }
    return <AdminPanel onBack={() => { window.location.href = '/'; setShowAdmin(false); }} onLogout={() => setShowLogoutConfirm(true)} />;
  }

  if (showAdmin && !isLoggedIn) return <Login onLogin={handleLogin} />;
  if (notFound) return <NotFound title="404" message="Такой страницы не существует" description="Страница не найдена." onClose={() => { setNotFound(false); window.history.replaceState({}, '', '/'); }} />;
  if (isLoading) return <div className="loading-screen">Загрузка...</div>;

  // ============================================
  // ОСНОВНОЙ РЕНДЕР
  // ============================================
  return (
    <div className="app-container">
      {/* Уведомление о новом устройстве */}
      {showNewDeviceAlert && newDeviceInfo && (
        <NewDeviceAlert
          onConfirm={handleConfirmDevice}
          onDeny={handleDenyDevice}
          deviceInfo={newDeviceInfo}
        />
      )}
      
      {/* Приглашения и ошибки */}
      {inviteError && !isLoggedIn && (
        <NotFound title="Ошибка" message="Чат не найден" description="Ссылка недействительна." onClose={() => { setInviteError(false); window.history.replaceState({}, '', '/'); }} />
      )}
      {inviteUsername && isLoggedIn && !inviteError && (
        <InviteModal
          username={inviteUsername}
          firstName={inviteUserData?.firstName || ''}
          lastName={inviteUserData?.lastName || ''}
          avatarUrl={inviteUserData?.avatarUrl || ''}
          bio={inviteUserData?.bio || ''}
          onStartChat={() => { setInviteUserData(null); handleStartChat(inviteUsername!); }}
          onClose={() => { setInviteUsername(null); setInviteUserData(null); window.history.replaceState({}, '', '/'); }}
          isLoggedIn={isLoggedIn}
          isSelf={userData?.username?.toLowerCase() === inviteUsername?.toLowerCase()}
        />
      )}

      {/* Основное содержимое */}
      {!isLoggedIn ? (
        showWelcome ? (
          <WelcomeScreen 
            onLogin={() => setShowWelcome(false)}
            onRegister={() => setShowWelcome(false)}
            onOpenScanner={() => setShowScanner(true)}
          />
        ) : (
          <Login onLogin={handleLogin} />
        )
      ) : (
        <div className="app-main-layout">
          {/* Мобильная версия: всегда показываем чат на весь экран */}
          {isMobileLayout ? (
            activeChat ? (
              <div className="chat-fullscreen">
                <div className="chat-fullscreen-header">
                  <button className="back-to-chats" onClick={() => setActiveChat(null)} aria-label="Назад к чатам">
                    <Icon name="arrow" size={24} />
                  </button>
                  <div className="chat-fullscreen-name">{activeChat.name}</div>
                  <div style={{ width: 40 }} />
                </div>
                  <ChatWindow 
                    chatId={activeChat.id} 
                    chatName={activeChat.name} 
                    currentUserId={userData?.id || 1} 
                    onChatHeaderClick={() => setShowChatInfo(true)}
                    e2eeEnabled={e2eeEnabled}
                    onForwardMessage={(id) => setForwardMessageId(id)}
                    onSaveDraft={(chatId, text) => saveDraft(chatId, text)}
                    chatType={activeChat.type || 'private'}
                    onStartCall={(peerId, peerName) => setActiveCall({
                      chatId: activeChat.id,
                      userId: userData?.id || 1,
                      peerId,
                      peerName,
                    })}
                    onMessageSent={() => loadUserChats()}
                  />
              </div>
            ) : (
              // На телефоне если нет активного чата - показываем сайдбар с выбором чата
              <Sidebar
                chats={savedChats}
                activeChatId={activeChat ? (activeChat as { id: number; name: string; type?: string }).id : 0}
                onChatSelect={(id, name) => { setActiveChat({ id, name }); closeSidebar(); }}
                onProfileClick={() => setShowProfile(true)}
                onSettingsClick={() => setShowSettings(true)}
                onNotificationsClick={() => setShowNotifications(true)}
                onLogout={() => setShowLogoutConfirm(true)}
                onCreateGroup={() => setShowGroup(true)}
                onCreateChannel={() => setShowChannel(true)}
                onAddChat={() => setShowAddChat(true)}
                userData={userData}
                isAdmin={isAdmin}
                isPremium={isPremium}
                onAdminClick={() => { window.location.href = '/config'; setShowAdmin(true); }}
                onPremiumClick={() => setShowPremium(true)}
                onPinChat={handlePinChat}
                onArchiveChat={handleArchiveChat}
                onMuteChat={handleMuteChat}
                isOpen={sidebarOpen}
                onClose={closeSidebar}
              />
            )
          ) : (
            // Десктопная версия: сайдбар + контент
            <>
              <Sidebar
                chats={savedChats}
                activeChatId={activeChat ? activeChat.id : 0}
                onChatSelect={(id, name) => { setActiveChat({ id, name }); closeSidebar(); }}
                onProfileClick={() => setShowProfile(true)}
                onSettingsClick={() => setShowSettings(true)}
                onNotificationsClick={() => setShowNotifications(true)}
                onLogout={() => setShowLogoutConfirm(true)}
                onCreateGroup={() => setShowGroup(true)}
                onCreateChannel={() => setShowChannel(true)}
                onAddChat={() => setShowAddChat(true)}
                userData={userData}
                isAdmin={isAdmin}
                isPremium={isPremium}
                onAdminClick={() => { window.location.href = '/config'; setShowAdmin(true); }}
                onPremiumClick={() => setShowPremium(true)}
                onPinChat={handlePinChat}
                onArchiveChat={handleArchiveChat}
                onMuteChat={handleMuteChat}
                isOpen={sidebarOpen}
                onClose={closeSidebar}
              />
              <div className="app-content">
                {activeChat ? (
                  <ChatWindow 
                    chatId={activeChat.id} 
                    chatName={activeChat.name} 
                    currentUserId={userData?.id || 1} 
                    onChatHeaderClick={() => setShowChatInfo(true)}
                    e2eeEnabled={e2eeEnabled}
                    onForwardMessage={(id) => setForwardMessageId(id)}
                    onSaveDraft={(chatId, text) => saveDraft(chatId, text)}
                    onMessageSent={() => loadUserChats()}
                  />
                ) : (
                  <div className="welcome-screen">
                    <Icon name="send" size={72} />
                    <h2>Добро пожаловать в Monogram</h2>
                    <p>Выберите чат или создайте новый</p>
                    {isPremium && <div className="premium-welcome-badge">✨ Премиум аккаунт ✨</div>}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Модальные окна */}
      {showProfile && (
        <ProfileModal 
          onClose={() => setShowProfile(false)} 
          userData={userData} 
          onSave={setUserData}
          onShowQR={handleOpenQR}
        />
      )}
      {showSettings && (
        <React.Suspense fallback={<div className="loading-spinner" />}>
          <SettingsModal 
            onClose={() => setShowSettings(false)} 
            e2eeEnabled={e2eeEnabled}
            onToggleE2EE={handleToggleE2EE}
            biometricSupported={biometricSupported}
            biometricEnabled={biometricEnabled}
            onToggleBiometric={toggleBiometric}
            isMobile={isMobile}
            isPremium={isPremium}
          />
        </React.Suspense>
      )}
      {showNotifications && <NotificationsModal onClose={() => setShowNotifications(false)} />}
      {showAddChat && <AddChatModal onClose={() => setShowAddChat(false)} onAddChat={handleAddNewChat} />}
      {showGroup && <GroupModal onClose={() => setShowGroup(false)} onChatSelect={(id, name) => setActiveChat({ id, name })} />}
      {showChannel && <ChannelModal onClose={() => setShowChannel(false)} onChatSelect={(id, name) => setActiveChat({ id, name })} />}
      {showChatInfo && activeChat !== null && (
        <ChatInfoModal 
          onClose={() => setShowChatInfo(false)} 
          chat={activeChat}
          currentUserId={userData?.id}
        />
      )}
      {showLogoutConfirm && (
        <ConfirmModal
          title="Выход из аккаунта"
          message="Вы уверены, что хотите выйти?"
          confirmText="Выйти"
          cancelText="Отмена"
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
          danger
        />
      )}
      
      {/* QR и сканер */}
      {showQR && renderQRModal()}
      {showScanner && <QRScanner onClose={() => setShowScanner(false)} onScanSuccess={(result) => console.debug('Scanned:', result)} />}
      {showQRLogin && <QRLogin onClose={() => setShowQRLogin(false)} />}
      {showPremium && (
        <React.Suspense fallback={<div className="loading-spinner" />}>
          <PremiumModal onClose={() => setShowPremium(false)} />
        </React.Suspense>
      )}
      {forwardMessageId && (
        <React.Suspense fallback={<div className="loading-spinner" />}>
          <ForwardDialog
            messageId={forwardMessageId}
            onClose={() => setForwardMessageId(null)}
            onDone={() => { setForwardMessageId(null); }}
          />
        </React.Suspense>
      )}

      {/* Call Screen */}
      {activeCall && (
        <React.Suspense fallback={<div className="loading-spinner" />}>
          <CallScreen
            chatId={activeCall.chatId}
            userId={activeCall.userId}
            peerId={activeCall.peerId}
            peerName={activeCall.peerName}
            onEnd={() => setActiveCall(null)}
          />
        </React.Suspense>
      )}

      {/* Group Call Screen */}
      {groupCall && (
        <React.Suspense fallback={<div className="loading-spinner" />}>
          <GroupCallScreen
            roomId={groupCall.roomId}
            userId={groupCall.userId}
            onEnd={() => setGroupCall(null)}
          />
        </React.Suspense>
      )}

      {isLoggedIn && <PwaInstallBanner />}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* QuarkPay Connect Prompt */}
      {showQuarkPayConnect && (
        <div className="modal-overlay" onClick={() => setShowQuarkPayConnect(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: 440, textAlign: 'center', padding: '2rem'}}>
            <div style={{width: 64, height: 64, background: 'linear-gradient(135deg, #00d4aa, #00b894)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '1.5rem', fontWeight: 800, color: '#000'}}>Q</div>
            <h2 style={{marginBottom: 12}}>Подключить QuarkPay?</h2>
            <p style={{color: 'var(--text-secondary)', marginBottom: 8, fontSize: '0.9rem'}}>QuarkPay получит доступ к:</p>
            <ul style={{textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20, paddingLeft: 20}}>
              <li>Ваше имя и аватарка</li>
              <li>Отправка денег по QuarkPay прямо в чатах</li>
              <li>Если у собеседника подключён QuarkPay</li>
            </ul>
            <div style={{display: 'flex', gap: 12, justifyContent: 'center'}}>
              <button className="btn-secondary" onClick={() => setShowQuarkPayConnect(false)}>Позже</button>
              <a href="https://f1w6ggb2-5174.euw.devtunnels.ms/" target="_blank" rel="noopener" className="btn-primary" style={{textDecoration: 'none', padding: '12px 24px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', borderRadius: 12, fontWeight: 600, border: 'none', cursor: 'pointer'}}>Подключить</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

