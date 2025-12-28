# Dashboard App Docker Image
# This file tells Docker how to build your app

# Start with Node.js 20 (LTS version)
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first (for better caching)
# When these don't change, Docker reuses cached layers
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm ci

# Copy the rest of the application code
WORKDIR /app
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build the frontend (creates dist/ folder)
WORKDIR /app/frontend
RUN npm run build

# Switch back to backend directory for running
WORKDIR /app/backend

# Expose the port the app runs on
EXPOSE 3001

# Start the backend server
CMD ["node", "server.js"]
