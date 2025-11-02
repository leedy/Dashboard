# Dashboard App - Raspberry Pi 5 Setup Guide

Complete guide for setting up your Dashboard application on a Raspberry Pi 5 with auto-start and kiosk mode.

---

## Prerequisites

- Raspberry Pi 5 (4GB+ RAM recommended)
- MicroSD card (32GB+ recommended)
- Monitor with HDMI cable
- Keyboard & mouse (for initial setup)
- Internet connection (WiFi or Ethernet)
- TMDb API key (optional, for movies dashboard)
- MongoDB server (local or remote)

---

## Step 1: Install Raspberry Pi OS

1. **Download Raspberry Pi Imager** from https://www.raspberrypi.com/software/
2. **Flash the OS:**
   - Insert your microSD card into your computer
   - Open Raspberry Pi Imager
   - Choose **Raspberry Pi OS (64-bit)** (Desktop version, not Lite)
   - Select your microSD card
   - Click the **Settings** gear icon:
     - Set hostname (e.g., `dashboard-pi`)
     - Enable SSH
     - Configure WiFi credentials
     - Set username and password
   - Click **Write**
3. **Boot the Pi:**
   - Insert the microSD card into your Raspberry Pi 5
   - Connect monitor, keyboard, and mouse
   - Power on the Pi
   - Complete the initial setup wizard

---

## Step 2: Initial Pi Configuration

Open a terminal and run:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Git
sudo apt install git -y

# Reboot if kernel was updated
sudo reboot
```

---

## Step 3: Install Node.js

The dashboard requires Node.js to run. Install the latest LTS version:

```bash
# Install Node.js 20.x (recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show npm version
```

---

## Step 4: Install & Configure MongoDB

You have two options for MongoDB:

### Option A: Use Remote MongoDB (Recommended)

If you have MongoDB running on another machine (like Unraid/NAS):
- Skip MongoDB installation on Pi
- Configure connection details in Step 6

### Option B: Install MongoDB Locally on Pi

If you want MongoDB running on the Raspberry Pi itself:

```bash
# Install MongoDB
sudo apt install mongodb -y

# Start MongoDB service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Verify it's running
sudo systemctl status mongodb
```

**Note:** Local MongoDB will use Pi's resources. Remote MongoDB is recommended for better performance.

---

## Step 5: Clone Your Repository

```bash
# Navigate to home directory
cd ~

# Clone the Dashboard repository
git clone https://github.com/leedy/Dashboard.git

# Navigate to the repository
cd Dashboard
```

---

## Step 6: Configure Environment Variables

### Backend Configuration

```bash
# Navigate to server directory
cd ~/Dashboard/server

# Create .env file from template
cp .env.template .env

# Edit the .env file
nano .env
```

**For Remote MongoDB (Option A):**
```env
MONGO_HOST=192.168.1.100  # Replace with your MongoDB server IP
MONGO_PORT=27017
MONGO_USERNAME=admin
MONGO_PASSWORD=your_password
MONGO_DATABASE=dashboard
BACKEND_PORT=3001
```

**For Local MongoDB (Option B):**
```env
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_USERNAME=
MONGO_PASSWORD=
MONGO_DATABASE=dashboard
BACKEND_PORT=3001
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

### Frontend Configuration

```bash
# Navigate back to app root
cd ~/Dashboard

# Create frontend .env file
cp .env.local.template .env.local

# Edit if you want movies dashboard
nano .env.local
```

Add your TMDb API key (optional, only needed for movies dashboard):
```env
VITE_TMDB_API_KEY=your_api_key_here
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

---

## Step 7: Install Dependencies & Build

```bash
# Install frontend dependencies
cd ~/Dashboard
npm install

# Build the frontend for production
npm run build

# Install backend dependencies
cd ~/Dashboard/server
npm install
```

**Note:** The build process may take 5-10 minutes on Raspberry Pi.

---

## Step 8: Test the Application Manually

Before setting up auto-start, test that everything works:

```bash
# Terminal 1: Start backend
cd ~/Dashboard/server
node server.js

# Terminal 2 (open new terminal): Start frontend
cd ~/Dashboard
npm run preview -- --host 0.0.0.0
```

Open Chromium browser and navigate to: `http://localhost:4173`

