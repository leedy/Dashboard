# MongoDB Setup Guide

This guide covers setting up MongoDB for the Dashboard application, including user creation and authentication configuration.

## Before You Start (Required)

**The MongoDB user must be created manually before the app will work.** The app does not create database users automatically - it only connects using the credentials you provide.

If you skip this step, you'll see this error when starting the app:
```
MongoServerError: Authentication failed. (code 18)
```

### Quick Example: Create User and Configure App

**Step 1:** Connect to MongoDB and create the user:

```bash
mongosh "mongodb://admin:adminpassword@192.168.1.30:27017/admin"
```

```javascript
use dashboard

db.createUser({
  user: "dashboard_user",
  pwd: "mySecurePassword123",
  roles: [{ role: "readWrite", db: "dashboard" }]
})
```

**Step 2:** Configure your app's `backend/.env` to match:

```env
MONGO_HOST=192.168.1.30
MONGO_PORT=27017
MONGO_USERNAME=dashboard_user
MONGO_PASSWORD=mySecurePassword123
MONGO_DATABASE=dashboard
```

Note how the values match up:
| MongoDB Command | Environment Variable |
|-----------------|---------------------|
| `use dashboard` | `MONGO_DATABASE=dashboard` |
| `user: "dashboard_user"` | `MONGO_USERNAME=dashboard_user` |
| `pwd: "mySecurePassword123"` | `MONGO_PASSWORD=mySecurePassword123` |
| MongoDB server IP | `MONGO_HOST=192.168.1.30` |

**Step 3:** Start the app - it should now connect successfully.

---

## Overview

The Dashboard app requires MongoDB for storing:
- User accounts and preferences
- Cached game data
- Photos and usage analytics

**Important:** The app authenticates against the same database specified in `MONGO_DATABASE`. Users must be created in that database (not in `admin`).

## Prerequisites

- MongoDB server installed and running
- Network access to MongoDB from your app server
- `mongosh` CLI tool for database administration

## Detailed Setup

### 1. Connect to MongoDB

```bash
# Connect as admin
mongosh "mongodb://admin_user:admin_password@your_mongo_host:27017/admin"
```

### 2. Create the Application Database and User

```javascript
// Switch to the dashboard database
use dashboard

// Create an application-specific user
db.createUser({
  user: "dashboard_user",
  pwd: "your_secure_password",
  roles: [
    { role: "readWrite", db: "dashboard" }
  ]
})
```

### 3. Verify the User

```javascript
// Test authentication (should return { ok: 1 })
db.auth("dashboard_user", "your_secure_password")
```

### 4. Configure the App

In `backend/.env`:

```env
MONGO_HOST=your_mongo_host
MONGO_PORT=27017
MONGO_USERNAME=dashboard_user
MONGO_PASSWORD=your_secure_password
MONGO_DATABASE=dashboard
```

## Understanding Authentication Source

MongoDB authenticates users against a specific database called the **authSource**. This app uses `MONGO_DATABASE` as the authSource, meaning:

- If `MONGO_DATABASE=dashboard`, users must exist in the `dashboard` database
- If `MONGO_DATABASE=dashboard_qa`, users must exist in the `dashboard_qa` database

### Connection String

The app builds this connection string:

```
mongodb://user:pass@host:port/database?authSource=database
```

For example, with `MONGO_DATABASE=dashboard`:

```
mongodb://dashboard_user:pass@192.168.1.30:27017/dashboard?authSource=dashboard
```

### Common Authentication Error

If you see this error:

```
MongoServerError: Authentication failed. (code 18)
```

It usually means:
1. The user was created in a different database (often `admin`)
2. The password is incorrect
3. The username is misspelled

**Solution:** Ensure the user exists in the same database specified in `MONGO_DATABASE`.

## Multi-Environment Setup

For running separate QA/staging and production environments, create separate databases and users:

### Production Setup

```javascript
use dashboard

db.createUser({
  user: "dashboard_prod",
  pwd: "prod_secure_password",
  roles: [{ role: "readWrite", db: "dashboard" }]
})
```

Production `backend/.env`:
```env
MONGO_DATABASE=dashboard
MONGO_USERNAME=dashboard_prod
MONGO_PASSWORD=prod_secure_password
```

### QA/Staging Setup

```javascript
use dashboard_qa

db.createUser({
  user: "dashboard_qa",
  pwd: "qa_secure_password",
  roles: [{ role: "readWrite", db: "dashboard_qa" }]
})
```

QA `backend/.env`:
```env
MONGO_DATABASE=dashboard_qa
MONGO_USERNAME=dashboard_qa
MONGO_PASSWORD=qa_secure_password
```

This keeps environments completely isolated with separate databases and credentials.

## User Management

### List Users in a Database

```javascript
use dashboard
db.getUsers()
```

### Remove a User

```javascript
use dashboard
db.dropUser("old_username")
```

### Change a User's Password

```javascript
use dashboard
db.changeUserPassword("dashboard_user", "new_secure_password")
```

### Add Additional Roles

```javascript
use dashboard
db.grantRolesToUser("dashboard_user", [
  { role: "dbAdmin", db: "dashboard" }
])
```

## Migrating from Admin Auth

If you previously created users in the `admin` database and need to migrate:

### 1. Create New User in App Database

```javascript
use dashboard

db.createUser({
  user: "dashboard_user",
  pwd: "your_password",
  roles: [{ role: "readWrite", db: "dashboard" }]
})
```

### 2. Verify New User Works

```javascript
db.auth("dashboard_user", "your_password")
// Should return { ok: 1 }
```

### 3. Update App Configuration

Ensure `backend/.env` has the correct values, then restart the app.

### 4. Remove Old User (Optional)

```javascript
use admin
db.dropUser("old_dashboard_user")
```

## Security Best Practices

1. **Use strong passwords** - At least 16 characters with mixed case, numbers, and symbols
2. **Limit roles** - Only grant `readWrite` on the specific database needed
3. **Use separate users per environment** - Don't share credentials between prod/QA
4. **Restrict network access** - Configure MongoDB to only accept connections from known IPs
5. **Enable TLS** - Use encrypted connections in production

## Troubleshooting

### Cannot Connect to MongoDB

```bash
# Test connectivity
nc -zv your_mongo_host 27017

# Test with mongosh
mongosh "mongodb://your_mongo_host:27017"
```

### Authentication Failed (Code 18)

1. Verify user exists in the correct database:
   ```javascript
   use dashboard
   db.getUsers()
   ```

2. Test authentication directly:
   ```javascript
   use dashboard
   db.auth("dashboard_user", "your_password")
   ```

3. Check for typos in username/password in `.env`

### User Has No Permissions

```javascript
use dashboard
db.grantRolesToUser("dashboard_user", [
  { role: "readWrite", db: "dashboard" }
])
```

### View Current Connections

```javascript
db.currentOp(true).inprog.forEach(function(op) {
  if(op.client) print(op.client)
})
```

## Docker Considerations

When running the Dashboard app in Docker:

- `MONGO_HOST` must be set to your MongoDB server's actual IP address (e.g., `192.168.1.30`)
- Do NOT use `127.0.0.1` or `localhost` - the container cannot reach the host this way
- The container uses bridge networking with explicit port mapping

See [DOCKER_SETUP.md](DOCKER_SETUP.md) for complete Docker deployment instructions.
