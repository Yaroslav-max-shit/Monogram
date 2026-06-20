import React, { useState } from 'react';

interface E2EESettingsProps {
  chatId: number;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  fingerprint?: string;
}

const E2EESettings: React.FC<E2EESettingsProps> = ({ chatId, enabled, onToggle, fingerprint }) => {
  return (
    <div className="e2ee-settings">
      <div className="e2ee-header">
        <div className="e2ee-icon">{enabled ? 'LOCK' : 'UNLOCK'}</div>
        <div>
          <h4>Secret Chat</h4>
          <p className="e2ee-desc">
            {enabled
              ? 'Messages in this chat are end-to-end encrypted.'
              : 'Enable end-to-end encryption for this chat.'}
          </p>
        </div>
      </div>
      <label className="e2ee-toggle">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span className="toggle-slider"></span>
      </label>
      {enabled && fingerprint && (
        <div className="e2ee-fingerprint">
          <div className="fingerprint-label">Encryption key fingerprint:</div>
          <code className="fingerprint-value">{fingerprint}</code>
        </div>
      )}
    </div>
  );
};

export default E2EESettings;