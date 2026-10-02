import React, { useEffect, useState } from 'react';
import alertService from '../api/alerts';
import { AnnouncementBanner } from './AnnouncementBanner';
import { UserAlertsCarousel } from './UserAlertsCarousel';

export const DashboardAlerts = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

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
            width: '20px',
            height: '20px',
            border: '2px solid var(--border-strong)',
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

  if (announcements.length === 0 && alerts.length === 0) {
    return null;
  }

  return (
    <>
      {/* Announcements Section */}
      {announcements.length > 0 && (
        <div style={{ width: '100%', marginBottom: '24px' }}>
          {announcements.map((announcement) => (
            <AnnouncementBanner
              key={announcement.id}
              announcement={announcement}
              onDismiss={handleDismissAnnouncement}
            />
          ))}
        </div>
      )}

      {/* User Alerts Carousel */}
      {alerts.length > 0 && (
        <UserAlertsCarousel
          alerts={alerts}
          onDismiss={handleDismissAlert}
          onRead={handleMarkAsRead}
        />
      )}
    </>
  );
};
