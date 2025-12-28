# Docker Setup Guide

This guide covers deploying the Dashboard app using Docker, specifically with Portainer on Unraid.

## Prerequisites

- Docker installed (comes with Unraid)
- Portainer CE installed and running
- MongoDB running and accessible (can be on the same server or network)
- Your MongoDB credentials (host, port, username, password)

## Files Overview

The Docker deployment uses three files in the repository root:

| File | Purpose |
|------|---------|
| `Dockerfile` | Instructions for building the app image |
| `docker-compose.yml` | Configuration for running the container |
| `.dockerignore` | Files to exclude from the build |

## Deployment via Portainer

### Step 1: Create a Stack

1. Open Portainer (usually `http://your-server-ip:9000`)
2. Click **Stacks** in the left sidebar
3. Click **+ Add stack**
4. Enter a name: `dashboard`

### Step 2: Configure Repository

1. Select **Repository** as the build method
2. Enter the repository URL: `https://github.com/leedy/Dashboard.git`
3. Set **Repository reference**: `refs/heads/main`
4. Set **Compose path**: `docker-compose.yml`

### Step 3: Set Environment Variables

Scroll down to **Environment variables** and add:

| Variable | Value | Description |
|----------|-------|-------------|
| `MONGO_HOST` | `127.0.0.1` | MongoDB host (use `127.0.0.1` if on same server) |
| `MONGO_PORT` | `27017` | MongoDB port |
| `MONGO_USERNAME` | your_username | Your MongoDB username |
| `MONGO_PASSWORD` | your_password | Your MongoDB password |
| `MONGO_DATABASE` | `dashboard` | Database name |

**Note:** If MongoDB is on a different server, use that server's IP address instead of `127.0.0.1`.

### Step 4: Deploy

1. Click **Deploy the stack**
2. Wait for the build to complete (first build takes 5-10 minutes)
3. Check **Containers** to verify `dashboard-app` is running

### Step 5: Access the App

Open `http://your-server-ip:3001` in your browser.

## Updating the App

When you push changes to GitHub and want to update the running container:

1. Go to **Stacks** → click **dashboard**
2. Click **Pull and redeploy** (or "Update the stack")
3. Enable **Re-pull image** and **Force rebuild** if available
4. Click **Update**

The container will rebuild with the latest code from GitHub.

## Troubleshooting

### Check Container Logs

1. Go to **Containers** → click **dashboard-app**
2. Click the **Logs** button (document icon)
3. Look for error messages

### Common Issues

#### "EHOSTUNREACH" or "MongoDB connection error"

**Cause:** Container can't reach MongoDB server.

**Solutions:**
- If MongoDB is on the same server, use `MONGO_HOST=127.0.0.1`
- Verify `network_mode: host` is in docker-compose.yml
- Check MongoDB is running: `mongosh mongodb://user:pass@host:27017/dashboard`

#### "Network Error" in Browser

**Cause:** Frontend can't reach the backend API.

**Solutions:**
- Check container logs for MongoDB connection errors
- Verify environment variables are set correctly in Portainer
- Restart the container after changing environment variables

#### Build Fails

**Cause:** Usually npm install or build errors.

**Solutions:**
- Check Portainer build logs for specific error messages
- Ensure the repository URL is correct
- Try removing the stack and recreating it

#### Changes Not Appearing After Update

**Cause:** Docker cached the old build.

**Solutions:**
- Enable "Force rebuild" when updating
- Delete the stack and redeploy from scratch
- In Portainer, go to **Images** and remove old dashboard images

### Viewing Real-Time Logs

In Portainer:
1. Go to **Containers** → **dashboard-app**
2. Click **Logs**
3. Enable **Auto-refresh** to see live logs

### Restarting the Container

1. Go to **Containers**
2. Select **dashboard-app**
3. Click **Restart**

## Configuration Reference

### docker-compose.yml

```yaml
version: '3.8'

services:
  dashboard:
    build: .
    container_name: dashboard-app
    restart: unless-stopped
    network_mode: host          # Required to reach MongoDB on local network
    environment:
      - MONGO_HOST=${MONGO_HOST:-127.0.0.1}
      - MONGO_PORT=${MONGO_PORT:-27017}
      - MONGO_USERNAME=${MONGO_USERNAME:-dashboard_user}
      - MONGO_PASSWORD=${MONGO_PASSWORD:-changeme}
      - MONGO_DATABASE=${MONGO_DATABASE:-dashboard}
      - BACKEND_PORT=3001
      - JWT_SECRET=${JWT_SECRET:-auto-generated-if-not-set}
```

**Key settings:**
- `network_mode: host` - Container uses host's network directly (required for reaching MongoDB)
- `restart: unless-stopped` - Container restarts automatically unless manually stopped
- Environment variables use `${VAR:-default}` syntax (Portainer values override defaults)

### Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
WORKDIR /app/backend
RUN npm ci --only=production
WORKDIR /app/frontend
RUN npm ci

# Copy source and build
WORKDIR /app
COPY backend/ ./backend/
COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN npm run build

# Run
WORKDIR /app/backend
EXPOSE 3001
CMD ["node", "server.js"]
```

**What it does:**
1. Starts with Node.js 20 (Alpine Linux for small size)
2. Installs backend dependencies (production only)
3. Installs frontend dependencies
4. Copies source code
5. Builds React frontend
6. Runs the Express backend (which serves the built frontend)

### Port Configuration

The app runs on port **3001** by default. Since we use `network_mode: host`, this port is exposed directly on the host.

To change the port:
1. Update `BACKEND_PORT` environment variable in Portainer
2. Access the app on the new port

**Note:** With host networking, the `ports:` mapping in docker-compose.yml is not used.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Unraid Server                        │
│                                                         │
│  ┌─────────────────────┐    ┌─────────────────────┐    │
│  │   Docker Container  │    │      MongoDB        │    │
│  │   (dashboard-app)   │───▶│   (port 27017)      │    │
│  │                     │    │                     │    │
│  │   Express Backend   │    └─────────────────────┘    │
│  │   (port 3001)       │                               │
│  │         │           │                               │
│  │   React Frontend    │                               │
│  │   (built static)    │                               │
│  └─────────────────────┘                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
           │
           ▼
    Browser accesses
    http://server-ip:3001
```

## Future: Auto-Updates from GitHub

To enable automatic updates when you push to GitHub, you can set up:

1. **GitHub Actions** - Build and push Docker image to Docker Hub on every push
2. **Watchtower** - Automatically pull and restart updated images
3. **Portainer Webhooks** - Trigger redeployment from GitHub

See the main README.md for details on setting this up (coming soon).
