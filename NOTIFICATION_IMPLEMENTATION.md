# Notification System Implementation

## Changes Made

### Backend

1. **Created Notification Service** (`rentverse-backend/src/services/notification.service.js`)
   - Create notifications
   - Get user notifications with pagination
   - Mark as read functionality
   - Get unread count
   - Helper methods for rental application and agreement signing notifications

2. **Created Notification Routes** (`rentverse-backend/src/routes/notifications.routes.js`)
   - GET `/api/notifications` - Get user notifications
   - GET `/api/notifications/unread-count` - Get unread count
   - PATCH `/api/notifications/:id/read` - Mark as read
   - PATCH `/api/notifications/mark-all-read` - Mark all as read

3. **Updated Database Schema** (`rentverse-backend/prisma/schema.prisma`)
   - Added `Notification` model
   - Added `notifications` relation to User model

4. **Registered Routes** (`rentverse-backend/src/app.js`)
   - Added notification routes to Express app

5. **Updated Booking Service** (`rentverse-backend/src/modules/bookings/bookings.service.js`)
   - Added notification sending when user applies for rental property

### Frontend

1. **Created NotificationBell Component** (`rentverse-frontend/components/NotificationBell.tsx`)
   - Bell icon with badge showing unread count
   - Dropdown showing recent notifications
   - Real-time polling every 30 seconds
   - Mark as read functionality
   - Green theme design matching app style

## Database Migration Required

Run the following command to create and apply the migration:

```bash
cd rentverse-backend
npx prisma migrate dev --name add_notifications
```

This will:
- Create the `notifications` table
- Add indexes for performance
- Update the database schema

## Installation Requirements

### Backend
No additional packages required (uses existing Prisma setup)

### Frontend
Install date-fns for time formatting:

```bash
cd rentverse-frontend
npm install date-fns
```

## Integration Instructions

### Add NotificationBell to Navbar/Header

To add the NotificationBell component to your application header/navbar:

1. Open your main layout or navbar component (e.g., `components/Navbar.tsx`)
2. Import the component:
   ```tsx
   import NotificationBell from '@/components/NotificationBell'
   ```
3. Add it to your header (example):
   ```tsx
   <div className="flex items-center gap-4">
     {isLoggedIn && <NotificationBell />}
     {/* other header items */}
   </div>
   ```

## Notification Types

Currently implemented:
- `RENTAL_APPLICATION` - When user applies to rent property
- `AGREEMENT_SIGNED_TENANT` - When tenant signs agreement (ready to implement)
- `AGREEMENT_SIGNED_LANDLORD` - When landlord signs agreement (ready to implement)

## Future Enhancements (Not Yet Implemented)

To complete the notification system, add notification sending in:

1. **Digital Agreement Service** - When tenant or landlord signs agreement
   - File: `rentverse-backend/src/services/digitalAgreement.service.js`
   - Add calls to `notificationService.notifyTenantSigned()` and `notificationService.notifyLandlordSigned()`

2. **E-Signature Service** - When signatures are completed
   - File: `rentverse-backend/src/services/eSignature.service.js`
   - Add notification calls after signature completion

## Testing

1. **Start Backend:**
   ```bash
   cd rentverse-backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd rentverse-frontend
   npm run dev
   ```

3. **Test Flow:**
   - Log in as a user
   - Apply for a rental property
   - Log in as the property owner
   - Check the notification bell for the new application notification

## API Endpoints

### Get Notifications
```
GET /api/notifications?page=1&limit=20&unreadOnly=false
Authorization: Bearer <token>
```

### Get Unread Count
```
GET /api/notifications/unread-count
Authorization: Bearer <token>
```

### Mark as Read
```
PATCH /api/notifications/{id}/read
Authorization: Bearer <token>
```

### Mark All as Read
```
PATCH /api/notifications/mark-all-read
Authorization: Bearer <token>
```

## Performance Notes

- Notifications are polled every 30 seconds (configurable in NotificationBell component)
- Database indexes added for optimal query performance
- Pagination implemented to handle large notification lists
- Old read notifications can be cleaned up using `notificationService.deleteOldNotifications(30)` (30 days old)
