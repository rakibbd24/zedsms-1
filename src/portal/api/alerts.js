import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/?$/, '/');

const alertService = {
  // Get all active announcements for the current user
  async getAnnouncements() {
    try {
      const response = await axios.get(`${API_BASE}/user/announcements`);
      return response.data;
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return { data: [] };
    }
  },

  // Dismiss an announcement
  async dismissAnnouncement(announcementId) {
    try {
      const response = await axios.post(
        `${API_BASE}/user/announcements/${announcementId}/dismiss`
      );
      return response.data;
    } catch (error) {
      console.error('Error dismissing announcement:', error);
      throw error;
    }
  },

  // Get all user alerts
  async getUserAlerts() {
    try {
      const response = await axios.get(`${API_BASE}/user/alerts`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user alerts:', error);
      return { data: [] };
    }
  },

  // Mark alert as read
  async markAlertAsRead(alertId) {
    try {
      const response = await axios.post(
        `${API_BASE}/user/alerts/${alertId}/read`
      );
      return response.data;
    } catch (error) {
      console.error('Error marking alert as read:', error);
      throw error;
    }
  },

  // Mark all alerts as read
  async markAllAlertsAsRead() {
    try {
      const response = await axios.post(
        `${API_BASE}/user/alerts/mark-all-read`
      );
      return response.data;
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
      throw error;
    }
  },

  // Dismiss an alert
  async dismissAlert(alertId) {
    try {
      const response = await axios.post(
        `${API_BASE}/user/alerts/${alertId}/dismiss`
      );
      return response.data;
    } catch (error) {
      console.error('Error dismissing alert:', error);
      throw error;
    }
  },

  // Get unread notification count
  async getUnreadCount() {
    try {
      const response = await axios.get(
        `${API_BASE}/user/notifications/count`
      );
      return response.data.data?.unread_alerts || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  },
};

export default alertService;
