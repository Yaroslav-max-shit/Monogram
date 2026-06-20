import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  symbol: string;
  rotation: number;
}

const HolidayEffect: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();
    const monthDay = month * 100 + day;

    let symbols: string[] = [];

    if (monthDay >= 1225 || monthDay <= 107) {
      symbols = ['❄️', '❄', '❅', '❆'];
    } else if (monthDay >= 1231 && monthDay <= 101) {
      symbols = ['🎉', '✨', '🎊', '⭐'];
    } else if (monthDay >= 308 && monthDay <= 308) {
      symbols = ['🌸', '🌺', '🌷', '💐'];
    }

    if (symbols.length === 0) return;

    const count = Math.min(20, symbols.length * 5);
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      size: 12 + Math.random() * 12,
      speed: 0.3 + Math.random() * 0.5,
      opacity: 0.5 + Math.random() * 0.5,
      symbol: symbols[i % symbols.length],
      rotation: Math.random() * 360,
    }));

    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles(prev =>
        prev.map(p => {
          let newY = p.y + p.speed;
          if (newY > 105) newY = -10;
          return {
            ...p,
            y: newY,
            x: p.x + Math.sin(newY * 0.05) * 0.15,
            rotation: p.rotation + 0.5,
          };
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="holiday-effect-container">
      {particles.map(p => (
        <div
          key={p.id}
          className="holiday-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            transform: `rotate(${p.rotation}deg)`,
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 9999,
            transition: 'none',
          }}
        >
          {p.symbol}
        </div>
      ))}
    </div>
  );
};

export default HolidayEffect;
