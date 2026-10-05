import React from 'react';
import { Icon } from './Icon';

const getAlertStyles = (type) => {
  const styles = {
    warning: {
      dot: '#F59E0B',
      bg: 'color-mix(in srgb, #F59E0B 6%, var(--surface))',
      border: 'color-mix(in srgb, #F59E0B 20%, var(--border))',
    },
    info: {
      dot: 'var(--accent)',
      bg: 'color-mix(in srgb, var(--accent) 6%, var(--surface))',
      border: 'color-mix(in srgb, var(--accent) 20%, var(--border))',
    },
    success: {
      dot: 'var(--success)',
      bg: 'color-mix(in srgb, var(--success) 6%, var(--surface))',
      border: 'color-mix(in srgb, var(--success) 20%, var(--border))',
    },
    error: {
      dot: 'var(--danger)',
      bg: 'color-mix(in srgb, var(--danger) 6%, var(--surface))',
      border: 'color-mix(in srgb, var(--danger) 20%, var(--border))',
    },
  };
  return styles[type] || styles.info;
};

export const UserAlertItem = ({ alert, onDismiss, onRead, itemType = 'alert' }) => {
  const isUnread = !alert.is_read && itemType === 'alert';
  const alertStyles = getAlertStyles(alert.type);

  const handleClick = () => {
    if (isUnread) {
      onRead(alert.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        padding: '16px',
        borderRadius: 'var(--r-card)',
        background: isUnread ? alertStyles.bg : 'var(--surface)',
        border: `1px solid ${isUnread ? alertStyles.border : 'var(--border)'}`,
        transition: 'all 0.2s',
        cursor: 'pointer',
        boxShadow: isUnread ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = alertStyles.border;
        if (isUnread) e.currentTarget.style.background = 'color-mix(in srgb, ' + alertStyles.bg + ' 1.2, var(--surface))';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isUnread ? alertStyles.border : 'var(--border)';
        e.currentTarget.style.background = isUnread ? alertStyles.bg : 'var(--surface)';
      }}
    >
      {/* Left Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title */}
        <h4
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text)',
            margin: '0 0 6px 0',
          }}
        >
          {alert.title}
        </h4>

        {/* Message */}
        <p
          style={{
            fontSize: '13px',
            lineHeight: '1.5',
            color: 'var(--text-muted)',
            margin: '0 0 8px 0',
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
              display: 'inline-block',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--accent)',
              textDecoration: 'none',
              cursor: 'pointer',
              marginBottom: '8px',
            }}
          >
            {alert.action_text}
          </a>
        )}

        {/* Category & Time */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 12px' }}>
          {alert.category && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-muted)',
                backgroundColor: 'var(--surface-3)',
                padding: '3px 8px',
                borderRadius: '3px',
              }}
            >
              {alert.category}
            </span>
          )}
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-faint)',
            }}
          >
            {alert.created_at_human || 'Just now'}
          </span>
        </div>
      </div>

      {/* Right Side - Dismiss & Dot */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          minWidth: '50px',
        }}
      >
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

        {/* Status Dot */}
        <div
          style={{
            width: '10px',
            height: '10px',
            minWidth: '10px',
            borderRadius: '50%',
            background: alertStyles.dot,
            marginTop: '4px',
            boxShadow: `0 0 8px ${alertStyles.dot}40`,
          }}
        />
      </div>
    </div>
  );
};
