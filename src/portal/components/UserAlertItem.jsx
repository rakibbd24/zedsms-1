import React from 'react';
import { Icon } from './Icon';

const getAlertStyles = (type) => {
  const styles = {
    warning: {
      dot: '#F59E0B',
      bg: 'color-mix(in srgb, #F59E0B 6%, var(--surface))',
      bgHover: 'color-mix(in srgb, #F59E0B 12%, var(--surface))',
      border: 'color-mix(in srgb, #F59E0B 20%, var(--border))',
    },
    info: {
      dot: 'var(--accent)',
      bg: 'color-mix(in srgb, var(--accent) 6%, var(--surface))',
      bgHover: 'color-mix(in srgb, var(--accent) 12%, var(--surface))',
      border: 'color-mix(in srgb, var(--accent) 20%, var(--border))',
    },
    success: {
      dot: 'var(--success)',
      bg: 'color-mix(in srgb, var(--success) 6%, var(--surface))',
      bgHover: 'color-mix(in srgb, var(--success) 12%, var(--surface))',
      border: 'color-mix(in srgb, var(--success) 20%, var(--border))',
    },
    error: {
      dot: 'var(--danger)',
      bg: 'color-mix(in srgb, var(--danger) 6%, var(--surface))',
      bgHover: 'color-mix(in srgb, var(--danger) 12%, var(--surface))',
      border: 'color-mix(in srgb, var(--danger) 20%, var(--border))',
    },
  };
  return styles[type] || styles.info;
};

export const UserAlertItem = ({ alert, onDismiss, onRead, itemType = 'alert' }) => {
  const isUnread = !alert.is_read && itemType === 'alert';
  const alertStyles = getAlertStyles(alert.type);
  // announcements come from a different endpoint and name these fields differently
  const message = alert.message ?? alert.description;
  const actionText = alert.action_text ?? alert.cta_text;
  const actionLink = alert.action_link ?? alert.cta_link;

  // announcements render as the brand banner (blue, white text, white CTA), like the legacy dashboard
  if (itemType === 'announcement') {
    return (
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '18px 20px',
          borderRadius: 'var(--r-card)',
          background: 'linear-gradient(100deg, #1e4fd8 0%, #3b6fe6 100%)',
          color: '#fff',
          boxShadow: '0 4px 14px rgba(33, 85, 245, 0.25)',
        }}
      >
        {/* decorative bubbles */}
        <span aria-hidden style={{ position: 'absolute', top: '-70px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.10)', pointerEvents: 'none' }} />
        <span aria-hidden style={{ position: 'absolute', bottom: '-50px', left: '-30px', width: '110px', height: '110px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <span aria-hidden style={{ position: 'absolute', bottom: '-14px', right: '30%', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />

        {/* icon tile */}
        <div
          aria-hidden
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            minWidth: '44px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.18)',
            color: '#fff',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
            <path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15z" />
          </svg>
        </div>

        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 0 }}>
          <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0', color: '#fff' }}>{alert.title}</h4>
          {message && (
            <p style={{ fontSize: '14px', lineHeight: 1.5, margin: 0, color: 'rgba(255,255,255,0.92)' }}>{message}</p>
          )}
        </div>

        {actionText && actionLink && (
          <a
            href={actionLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '8px',
              background: '#fff',
              color: '#2155f5',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {actionText}
            <Icon name="arrowR" size={16} strokeWidth={2} />
          </a>
        )}

        {alert.is_dismissible && (
          <button
            onClick={() => onDismiss(alert.id)}
            aria-label="Dismiss"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              padding: 0,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
            }}
          >
            <Icon name="x" size={18} strokeWidth={2} />
          </button>
        )}
      </div>
    );
  }

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
        if (isUnread) e.currentTarget.style.background = alertStyles.bgHover;
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
        {message && (
          <p
            style={{
              fontSize: '13px',
              lineHeight: '1.5',
              color: 'var(--text-muted)',
              margin: '0 0 8px 0',
            }}
          >
            {message}
          </p>
        )}

        {/* Action Button */}
        {actionText && actionLink && (
          <a
            href={actionLink}
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
            {actionText}
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
