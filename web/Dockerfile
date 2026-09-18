# Multi-stage Dockerfile for Pinky Artwork Web Application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm install

COPY src/ ./src/
RUN npm run build

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY public ./public

# Ensure uploads and data directories exist with proper permissions
RUN mkdir -p /app/data /app/uploads && chown -R node:node /app

VOLUME ["/app/data", "/app/uploads"]

EXPOSE 3000

USER node

CMD ["node", "dist/server.js"]
