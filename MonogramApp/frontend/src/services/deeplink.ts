export function parseDeepLink(url: string): { action: string; param: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'monogram:') return null;
    const [action, ...rest] = parsed.pathname.split('/').filter(Boolean);
    return { action, param: rest.join('/') };
  } catch {
    return null;
  }
}

export function handleDeepLink(url: string): void {
  const link = parseDeepLink(url);
  if (!link) return;
  switch (link.action) {
    case 'user':
      window.dispatchEvent(new CustomEvent('navigate', { detail: { type: 'user', username: link.param } }));
      break;
    case 'chat':
      window.dispatchEvent(new CustomEvent('navigate', { detail: { type: 'chat', chatId: parseInt(link.param) } }));
      break;
    case 'join':
      window.dispatchEvent(new CustomEvent('navigate', { detail: { type: 'join', inviteLink: link.param } }));
      break;
  }
}
