import React, { useState, useEffect, useRef, useCallback } from 'react';

interface StorySlide {
  id: number;
  type: 'image' | 'video' | 'text';
  url?: string;
  text?: string;
  backgroundColor?: string;
  duration: number;
  viewed: boolean;
}

interface StoryUser {
  id: number;
  username: string;
  avatarUrl: string;
  hasUnviewedStory: boolean;
  slides: StorySlide[];
}

interface Props {
  users: StoryUser[];
  currentUserId: number;
  onStoryView?: (userId: number, storyId: number) => void;
  onReply?: (userId: number, text: string) => void;
}

const StoryCircle: React.FC<{ user: StoryUser; onClick: () => void }> = ({ user, onClick }) => (
  <div className="story-circle" onClick={onClick}>
    <div className={`story-ring ${user.hasUnviewedStory ? 'unviewed' : ''}`}>
      <div className="story-avatar">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" />
        ) : (
          <span>{user.username.charAt(0).toUpperCase()}</span>
        )}
      </div>
    </div>
    <span className="story-username">{user.username}</span>
  </div>
);

const StoryProgress: React.FC<{
  slides: StorySlide[];
  currentIndex: number;
  progress: number;
}> = ({ slides, currentIndex, progress }) => (
  <div className="story-progress">
    {slides.map((slide, idx) => (
      <div key={slide.id} className="story-progress-segment">
        <div
          className="story-progress-bar"
          style={{
            width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
            transition: idx === currentIndex ? `width ${slide.duration}ms linear` : 'none',
          }}
        />
      </div>
    ))}
  </div>
);

