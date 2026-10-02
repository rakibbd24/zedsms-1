import React, { useState } from 'react';
import { UserAlertItem } from './UserAlertItem';

export const UserAlertsCarousel = ({ alerts, onDismiss, onRead }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (alerts.length === 0) return null;

  const currentAlert = alerts[currentIndex];
  const unreadCount = alerts.filter((a) => !a.is_read).length;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? alerts.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === alerts.length - 1 ? 0 : prev + 1));
  };

  return (
    <div style={{ width: '100%', marginBottom: '24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          gap: '12px',
          paddingBottom: '12px',
          borderBottom: `1px solid var(--border)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h4
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text)',
              margin: 0,
            }}
          >
            Notifications
          </h4>
          {unreadCount > 0 && (
            <span
              style={{
                padding: '4px 10px',
                background: 'var(--accent)',
                color: 'white',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '12px',
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>

        {/* Counter */}
        <span
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}
        >
          {currentIndex + 1} / {alerts.length}
        </span>
      </div>

      {/* Carousel with Arrows Inside Box */}
      <div
        style={{
          position: 'relative',
          width: '100%',
        }}
      >
        {/* Alert Card */}
        <UserAlertItem
          alert={currentAlert}
          onDismiss={() => {
            onDismiss(currentAlert.id);
            if (currentIndex >= alerts.length - 1) {
              setCurrentIndex(Math.max(0, currentIndex - 1));
            }
          }}
          onRead={onRead}
        />

        {/* Arrows Container - Bottom Right */}
        {alerts.length > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 10,
            }}
          >
            {/* Left Arrow */}
            <button
              onClick={handlePrev}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                padding: 0,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: '16px',
                fontWeight: 'normal',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text)';
              }}
            >
              ‹
            </button>

            {/* Right Arrow */}
            <button
              onClick={handleNext}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                padding: 0,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: '16px',
                fontWeight: 'normal',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text)';
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
