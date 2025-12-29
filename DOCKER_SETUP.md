# Docker Setup Guide

This guide covers deploying the Dashboard app using Docker, specifically with Portainer on Unraid.

## Prerequisites

- Docker installed (comes with Unraid)
- Portainer CE installed and running
- MongoDB running and accessible (can be on the same server or network)
- **MongoDB user created for the app** (see below)

## Before You Start: Create MongoDB User (Required)

**The app will not start without a MongoDB user.** You must create the user manually before deploying.

Connect to your MongoDB server and run:

```bash
mongosh "mongodb://admin:adminpassword@your_mongo_host:27017/admin"
```

```javascript
// Create the database and user
use dashboard

db.createUser({
  user: "dashboard_user",
  pwd: "your_secure_password",
  roles: [{ role: "readWrite", db: "dashboard" }]
})

// Verify it works
db.auth("dashboard_user", "your_secure_password")
// Should return: { ok: 1 }
```

The values you use here must match your environment variables:

| What you set in MongoDB | Environment Variable |
|------------------------|---------------------|
| `use dashboard` | `MONGO_DATABASE=dashboard` |
| `user: "dashboard_user"` | `MONGO_USERNAME=dashboard_user` |
| `pwd: "your_secure_password"` | `MONGO_PASSWORD=your_secure_password` |

See [MONGODB_SETUP.md](MONGODB_SETUP.md) for more details on MongoDB configuration.

## Files Overview

The Docker deployment uses three files in the repository root:

| File | Purpose |
|------|---------|
| `Dockerfile` | Instructions for building the app image |
| `docker-compose.yml` | Configuration for running the container |
| `docker.env.example` | Template for environment variables |
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

You have two options for setting environment variables:

#### Option A: Use an env file (Recommended for reuse)

1. Copy `docker.env.example` to `docker.env` on your server
2. Edit `docker.env` with your actual values
3. The docker-compose.yml will automatically load it

```bash
# On your server, in the cloned repo directory:
cp docker.env.example docker.env
nano docker.env  # Edit with your values
```

**Note:** `docker.env` is git-ignored so your credentials won't be committed.

#### Option B: Set in Portainer UI (Manual each time)

Scroll down to **Environment variables** and add:

| Variable | Value | Description |
|----------|-------|-------------|
| `MONGO_HOST` | `127.0.0.1` | MongoDB host (use `127.0.0.1` if on same server) |
| `MONGO_PORT` | `27017` | MongoDB port |
| `MONGO_USERNAME` | your_username | Your MongoDB username |
| `MONGO_PASSWORD` | your_password | Your MongoDB password |
| `MONGO_DATABASE` | `dashboard` | Database name |

**Important:** The MongoDB user must be created in the database specified by `MONGO_DATABASE`. See [MONGODB_SETUP.md](MONGODB_SETUP.md) for setup instructions.

#### Optional variables (both options)

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_PORT` | `3001` | Port the app runs on (change if 3001 is in use) |

**Note:** If MongoDB is on a different server, use that server's IP address instead of `127.0.0.1`.

### Step 4: Deploy

1. Click **Deploy the stack**
2. Wait for the build to complete (first build takes 5-10 minutes)
3. Check **Containers** to verify `dashboard-app` is running

### Step 5: Access the App

Open `http://your-server-ip:3001` in your browser (or your custom `BACKEND_PORT` if changed).

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

#### "Authentication failed" (code 18)

**Cause:** MongoDB user doesn't exist in the correct database.

**Solutions:**
- The user must be created in the database specified by `MONGO_DATABASE`, not in `admin`
- See [MONGODB_SETUP.md](MONGODB_SETUP.md) for user creation instructions
- Test authentication: `mongosh` then `use dashboard` then `db.auth("user", "pass")`

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
      - BACKEND_PORT=${BACKEND_PORT:-3001}
      - JWT_SECRET=${JWT_SECRET:-auto-generated-if-not-set}
```

**Key settings:**
- `network_mode: host` - Container shares the host's network stack directly. This is why `MONGO_HOST=127.0.0.1` works when MongoDB runs on the same server - the container sees `127.0.0.1` as the host machine, not itself. Without this setting, you'd need to use the host's actual IP address.
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
