import React from 'react'
import Icon from '../components/Icon'
import './InstallPage.css'

const InstallPage: React.FC = () => {
  return (
    <div className="install-page">
      <div className="install-hero">
        <div className="install-hero-icon">
          <Icon name="shield" size={48} />
        </div>
        <h1>Monogram Messenger</h1>
        <p className="install-hero-subtitle">Безопасный мессенджер с шифрованием</p>
      </div>

      <div className="install-section">
        <div className="install-apk-card">
          <div className="install-apk-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </div>
          <div className="install-apk-info">
            <h3>APK-файл</h3>
            <p>Прямая установка на Android</p>
          </div>
          <div className="install-apk-status">
            <span className="install-badge">Скоро</span>
            <p className="install-hint">Следите за обновлениями в нашем канале</p>
          </div>
        </div>
      </div>

      <div className="install-section">
        <h2>Преимущества</h2>
        <div className="install-features">
          <div className="install-feature">
            <div className="install-feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <h4>Безопасность</h4>
              <p>End-to-end шифрование</p>
            </div>
          </div>
          <div className="install-feature">
            <div className="install-feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <h4>Быстрый доступ</h4>
              <p>Открывается моментально</p>
            </div>
          </div>
          <div className="install-feature">
            <div className="install-feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <div>
              <h4>Уведомления</h4>
              <p>Push-уведомления</p>
            </div>
          </div>
          <div className="install-feature">
            <div className="install-feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <div>
              <h4>Офлайн</h4>
              <p>Просмотр без интернета</p>
            </div>
          </div>
        </div>
      </div>

      <div className="install-section">
        <h2>Как установить</h2>
        <ol className="install-steps">
          <li>
            <span className="install-step-num">1</span>
            <div>
              <h4>Разрешите установку</h4>
              <p>Настройки - Безопасность - Установка из неизвестных источников</p>
            </div>
          </li>
          <li>
            <span className="install-step-num">2</span>
            <div>
              <h4>Скачайте APK</h4>
              <p>Нажмите кнопку скачивания выше (скоро)</p>
            </div>
          </li>
          <li>
            <span className="install-step-num">3</span>
            <div>
              <h4>Откройте файл</h4>
              <p>Нажмите на уведомление о загрузке</p>
            </div>
          </li>
          <li>
            <span className="install-step-num">4</span>
            <div>
              <h4>Установите</h4>
              <p>Нажмите "Установить" и дождитесь завершения</p>
            </div>
          </li>
        </ol>
      </div>

      <div className="install-footer">
        <p>Monogram Messenger</p>
      </div>
    </div>
  )
}

export default InstallPage
