import React, { useState } from 'react';
import { UserAlertItem } from './UserAlertItem';

export const Carousel = ({ items, onDismiss, onRead, itemType = 'alert' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!items || items.length === 0) return null;

  // the list can shrink under us (dismissal, refetch) — never index past its end
  const safeIndex = Math.min(currentIndex, items.length - 1);
  const currentItem = items[safeIndex];

  const handlePrev = () => {
    setCurrentIndex(safeIndex === 0 ? items.length - 1 : safeIndex - 1);
  };

  const handleNext = () => {
    setCurrentIndex(safeIndex === items.length - 1 ? 0 : safeIndex + 1);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        marginBottom: '16px',
      }}
    >
      {/* Item Card */}
      <UserAlertItem
        alert={currentItem}
        onDismiss={() => onDismiss(currentItem.id)}
        onRead={onRead}
        itemType={itemType}
      />

      {/* Arrows Container - Bottom Right */}
      {items.length > 1 && (
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
  );
};

