import React from 'react';

interface NewDeviceAlertProps {
  onConfirm: () => void;
  onDeny: () => void;
  deviceInfo: any;
}

const NewDeviceAlert: React.FC<NewDeviceAlertProps> = ({ onConfirm, onDeny, deviceInfo }) => {
  return (
    <div className="modal-overlay">
      <div className="new-device-alert" onClick={e => e.stopPropagation()}>
        <h2>Новое устройство</h2>
        <p>Обнаружен вход с нового устройства:</p>
        {deviceInfo && (
          <div className="device-info">
            <p>Устройство: {deviceInfo.device || deviceInfo.browser || 'Неизвестно'}</p>
            <p>IP: {deviceInfo.ip || 'Неизвестно'}</p>
          </div>
        )}
        <div className="device-actions">
          <button className="btn btn-danger" onClick={onDeny}>Заблокировать</button>
          <button className="btn btn-primary" onClick={onConfirm}>Это я</button>
        </div>
      </div>
    </div>
  );
};

export default NewDeviceAlert;
