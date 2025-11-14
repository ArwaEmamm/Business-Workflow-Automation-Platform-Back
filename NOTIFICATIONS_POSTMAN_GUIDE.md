# Notifications System - Postman Testing Guide

This guide walks you through testing the complete notifications system integrated with the workflow approval process.

## Prerequisites
- Server running: `npm run dev`
- Redis running (for Bull email queue): `redis-cli` or Docker container
- MongoDB connection working

## Step 1: Register/Login Users

### 1.1 Register Employee
**POST** `http://localhost:5000/auth/register`
```json
{
  "name": "Ahmed Employee",
  "email": "employee@example.com",
  "password": "12345678",
  "role": "employee"
}
```
**Response:** Extract and save the `token` for use in Step 2.

---

### 1.2 Register Manager
**POST** `http://localhost:5000/auth/register`
```json
{
  "name": "Sara Manager",
  "email": "manager@example.com",
  "password": "12345678",
  "role": "manager"
}
```
**Response:** Extract and save the manager's `token`.

---

### 1.3 Register HR Manager
**POST** `http://localhost:5000/auth/register`
```json
{
  "name": "Admin HR",
  "email": "admin@example.com",
  "password": "12345678",
  "role": "hr_manager"
}
```
**Response:** Extract and save the hr_manager's `token`.

---

## Step 2: Create a Workflow

### 2.1 Create Multi-Step Workflow (as HR Manager)
**POST** `http://localhost:5000/workflows`

**Headers:**
```
Authorization: Bearer <hr_manager_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Leave Request Approval",
  "description": "Multi-step approval for leave requests",
  "steps": [
    {
      "stepNumber": 1,
      "name": "Manager Review",
      "assignedRole": "manager",
      "description": "Manager reviews the leave request"
    },
    {
      "stepNumber": 2,
      "name": "HR Sign Off",
      "assignedRole": "hr_manager",
      "description": "HR finalizes the approval"
    }
  ]
}
```

**Response:** Extract the `workflow._id` (e.g., `6731a2b8c1d2e3f4g5h6i7j8`).

---

## Step 3: Create a Request

### 3.1 Employee Creates Request (as Employee)
**POST** `http://localhost:5000/requests/{workflowId}`

**Headers:**
```
Authorization: Bearer <employee_token>
Content-Type: multipart/form-data
```

**Body (form-data):**
- Key: `title`, Value: `Annual Leave Request`
- Key: `description`, Value: `Requesting leave from Dec 20-25`
- Key: `attachments` (optional), File: Any PDF/document

**Response:** Extract `request._id`.

**Expected:** Manager receives notification `request-created`.

---

## Step 4: Check Notifications

### 4.1 Manager Checks Pending Notifications (as Manager)
**GET** `http://localhost:5000/notifications`

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Expected Response:**
```json
{
  "message": "Notifications retrieved successfully",
  "count": 1,
  "data": [
    {
      "_id": "...",
      "userId": "...",
      "message": "📄 New request \"Annual Leave Request\" awaits your review at step 1",
      "type": "request-created",
      "meta": {
        "requestId": "<request_id>",
        "workflowId": "<workflow_id>",
        "stepOrder": 1
      },
      "isRead": false,
      "createdAt": "2025-11-14T10:00:00Z"
    }
  ]
}
```

---

### 4.2 Get Unread Count (as Manager)
**GET** `http://localhost:5000/notifications/unread/count`

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Expected Response:**
```json
{
  "message": "Unread count retrieved",
  "unreadCount": 1
}
```

---

## Step 5: Manager Approves Request

### 5.1 Get Request Details (as Manager)
**GET** `http://localhost:5000/requests/{requestId}`

**Headers:**
```
Authorization: Bearer <manager_token>
```

---

### 5.2 Manager Approves (as Manager)
**POST** `http://localhost:5000/requests/{requestId}/approve`

**Headers:**
```
Authorization: Bearer <manager_token>
Content-Type: application/json
```

**Body:**
```json
{
  "decision": "approved",
  "comment": "Request looks good, moving to HR"
}
```

**Expected:**
- Approval recorded
- Employee receives `request-approved` notification
- HR Manager receives `workflow-step-assigned` notification for final step

---

## Step 6: Verify Notifications After Approval

### 6.1 Employee Checks Notifications (as Employee)
**GET** `http://localhost:5000/notifications`

**Headers:**
```
Authorization: Bearer <employee_token>
```

