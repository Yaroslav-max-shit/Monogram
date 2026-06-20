import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PREMIUM_PRICES, PREMIUM_FEATURES } from '../../services/premium';
import Icon from '../Icon';

interface PremiumModalProps {
  onClose: () => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<'features' | 'plan' | 'payment' | 'success'>('features');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [paymentCode, setPaymentCode] = useState('');

  const handleSelectPlan = (plan: string) => {
    setSelectedPlan(plan);
    const code = Math.random().toString(36).substring(2, 30);
    setPaymentCode(code);
    setStep('payment');
  };

  const handleQuarkPay = () => {
    window.open(`https://f1w6ggb2-5174.euw.devtunnels.ms/pay/${paymentCode}`, '_blank');
  };

  const handleTestPay = async () => {
    try {
      const { default: apiClient } = await import('../../services/api');
      await apiClient.post('/payment/test-premium', { plan: selectedPlan });
      setStep('success');
      // Конфити
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99999';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          const colors = ['#667eea', '#764ba2', '#f59e0b', '#10b981', '#ec4899', '#00d4aa'];
          const particles: any[] = [];
          for (let i = 0; i < 150; i++) {
            particles.push({ x: Math.random() * canvas.width, y: -20, vx: (Math.random() - 0.5) * 6, vy: Math.random() * 4 + 2, color: colors[Math.floor(Math.random() * colors.length)], size: Math.random() * 10 + 4, life: 1, rotation: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 10 });
          }
          const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = false;
            particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.rotation += p.rotSpeed; p.life -= 0.008; if (p.life > 0) { alive = true; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation * Math.PI / 180); ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6); ctx.restore(); } });
            if (alive) requestAnimationFrame(animate);
          };
          animate();
          setTimeout(() => canvas.remove(), 3000);
        }
      }, 100);
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Ошибка оплаты');
    }
  };

  const features = PREMIUM_FEATURES.premium;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: 480, padding: 0, overflow: 'hidden'}}>
        
        {step === 'features' && (
          <>
            <div style={{background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '32px 24px', textAlign: 'center', color: 'white'}}>
              <Icon name="crown" size={48} />
              <h2 style={{margin: '12px 0 8px', fontSize: '1.5rem'}}>Monogram Premium</h2>
              <p style={{opacity: 0.9, fontSize: '0.9rem'}}>Разблокируйте все возможности</p>
            </div>
            <div style={{padding: '24px'}}>
              <div style={{marginBottom: 24}}>
                {[
                  { icon: 'paint', text: 'Безлимитные обои' },
                  { icon: 'picture', text: 'Свои реакции-фото' },
                  { icon: 'crown', text: 'Premium бейдж' },
                  { icon: 'camera', text: 'Безлимитные истории' },
                  { icon: 'briefcase', text: 'Бизнес-профиль' },
                  { icon: 'emoji', text: 'Эмодзи-статус' },
                  { icon: 'shield', text: 'Приоритетная поддержка' },
                ].map((f, i) => (
                  <div key={i} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-color)'}}>
                    <Icon name={f.icon} size={20} />
                    <span>{f.text}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep('plan')} style={{width: '100%', padding: 14, background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 600, cursor: 'pointer'}}>
                Оформить Premium
              </button>
            </div>
          </>
        )}

        {step === 'plan' && (
          <div style={{padding: '24px'}}>
            <h2 style={{marginBottom: 20, textAlign: 'center'}}>Выберите план</h2>
            <div style={{display: 'flex', gap: 12}}>
              <div onClick={() => handleSelectPlan('month')} style={{flex: 1, padding: 20, background: 'var(--bg-primary)', border: '2px solid var(--border-color)', borderRadius: 16, cursor: 'pointer', textAlign: 'center'}}>
                <div style={{fontSize: '2rem', fontWeight: 700, color: 'var(--accent)'}}>49₽</div>
                <div style={{color: 'var(--text-tertiary)', fontSize: '0.9rem'}}>в месяц</div>
              </div>
              <div onClick={() => handleSelectPlan('year')} style={{flex: 1, padding: 20, background: 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))', border: '2px solid var(--accent)', borderRadius: 16, cursor: 'pointer', textAlign: 'center', position: 'relative'}}>
                <div style={{position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: 'white', padding: '2px 10px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600}}>Выгодно</div>
                <div style={{fontSize: '2rem', fontWeight: 700, color: 'var(--accent)'}}>499₽</div>
                <div style={{color: 'var(--text-tertiary)', fontSize: '0.9rem'}}>в год</div>
              </div>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div style={{padding: '32px 24px', textAlign: 'center'}}>
            <h2 style={{marginBottom: 8}}>Оплата Premium</h2>
            <p style={{color: 'var(--text-tertiary)', marginBottom: 24}}>
              {selectedPlan === 'month' ? '49₽ в месяц' : '499₽ в год'}
            </p>
            
            <div style={{marginBottom: 24}}>
              <QRCodeSVG value={`https://f1w6ggb2-5174.euw.devtunnels.ms/pay/${paymentCode}`} size={200} level="H" />
            </div>

            <button onClick={handleTestPay} style={{width: '100%', padding: 14, background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginBottom: 12}}>
              Тестовая оплата
            </button>
            
            <button onClick={handleQuarkPay} style={{width: '100%', padding: 14, background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 12, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer'}}>
              Оплатить через ЮMoney
            </button>
          </div>
        )}

        {step === 'success' && (
          <div style={{padding: '40px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden'}}>
            <div id="confetti-container" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}></div>
            <div style={{width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'scaleIn 0.3s ease'}}>
              <Icon name="check" size={40} />
            </div>
            <h2 style={{marginBottom: 8}}>Оплата прошла успешно!</h2>
            <p style={{color: 'var(--text-tertiary)', marginBottom: 24}}>
              Premium активирован на {selectedPlan === 'month' ? '1 месяц' : '12 месяцев'}
            </p>
            <button onClick={onClose} style={{width: '100%', padding: 14, background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 600, cursor: 'pointer'}}>
              Продолжить
            </button>
          </div>
        )}

        <button onClick={onClose} style={{position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1.2rem'}}>✕</button>
      </div>
    </div>
  );
};

export default PremiumModal;
