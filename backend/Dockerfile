# =============================================================================
# CivicTrack Backend - Production Multi-Stage Dockerfile
# Supabase (PostgreSQL, Storage, Vault) compatible. No AWS/Azure.
# =============================================================================

# ---- Stage 1: Dependencies ----
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
# Builder needs devDependencies (prisma, typescript); runner uses prod only
RUN npm ci --ignore-scripts

# ---- Stage 2: Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (no DB connection)
RUN npx prisma generate

# Ensure public exists (Next.js standalone expects it)
RUN mkdir -p public

# Build Next.js (standalone output). Placeholder DATABASE_URL for build-time only.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
RUN npm run build

# ---- Stage 3: Runner ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build output (standalone omits public/static; add them)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Ensure app binds to all interfaces (required for containers)
ENV HOSTNAME=0.0.0.0
ENV PORT=5000
EXPOSE 5000

USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))" \
  || exit 1

# Graceful shutdown: Next.js handles SIGTERM
CMD ["node", "server.js"]
