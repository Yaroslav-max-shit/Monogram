// frontend/src/utils/formatMessage.ts — ПОЛНОСТЬЮ ИСПРАВЛЕННЫЙ
import React from 'react';

export const formatMessageText = (text: string): React.ReactNode => {
  if (!text) return text;
  
  let formatted = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // **Жирный**
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // *Курсив*
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // `Код`
  formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // ~~Зачёркнутый~~
  formatted = formatted.replace(/~~(.*?)~~/g, '<del>$1</del>');
  
  // Ссылки — only http/https, strip javascript: and other protocols
  formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, (match) => {
    const safeUrl = match.replace(/[^\x20-\x7E]/g, '').substring(0, 2000);
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer nofollow">${safeUrl}</a>`;
  });
  
  // @упоминания
  formatted = formatted.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
  
  return React.createElement('span', { dangerouslySetInnerHTML: { __html: formatted } });
};