import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import apiClient from '../../services/api';

interface BusinessHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

interface BusinessProfileProps {
  userId: number;
  isPremium: boolean;
}

const BusinessProfile: React.FC<BusinessProfileProps> = ({ userId, isPremium }) => {
  const [businessData, setBusinessData] = useState({
    name: '',
    description: '',
    hours: [] as BusinessHours[],
    addresses: [] as string[],
    phone: '',
    email: '',
    website: '',
    showAllAddresses: false,
  });
  const [editing, setEditing] = useState(false);
  const [showAllAddresses, setShowAllAddresses] = useState(false);

  const daysOfWeek = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

  useEffect(() => {
    if (isPremium) {
      loadBusinessProfile();
    }
  }, [isPremium]);

  const loadBusinessProfile = async () => {
    try {
      const res = await apiClient.get(`/users/${userId}/business`);
      setBusinessData(res.data);
    } catch (error) {
      console.error('Ошибка загрузки бизнес-профиля:', error);
    }
  };

  const saveBusinessProfile = async () => {
    try {
      await apiClient.put(`/users/${userId}/business`, businessData);
      setEditing(false);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  if (!isPremium) {
    return (
      <div className="business-premium-prompt">
        <Icon name="crown" size={48} />
        <h3>Бизнес-профиль</h3>
        <p>Откройте бизнес-профиль с Premium подпиской</p>
        <button className="premium-upgrade-btn">Оформить Premium</button>
      </div>
    );
  }

  return (
    <div className="business-profile">
      <div className="business-header">
        <h3>Бизнес-профиль</h3>
        <button onClick={() => setEditing(!editing)}>
          <Icon name="edit" size={18} /> {editing ? 'Отмена' : 'Редактировать'}
        </button>
      </div>

      {editing ? (
        <div className="business-edit-form">
          <input
            type="text"
            placeholder="Название компании"
            value={businessData.name}
            onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })}
          />
          <textarea
            placeholder="Описание"
            value={businessData.description}
            onChange={(e) => setBusinessData({ ...businessData, description: e.target.value })}
          />
          
          <h4>Часы работы</h4>
          {daysOfWeek.map((day, idx) => (
            <div key={day} className="business-hours-row">
              <span>{day}</span>
              <input
                type="time"
                value={businessData.hours[idx]?.open || '09:00'}
                onChange={(e) => {
                  const newHours = [...businessData.hours];
                  newHours[idx] = { ...newHours[idx], open: e.target.value };
                  setBusinessData({ ...businessData, hours: newHours });
                }}
              />
              <span>-</span>
              <input
                type="time"
                value={businessData.hours[idx]?.close || '18:00'}
                onChange={(e) => {
                  const newHours = [...businessData.hours];
                  newHours[idx] = { ...newHours[idx], close: e.target.value };
                  setBusinessData({ ...businessData, hours: newHours });
                }}
              />
              <label>
                <input
                  type="checkbox"
                  checked={businessData.hours[idx]?.closed || false}
                  onChange={(e) => {
                    const newHours = [...businessData.hours];
                    newHours[idx] = { ...newHours[idx], closed: e.target.checked };
                    setBusinessData({ ...businessData, hours: newHours });
                  }}
                />
                Выходной
              </label>
            </div>
          ))}

          <h4>Адреса (до 5 основных)</h4>
          {businessData.addresses.slice(0, 5).map((addr, idx) => (
            <input
              key={idx}
              type="text"
              placeholder={`Адрес ${idx + 1}`}
              value={addr}
              onChange={(e) => {
                const newAddresses = [...businessData.addresses];
                newAddresses[idx] = e.target.value;
                setBusinessData({ ...businessData, addresses: newAddresses });
              }}
            />
          ))}
          <button onClick={() => setBusinessData({ ...businessData, addresses: [...businessData.addresses, ''] })}>
            + Добавить адрес
          </button>

          <h4>Контакты</h4>
          <input
            type="tel"
            placeholder="Телефон"
            value={businessData.phone}
            onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            value={businessData.email}
            onChange={(e) => setBusinessData({ ...businessData, email: e.target.value })}
          />
          <input
            type="url"
            placeholder="Сайт"
            value={businessData.website}
            onChange={(e) => setBusinessData({ ...businessData, website: e.target.value })}
          />

          <button className="save-btn" onClick={saveBusinessProfile}>Сохранить</button>
        </div>
      ) : (
        <div className="business-view">
          <h2>{businessData.name}</h2>
          <p>{businessData.description}</p>
          
          <h4>Часы работы</h4>
          {businessData.hours.map((hour, idx) => (
            <div key={idx}>
              <strong>{daysOfWeek[idx]}</strong>
              {hour.closed ? ' Выходной' : ` ${hour.open} - ${hour.close}`}
            </div>
          ))}
          
          <h4>Адреса</h4>
          {(showAllAddresses ? businessData.addresses : businessData.addresses.slice(0, 5)).map((addr, idx) => (
            <div key={idx}>📍 {addr}</div>
          ))}
          {businessData.addresses.length > 5 && (
            <button onClick={() => setShowAllAddresses(!showAllAddresses)}>
              {showAllAddresses ? 'Свернуть' : `Показать все (${businessData.addresses.length})`}
            </button>
          )}
          
          {businessData.phone && <div>📞 {businessData.phone}</div>}
          {businessData.email && <div>✉️ {businessData.email}</div>}
          {businessData.website && <div>🌐 {businessData.website}</div>}
        </div>
      )}
    </div>
  );
};

export default BusinessProfile;