If the dashboard loads correctly, press `Ctrl+C` in both terminals to stop the servers.

---

## Step 9: Create Systemd Services (Auto-start on Boot)

### Backend Service

```bash
sudo nano /etc/systemd/system/dashboard-backend.service
```

Paste this configuration:
```ini
[Unit]
Description=Dashboard Backend Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/Dashboard/server
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

### Frontend Service

```bash
sudo nano /etc/systemd/system/dashboard-frontend.service
```

Paste this configuration:
```ini
[Unit]
Description=Dashboard Frontend Server
After=network.target dashboard-backend.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/Dashboard
ExecStart=/usr/bin/npm run preview -- --host 0.0.0.0
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

### Enable & Start Services

```bash
# Reload systemd to recognize new services
sudo systemctl daemon-reload

# Enable services to start on boot
sudo systemctl enable dashboard-backend
sudo systemctl enable dashboard-frontend

# Start services now
sudo systemctl start dashboard-backend
sudo systemctl start dashboard-frontend

# Check status (should show "active (running)")
sudo systemctl status dashboard-backend
sudo systemctl status dashboard-frontend
```

If you see any errors, check logs with:
```bash
sudo journalctl -u dashboard-backend -n 50
sudo journalctl -u dashboard-frontend -n 50
```

---

## Step 10: Configure Chromium Kiosk Mode

### Install Required Packages

```bash
# Install Chromium browser and unclutter (hides mouse cursor)
sudo apt install chromium-browser unclutter -y
```

### Create Auto-start Desktop Entry

```bash
# Create autostart directory if it doesn't exist
mkdir -p ~/.config/autostart

# Create desktop entry
nano ~/.config/autostart/dashboard.desktop
```

Paste this:
```ini
[Desktop Entry]
Type=Application
Name=Dashboard
Exec=/home/pi/start-dashboard.sh
X-GNOME-Autostart-enabled=true
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

### Create Kiosk Start Script

```bash
nano ~/start-dashboard.sh
```

Paste this:
```bash
#!/bin/bash

# Wait for services to fully start
sleep 10

# Hide mouse cursor after 0.1 seconds of inactivity
unclutter -idle 0.1 &

# Start Chromium in kiosk mode
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --disable-features=TranslateUI \
  --disable-component-update \
  --start-maximized \
  --check-for-update-interval=31536000 \
  http://localhost:4173
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

Make the script executable:
```bash
chmod +x ~/start-dashboard.sh
```

---

## Step 11: Disable Screen Blanking

### Disable Screen Timeout in X Server

```bash
# Edit lightdm config

```

Find the `[Seat:*]` section and add this line:
```ini
[Seat:*]
xserver-command=X -s 0 -dpms
```

If the section doesn't exist, add it at the end of the file.

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

### Disable Screensaver

```bash
# Edit LXDE autostart
nano ~/.config/lxsession/LXDE-pi/autostart
```

Add these lines at the end:
```
@xset s off
@xset -dpms
@xset s noblank
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

---

## Step 12: Final Configuration & Reboot

### Set Desktop to Auto-login (if not already)

```bash
sudo raspi-config
```

Navigate to:
- **System Options** → **Boot / Auto Login** → **Desktop Autologin**
- Exit and select **Yes** when prompted to reboot

OR manually reboot:
```bash
sudo reboot
```

---

## Step 13: Verify Everything Works

After reboot (wait 30-60 seconds):
1. The desktop should load automatically
2. Chromium should launch in full-screen kiosk mode
3. Your dashboard should display
4. The cursor should be hidden

If something doesn't work, see the Troubleshooting section below.

---

## Maintenance Commands

### View Service Logs

```bash
# View backend logs (live)
sudo journalctl -u dashboard-backend -f

# View frontend logs (live)
sudo journalctl -u dashboard-frontend -f

# View last 50 lines of backend logs
sudo journalctl -u dashboard-backend -n 50

# View last 50 lines of frontend logs
sudo journalctl -u dashboard-frontend -n 50
```

### Restart Services

```bash
# Restart backend
sudo systemctl restart dashboard-backend

