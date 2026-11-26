# NURSE GIFT — Next.js standalone image for Dokploy
# Served at https://service.nurse.cmu.ac.th/dev/nursegift (basePath is baked in at build time)

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_BASE_PATH=/dev/nursegift
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# scripts/migrate.mjs runs outside the Next bundle, so it gets its own mysql2
FROM node:22-alpine AS migrate-deps
WORKDIR /migrate
RUN npm init -y >/dev/null && npm install --omit=dev mysql2@3.24.6

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/db ./db
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=migrate-deps --chown=nextjs:nodejs /migrate/node_modules ./scripts/node_modules
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/dev/nursegift/admin/login >/dev/null || exit 1
# Create/upgrade tables, then start the server
CMD ["sh", "-c", "node scripts/migrate.mjs && exec node server.js"]
