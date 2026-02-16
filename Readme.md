Product Requirements Document (PRD)
Product Name
CivicTrack – Transparent Urban Grievance Redressal Platform

1. Purpose & Vision
Problem Statement
Urban local bodies lack accessible, transparent, and accountable grievance redressal systems, leading to unresolved civic issues, citizen frustration, and inefficiency.
Vision
To build a citizen-first, transparent, and data-driven web platform that enables residents to report civic issues, track them publicly, and hold authorities accountable through technology.

2. Goals & Success Metrics
Primary Goals
Enable easy reporting of local civic issues
Ensure end-to-end traceability of complaints
Enforce accountability through deadlines and proof-based resolution
Increase citizen trust in governance
Success Metrics (KPIs)
% of issues resolved within SLA
Average resolution time per category
Citizen satisfaction score
% of reopened complaints
Active monthly users

3. Target Users
1️⃣ Citizens
Urban residents
Students, working professionals, senior citizens
2️⃣ Municipal Officers
Ward-level officers
Department supervisors
3️⃣ City Administrators
Zonal heads
City-level administrators

4. User Personas
Citizen (Ravi, 24)
Wants to report potholes easily and track if the government actually fixes them.
Ward Officer (Mr. Sharma, 45)
Wants a centralized dashboard to manage assigned issues efficiently.
City Admin (Ms. Verma, 38)
Needs analytics to monitor performance and SLA compliance.

5. Scope
In-Scope (MVP)
Web application (desktop & mobile responsive)
Public issue reporting & tracking
Officer/admin dashboard
SLA & escalation logic
Out-of-Scope (Phase 2+)
Native mobile apps
Blockchain implementation
Payment or fine systems

6. Functional Requirements
6.1 Citizen Features
Issue Submission
Upload photos/videos
Auto geo-location capture
Category selection
Optional anonymous reporting
Issue Tracking
Unique public issue ID
Status updates (Reported → Assigned → In Progress → Resolved)
SLA countdown timer
Public Feed
View all reported issues
Filters (location, category, status)
Upvote issues
Resolution Feedback
Approve or reopen resolved issues
Rate satisfaction

6.2 Officer Features
View assigned complaints
Update status
Upload proof of work (before/after photos)
Add resolution notes
SLA alerts & reminders

6.3 Admin Features
Role-based access control
Assign/reassign complaints
SLA configuration by issue type
Escalation management
Performance analytics dashboard

7. Non-Functional Requirements
Performance
Page load < 2 seconds
Handle 10k+ issues/month
Security
JWT-based authentication
Role-based authorization
Secure file uploads
Scalability
Modular backend architecture
Cloud storage for media
Accessibility
Mobile-first responsive design
Simple UI for non-tech users

8. User Journey (Happy Path)
Citizen logs in
Reports issue with photo & location
Issue appears on public feed
Admin assigns to officer
Officer resolves issue & uploads proof
Citizen approves resolution
Issue closed & archived

9. SLA & Escalation Logic
Issue Type
SLA
Garbage
24 hrs
Water Supply
12 hrs
Road Damage
72 hrs
Streetlight
24 hrs

Escalation Path:
Ward Officer → Zonal Officer → City Admin

10. Data Model (High-Level)
User
id
name
role (Citizen / Officer / Admin)
Issue
issueId
title
description
category
geoLocation
status
assignedTo
SLA deadline
media
timeline logs

11. Tech Stack
Frontend: React + Vite
Backend: Node.js + Express
Database: MongoDB (GeoJSON)
Auth: JWT
Maps: Mapbox / Google Maps
Storage: Cloudinary
Charts: Recharts

12. Risks & Mitigations
Risk
Mitigation
Fake complaints
Image validation + reporting abuse
Officer inactivity
SLA escalation
Low adoption
Simple UX + public visibility
Data misuse
Rate limits + access control


13. Future Enhancements
AI-based issue classification
WhatsApp bot integration
Open public APIs
Predictive civic analytics
Multilingual support

14. Open Questions
Will officials be manually onboarded?
Should citizens require Aadhaar/email verification?
Should issues be visible across cities or city-specific?

15. Summary
CivicTrack bridges the trust gap between citizens and urban authorities by combining technology, transparency, and accountability into a single platform.

---

## Docker & Production Deployment

CivicTrack is **containerized** and ready for production deployment with **Supabase** (PostgreSQL, Storage, Vault). No AWS or Azure required.

- **Docker**: Multi-stage production Dockerfiles for backend and frontend
- **Registry**: GitHub Container Registry (ghcr.io)
- **CI/CD**: GitHub Actions for build and push
- **Deployment**: Railway, Render, Fly.io, or any Docker host

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for:

- Docker build and run instructions
- Local validation with `docker compose`
- Registry push and versioning
- Supabase-compatible platform deployment
- Health checks, autoscaling, security

