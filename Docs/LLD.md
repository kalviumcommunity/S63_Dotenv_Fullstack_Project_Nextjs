# 🧩 CivicTrack – Low Level Design (LLD)

## 1️⃣ LLD Scope

This LLD covers:

* Backend **class/module design**
* **Database schema (MongoDB)**
* **API contracts**
* **Service-level logic**
* **SLA & escalation algorithms**
* **Security & validations**

Tech Stack aligned with your PRD:

* **Backend:** Node.js + Express
* **DB:** MongoDB (Mongoose)
* **Auth:** JWT
* **Storage:** Cloudinary

---

## 2️⃣ Backend Project Structure (LLD View)

```
backend/
│
├── src/
│   ├── config/
│   │   ├── db.js
│   │   ├── cloudinary.js
│   │   ├── jwt.js
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.routes.js
│   │   │   └── auth.middleware.js
│   │   │
│   │   ├── users/
│   │   │   ├── user.model.js
│   │   │   └── user.service.js
│   │   │
│   │   ├── issues/
│   │   │   ├── issue.model.js
│   │   │   ├── issue.controller.js
│   │   │   ├── issue.service.js
│   │   │   ├── issue.routes.js
│   │   │   └── issue.validation.js
│   │   │
│   │   ├── sla/
│   │   │   ├── sla.model.js
│   │   │   ├── sla.service.js
│   │   │   └── escalation.worker.js
│   │   │
│   │   ├── notifications/
│   │   │   ├── notification.service.js
│   │   │   └── notification.provider.js
│   │   │
│   │   ├── analytics/
│   │   │   ├── analytics.controller.js
│   │   │   └── analytics.service.js
│   │
│   ├── utils/
│   │   ├── logger.js
│   │   ├── response.js
│   │   └── constants.js
│   │
│   ├── app.js
│   └── server.js
```

---

## 3️⃣ Database Design (MongoDB – Detailed)

### 🔹 User Schema (`users`)

```js
User {
  _id: ObjectId,
  name: String,
  email: String,
  passwordHash: String,
  role: "CITIZEN" | "OFFICER" | "ADMIN",
  wardId: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

* `email (unique)`
* `role`

---

### 🔹 Issue Schema (`issues`) – Core Entity

```js
Issue {
  _id: ObjectId,
  issueId: String, // CIV-DEL-000123
  title: String,
  description: String,
  category: "GARBAGE" | "WATER" | "ROAD" | "STREETLIGHT",

  location: {
    type: "Point",
    coordinates: [longitude, latitude]
  },

  media: {
    before: [String],
    after: [String]
  },

  status: "REPORTED" | "ASSIGNED" | "IN_PROGRESS" |
          "RESOLVED" | "REOPENED" | "CLOSED",

  citizenId: ObjectId,
  assignedOfficerId: ObjectId,

  escalationLevel: 0 | 1 | 2,
  slaDeadline: Date,

  timeline: [
    {
      status: String,
      comment: String,
      updatedBy: ObjectId,
      timestamp: Date
    }
  ],

  upvotes: Number,
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

* `location (2dsphere)`
* `status`
* `slaDeadline`

---

### 🔹 SLA Rules (`sla_rules`)

```js
SlaRule {
  category: String,
  durationInHours: Number,
  escalationMatrix: [
    "OFFICER",
    "ZONAL_ADMIN",
    "CITY_ADMIN"
  ]
}
```

---

## 4️⃣ API LLD (Request–Response Contracts)

### 🔹 Create Issue

**POST** `/api/issues`

Request:

```json
{
  "title": "Garbage not collected",
  "description": "Overflowing garbage near park",
  "category": "GARBAGE",
  "location": {
    "lat": 26.9124,
    "lng": 75.7873
  },
  "media": ["base64-or-multipart"]
}
```

Processing:

1. Validate input
2. Upload media → Cloudinary
3. Compute SLA deadline
4. Save issue
5. Add timeline entry

Response:

```json
{
  "issueId": "CIV-JPR-00124",
  "status": "REPORTED"
}
```

---

### 🔹 Assign Issue (Admin)

**PATCH** `/api/issues/:id/assign`

```json
{
  "officerId": "64fa..."
}
```

Logic:

* Update `assignedOfficerId`
* Status → `ASSIGNED`
* Timeline log
* Notify officer

---

### 🔹 Resolve Issue (Officer)

**PATCH** `/api/issues/:id/resolve`

```json
{
  "resolutionNote": "Garbage cleared",
  "afterImages": ["image-url"]
}
```

Logic:

* Upload proof
* Status → `RESOLVED`
* Timeline update
* Notify citizen

---

## 5️⃣ Service-Level LLD (Core Logic)

### 🔹 IssueService

Responsibilities:

* Create issues
* Change status
* Maintain timeline
* SLA calculations

```js
class IssueService {
  createIssue(data, userId)
  assignIssue(issueId, officerId, adminId)
  resolveIssue(issueId, officerId, proof)
  verifyIssue(issueId, citizenAction)
}
```

---

### 🔹 SLA & Escalation Engine (VERY IMPORTANT)

Runs every X minutes.

Algorithm:

```text
For each issue where:
  status != CLOSED
  AND currentTime > slaDeadline

If escalationLevel == 0
  escalate to Zonal Officer
Else if escalationLevel == 1
  escalate to City Admin
```

Actions:

* Update escalationLevel
* Reassign authority
* Log timeline
* Trigger notification

---

## 6️⃣ Notification Service LLD

```js
NotificationService {
  sendIssueCreated(issue)
  sendAssignment(issue, officer)
  sendSlaBreach(issue)
  sendResolution(issue)
}
```

Channels:

* Email (SMTP)
* SMS / WhatsApp (Twilio)

---

## 7️⃣ Analytics LLD

### 🔹 Metrics Calculated

* Avg resolution time per category
* SLA compliance %
* Officer performance
* Heatmap density (Geo aggregation)

Mongo Aggregation Example:

```js
group by category
avg(resolutionTime)
```

APIs:

* `/api/analytics/overview`
* `/api/analytics/heatmap`

---

## 8️⃣ Security & Validation (LLD View)

* JWT middleware on protected routes
* Role guards (`ADMIN`, `OFFICER`)
* Rate limiting on issue creation
* Image MIME validation
* Public feed = read-only

---

## 9️⃣ State Transition Diagram (Text LLD)

```
REPORTED
   ↓
ASSIGNED
   ↓
IN_PROGRESS
   ↓
RESOLVED
   ↓
CLOSED

RESOLVED → REOPENED → ASSIGNED
```
