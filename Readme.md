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

---

## Custom Domain & SSL (Production)

CivicTrack supports production-grade custom domains and SSL on **Supabase-compatible platforms** (Railway, Render, Fly.io). No AWS or Azure.

See **[DOMAIN_SSL_SETUP.md](./DOMAIN_SSL_SETUP.md)** for:

### Domain Setup Architecture

- **Root domain**: `myapp.com` → CNAME/A to platform host
- **www**: `www.myapp.com` → CNAME to root or same host
- **API**: `api.myapp.com` (optional backend subdomain)
- **Staging**: `staging.myapp.com` for pre-production

### DNS Records

| Record | Type | Target | Purpose |
|--------|------|--------|---------|
| Root | A or CNAME | Platform-provided | Main app |
| www | CNAME | Root or platform | www subdomain |
| staging | CNAME | Staging service host | Staging env |

### SSL Issuance

- **Automatic**: Railway, Render, Fly.io provision Let's Encrypt certificates.
- **Validation**: DNS must point to the platform before certificate issuance.
- **Renewal**: Handled by the platform; no manual steps.

### HTTPS Enforcement

- **Platform-level**: HTTP (80) redirects to HTTPS (443) at the load balancer/proxy.
- **App-level**: Next.js enforces HTTPS when `X-Forwarded-Proto: https` is present.
- **HSTS**: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

### Screenshot Placeholders

<!-- Add screenshots when available -->
- **Hosted zone / DNS records**: Platform dashboard showing CNAME/A records
- **Certificate status**: Platform showing "Issued" or "Active"
- **Browser lock icon**: HTTPS connection verified in address bar
- **Load balancer listener rules**: HTTP→HTTPS redirect configuration

### Architecture Notes

| Topic | Summary |
|-------|---------|
| **DNS vs Load Balancer** | DNS routes to the platform; the platform handles TLS termination and redirect |
| **SSL automation** | Certificates are issued and renewed automatically |
| **Trust & compliance** | HSTS, TLS 1.2+, no self-signed certs |
| **Scaling** | Add subdomains per environment; no code changes for new domains |

---

## Logging & Monitoring (Production)

CivicTrack uses **structured JSON logging** and **correlation IDs** for observability on Railway, Render, and Fly.io. No AWS or Azure.

See **[LOGGING_MONITORING.md](./LOGGING_MONITORING.md)** for:

### Logging Architecture

- **Structured JSON**: `timestamp`, `level`, `message`, `requestId`, `endpoint`, `method`, `statusCode`, `latency`
- **Correlation ID**: `X-Request-ID` on every request; propagated through logs
- **Sensitive data**: Passwords, tokens, and secrets are never logged
- **Error categories**: `validation_error`, `auth_error`, `system_error`, `external_service_error`

### Example Log

```json
{
  "timestamp": "2026-02-16T14:00:00.000Z",
  "level": "info",
  "message": "request_start",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "endpoint": "/api/health",
  "method": "GET",
  "environment": "production"
}
```

### Platform Integration

- **Railway / Render / Fly.io**: Logs stream to platform dashboard
- **Third-party**: Logtail, Axiom, Datadog for search, alerts, dashboards
- **Retention**: 14 days operational, 30 days errors (configurable)
- **Alerts**: Error spike, high latency, 5xx rate

