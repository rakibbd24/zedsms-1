import React from 'react';
import { AnnouncementBanner } from '../components/AnnouncementBanner';
import { UserAlertsCarousel } from '../components/UserAlertsCarousel';

export default function AlertsDesignPreview() {
  const sampleAnnouncements = [
    {
      id: 1,
      type: 'info',
      title: 'New Feature Available',
      message: 'You can now export your SMS history directly from the dashboard.',
      action_text: 'Learn More',
      action_link: '#',
      dismissible: true,
    },
  ];

  const sampleAlerts = [
    {
      id: 1,
      type: 'warning',
      title: 'Number Expiring Soon',
      message: '+441234567890 will expire in 3 days.',
      category: 'Numbers',
      action_text: 'Extend',
      action_link: '#',
      is_read: false,
      is_dismissible: true,
      created_at_human: '2 hours ago',
    },
    {
      id: 2,
      type: 'success',
      title: 'Payment Received',
      message: 'Your top-up of $50.00 has been processed successfully.',
      category: 'Billing',
      is_read: false,
      is_dismissible: true,
      created_at_human: '1 hour ago',
    },
    {
      id: 3,
      type: 'info',
      title: 'New SMS',
      message: 'You have a new SMS from Amazon on your number.',
      category: 'Messages',
      is_read: true,
      is_dismissible: true,
      created_at_human: '30 min ago',
    },
    {
      id: 4,
      type: 'error',
      title: 'SMS Delivery Failed',
      message: 'Failed to send SMS. The number may be invalid.',
      category: 'SMS',
      is_read: true,
      is_dismissible: true,
      created_at_human: '1 day ago',
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text)', marginBottom: '30px' }}>
        Announcements & Alerts Carousel Preview
      </h2>

      {/* Announcements Section */}
      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>
          📢 ANNOUNCEMENTS CAROUSEL
        </h3>
        {sampleAnnouncements.map((announcement) => (
          <AnnouncementBanner
            key={announcement.id}
            announcement={announcement}
            onDismiss={() => {}}
          />
        ))}
      </section>

      {/* User Alerts Carousel Section */}
      <section>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>
          📬 USER ALERTS CAROUSEL (Click arrows to navigate)
        </h3>
        <UserAlertsCarousel
          alerts={sampleAlerts}
          onDismiss={() => {}}
          onRead={() => {}}
        />
      </section>
    </div>
  );
}