# Restart frontend
sudo systemctl restart dashboard-frontend

# Restart both
sudo systemctl restart dashboard-backend dashboard-frontend
```

### Stop Services

```bash
# Stop backend
sudo systemctl stop dashboard-backend

# Stop frontend
sudo systemctl stop dashboard-frontend
```

### Update Dashboard Code

When you make changes on your development machine and push them to GitHub, here's how to update your Pi:

**Manual Update:**
```bash
# SSH into your Pi
ssh your_username@raspberrypi.local

# Navigate to repository
cd ~/Dashboard

# Pull latest changes from GitHub
git pull

# Rebuild frontend
npm run build

# Restart services
sudo systemctl restart dashboard-backend
sudo systemctl restart dashboard-frontend
```

**Use the Update Script (Recommended):**

An update script is included in the repository that handles everything automatically:

```bash
# Copy the update script to your home directory
cp ~/Dashboard/update-dashboard.sh ~/update-dashboard.sh

# Make it executable (if not already)
chmod +x ~/update-dashboard.sh
```

The script does the following:
1. Pulls latest changes from GitHub
2. Installs any new frontend dependencies
3. Rebuilds the frontend
4. Installs any new backend dependencies
5. Restarts both services

**Now you can update with one command:**
```bash
~/update-dashboard.sh
```

**Update Workflow:**
1. Make changes on your development machine
2. Commit and push to GitHub
3. SSH into your Pi: `ssh your_username@192.168.1.X`
4. Run: `~/update-dashboard.sh`
5. Done! The dashboard updates automatically

### Exit Kiosk Mode

If you need to access the desktop while in kiosk mode:
- Press `Alt+F4` or `Ctrl+W` to close Chromium
- The dashboard will restart on next reboot

To prevent auto-start temporarily:
```bash
# Disable autostart
rm ~/.config/autostart/dashboard.desktop

# Re-enable later
nano ~/.config/autostart/dashboard.desktop
# (paste the desktop entry content again)
```

---

## Troubleshooting

### Dashboard Doesn't Load

**Check if services are running:**
```bash
sudo systemctl status dashboard-backend
sudo systemctl status dashboard-frontend
```

**Check for port conflicts:**
```bash
# Check if ports are in use
sudo lsof -i :3001  # Backend port
sudo lsof -i :4173  # Frontend port
```

**Restart services:**
```bash
sudo systemctl restart dashboard-backend
sudo systemctl restart dashboard-frontend
```

### MongoDB Connection Errors

**Test MongoDB connection:**
```bash
# For local MongoDB
sudo systemctl status mongodb

# For remote MongoDB
ping 192.168.1.100  # Replace with your MongoDB IP
telnet 192.168.1.100 27017  # Test if port is accessible
```

**Check environment variables:**
```bash
cat ~/Dashboard/server/.env
```

### Chromium Doesn't Start in Kiosk Mode

**Check if script is executable:**
```bash
ls -l ~/start-dashboard.sh
# Should show: -rwxr-xr-x
```

**Test script manually:**
```bash
~/start-dashboard.sh
```

**Check autostart configuration:**
```bash
cat ~/.config/autostart/dashboard.desktop
```

### Screen Keeps Blanking

**Verify screen blanking is disabled:**
```bash
# Check current settings
xset q | grep -A 2 "Screen Saver"

# Manually disable (temporary)
xset s off
xset -dpms
xset s noblank
```

**Check lightdm config:**
```bash
cat /etc/lightdm/lightdm.conf | grep xserver-command
```

### Performance Issues

**Check CPU/memory usage:**
```bash
top
# Or
htop  # (install with: sudo apt install htop)
```

**Reduce refresh intervals:**
Edit the frontend code to increase auto-refresh intervals:
```bash
nano ~/Dashboard/src/components/dashboards/TodaysGames.jsx
# Change line 38: 60000 (1 minute) to 120000 (2 minutes)
```

**Enable hardware acceleration:**
Chromium should use hardware acceleration by default on Pi 5, but verify:
```bash
# Open Chromium manually and visit:
chrome://gpu
# Check if hardware acceleration is enabled
```

---

## Optional Enhancements

### 1. Remote SSH Access

Your Pi should already have SSH enabled. Access it from another computer:

```bash
# From your laptop/desktop
ssh pi@raspberrypi.local
# Or use the IP address
ssh pi@192.168.1.X
```

### 2. Rotate Display (Portrait Mode)

If you're using a monitor in portrait orientation:

```bash
sudo nano /boot/config.txt
```

Add one of these lines at the end:
```
display_rotate=1    # 90° clockwise
display_rotate=2    # 180°
display_rotate=3    # 270° clockwise (90° counter-clockwise)
```

Save and reboot:
```bash
sudo reboot
```

### 3. VNC Access (Remote Desktop)

Enable VNC for GUI remote access:

```bash
# Install VNC server (usually pre-installed)
sudo apt install realvnc-vnc-server -y

