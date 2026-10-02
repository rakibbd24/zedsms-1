import React from 'react';
import { Icon } from './Icon';

const getAnnouncementConfig = (type) => {
  const configs = {
    warning: {
      bg: 'bg-[#FEF3C7] dark:bg-[#78350F]/30',
      border: 'border-[#F59E0B]',
      iconName: 'alert-triangle',
      iconColor: 'text-[#F59E0B]',
      titleColor: 'text-[#92400E] dark:text-[#FCD34D]'
    },
    info: {
      bg: 'bg-[#DBEAFE] dark:bg-[#1E3A8A]/30',
      border: 'border-[#3B82F6]',
      iconName: 'info',
      iconColor: 'text-[#3B82F6]',
      titleColor: 'text-[#1E40AF] dark:text-[#93C5FD]'
    },
    success: {
      bg: 'bg-[#D1FAE5] dark:bg-[#065F46]/30',
      border: 'border-[#10B981]',
      iconName: 'check-circle',
      iconColor: 'text-[#10B981]',
      titleColor: 'text-[#065F46] dark:text-[#6EE7B7]'
    },
    error: {
      bg: 'bg-[#FEE2E2] dark:bg-[#7F1D1D]/30',
      border: 'border-[#EF4444]',
      iconName: 'alert-circle',
      iconColor: 'text-[#EF4444]',
      titleColor: 'text-[#991B1B] dark:text-[#FCA5A5]'
    }
  };
  return configs[type] || configs.info;
};

export const AnnouncementBanner = ({ announcement, onDismiss }) => {
  const config = getAnnouncementConfig(announcement.type);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '16px',
        marginBottom: '16px',
        borderLeft: `4px solid var(--accent)`,
        borderRadius: '12px',
        background: 'var(--surface)',
        border: `1px solid var(--border)`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
      className={config.bg}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          minWidth: '20px',
          marginTop: '2px',
        }}
        className={config.iconColor}
      >
        <Icon name={config.iconName} size={18} strokeWidth={2} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '4px',
          }}
          className={config.titleColor}
        >
          {announcement.title}
        </h3>
        {announcement.message && (
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.4',
              color: 'var(--text-muted)',
              marginBottom: announcement.action_text ? '8px' : 0,
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
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--accent)',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
            className="hover:underline"
          >
            {announcement.action_text}
            <Icon name="arrow-right" size={14} strokeWidth={2} />
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
            width: '24px',
            height: '24px',
            minWidth: '24px',
            padding: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <Icon name="x" size={18} strokeWidth={2} />
        </button>
      )}
    </div>
  );
};
