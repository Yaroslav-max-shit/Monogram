import { useEffect } from 'react';
import { saveSession } from '../services/cookies';

const YandexCallback: React.FC = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      saveSession(token, {
        id: payload.user_id,
        username: '',
        firstName: '',
        lastName: '',
      }).then(() => {
        window.location.href = '/';
      });
    }
  }, []);
  
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
    <h2>Вход через Яндекс...</h2>
  </div>;
};

export default YandexCallback;