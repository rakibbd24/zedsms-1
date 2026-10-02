import React, { useEffect, useState } from 'react';
import alertService from '../api/alerts';
import { AnnouncementBanner } from './AnnouncementBanner';
import { UserAlertItem } from './UserAlertItem';
import { Icon } from './Icon';

export const DashboardAlerts = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [announcementsRes, alertsRes] = await Promise.all([
        alertService.getAnnouncements(),
        alertService.getUserAlerts(),
      ]);
      setAnnouncements(announcementsRes.data || []);
      setAlerts(alertsRes.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const visibleAlerts = showAllAlerts ? alerts : alerts.slice(0, 3);
  const unreadCount = alerts.filter((a) => !a.is_read).length;

  const handleDismissAnnouncement = async (id) => {
    try {
      await alertService.dismissAnnouncement(id);
      setAnnouncements(announcements.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Error dismissing announcement:', error);
    }
  };

  const handleDismissAlert = async (id) => {
    try {
      await alertService.dismissAlert(id);
      setAlerts(alerts.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await alertService.markAlertAsRead(id);
      setAlerts(
        alerts.map((a) => (a.id === id ? { ...a, is_read: true } : a))
      );
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await alertService.markAllAlertsAsRead();
      setAlerts(alerts.map((a) => ({ ...a, is_read: true })));
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            border: '3px solid var(--border-strong)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', marginBottom: '32px' }}>
      {/* Announcements */}
      {announcements.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          {announcements.map((announcement) => (
            <AnnouncementBanner
              key={announcement.id}
              announcement={announcement}
              onDismiss={handleDismissAnnouncement}
            />
          ))}
        </div>
      )}

      {/* User Alerts */}
      {alerts.length > 0 && (
        <div
          style={{
            width: '100%',
            background: 'var(--surface)',
            borderRadius: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '20px 24px',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h4
                style={{
                  fontSize: '18px',
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
                    background: '#0057FF',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '9999px',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  style={{
                    padding: 0,
                    background: 'transparent',
                    border: 'none',
                    color: '#0057FF',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'text-decoration 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Mark all read
                </button>
              )}
              {alerts.length > 3 && (
                <button
                  onClick={() => setShowAllAlerts(!showAllAlerts)}
                  style={{
                    padding: 0,
                    background: 'transparent',
                    border: 'none',
                    color: '#0057FF',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'text-decoration 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  {showAllAlerts ? 'Show Less' : `View All (${alerts.length})`}
                </button>
              )}
            </div>
          </div>

          {/* Alerts List */}
          <div style={{ display: 'grid', gap: '12px' }}>
            {visibleAlerts.map((alert) => (
              <UserAlertItem
                key={alert.id}
                alert={alert}
                onDismiss={handleDismissAlert}
                onRead={handleMarkAsRead}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
