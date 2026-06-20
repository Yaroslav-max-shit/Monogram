import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
  onLogout: () => void
  username: string
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout, username }) => {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="qp-layout">
      <Sidebar onLogout={onLogout} />
      <main className="qp-main">
        <div className="qp-topbar">
          <div ref={menuRef} style={{position: 'relative'}}>
            <button className="qp-avatar-btn" onClick={() => setShowMenu(!showMenu)}>
              {username.charAt(0).toUpperCase()}
            </button>
            {showMenu && (
              <div className="qp-avatar-menu">
                <div style={{padding: '10px 14px', borderBottom: '1px solid var(--qp-border)'}}>
                  <div style={{fontWeight: 600, fontSize: '0.95rem'}}>{username}</div>
                </div>
                <Link to="/settings" className="qp-avatar-menu-item" onClick={() => setShowMenu(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  Настройки аккаунта
                </Link>
                <div className="qp-avatar-menu-divider"></div>
                <button className="qp-avatar-menu-item" onClick={() => { setShowMenu(false); onLogout() }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Выйти
                </button>
              </div>
            )}
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}

export default Layout
