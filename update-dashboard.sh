#!/bin/bash

echo "Updating Dashboard from GitHub..."
cd ~/Dashboard

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
