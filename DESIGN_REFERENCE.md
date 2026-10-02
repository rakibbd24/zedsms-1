# Dashboard Announcements & User Alerts - Design Reference

Based on your old ZedSMS Vue app, here's what we'll build:

## 📢 System Overview

### 1. **Announcements** (DashboardAlerts.vue)
- System-wide announcements for all users
- Displayed at top of dashboard
- Fetchable from API: `/user/announcements`
- Can be dismissed
- Shows in banner/card format

### 2. **User Alerts** (UserAlertItem.vue)
- User-specific personalized alerts
- Fetched from API: `/user/alerts`
- Displayed in dashboard card with title "Notifications"
- Shows max 3 alerts, with "View All" button for more

## 🎨 Design Elements

### User Alert Card (UserAlertItem)
- **4 Alert Types with distinct colors:**
  - Warning: Amber/Yellow (#FEF3C7 bg, #F59E0B border)
  - Info: Blue (#DBEAFE bg, #3B82F6 border)
  - Success: Green (#D1FAE5 bg, #10B981 border)
  - Error: Red (#FEE2E2 bg, #EF4444 border)

### Alert Features
- Icon on left (SVG icons for each type)
- Unread indicator: Blue pulsing dot (top-right)
- Unread state: Ring border (#0057FF/30)
- Title: Bold, colored text
- Message: Lighter gray text
- Dismiss button: X icon (hover effect)
- Action button: Optional link with arrow
- Category tag: Small badge at bottom
- Timestamp: "Just now", "2 hours ago", etc.

### Alert Container (DashboardAlerts)
- White card with rounded corners (20px)
- Dark mode: #09132C
- Shadow styling
- Header with "Notifications" title
- Unread count badge: Blue (#0057FF) with "N new"
- "Mark all read" button
- "View All" button for showing all alerts

## 📡 API Endpoints Needed

```
GET  /user/announcements           - Fetch announcements
POST /user/announcements/:id/dismiss - Dismiss announcement

GET  /user/alerts                  - Fetch user alerts  
POST /user/alerts/:id/read         - Mark alert as read
POST /user/alerts/mark-all-read    - Mark all as read
POST /user/alerts/:id/dismiss      - Dismiss alert
GET  /user/notifications/count     - Get unread count
```

## 📊 Data Structure

### Announcement Object
```json
{
  "id": 1,
  "type": "info|warning|success|error",
  "title": "Announcement Title",
  "message": "Full message content",
  "action_text": "Optional button text",
  "action_link": "https://link.com",
  "dismissible": true,
  "created_at": "2024-10-02T10:30:00Z"
}
```

### Alert Object
```json
{
  "id": 1,
  "type": "warning|info|success|error",
  "title": "Alert Title",
  "message": "Alert description",
  "category": "Numbers",
  "action_text": "Take Action",
  "action_link": "https://...",
  "is_read": false,
  "is_dismissible": true,
  "created_at": "2024-10-02T10:30:00Z",
  "created_at_human": "2 hours ago"
}
```

## 🎯 Functionality

### DashboardAlerts Component
- Load announcements and alerts on mount
- Unread count badge
- "Mark all read" button
- "View All / Show Less" toggle (shows max 3 by default)
- Dismiss announcements
- Dismiss alerts
- Mark individual alerts as read

### UserAlertItem Component
- Click to mark as read (if not already read)
- Dismiss functionality
- Action link (opens in new tab)
- Animated unread indicator
- Full dark mode support
- Category and timestamp display

## 🔄 Integration Points

- **Dashboard/Home Screen**: Add DashboardAlerts component at the top
- **API Service**: Create alertService similar to old app
- **Real-time updates**: Can integrate with useRealtime hook for live updates

---

## Next Steps:
1. Create AnnouncementBanner component (announcement display)
2. Create UserAlertItem component (alert item)
3. Create DashboardAlerts container (orchestration)
4. Create alertService for API calls
5. Integrate into Dashboard/HomeScreen
