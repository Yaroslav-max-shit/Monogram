import React, { useEffect, useRef } from 'react';
import Icon from './Icon';
import './MessageContextMenu.css';

interface Message {
  id: number;
  content: string;
  sender_id: number;
  timestamp: string;
}

interface MessageContextMenuProps {
  x: number;
  y: number;
  message: Message;
  isOwn: boolean;
  isForwarded?: boolean;
  onClose: () => void;
  onReply: () => void;
  onQuote: (text: string) => void;
  onEdit: (text: string) => void;
  onDelete: () => void;
  onDeleteForEveryone: () => void;
  onCopy: () => void;
  onForward: () => void;
  onWhoForwarded?: () => void;
}

const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  x,
  y,
  message,
  isOwn,
  isForwarded,
  onClose,
  onReply,
  onQuote,
  onEdit,
  onDelete,
  onDeleteForEveryone,
  onCopy,
  onForward,
  onWhoForwarded,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = React.useState('');

  useEffect(() => {
    const selection = window.getSelection();
    const text = selection?.toString();
    if (text && text.trim()) {
      setSelectedText(text);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let finalX = x;
      let finalY = y;

      if (x + rect.width > viewportWidth) {
        finalX = viewportWidth - rect.width - 10;
      }
      if (y + rect.height > viewportHeight) {
        finalY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${finalX}px`;
      menuRef.current.style.top = `${finalY}px`;
    }
  }, [x, y]);

  const handleEdit = () => {
    const newText = prompt('Редактировать сообщение:', message.content);
    if (newText && newText !== message.content) {
      onEdit(newText);
    }
    onClose();
  };

  const handleQuoteClick = () => {
    if (selectedText) {
      onQuote(selectedText);
    } else {
      onQuote(message.content);
    }
    onClose();
  };

  return (
    <div className="context-menu" ref={menuRef}>
      <div className="context-menu-item" onClick={onReply}>
        <Icon name="reply" size={18} />
        <span>Ответить</span>
      </div>
      
      <div className="context-menu-item" onClick={handleQuoteClick}>
        <Icon name="quote" size={18} />
        <span>{selectedText ? 'Цитировать выделенное' : 'Цитировать'}</span>
      </div>
      
      <div className="context-menu-item" onClick={onForward}>
        <Icon name="forward" size={18} />
        <span>Переслать</span>
      </div>
      
      <div className="context-menu-item" onClick={onCopy}>
        <Icon name="copy" size={18} />
        <span>Копировать</span>
      </div>
      
      {isForwarded && onWhoForwarded && (
        <div className="context-menu-item" onClick={onWhoForwarded}>
          <Icon name="forward" size={18} />
          <span>Кто переслал</span>
        </div>
      )}

      {isOwn && (
        <>
          <div className="context-menu-item" onClick={handleEdit}>
            <Icon name="edit" size={18} />
            <span>Редактировать</span>
          </div>
          <div className="context-menu-divider" />
          <div className="context-menu-item" onClick={onDelete}>
            <Icon name="delete" size={18} />
            <span>Удалить у себя</span>
          </div>
          <div className="context-menu-item danger" onClick={onDeleteForEveryone}>
            <Icon name="delete" size={18} />
            <span>Удалить у всех</span>
          </div>
        </>
      )}
    </div>
  );
};

export default MessageContextMenu;