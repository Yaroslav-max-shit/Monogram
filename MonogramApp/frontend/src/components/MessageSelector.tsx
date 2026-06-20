import React from 'react';

interface MessageSelectorProps {
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  onClear: () => void;
  onForward: () => void;
  onDelete: () => void;
  onCopy: () => void;
}

const MessageSelector: React.FC<MessageSelectorProps> = ({
  selectedIds,
  onToggle,
  onClear,
  onForward,
  onDelete,
  onCopy,
}) => {
  const count = selectedIds.size;
  if (count === 0) return null;

  return (
    <div className="selection-toolbar">
      <div className="selection-toolbar-left">
        <button className="selection-cancel-btn" onClick={onClear} aria-label="Cancel selection">
          ✕
        </button>
        <span className="selection-count">{count}</span>
      </div>
      <div className="selection-toolbar-actions">
        <button className="selection-action-btn" onClick={onForward} title="Forward">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
          <span>Forward</span>
        </button>
        <button className="selection-action-btn" onClick={onDelete} title="Delete">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" /><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
          <span>Delete</span>
        </button>
        <button className="selection-action-btn" onClick={onCopy} title="Copy">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          <span>Copy</span>
        </button>
      </div>
    </div>
  );
};

export default MessageSelector;
