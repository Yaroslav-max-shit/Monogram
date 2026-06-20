// frontend/src/services/preloader.ts

export const trackResourceLoading = (onProgress: (percent: number) => void) => {
  let loaded = 0;
  let total = 0;
  
  // Получаем все ресурсы на странице
  const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.getAttribute('src'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.getAttribute('href'));
  const images = Array.from(document.querySelectorAll('img[src]')).map(i => i.getAttribute('src'));
  
  const allResources = [
    ...scripts.filter(Boolean),
    ...styles.filter(Boolean),
    ...images.filter(Boolean)
  ];
  
  total = allResources.length;
  
  if (total === 0) {
    onProgress(100);
    return;
  }
  
  const checkComplete = () => {
    loaded++;
    const percent = Math.round((loaded / total) * 100);
    onProgress(percent);
  };
  
  // Отслеживаем загрузку скриптов
  allResources.forEach(src => {
    if (!src) return;
    
    if (src.endsWith('.js') || src.endsWith('.ts') || src.endsWith('.tsx')) {
      const script = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
      if (script) {
        if (script.dataset.loaded === 'true') {
          checkComplete();
        } else {
          script.addEventListener('load', () => {
            script.dataset.loaded = 'true';
            checkComplete();
          });
          script.addEventListener('error', checkComplete);
        }
      } else {
        checkComplete();
      }
    } else if (src.endsWith('.css')) {
      const link = document.querySelector(`link[href="${src}"]`) as HTMLLinkElement | null;
      if (link) {
        if (link.sheet) {
          checkComplete();
        } else {
          link.addEventListener('load', checkComplete);
          link.addEventListener('error', checkComplete);
        }
      } else {
        checkComplete();
      }
    } else if (src.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) {
      const img = new Image();
      img.addEventListener('load', checkComplete);
      img.addEventListener('error', checkComplete);
      img.src = src;
    } else {
      checkComplete();
    }
  });
};

export const preloadApp = async (onProgress: (percent: number) => void) => {
  // Этап 1: загрузка ресурсов страницы (0-60%)
  trackResourceLoading((percent) => {
    onProgress(Math.min(60, percent));
  });
  
  // Этап 2: загрузка React компонентов (60-90%)
  const modules = [
    import('../App'),
    import('../components/Login'),
    import('../components/Sidebar'),
    import('../components/ChatWindow')
  ];
  
  let loaded = 0;
  const total = modules.length;
  
  await Promise.all(modules.map(async (module) => {
    await module;
    loaded++;
    onProgress(60 + Math.round((loaded / total) * 30));
  }));
  
  // Этап 3: финальная инициализация (90-100%)
  onProgress(90);
  await new Promise(resolve => setTimeout(resolve, 200));
  onProgress(100);
};