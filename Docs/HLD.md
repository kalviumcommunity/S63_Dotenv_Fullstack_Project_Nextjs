🏗️ CivicTrack – High Level Design (HLD)

## 1️⃣ Purpose of HLD

The High Level Design (HLD) describes the **overall system architecture**, **major components**, and **data flow** of the CivicTrack platform.
It focuses on **what the system does and how components interact**, without going into low-level implementation details.

This document is intended for:

* Stakeholders
* System architects
* Reviewers
* Academic evaluation

---

## 2️⃣ System Overview

**CivicTrack** is a centralized, web-based **Urban Grievance Redressal Platform** that enables citizens to report civic issues and track their resolution while ensuring transparency, traceability, and accountability within urban local bodies.

The system connects:

* **Citizens**
* **Municipal Officers**
* **Administrators**

through a secure, role-based digital workflow governed by **Service Level Agreements (SLAs)**.

---

## 3️⃣ High Level Architecture

### 🔹 Architecture Style

**Client–Server Architecture with Modular Backend**

```
[ Client (Web / Mobile) ]
            |
            | HTTPS (REST APIs)
            ↓
[ API Gateway / Express Server ]
            |
   -------------------------------
   |        |        |           |
[Auth]  [Issues]  [SLA]   [Analytics]
   |        |        |           |
            ↓
        [ MongoDB ]
            |
     [ Cloudinary ]
```

---

## 4️⃣ Major System Components

### 4.1 Frontend Layer (Client)

**Actors:**

* Citizens
* Officers
* Admins

**Responsibilities:**

* User authentication
* Issue reporting & tracking
* Dashboards (role-based)
* Public issue feed
* Analytics visualization

**Technology:**

* React (Vite)
* REST API consumption
* Maps (Mapbox / Google Maps)

---

### 4.2 Backend Layer (Application Server)

**Responsibilities:**

* Business logic execution
* Role-based access control
* SLA calculation & escalation
* Notifications
* Data validation

**Technology:**

* Node.js
* Express.js
* JWT Authentication

---

### 4.3 Database Layer

**Database:** MongoDB

**Responsibilities:**

* Persistent storage of users, issues, SLA rules
* Geo-spatial queries
* Aggregation for analytics

**Key Collections:**

* Users
* Issues
* SLA Rules

---

### 4.4 Media Storage Layer

**Cloudinary**

* Stores issue images and resolution proofs
* Reduces server load
* Provides CDN delivery

---

### 4.5 Notification System

**Channels:**

* Email
* SMS / WhatsApp

**Triggers:**

* Issue creation
* Assignment
* SLA breach
* Resolution updates

---

## 5️⃣ Actor-wise Functional View (HLD)

### 👤 Citizen

* Register/Login
* Raise civic issue
* Upload images/videos
* Track issue progress
* View SLA countdown
* Reopen or close issues
* View public complaints

---

### 🧑‍💼 Officer

* Login securely
* View assigned issues
* Update status
* Upload resolution proof
* Receive SLA alerts

---

### 🧑‍💻 Administrator

* Manage users & roles
* Assign/reassign issues
* Configure SLA rules
* Monitor escalations
* View analytics dashboards

---

## 6️⃣ Data Flow (High Level)

### 🔹 Issue Lifecycle Flow

```
Citizen → Reports Issue
        → Issue Stored in DB
        → SLA Assigned
        → Admin Assigns Officer
        → Officer Resolves Issue
        → Citizen Verifies
        → Issue Closed
```

---

### 🔹 SLA Escalation Flow

```
Issue Created
     ↓
SLA Deadline Set
     ↓
Background SLA Checker
     ↓
Deadline Missed?
     ↓
Auto Escalation
     ↓
Higher Authority Notified
```

---

## 7️⃣ SLA & Escalation – HLD View

* SLA duration is defined per issue category
* SLA timer starts at issue creation
* System periodically checks SLA violations
* Escalation hierarchy:

  * Officer → Zonal Admin → City Admin
* Each escalation is logged and visible to citizens

---

## 8️⃣ Security Architecture

**Authentication**

* JWT-based stateless authentication

**Authorization**

* Role-based access control (RBAC)

**Data Protection**

* Password hashing
* Secure API endpoints
* Rate limiting on complaint submission

---

## 9️⃣ Non-Functional Requirements (HLD)

### 🔹 Performance

* Supports concurrent users
* Optimized DB indexes
* Asynchronous notifications

### 🔹 Scalability

* Modular services
* Cloud storage for media
* Horizontal scaling possible

### 🔹 Reliability

* SLA monitoring
* Persistent audit logs
* Fault-tolerant notifications

### 🔹 Transparency

* Public issue feed
* Visible timelines
* Officer accountability

---

## 🔟 Assumptions & Constraints

**Assumptions**

* Users have internet access
* Officers regularly update issue status

**Constraints**

* Depends on third-party services (Maps, SMS)
* Requires accurate geo-location data
