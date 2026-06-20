export const APP_ICONS = [
  { name: 'Стандартная', path: '/assets/images/icon-192.png' },
  { name: 'Красочная', path: '/assets/icons/красочная.png' },
  { name: 'Космическая', path: '/assets/icons/космическая.jpg' },
  { name: 'Минимализм', path: '/assets/icons/минимализм.png' },
  { name: 'Неон', path: '/assets/icons/неон.png' },
  { name: 'Тёмная', path: '/assets/icons/тёмная.png' },
];

export function setAppIcon(path: string) {
  const link = document.querySelector('link[rel="icon"]') || document.createElement('link');
  link.setAttribute('rel', 'icon');
  link.setAttribute('href', path);
  document.head.appendChild(link);
  const apple = document.querySelector('link[rel="apple-touch-icon"]') || document.createElement('link');
  apple.setAttribute('rel', 'apple-touch-icon');
  apple.setAttribute('href', path.replace('-192', '-512'));
  document.head.appendChild(apple);
  localStorage.setItem('app_icon', path);
}
