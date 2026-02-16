# CivicTrack – Custom Domain & SSL Setup (Production)

Production-grade domain configuration and SSL for CivicTrack when deployed on **Supabase-compatible platforms** (Railway, Render, Fly.io). No AWS or Azure.

---

## 1. Domain Configuration Strategy

### Supported Architecture

CivicTrack uses **Supabase** (PostgreSQL, Storage, Vault). The Next.js app (frontend + backend) is deployed to a Docker host. Custom domains are configured at the platform level.

| Environment | Domain Example | Purpose |
|-------------|----------------|---------|
| **Production** | `civictrack.com` | Live app |
| **www** | `www.civictrack.com` | Canonical or redirect to root |
| **API** | `api.civictrack.com` | Backend API (optional split) |
| **Staging** | `staging.civictrack.com` | Pre-production |
| **Dev** | `dev.civictrack.com` | Development preview |

### Registrar & Nameserver

- **External registrar**: Any (GoDaddy, Namecheap, Cloudflare Registrar, etc.).
- **DNS hosting**: Use your platform's guidance or a DNS provider (Cloudflare DNS, DNSimple, etc.).
- **Nameserver migration**: When switching DNS providers, update nameservers at your registrar. Typical TTL before migration: 300–3600 seconds. After migration, expect 24–48 hours for full propagation.

### DNS Propagation & TTL

- **TTL (Time to Live)**: Lower = faster changes (e.g. 300s for staging). Higher = less load (e.g. 3600s for production).
- **Propagation**: Allow 1–24 hours for new records; some regions may take up to 48 hours.
- **Pre-change**: Reduce TTL 24–48 hours before a cutover so changes propagate quickly.

---

## 2. DNS Zone Setup

### Railway

1. **Add custom domain** in Railway: Project → Settings → Domains.
2. **DNS records** (use your DNS host, e.g. Cloudflare):
   - **Root domain**: `myapp.com` → CNAME to `your-app.up.railway.app` (or the host Railway provides).
   - **www**: `www.myapp.com` → CNAME to `myapp.com` or the same Railway host.
   - **Staging**: `staging.myapp.com` → CNAME to your staging service host.
3. Railway gives you the exact host to use after you add a domain.

### Render

1. **Add custom domain**: Dashboard → Your Web Service → Settings → Custom Domain.
2. **Root domain**: Add `myapp.com`. Render provides a target (e.g. `your-app.onrender.com`).
3. **DNS records**:
   - **A record** (root): Render usually provides an A record target (IP) or CNAME.
   - **CNAME (www)**: `www` → `myapp.com` or Render’s root target.
4. **Staging**: Add another service for staging and use `staging.myapp.com` → staging service host.

### Fly.io

1. **Add custom domain**: `fly certs add myapp.com`.
2. **DNS**:
   - **A record** (root): Add A records for the IPv4 addresses Fly provides.
   - **AAAA**: IPv6 addresses if provided.
   - **www**: CNAME `www` → `myapp.com` or Fly app host.
3. Fly issues Let’s Encrypt certs when DNS resolves correctly.

### CNAME vs A Record

| Record | Use Case | Notes |
|--------|----------|-------|
| **CNAME** | Subdomains, aliases | Points one hostname to another. Use for `www`, `api`, `staging`. Root domain (apex) cannot be CNAME on some DNS. |
| **A** | Root domain (apex) | Points to an IP. Platforms like Fly.io provide IPs; others use CNAME flattening at the DNS provider (e.g. Cloudflare). |
| **ALIAS/ANAME** | Apex with CNAME-like behavior | Cloudflare and others support apex CNAME via proxy. Use when the platform only gives a hostname. |

### Best Practices

- **Apex (root)**: Use A/ALIAS if the platform gives an IP; otherwise use CNAME flattening where supported.
- **www**: CNAME to root or the same target.
- **No insecure wildcards**: Avoid `*.myapp.com` unless you need it; create explicit records for each subdomain.

