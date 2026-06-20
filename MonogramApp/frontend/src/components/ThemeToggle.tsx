import React from 'react';
import { useTheme } from './ThemeContext';
import Icon from './Icon';  // ← добавить
import './ThemeToggle.css';

const ThemeToggle: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <button 
      className="theme-toggle" 
      onClick={toggleDarkMode}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? <Icon name="moon" size={22} /> : <Icon name="sun" size={22} />}
    </button>
  );
};

export default ThemeToggle;