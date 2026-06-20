import React from 'react';
import { useAdaptiveLayout } from '../../hooks/useAdaptiveLayout';

interface AdaptiveLayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
}

const AdaptiveLayout: React.FC<AdaptiveLayoutProps> = ({
  sidebar, content, sidebarOpen, onCloseSidebar
}) => {
  const { isDesktop } = useAdaptiveLayout();

  return (
    <div className="adaptive-layout">
      {isDesktop ? (
        <div className="adaptive-layout-desktop">
          <div className="adaptive-sidebar">{sidebar}</div>
          <div className="adaptive-content">{content}</div>
        </div>
      ) : (
        <div className="adaptive-layout-mobile">
          {sidebarOpen && (
            <>
              <div className="adaptive-mobile-overlay" onClick={onCloseSidebar} />
              <div className="adaptive-sidebar adaptive-sidebar-mobile">{sidebar}</div>
            </>
          )}
          <div className="adaptive-content">{content}</div>
        </div>
      )}
    </div>
  );
};

export default AdaptiveLayout;