---

## 3. SSL Certificate Setup

### Railway

- **SSL**: Automatic (Let’s Encrypt).
- **Flow**: Add custom domain → Railway provisions and renews the certificate.
- **Validation**: DNS must point to Railway before the cert is issued.
- **Status**: Check in project settings; certificate renews automatically.

### Render

- **SSL**: Managed certificate.
- **Flow**: Add custom domain → Render requests cert when DNS is correct.
- **Status**: Dashboard shows “Certificate issued” when ready.
- **Renewal**: Automatic, typically via Let’s Encrypt.

### Fly.io

- **SSL**: Let’s Encrypt via `fly certs add`.
- **Flow**: Run `fly certs add myapp.com` after DNS is configured.
- **Validation**: Automatic HTTP-01 challenge.
- **Renewal**: Automatic; Fly handles renewals before expiry.

### Why DNS Validation

- No manual email verification.
- Works for wildcards (if needed).
- Allows automation and CI/CD.
- Reduces risk of expiry due to missed emails.

### Wildcard Certificates

- **Use case**: `*.myapp.com` (many subdomains).
- **Trade-off**: Requires DNS validation and explicit DNS records; not all platforms support it.
- **CivicTrack**: Explicit subdomains (`api`, `staging`, `www`) are preferred over wildcards.

### Expiration Monitoring

- Check platform dashboards for certificate status.
- Use SSL Labs (see Section 6) for expiry and chain validation.
- Configure alerts in the platform if available.

---

## 4. HTTPS Enforcement

### Platform-Level Redirect

HTTPS enforcement should be done by the platform, not only in Next.js:

| Platform | Setting | Behavior |
|----------|---------|----------|
| **Railway** | Built-in | HTTP → HTTPS redirect |
| **Render** | HTTPS Only | Redirect HTTP to HTTPS |
| **Fly.io** | Default | HTTPS by default |

### Why Infrastructure-Level Redirect

- Happens before traffic reaches your app.
- Avoids unnecessary load on the app.
- Preserves path and query string.
- Better for SEO and security.

### Next.js Configuration

CivicTrack already enforces HTTPS in production for non-local requests. Behind a load balancer or platform proxy:

1. Set `X-Forwarded-Proto: https` (platforms typically do this).
2. Do **not** set `SKIP_HTTPS_REDIRECT=1` in production.
3. Local Docker testing may use `SKIP_HTTPS_REDIRECT=1` for HTTP health checks.

### Redirect Behavior

- **301 vs 308**: Use 308 (Permanent) so POST is not converted to GET.
- **Path/query**: Redirect must preserve full URL.
- **SEO**: Use consistent canonical HTTPS URLs.

---

## 5. Security Hardening

### HSTS (HTTP Strict Transport Security)

CivicTrack sets:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

- **max-age**: One year; required for HSTS preload.
- **includeSubDomains**: Enforces HTTPS for all subdomains.
- **preload**: Allows inclusion in browser preload lists.

### TLS Configuration

- **Minimum**: TLS 1.2.
- **Prefer**: TLS 1.3 where supported.
- **Cipher suites**: Let the platform use modern defaults.
- **No self-signed certs in production.**

### Mixed Content

- All assets and API calls must use HTTPS.
- `NEXT_PUBLIC_API_URL` and backend URLs must be `https://`.
- CSP `connect-src` should restrict to `https:`.

### Private Keys

- Never commit private keys to the repo.
- Certificates and keys are managed by the platform.
- No `.pem`, `.key` or similar files in the codebase.

---

## 6. Verification Steps

### Browser

1. Visit `https://myapp.com`.
2. Confirm lock icon; click it and verify certificate details.
3. Check for mixed-content or insecure resource warnings.

### Chrome DevTools

1. Open DevTools → Application → Security.
2. Confirm “Secure origin” and “Valid certificate”.
3. Check HSTS under “Security” if available.

