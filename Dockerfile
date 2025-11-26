# Stage 1: Build client
FROM node:20-alpine AS client-builder

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# Stage 2: Setup server
FROM node:20-alpine AS server-builder

WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --only=production

# Stage 3: Final image
FROM node:20-alpine

WORKDIR /app

# Copy server files
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY server/package*.json ./server/
COPY server/index.js ./server/

# Copy built client files
COPY --from=client-builder /app/client/dist ./server/public

# Set working directory to server
WORKDIR /app/server

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "index.js"]
