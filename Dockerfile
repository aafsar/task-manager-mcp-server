# Task Manager MCP Server - Dockerfile
# Multi-stage build for optimal image size

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create data directory
RUN mkdir -p /app/data

# Set environment variables
ENV NODE_ENV=production
ENV DATA_DIR=/app/data

# Expose port (if using HTTP transport in future)
# EXPOSE 3000

# Run the server
CMD ["node", "dist/index.js"]