# Enable VNC through raspi-config
sudo raspi-config
```

Navigate to: **Interface Options** → **VNC** → **Enable**

Connect using RealVNC Viewer from another computer: `raspberrypi.local`

### 4. Add Physical Refresh Button

You could wire a GPIO button to force-refresh the dashboard. Example script:

```bash
nano ~/refresh-button.py
```

```python
#!/usr/bin/env python3
import RPi.GPIO as GPIO
import subprocess
import time

# Use GPIO pin 17 (physical pin 11)
BUTTON_PIN = 17

GPIO.setmode(GPIO.BCM)
GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

def refresh_dashboard():
    subprocess.run(['xdotool', 'key', 'F5'])

try:
    while True:
        if GPIO.input(BUTTON_PIN) == GPIO.LOW:
            print("Button pressed! Refreshing...")
            refresh_dashboard()
            time.sleep(1)  # Debounce
        time.sleep(0.1)
except KeyboardInterrupt:
    GPIO.cleanup()
```

Install dependencies and run:
```bash
sudo apt install python3-rpi.gpio xdotool -y
python3 ~/refresh-button.py
```

### 5. Static IP Address

Set a static IP for your Pi:

```bash
sudo nano /etc/dhcpcd.conf
```

Add at the end:
```
interface wlan0  # or eth0 for Ethernet
static ip_address=192.168.1.150/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1 8.8.8.8
```

Reboot to apply.

---

## Performance Tips for Raspberry Pi 5

- **Pi 5 is powerful enough** to run this dashboard smoothly
- The **4GB RAM model is sufficient**; 8GB is even better
- Use **remote MongoDB** to reduce Pi's workload
- Consider using an **SSD via USB 3.0** instead of microSD for better performance
- Keep the Pi **well-ventilated** or use an **active cooler**
- Chromium on Pi 5 has **hardware acceleration enabled by default**

---

## Network Access

Once set up, you can access the dashboard from other devices on your network:

- **From Pi browser:** `http://localhost:4173`
- **From other devices:** `http://raspberrypi.local:4173` or `http://192.168.1.X:4173`

**Note:** The backend API is only accessible locally unless you configure port forwarding.

---

## Security Considerations

Since this is a local dashboard for personal use:

- **No authentication is implemented** (single-user design)
- **Don't expose ports to the internet** without adding authentication
- **MongoDB should only be accessible on your local network**
- **Keep your Pi updated:** `sudo apt update && sudo apt upgrade`

---

## Backup Your Configuration

After setup, create a backup:

```bash
# Backup environment files
cp ~/Dashboard/server/.env ~/dashboard-backup.env
cp ~/Dashboard/.env.local ~/dashboard-backup-frontend.env

# Or backup entire SD card using Raspberry Pi Imager
# (Image > Create from SD card)
```

---

## Support & Updates

- **GitHub Repository:** https://github.com/leedy/Dashboard
- **Update dashboard:** `cd ~/Dashboard && git pull && npm run build`
- **Issues:** Check logs with `sudo journalctl -u dashboard-backend -f`

---

## Summary of Running Services

After completing this setup, your Pi will:
1. Auto-login to desktop on boot
2. Start MongoDB (if local installation)
3. Start dashboard backend on port 3001
4. Start dashboard frontend on port 4173
5. Launch Chromium in kiosk mode displaying your dashboard
6. Hide the mouse cursor
7. Prevent screen blanking

Enjoy your dashboard! 🎉
