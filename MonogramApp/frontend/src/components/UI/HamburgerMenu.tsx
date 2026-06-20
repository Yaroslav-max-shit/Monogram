import React, { useEffect, useState } from 'react';
import Icon from '../Icon';

interface HamburgerMenuProps {
  onMenuClick: () => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ onMenuClick }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <button 
      className="hamburger-menu"
      onClick={onMenuClick}
      aria-label="Открыть меню"
    >
      <Icon name="menu" size={24} />
    </button>
  );
};

export default HamburgerMenu;