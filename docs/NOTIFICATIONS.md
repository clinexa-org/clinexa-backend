# Notifications API

Real-time updates, push notifications, and inbox notifications for Clinexa.

## Socket.io Connection

Connect with JWT authentication:

```javascript
const socket = io("wss://your-api.com", {
  auth: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
});
```

On connection, user automatically joins room `user:<userId>`.

## Socket Events

| Event | Triggered When | Payload |
|-------|---------------|---------|
| `appointment:created` | Patient books appointment | `{ appointmentId, status, start_time, patientName }` |
| `appointment:updated` | Doctor confirms/cancels/completes | `{ appointmentId, status, start_time, doctorName?, cancellationReason? }` |
| `appointment:reminder` | 10 min before appointment | `{ appointmentId, title, body }` |
| `prescription:created` | Doctor creates prescription | `{ prescriptionId, diagnosis, itemsCount }` |

---

## Device Token Management

### Register Device Token
```http
POST /api/auth/device-token
Authorization: Bearer <token>
Content-Type: application/json

{ "token": "fcm_device_token", "platform": "android" }
```

### Remove Device Token (on logout)
```http
DELETE /api/auth/device-token
Authorization: Bearer <token>
Content-Type: application/json

{ "token": "fcm_device_token" }
```

---

## Notifications API

### Get My Notifications
```http
GET /api/notifications/me?unreadOnly=true&limit=20&page=1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "...",
        "type": "APPOINTMENT_CONFIRMED",
        "title": "Appointment Confirmed",
        "body": "Your appointment with Dr. Fares has been confirmed",
        "data": { "appointmentId": "..." },
        "readAt": null,
        "createdAt": "2026-01-31T12:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 },
    "unreadCount": 3
  }
}
```

### Mark Notification as Read
```http
PATCH /api/notifications/:id/read
Authorization: Bearer <token>
```

### Mark All as Read
```http
PATCH /api/notifications/read-all
Authorization: Bearer <token>
```

---

## Notification Types

| Type | Description |
|------|-------------|
| `APPOINTMENT_CREATED` | New appointment booked (to doctor) |
| `APPOINTMENT_CONFIRMED` | Appointment confirmed (to patient) |
| `APPOINTMENT_CANCELLED` | Appointment cancelled (to patient) |
| `APPOINTMENT_COMPLETED` | Appointment completed (to patient) |
| `PRESCRIPTION_CREATED` | New prescription (to patient) |
| `REMINDER` | 10 min before appointment (to both) |

---

## Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Generate a service account key (Project Settings → Service Accounts → Generate new private key)
3. Save as `src/config/firebase-service-account.json` or set `FIREBASE_SERVICE_ACCOUNT_PATH` env var
