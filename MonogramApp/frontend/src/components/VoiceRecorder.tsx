import React, { useState, useRef, useEffect, useCallback } from 'react';
import Icon from './Icon';
import VoiceWaveform from './VoiceWaveform';
import apiClient from '../services/api';

interface VoiceRecorderProps {
  onSend: () => void;
  chatId?: number;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, chatId }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const swipeStartY = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const setupAnalyser = async (stream: MediaStream) => {
    try {
      audioCtxRef.current = new AudioContext();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
    } catch {
      // silent
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      setRecordingStream(stream);
      await setupAnalyser(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
        setRecordingStream(null);
        if (audioCtxRef.current) {
          audioCtxRef.current.close();
          audioCtxRef.current = null;
        }
        analyserRef.current = null;
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsLocked(false);
      setDuration(0);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Microphone access denied:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const sendRecording = async () => {
    if (audioUrl) {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('audio', blob, 'voice-message.webm');
      
      console.debug('Sending voice message...');
      
      setAudioUrl(null);
      onSend();
    }
  };

  const cancelRecording = () => {
    setAudioUrl(null);
    setDuration(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    swipeStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isRecording || isLocked) return;
    const diff = swipeStartY.current - e.touches[0].clientY;
    if (diff > 50) {
      setIsLocked(true);
    }
  };

  const handleTouchEnd = () => {
    if (isRecording && !isLocked) {
      stopRecording();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.ended) {
        setIsPlaying(false);
      }
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="voice-recorder">
      {!audioUrl ? (
        <div className="recording-controls">
          {!isRecording ? (
            <button className="record-btn" onClick={startRecording}>
              <Icon name="mic" size={24} />
              <span>Record voice message</span>
            </button>
          ) : (
            <div className="recording-active">
              {isLocked && (
                <div className="voice-lock-indicator">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <span>Locked</span>
                </div>
              )}
              <div className="recording-waveform">
                <VoiceWaveform
                  stream={recordingStream || undefined}
                  analyserNode={analyserRef.current || undefined}
                  isActive={isRecording}
                  bars={40}
                />
              </div>
              <div className="recording-time">
                {isLocked && <span className="recording-locked-dot" />}
                {formatTime(duration)}
              </div>
              <button
                className="lock-toggle-btn"
                onClick={() => setIsLocked(!isLocked)}
                title={isLocked ? 'Unlock' : 'Lock recording'}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill={isLocked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </button>
              <button
                className="stop-record-btn"
                onClick={stopRecording}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <Icon name="stop" size={24} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="preview-controls">
          <div className="playback-waveform">
            <VoiceWaveform
              isPlaying={isPlaying}
              duration={audioRef.current?.duration || 0}
              currentTime={currentTime}
              isActive
              bars={50}
            />
          </div>
          <audio
            ref={audioRef}
            src={audioUrl}
            autoPlay
            onTimeUpdate={handleAudioTimeUpdate}
            onLoadedMetadata={() => {
              if (audioRef.current) {
                audioRef.current.playbackRate = playbackSpeed;
              }
            }}
          />
          <div className="playback-controls-row">
            <button className="playback-toggle-btn" onClick={togglePlayback}>
              {isPlaying ? <Icon name="pause" size={20} /> : <Icon name="play" size={20} />}
            </button>
            <span className="playback-time">{formatTime(currentTime)} / {formatTime(audioRef.current?.duration || 0)}</span>
          </div>
          <div className="speed-controls">
            {[0.5, 1, 1.5, 2].map(speed => (
              <button
                key={speed}
                className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                onClick={() => setPlaybackSpeed(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
          <div className="preview-actions">
            <button className="cancel-btn" onClick={cancelRecording}>
              <Icon name="close" size={20} />
            </button>
            <button className="send-btn" onClick={sendRecording}>
              <Icon name="send" size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
