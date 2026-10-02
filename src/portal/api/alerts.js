import { api } from './client';

const alertService = {
  async getAnnouncements() {
    try {
      const response = await api.get('/user/announcements');
      return { data: response?.data || [] };
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return { data: [] };
    }
  },

  async dismissAnnouncement(announcementId) {
    return api.post(`/user/announcements/${announcementId}/dismiss`);
  },

  async getUserAlerts() {
    try {
      const response = await api.get('/user/alerts');
      return { data: response?.data || [] };
    } catch (error) {
      console.error('Error fetching user alerts:', error);
      return { data: [] };
    }
  },

  async markAlertAsRead(alertId) {
    return api.post(`/user/alerts/${alertId}/read`);
  },

  async markAllAlertsAsRead() {
    return api.post('/user/alerts/mark-all-read');
  },

  async dismissAlert(alertId) {
    return api.post(`/user/alerts/${alertId}/dismiss`);
  },

  async getUnreadCount() {
    try {
      const response = await api.get('/user/notifications/count');
      return response?.data?.unread_alerts || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  },
};

export default alertService;
