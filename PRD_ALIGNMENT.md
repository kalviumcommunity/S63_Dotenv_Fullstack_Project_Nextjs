# CivicTrack – PRD Alignment

This document maps the **Product Requirements Document (PRD)** to the current implementation.

## Tech Stack (Actual vs PRD)

| PRD | Actual | Notes |
|-----|--------|------|
| Frontend: React + Vite | **Next.js (App Router)** | Same React; Next.js for SSR, API routes, and deployment |
| Backend: Node.js + Express | **Next.js API (Node)** | API routes in `backend/src/app/api/` |
| Database: MongoDB (GeoJSON) | **PostgreSQL + Prisma** | Relational model; lat/lng on Issue for geo |
| Auth: JWT | **JWT** | ✅ |
| Maps: Mapbox / Google | **Placeholder** | Geo fields present; map UI in Phase 2 |
| Storage: Cloudinary | **Placeholder** | `mediaUrls` / `proofUrls` as JSON; upload in Phase 2 |
| Charts: Recharts | **Placeholder** | Analytics dashboard structure ready |

## Data Model (PRD Section 10)

| PRD | Implementation |
|-----|----------------|
| **User**: id, name, role (Citizen/Officer/Admin) | ✅ `User` model: id, name, email, password, **role** (citizen \| officer \| admin) |
| **Issue**: issueId, title, description, category, geoLocation, status, assignedTo, SLA deadline, media, timeline | ✅ `Issue` model: publicId, title, description, category, latitude/longitude, status (REPORTED→ASSIGNED→IN_PROGRESS→RESOLVED), assignedToId, slaDeadline, mediaUrls, proofUrls, timeline (JSON), resolutionNotes, upvotes, satisfactionRating, reopened |

## Functional Requirements

### 6.1 Citizen Features

| Requirement | Status |
|-------------|--------|
| Issue submission (photo/video, geo, category, optional anonymous) | ✅ Form: title, description, category, anonymous; geo and media URLs ready in schema |
| Issue tracking (public ID, status, SLA countdown) | ✅ publicId (CT-00001), status flow, slaDeadline |
| Public feed (view all, filters, upvote) | ✅ Feed page; filters via API; upvotes in schema |
| Resolution feedback (approve/reopen, rate) | ✅ satisfactionRating, reopened; UI to wire |

### 6.2 Officer Features

| Requirement | Status |
|-------------|--------|
| View assigned complaints | ✅ Dashboard lists issues; filter by assignedTo |
| Update status | ✅ PATCH /api/issues/:id (status) |
| Upload proof (before/after) | ✅ proofUrls in schema; upload UI in Phase 2 |
| Resolution notes | ✅ resolutionNotes |
| SLA alerts | 🔲 Backend SLA config done; alerts/reminders in Phase 2 |

### 6.3 Admin Features

| Requirement | Status |
|-------------|--------|
| Role-based access control | ✅ RBAC middleware; admin/officer routes |
| Assign/reassign complaints | ✅ PATCH /api/issues/:id (assignedToId) |
| SLA configuration by issue type | ✅ `backend/src/lib/sla.ts` (Garbage 24h, Water 12h, Road 72h, Streetlight 24h) |
| Escalation management | 🔲 Escalation path (Ward→Zonal→City) in Phase 2 |
| Performance analytics dashboard | 🔲 Dashboard page structure; charts in Phase 2 |

## SLA & Escalation (PRD Section 9)

- **SLA hours**: Implemented in `backend/src/lib/sla.ts` (Garbage 24h, Water 12h, Road 72h, Streetlight 24h, Other 48h).
- **Escalation path**: Documented; implementation (Ward Officer → Zonal → City Admin) in Phase 2.

## UI Design (PRD-Aligned)

- **Citizen-first**: Public feed, simple report form, issue detail with status and SLA.
- **Mobile-responsive**: Tailwind; max-width containers and grid layouts.
- **Officer/Admin**: Dashboard with assigned and pending counts; issue cards link to detail.
- **Trust**: CivicTrack branding, status badges, public ID, resolution notes.

## Open Questions (PRD Section 14)

- **Officials onboarding**: Manual for MVP; officer/admin users created via backend or seed.
- **Citizen verification**: Email/password signup; Aadhaar/email verification in Phase 2.
- **Cross-city visibility**: Issues are global in MVP; city/ward filters in Phase 2.

## Summary

The MVP covers: **User roles (citizen/officer/admin)**, **Issue model with SLA and status flow**, **Public feed and report form**, **Officer/Admin dashboard**, **JWT + RBAC**. Geo, media upload, escalation, and analytics are structured in schema and API and can be completed in Phase 2.
