import React, { useRef, useEffect } from 'react';

interface VoiceWaveformProps {
  stream?: MediaStream;
  analyserNode?: AnalyserNode;
  isPlaying?: boolean;
  duration?: number;
  currentTime?: number;
  bars?: number;
  isActive?: boolean;
}

const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  stream,
  analyserNode: externalAnalyser,
  isPlaying = false,
  duration = 0,
  currentTime = 0,
  bars = 50,
  isActive = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const setupAnalyser = async () => {
      if (externalAnalyser) {
        analyserRef.current = externalAnalyser;
        return;
      }

      if (stream) {
        try {
          audioCtxRef.current = new AudioContext();
          sourceRef.current = audioCtxRef.current.createMediaStreamSource(stream);
          const analyser = audioCtxRef.current.createAnalyser();
          analyser.fftSize = 256;
          sourceRef.current.connect(analyser);
          analyserRef.current = analyser;
        } catch {
          // silent fallback
        }
      }
    };

    setupAnalyser();

    const draw = () => {
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      const bufferLength = analyserRef.current?.frequencyBinCount || bars;
      const dataArray = new Uint8Array(bufferLength);

      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
      }

      const barWidth = w / bars;
      const activeBar = isPlaying && duration > 0
        ? Math.floor((currentTime / duration) * bars)
        : -1;

      for (let i = 0; i < bars; i++) {
        const value = analyserRef.current
          ? dataArray[Math.floor(i * bufferLength / bars)] / 255
          : isActive
            ? Math.random() * 0.6 + 0.2
            : 0.15;

        const barHeight = Math.max(value * h * 0.85, 2);
        const x = i * barWidth + barWidth * 0.1;
        const barW = Math.max(barWidth * 0.7, 2);
        const y = (h - barHeight) / 2;

        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#667eea';

        ctx.fillStyle = i <= activeBar ? accentColor : 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        const radius = Math.min(barW / 2, 3);
        const ry = y;
        const rh = barHeight;
        ctx.moveTo(x + radius, ry);
        ctx.lineTo(x + barW - radius, ry);
        ctx.quadraticCurveTo(x + barW, ry, x + barW, ry + radius);
        ctx.lineTo(x + barW, ry + rh - radius);
        ctx.quadraticCurveTo(x + barW, ry + rh, x + barW - radius, ry + rh);
        ctx.lineTo(x + radius, ry + rh);
        ctx.quadraticCurveTo(x, ry + rh, x, ry + rh - radius);
        ctx.lineTo(x, ry + radius);
        ctx.quadraticCurveTo(x, ry, x + radius, ry);
        ctx.closePath();
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, [stream, externalAnalyser, isPlaying, duration, currentTime, bars, isActive]);

  return (
    <canvas
      ref={canvasRef}
      className="voice-waveform-canvas"
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};

export default VoiceWaveform;
