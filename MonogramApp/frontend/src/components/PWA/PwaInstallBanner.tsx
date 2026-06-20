import React, { useState, useEffect } from "react";
import Icon from "../Icon";

const STORAGE_KEY = "pwa_install_data";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface PwaInstallData {
  lastDismissed: number | null;
  firstVisitSeen: boolean;
}

const getStoredData = (): PwaInstallData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { lastDismissed: null, firstVisitSeen: false };
};

const storeData = (data: PwaInstallData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const PwaInstallBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (isInstalled) return;
    const data = getStoredData();

    if (!data.firstVisitSeen) {
      data.firstVisitSeen = true;
      storeData(data);
      setVisible(true);
      return;
    }

    if (data.lastDismissed) {
      const elapsed = Date.now() - data.lastDismissed;
      if (elapsed < WEEK_MS) return;
    }

    setVisible(true);
  }, [isInstalled]);

  if (!visible || isInstalled) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === "accepted") setIsInstalled(true);
      setVisible(false);
      return;
    }
    window.location.href = "/install/android";
  };

  const handleDismiss = () => {
    storeData({ ...getStoredData(), lastDismissed: Date.now() });
    setVisible(false);
  };

  return (
    <div className="pwa-install-banner">
      <div className="pwa-install-banner-inner">
        <div className="pwa-install-banner-icon">
          <Icon name="download" size={20} />
        </div>
        <div className="pwa-install-banner-text">
          <strong>Установить Monogram</strong>
          <span>Быстрее и с уведомлениями</span>
        </div>
        <div className="pwa-install-banner-actions">
          <button className="pwa-install-btn" onClick={handleInstall}>
            Установить
          </button>
          <button className="pwa-install-close" onClick={handleDismiss}>
            <Icon name="x" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PwaInstallBanner;
