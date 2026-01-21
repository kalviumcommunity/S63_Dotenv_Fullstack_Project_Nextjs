# 🏙️ CivicTrack

**Transparent Urban Grievance Redressal Platform**

## 📌 Project Overview

CivicTrack is a web-based platform designed to improve transparency, accountability, and efficiency in urban grievance redressal systems. It enables citizens to report civic issues, track their resolution publicly, and ensures authorities act within defined Service Level Agreements (SLAs).

The platform bridges the gap between citizens and municipal bodies by providing real-time visibility into complaint status and performance metrics for government officials.

---

## ✨ Key Features

### 👤 Citizen Features

* Report civic issues with images or videos
* Automatic geo-location capture
* Issue categorization (garbage, water, roads, streetlights, etc.)
* Optional anonymous issue reporting
* Public feed of all reported issues
* Filter issues by location, category, and status
* Upvote important or urgent issues
* Track issue status with SLA countdown
* Approve, reopen, and rate resolved issues

### 🧑‍💼 Officer Features

* View assigned complaints in a centralized dashboard
* Update issue status (Assigned, In Progress, Resolved)
* Upload before/after resolution proof
* Add resolution notes and remarks
* Receive SLA alerts and reminders

### 🧑‍💻 Admin Features

* Role-based access control
* Assign and reassign complaints to officers
* Configure SLAs based on issue type
* Escalate overdue complaints automatically
* Analytics dashboard for performance tracking

---

## 🛠️ Technical Stack

### Frontend

* React (with Vite)
* Responsive, mobile-first UI
* Recharts for analytics and data visualization

### Backend

* Node.js
* Express.js
* MongoDB with GeoJSON for location-based queries

### Authentication & Security

* JWT-based authentication
* Role-based authorization

### Integrations & Tools

* Mapbox / Google Maps (location & maps)
* Cloudinary (image and video storage)

---
