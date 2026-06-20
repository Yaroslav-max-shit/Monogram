const AUDIO_CACHE = new Map<string, HTMLAudioElement>();

const DEFAULT_SOUNDS: Record<string, string> = {
  message: '/assets/sounds/message.wav',
  group: '/assets/sounds/group.wav',
  call: '/assets/sounds/call.wav',
  notification: '/assets/sounds/notification.wav',
};

export function playSound(type: keyof typeof DEFAULT_SOUNDS) {
  const customSounds = JSON.parse(localStorage.getItem('custom_sounds') || '{}');
  const src = customSounds[type] || DEFAULT_SOUNDS[type];
  let audio = AUDIO_CACHE.get(src);
  if (!audio) {
    audio = new Audio(src);
    audio.volume = 0.5;
    AUDIO_CACHE.set(src, audio);
  }
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function setCustomSound(type: string, url: string) {
  const sounds = JSON.parse(localStorage.getItem('custom_sounds') || '{}');
  sounds[type] = url;
  localStorage.setItem('custom_sounds', JSON.stringify(sounds));
  AUDIO_CACHE.delete(url);
}

export function resetCustomSound(type: string) {
  const sounds = JSON.parse(localStorage.getItem('custom_sounds') || '{}');
  delete sounds[type];
  localStorage.setItem('custom_sounds', JSON.stringify(sounds));
}
