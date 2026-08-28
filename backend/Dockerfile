# syntax=docker/dockerfile:1.7
# Multi-platform: linux/amd64, linux/arm64 (Apple Silicon, Raspberry Pi)
FROM --platform=$BUILDPLATFORM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

FROM --platform=$BUILDPLATFORM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY database ./database
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/database ./database
COPY package.json ./
USER appuser
EXPOSE 3001
# Use node fetch (no curl/wget needed) — works on alpine + distroless
HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=10s CMD node -e "fetch('http://localhost:3001/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
