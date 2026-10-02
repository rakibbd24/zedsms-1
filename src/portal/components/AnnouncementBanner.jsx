import React from 'react';
import { Icon } from './Icon';

export const AnnouncementBanner = ({ announcement, onDismiss }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        marginBottom: '12px',
        borderRadius: 'var(--r-card)',
        background: 'var(--accent-soft)',
        border: `1px solid var(--accent-border)`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-border)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          height: '18px',
          minWidth: '18px',
          marginTop: '3px',
          color: 'var(--accent)',
        }}
      >
        <Icon name="bell" size={16} strokeWidth={2} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {announcement.title && (
          <h4
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--accent)',
              margin: '0 0 4px 0',
            }}
          >
            {announcement.title}
          </h4>
        )}
        {announcement.message && (
          <p
            style={{
              fontSize: '13px',
              lineHeight: '1.4',
              color: 'var(--text-muted)',
              margin: '0 0 8px 0',
            }}
          >
            {announcement.message}
          </p>
        )}
        {announcement.action_text && announcement.action_link && (
          <a
            href={announcement.action_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent)',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            {announcement.action_text}
            <Icon name="arrow-right" size={12} strokeWidth={2} />
          </a>
        )}
      </div>

      {announcement.dismissible && (
        <button
          onClick={() => onDismiss(announcement.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            minWidth: '20px',
            padding: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-faint)',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-faint)')}
        >
          <Icon name="x" size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
};