**Expected Response:**
```json
{
  "message": "Notifications retrieved successfully",
  "count": 1,
  "data": [
    {
      "_id": "...",
      "userId": "<employee_id>",
      "message": "✅ Your request has been approved at step 1",
      "type": "request-approved",
      "meta": {
        "requestId": "<request_id>",
        "stepOrder": 1,
        "approverRole": "manager"
      },
      "isRead": false,
      "createdAt": "2025-11-14T10:05:00Z"
    }
  ]
}
```

---

### 6.2 HR Manager Checks Notifications (as HR Manager)
**GET** `http://localhost:5000/notifications`

**Headers:**
```
Authorization: Bearer <hr_manager_token>
```

**Expected Response:** Should contain `workflow-step-assigned` notification for final review.

---

## Step 7: Mark Notification as Read

### 7.1 Mark Single Notification as Read (as Employee)
**PATCH** `http://localhost:5000/notifications/{notificationId}/read`

**Headers:**
```
Authorization: Bearer <employee_token>
```

**Expected Response:**
```json
{
  "message": "Notification marked as read",
  "data": {
    "_id": "...",
    "userId": "...",
    "message": "✅ Your request has been approved at step 1",
    "isRead": true
  }
}
```

---

### 7.2 Mark All Notifications as Read (as Employee)
**PATCH** `http://localhost:5000/notifications/read-all`

**Headers:**
```
Authorization: Bearer <employee_token>
```

**Expected Response:**
```json
{
  "message": "All notifications marked as read",
  "modifiedCount": 1
}
```

---

## Step 8: Delete Notification

### 8.1 Delete a Notification (as Employee)
**DELETE** `http://localhost:5000/notifications/{notificationId}`

**Headers:**
```
Authorization: Bearer <employee_token>
```

**Expected Response:**
```json
{
  "message": "Notification deleted successfully"
}
```

---

## Step 9: Complete the Multi-Step Workflow

### 9.1 HR Manager Final Approval (as HR Manager)
**POST** `http://localhost:5000/requests/{requestId}/approve`

**Headers:**
```
Authorization: Bearer <hr_manager_token>
Content-Type: application/json
```

**Body:**
```json
{
  "decision": "approved",
  "comment": "Approved by HR"
}
```

**Expected:** Request marked as fully `approved`, employee receives final approval notification.

---

## Step 10: Test Rejection Flow

### 10.1 Create Another Request (as Employee)
Repeat Step 3.1 to create a new request.

---

### 10.2 Manager Rejects (as Manager)
**POST** `http://localhost:5000/requests/{newRequestId}/approve`

**Headers:**
```
Authorization: Bearer <manager_token>
Content-Type: application/json
```

**Body:**
```json
{
  "decision": "rejected",
  "comment": "Missing required documentation"
}
```

**Expected:**
- Request status changes to `rejected`
- Employee receives `request-rejected` notification
- Approval chain stops

---

## Notification Types

| Type | When Sent | Recipients |
|------|-----------|------------|
| `request-created` | Request created | Next step reviewer |
| `request-approved` | Request approved at a step | Employee, next step reviewer (if exists), HR Manager (if final) |
| `request-rejected` | Request rejected at a step | Employee |
| `workflow-step-assigned` | Request moves to next step | Assigned reviewer for that step |

---

## Troubleshooting

### Issue: No notifications created
- Check that `createNotification` is being called in approval handler
- Verify users exist with correct roles
- Check MongoDB connection

### Issue: Redis/Email Queue not working
- Email queue is non-blocking; notifications still created without it
- Check Redis connection: `redis-cli ping`
- Email queue jobs logged to console

### Issue: Notifications not appearing for certain roles
- Verify user has correct role in database
- Check notification filters match user ID
- Run migration if needed: `npm run migrate:normalize-roles`

---

## API Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/notifications` | GET | Required | Get all notifications for user |
| `/notifications/unread/count` | GET | Required | Get unread notification count |
| `/notifications/:id/read` | PATCH | Required | Mark single notification as read |
| `/notifications/read-all` | PATCH | Required | Mark all as read |
| `/notifications/:id` | DELETE | Required | Delete notification |

---

## Notes

- All endpoints require valid JWT token in `Authorization: Bearer <token>` header
- Notifications are automatically queued for email (Bull queue)
- Email queue processes jobs in background with retry logic
- Notifications auto-expire after 30 days (TTL index on MongoDB)
- Use `meta` field to store context (requestId, workflowId, etc.)
