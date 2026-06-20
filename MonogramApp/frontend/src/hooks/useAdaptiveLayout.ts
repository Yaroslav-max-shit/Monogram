import { useState, useEffect, useCallback } from 'react';

interface AdaptiveLayoutState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isFoldable: boolean;
  isLandscape: boolean;
  sidebarOpen: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  windowSize: {
    width: number;
    height: number;
  };
}

export const useAdaptiveLayout = (initialSidebarState: boolean = false) => {
  const [state, setState] = useState<AdaptiveLayoutState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isFoldable: false,
    isLandscape: false,
    sidebarOpen: initialSidebarState,
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
    windowSize: { width: window.innerWidth, height: window.innerHeight }
  });

  // Определение типа устройства
  const checkDevice = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ua = navigator.userAgent;
    
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isFoldable = width <= 280;
    const isLandscape = width > height;
    
    let isMobile = false;
    let isTablet = false;
    let isDesktop = false;
    
    if (width < 768) {
      isMobile = true;
      isTablet = false;
      isDesktop = false;
    } else if (width >= 768 && width < 1024) {
      isMobile = false;
      isTablet = true;
      isDesktop = false;
    } else {
      isMobile = false;
      isTablet = false;
      isDesktop = true;
    }
    
    // Для foldable телефонов принудительно считаем мобильными
    if (isFoldable) {
      isMobile = true;
      isTablet = false;
    }
    
    return { isMobile, isTablet, isDesktop, isFoldable, isLandscape };
  }, []);

  // Получение safe-area-insets
  const getSafeAreaInsets = useCallback((): { top: number; bottom: number; left: number; right: number } => {
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('env(safe-area-inset-top)')) || 0,
      bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
      left: parseInt(style.getPropertyValue('env(safe-area-inset-left)')) || 0,
      right: parseInt(style.getPropertyValue('env(safe-area-inset-right)')) || 0
    };
  }, []);

  // Обновление состояния при ресайзе
  const updateLayout = useCallback(() => {
    const device = checkDevice();
    const safeArea = getSafeAreaInsets();
    
    setState(prev => ({
      ...prev,
      ...device,
      windowSize: { width: window.innerWidth, height: window.innerHeight },
      safeAreaInsets: safeArea
    }));
  }, [checkDevice, getSafeAreaInsets]);

  // Открытие/закрытие сайдбара
  const toggleSidebar = useCallback(() => {
    setState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
  }, []);

  const openSidebar = useCallback(() => {
    setState(prev => ({ ...prev, sidebarOpen: true }));
  }, []);

  const closeSidebar = useCallback(() => {
    setState(prev => ({ ...prev, sidebarOpen: false }));
  }, []);

  // Автоматическое закрытие сайдбара при ресайзе на десктоп
  useEffect(() => {
    if (state.isDesktop && state.sidebarOpen) {
      closeSidebar();
    }
  }, [state.isDesktop]);

  // Обработчик ресайза
  useEffect(() => {
    updateLayout();
    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', updateLayout);
    
    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('orientationchange', updateLayout);
    };
  }, [updateLayout]);

  // Установка CSS-переменных для safe-area
  useEffect(() => {
    document.documentElement.style.setProperty('--safe-area-top', `${state.safeAreaInsets.top}px`);
    document.documentElement.style.setProperty('--safe-area-bottom', `${state.safeAreaInsets.bottom}px`);
    document.documentElement.style.setProperty('--safe-area-left', `${state.safeAreaInsets.left}px`);
    document.documentElement.style.setProperty('--safe-area-right', `${state.safeAreaInsets.right}px`);
  }, [state.safeAreaInsets]);

  // Добавление/удаление класса для затемнения фона
  useEffect(() => {
    if (state.sidebarOpen && state.isMobile) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [state.sidebarOpen, state.isMobile]);

  return {
    ...state,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    isMobileLayout: state.isMobile || state.isFoldable,
    isTabletLayout: state.isTablet,
    isDesktopLayout: state.isDesktop,
    shouldShowHamburger: state.isMobile || state.isTablet
  };
};

export default useAdaptiveLayout;