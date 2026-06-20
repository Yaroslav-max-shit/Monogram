import { useState } from 'react';

interface Account {
  userId: number;
  username: string;
  avatarUrl: string;
  token: string;
  needsReauth: boolean;
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>(() => {
    return JSON.parse(localStorage.getItem('accounts') || '[]');
  });
  const [activeIndex, setActiveIndex] = useState(0);

  const addAccount = (account: Account) => {
    setAccounts(prev => {
      const exists = prev.find(a => a.userId === account.userId);
      if (exists) return prev.map(a => a.userId === account.userId ? account : a);
      return [...prev, account];
    });
  };

  const switchAccount = (index: number) => {
    const account = accounts[index];
    if (!account) return;
    if (account.needsReauth) return;
    document.cookie = `access_token=${account.token}; path=/; max-age=86400`;
    localStorage.setItem('token', account.token);
    setActiveIndex(index);
    window.location.reload();
  };

  const removeAccount = (userId: number) => {
    setAccounts(prev => prev.filter(a => a.userId !== userId));
  };

  const markReauth = (userId: number) => {
    setAccounts(prev => prev.map(a => a.userId === userId ? { ...a, needsReauth: true } : a));
  };

  return { accounts, activeIndex, addAccount, switchAccount, removeAccount, markReauth };
}
