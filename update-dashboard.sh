#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Updating Dashboard from GitHub..."
cd "$SCRIPT_DIR"

echo "Pulling latest changes..."
git pull

echo "Installing frontend dependencies..."
cd frontend
npm install

echo "Rebuilding frontend..."
npm run build
cd ..

echo "Installing backend dependencies..."
cd backend
npm install
cd ..

echo "Restarting services with PM2..."
pm2 restart dashboard-backend
pm2 restart dashboard-frontend

echo "Update complete! Dashboard restarted."
echo "Refresh will happen automatically in the browser."
