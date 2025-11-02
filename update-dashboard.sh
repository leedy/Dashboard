#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Updating Dashboard from GitHub..."
cd "$SCRIPT_DIR"

echo "Pulling latest changes..."
git pull

echo "Installing frontend dependencies..."
npm install

echo "Rebuilding frontend..."
npm run build

echo "Installing backend dependencies..."
cd server
npm install
cd ..

echo "Restarting services..."
sudo systemctl restart dashboard-backend
sudo systemctl restart dashboard-frontend

echo "Update complete! Dashboard restarted."
echo "Refresh will happen automatically in the browser."