const StoryViewer: React.FC<{
  user: StoryUser;
  onClose: () => void;
  onPrevUser: () => void;
  onNextUser: () => void;
  onReply?: (userId: number, text: string) => void;
}> = ({ user, onClose, onPrevUser, onNextUser, onReply }) => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const progressRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isHolding = useRef(false);

  const currentSlide = user.slides[slideIndex];

  useEffect(() => {
    startTimeRef.current = Date.now();
    progressRef.current = 0;
    setProgress(0);

    const startTimer = () => {
      const duration = currentSlide.duration;
      timerRef.current = setInterval(() => {
        if (isHolding.current) return;
        const elapsed = Date.now() - startTimeRef.current;
        const pct = Math.min((elapsed / duration) * 100, 100);
        progressRef.current = pct;
        setProgress(pct);
        if (pct >= 100) {
          clearInterval(timerRef.current);
          if (slideIndex < user.slides.length - 1) {
            setSlideIndex(slideIndex + 1);
          } else {
            onNextUser();
          }
        }
      }, 50);
    };

    startTimer();
    return () => { clearInterval(timerRef.current); };
  }, [slideIndex, user.id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigateSlide(-1);
      else if (e.key === 'ArrowRight') navigateSlide(1);
      else if (e.key === 'Escape') onClose();
      else if (e.key === ' ') { e.preventDefault(); setPaused(p => !p); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [slideIndex, user.slides.length]);

  useEffect(() => {
    if (paused) {
      clearInterval(timerRef.current);
    } else {
      startTimeRef.current = Date.now() - (progressRef.current / 100) * currentSlide.duration;
      const duration = currentSlide.duration;
      timerRef.current = setInterval(() => {
        if (isHolding.current) return;
        const elapsed = Date.now() - startTimeRef.current;
        const pct = Math.min((elapsed / duration) * 100, 100);
        progressRef.current = pct;
        setProgress(pct);
        if (pct >= 100) {
          clearInterval(timerRef.current);
          if (slideIndex < user.slides.length - 1) {
            setSlideIndex(slideIndex + 1);
          } else {
            onNextUser();
          }
        }
      }, 50);
    }
    return () => clearInterval(timerRef.current);
  }, [paused]);

  const navigateSlide = useCallback((dir: number) => {
    clearInterval(timerRef.current);
    const next = slideIndex + dir;
    if (next < 0) {
      onPrevUser();
    } else if (next >= user.slides.length) {
      onNextUser();
    } else {
      setSlideIndex(next);
      setProgress(0);
      progressRef.current = 0;
      startTimeRef.current = Date.now();
    }
  }, [slideIndex, user.slides.length]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (showReply) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    if (x < width * 0.3) {
      navigateSlide(-1);
    } else if (x > width * 0.7) {
      navigateSlide(1);
    } else {
      setPaused(p => !p);
    }
  };

  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (showReply) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.changedTouches[0];
    const x = touch.clientX - rect.left;
    const width = rect.width;
    const dx = touch.clientX - touchStartX.current;
    if (Math.abs(dx) < 30) {
      if (x < width * 0.3) navigateSlide(-1);
      else if (x > width * 0.7) navigateSlide(1);
      else setPaused(p => !p);
    }
  };

  const handleSendReply = () => {
    if (replyText.trim() && onReply) {
      onReply(user.id, replyText.trim());
      setReplyText('');
      setShowReply(false);
    }
  };

  return (
    <div className="story-viewer-overlay" onClick={handleContainerClick}>
      <div className="story-viewer" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <StoryProgress slides={user.slides} currentIndex={slideIndex} progress={progress} />

        <div className="story-header">
          <div className="story-header-user">
            <div className="story-header-avatar">
              {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <span>{user.username.charAt(0).toUpperCase()}</span>}
            </div>
            <span className="story-header-name">{user.username}</span>
            <span className="story-header-time">{Math.floor(currentSlide.duration / 1000)}s</span>
          </div>
          <button className="story-close-btn" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            ✕
          </button>
        </div>

        <div className="story-slide" onClick={e => e.stopPropagation()}>
          {currentSlide.type === 'image' && currentSlide.url && (
            <img src={currentSlide.url} alt="" className="story-media" draggable={false} />
          )}
          {currentSlide.type === 'video' && currentSlide.url && (
            <video src={currentSlide.url} className="story-media" autoPlay muted loop draggable={false} />
          )}
          {currentSlide.type === 'text' && (
            <div className="story-text" style={{ backgroundColor: currentSlide.backgroundColor || '#000' }}>
              <span>{currentSlide.text}</span>
            </div>
          )}
        </div>

        {showReply && (
          <div className="story-reply" onClick={e => e.stopPropagation()}>
            <input
              className="story-reply-input"
              placeholder="Ответить..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSendReply(); }}
              autoFocus
            />
            <button className="story-reply-send" onClick={handleSendReply}>➤</button>
          </div>
        )}

        <button className="story-reply-toggle" onClick={(e) => { e.stopPropagation(); setShowReply(!showReply); }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 11.5C21 16.1944 17.1944 20 12.5 20C11.3954 20 10.3424 19.7815 9.38197 19.3819L4 21L5.61803 15.618C5.21846 14.6575 5 13.6046 5 12.5C5 7.80558 8.80558 4 13.5 4C18.1944 4 21 7.80558 21 11.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

const Stories: React.FC<Props> = ({ users, currentUserId, onStoryView, onReply }) => {
  const [viewingUser, setViewingUser] = useState<StoryUser | null>(null);
  const [viewingIndex, setViewingIndex] = useState(0);

  const handleUserClick = (user: StoryUser) => {
    const idx = users.indexOf(user);
    setViewingIndex(idx);
    setViewingUser(user);
  };

  const handlePrevUser = () => {
    if (viewingIndex > 0) {
      const newIdx = viewingIndex - 1;
      setViewingIndex(newIdx);
      setViewingUser(users[newIdx]);
    } else {
      setViewingUser(null);
    }
  };

  const handleNextUser = () => {
    if (viewingIndex < users.length - 1) {
      const newIdx = viewingIndex + 1;
      setViewingIndex(newIdx);
      setViewingUser(users[newIdx]);
    } else {
      setViewingUser(null);
    }
  };

  if (users.length === 0) return null;

  return (
    <>
      <div className="stories-bar">
        <div className="stories-bar-scroll">
          {users.map(user => (
            <StoryCircle key={user.id} user={user} onClick={() => handleUserClick(user)} />
          ))}
        </div>
      </div>

      {viewingUser && (
        <StoryViewer
          user={viewingUser}
          onClose={() => setViewingUser(null)}
          onPrevUser={handlePrevUser}
          onNextUser={handleNextUser}
          onReply={onReply}
        />
      )}
    </>
  );
};

export default Stories;
export type { StoryUser, StorySlide };