### SSL Labs

1. Go to [https://www.ssllabs.com/ssltest/](https://www.ssllabs.com/ssltest/).
2. Enter `https://myapp.com`.
3. Wait for the report.
4. Target: A or A+ and no critical issues.

### DNS Verification

```bash
# Check A record
dig myapp.com A +short

# Check CNAME
dig www.myapp.com CNAME +short

# Check propagation
dig myapp.com @8.8.8.8 A +short
```

### Certificate Validation Failures

- **DNS not propagated**: Wait or lower TTL.
- **Wrong record**: Ensure CNAME/A matches the exact target from the platform.
- **Apex CNAME**: Some registrars disallow apex CNAME; use ALIAS or A records.
- **Rate limits**: Let’s Encrypt has limits; avoid frequent retries.

### Expected Results Checklist

- [ ] Root domain resolves
- [ ] www resolves (or redirects to root)
- [ ] HTTPS works on root and www
- [ ] Certificate valid (not expired, correct domain)
- [ ] HTTP redirects to HTTPS
- [ ] No mixed-content warnings
- [ ] HSTS header present
- [ ] SSL Labs A or A+

---

## 7. Multi-Environment Domain Strategy

### Recommended Structure

| Environment | Domain | SSL | Use |
|-------------|--------|-----|-----|
| **Production** | `civictrack.com` | Yes | Main app |
| **www** | `www.civictrack.com` | Yes | Redirect to root |
| **API** | `api.civictrack.com` | Yes | Backend if split |
| **Staging** | `staging.civictrack.com` | Yes | Pre-prod |
| **Dev** | `dev.civictrack.com` | Yes | Dev previews |

### Why Separate Domains

- Isolates environments.
- Prevents production data in staging.
- Clear separation for auth, cookies, and CORS.
- Easier security and compliance.

### SSL and Subdomains

- **Option A**: One cert per subdomain (platform default).
- **Option B**: Wildcard `*.civictrack.com` if the platform supports it.
- **CivicTrack**: Explicit subdomains are enough; no wildcard needed.

---

## 8. Cost & Maintenance

### Costs

| Item | Typical Cost |
|------|--------------|
| **SSL** | Free (Let’s Encrypt via platform) |
| **Railway DNS** | Included |
| **Render** | Included in plan |
| **Fly.io** | Included |
| **Domain** | Annual (e.g. ~$10–15) |
| **Cloudflare DNS** | Free tier available |

### Maintenance

- **Renewal**: Platforms auto-renew certificates.
- **Expiration**: Monitor via dashboards and SSL Labs.
- **Domain renewal**: Renew at the registrar before expiry.
- **Monitoring**: Use uptime checks and alerting.

---

## 9. Supabase-Specific Notes

### Supabase Domains

- Supabase API: `https://<project-ref>.supabase.co`.
- No custom domain configuration needed for Supabase itself.
- Auth, Storage, and DB use Supabase’s default SSL.

### App Configuration

| Variable | Example |
|----------|---------|
| `CORS_ORIGIN` | `https://civictrack.com` |
| `NEXT_PUBLIC_API_URL` | `https://api.civictrack.com` or `https://civictrack.com` if same host |
| `SUPABASE_URL` | `https://xxx.supabase.co` |

### CORS

- Set `CORS_ORIGIN` to the frontend domain.
- Use `CORS_ORIGINS` for multiple (e.g. `https://civictrack.com,https://www.civictrack.com`).
- Never use `*` in production.

---

## Summary

| Item | Status |
|------|--------|
| Custom domain | Via Railway / Render / Fly.io |
| SSL | Automatic (Let’s Encrypt) |
| HTTPS redirect | Platform + app |
| HSTS | Enabled in app |
| DNS | CNAME/A per platform |
| Multi-environment | Supported |
| No AWS/Azure | Supabase-compatible stack only |
