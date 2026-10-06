import React, { useEffect, useState } from 'react';
import alertService from '../api/alerts';
import { Carousel } from './UserAlertsCarousel';

export const DashboardAlerts = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [announcementsRes, alertsRes] = await Promise.all([
        alertService.getAnnouncements(),
        alertService.getUserAlerts(),
      ]);
      setAnnouncements(announcementsRes.data || []);
      setAlerts(alertsRes.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const handleDismissAnnouncement = async (id) => {
    try {
      await alertService.dismissAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Error dismissing announcement:', error);
    }
  };

  const handleDismissAlert = async (id) => {
    try {
      await alertService.dismissAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await alertService.markAlertAsRead(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
      );
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  if (announcements.length === 0 && alerts.length === 0) {
    return null;
  }

  return (
    <>
      {/* Announcements Carousel */}
      {announcements.length > 0 && (
        <Carousel
          items={announcements}
          onDismiss={handleDismissAnnouncement}
          onRead={() => {}}
          itemType="announcement"
        />
      )}

      {/* User Alerts Carousel */}
      {alerts.length > 0 && (
        <Carousel
          items={alerts}
          onDismiss={handleDismissAlert}
          onRead={handleMarkAsRead}
          itemType="alert"
        />
      )}
    </>
  );
};
