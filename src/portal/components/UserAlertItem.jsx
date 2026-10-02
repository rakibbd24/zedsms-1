import React from 'react';
import { Icon } from './Icon';

const getAlertConfig = (type) => {
  const configs = {
    warning: {
      bg: 'bg-[#FEF3C7] dark:bg-[#78350F]/30',
      border: 'border-l-[#F59E0B]',
      iconName: 'alert-triangle',
      iconColor: 'text-[#F59E0B]',
      titleColor: 'text-[#92400E] dark:text-[#FCD34D]'
    },
    info: {
      bg: 'bg-[#DBEAFE] dark:bg-[#1E3A8A]/30',
      border: 'border-l-[#3B82F6]',
      iconName: 'info',
      iconColor: 'text-[#3B82F6]',
      titleColor: 'text-[#1E40AF] dark:text-[#93C5FD]'
    },
    success: {
      bg: 'bg-[#D1FAE5] dark:bg-[#065F46]/30',
      border: 'border-l-[#10B981]',
      iconName: 'check-circle',
      iconColor: 'text-[#10B981]',
      titleColor: 'text-[#065F46] dark:text-[#6EE7B7]'
    },
    error: {
      bg: 'bg-[#FEE2E2] dark:bg-[#7F1D1D]/30',
      border: 'border-l-[#EF4444]',
      iconName: 'alert-circle',
      iconColor: 'text-[#EF4444]',
      titleColor: 'text-[#991B1B] dark:text-[#FCA5A5]'
    }
  };
  return configs[type] || configs.info;
};

export const UserAlertItem = ({ alert, onDismiss, onRead }) => {
  const config = getAlertConfig(alert.type);
  const isUnread = !alert.is_read;

  const handleClick = () => {
    if (isUnread) {
      onRead(alert.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'relative',
        padding: '16px',
        borderRadius: '15px',
        borderLeft: `4px solid`,
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
      className={`${config.bg} ${config.border} ${isUnread ? 'ring-2 ring-[#0057FF]/30 dark:ring-[#0057FF]/50' : ''}`}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div
          style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            width: '12px',
            height: '12px',
            background: '#0057FF',
            borderRadius: '50%',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Icon */}
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

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '4px',
            }}
          >
            <h4
              style={{
                fontSize: '14px',
                fontWeight: 600,
                lineHeight: '1.4',
              }}
              className={config.titleColor}
            >
              {alert.title}
            </h4>

            {/* Dismiss Button */}
            {alert.is_dismissible && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(alert.id);
                }}
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
                  transition: 'all 0.2s',
                  borderRadius: '50%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Icon name="x" size={16} strokeWidth={2} />
              </button>
            )}
          </div>

          <p
            style={{
              fontSize: '13px',
              lineHeight: '1.5',
              color: 'var(--text-muted)',
              marginBottom: alert.action_text ? '8px' : '8px',
            }}
          >
            {alert.message}
          </p>

          {/* Action Button */}
          {alert.action_text && alert.action_link && (
            <a
              href={alert.action_link}
              onClick={(e) => e.stopPropagation()}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#0057FF',
                textDecoration: 'none',
                cursor: 'pointer',
                marginBottom: '8px',
              }}
              className="hover:underline"
            >
              {alert.action_text}
              <Icon name="arrow-right" size={12} strokeWidth={2} />
            </a>
          )}

          {/* Category & Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {alert.category && (
              <span
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  fontWeight: 500,
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  borderRadius: '4px',
                  color: 'var(--text-muted)',
                }}
              >
                {alert.category}
              </span>
            )}
            <span
              style={{
                fontSize: '10px',
                color: 'var(--text-faint)',
              }}
            >
              {alert.created_at_human || 'Just now'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
