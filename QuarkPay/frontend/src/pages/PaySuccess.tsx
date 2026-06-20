import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const PaySuccess: React.FC = () => {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Конфити анимация
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    const particles: Array<{x: number, y: number, vx: number, vy: number, color: string, size: number, life: number}> = []
    const colors = ['#00d4aa', '#667eea', '#764ba2', '#f59e0b', '#10b981', '#ec4899']
    
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        life: 1
      })
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.life -= 0.005
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.fillRect(p.x, p.y, p.size, p.size)
      })
      if (particles.some(p => p.life > 0)) {
        requestAnimationFrame(animate)
      }
    }
    animate()
  }, [])

  return (
    <div className="qp-pay-success">
      <canvas ref={canvasRef} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}} />
      
      <div style={{position: 'relative', zIndex: 1, textAlign: 'center'}}>
        <div style={{width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'}}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        
        <h1 style={{marginBottom: 8}}>Оплата прошла успешно!</h1>
        <p style={{color: 'var(--text-tertiary)', marginBottom: 32}}>Premium активирован</p>
        
        <button onClick={() => navigate('/')} style={{padding: '14px 40px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 600, cursor: 'pointer'}}>
          Продолжить
        </button>
      </div>
    </div>
  )
}

export default PaySuccess
