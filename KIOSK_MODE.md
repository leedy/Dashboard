# Kiosk Mode - User Guide

Complete guide for working with your Dashboard in kiosk mode on Raspberry Pi.

---

## What is Kiosk Mode?

Kiosk mode runs Chromium browser in full-screen without any browser UI elements (no address bar, tabs, or buttons). It's designed for dedicated display systems like dashboards, digital signage, or information displays.

When properly configured, your Raspberry Pi will:
- Auto-login on boot
- Automatically launch the dashboard in full-screen
- Hide the mouse cursor
- Prevent screen blanking
- Restart the dashboard if it crashes

---

## Exiting Kiosk Mode

There are several ways to exit kiosk mode and return to the desktop:

### Method 1: Close Chromium (Simplest)

**Press `Alt + F4`**

or

**Press `Ctrl + W`**

This closes the Chromium window and returns you to the Raspberry Pi desktop.

**Note:** The dashboard will restart automatically on the next reboot unless you disable auto-start.

---

### Method 2: Force Quit via Terminal

**Press `Ctrl + Alt + T`**

This opens a terminal window. Type:

```bash
pkill chromium
```

Press `Enter` to kill Chromium and exit kiosk mode.

---

### Method 3: Switch to Text Terminal (TTY)

If Chromium is frozen or unresponsive:

**Press `Ctrl + Alt + F2`**

This switches to a text-only terminal (TTY2). You'll see a login prompt:

```
raspberrypi login:
```

Login with your username and password, then:

```bash
# Kill all Chromium processes
pkill chromium

# Return to the graphical desktop
sudo systemctl restart lightdm
```

To get back to the desktop from TTY:

**Press `Ctrl + Alt + F7`**

---

### Method 4: SSH from Another Computer (Recommended)

The **easiest and cleanest way** to manage your Pi while it's running the dashboard is to SSH from another computer:

```bash
# From your Mac/PC
ssh username@raspberrypi.local

# Or use IP address
ssh username@192.168.1.X
```

From the SSH session, you can:

```bash
# Kill Chromium remotely
pkill chromium

# Restart services
sudo systemctl restart dashboard-backend
sudo systemctl restart dashboard-frontend

# Check logs
sudo journalctl -u dashboard-backend -f

# Update code
cd ~/Dashboard
git pull
npm run build
```

**Advantage:** You don't need to touch the Pi or disrupt the display.

---

## Preventing Auto-Start

If you need to reboot without the dashboard starting automatically:

### Temporarily Disable Auto-Start

```bash
# Disable kiosk mode auto-start
mv ~/.config/autostart/dashboard.desktop ~/.config/autostart/dashboard.desktop.disabled

# Now you can reboot without kiosk mode starting
sudo reboot
```

After reboot, the Pi will boot to a normal desktop.

### Re-enable Auto-Start

```bash
# Restore the autostart file
mv ~/.config/autostart/dashboard.desktop.disabled ~/.config/autostart/dashboard.desktop

# Next reboot will start kiosk mode again
sudo reboot
```

### Permanently Disable Auto-Start

```bash
# Remove the autostart file completely
rm ~/.config/autostart/dashboard.desktop

# Kiosk mode will not start on boot anymore
```

To re-enable, follow the setup guide to recreate the file.

---

## Manually Starting Kiosk Mode

If you've disabled auto-start or exited kiosk mode, you can manually restart it:

```bash
# Run the kiosk start script
~/start-dashboard.sh
```

Or run the commands directly:

```bash
# Hide mouse cursor
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

---

## Managing Services While in Kiosk Mode

You can manage the backend and frontend services without exiting kiosk mode:

### Via SSH (Recommended)

```bash
# SSH from another computer
ssh username@raspberrypi.local

# Restart backend
sudo systemctl restart dashboard-backend

# Restart frontend
sudo systemctl restart dashboard-frontend

# Check status
sudo systemctl status dashboard-backend
sudo systemctl status dashboard-frontend

# View logs
sudo journalctl -u dashboard-backend -f
sudo journalctl -u dashboard-frontend -f
```

### Via TTY Terminal

Press `Ctrl + Alt + F2`, login, then use the same commands above.

Press `Ctrl + Alt + F7` to return to the display.

---

## Creating a Keyboard Shortcut to Exit Kiosk Mode

You can set up a custom keyboard shortcut to make exiting easier:

### Step 1: Create Exit Script

```bash
nano ~/exit-kiosk.sh
```

Paste:
```bash
#!/bin/bash
pkill chromium
```

Save with `Ctrl+X`, `Y`, `Enter`

Make it executable:
```bash
chmod +x ~/exit-kiosk.sh
```

### Step 2: Add Keyboard Shortcut

1. On the Pi desktop, go to: **Preferences** → **Keyboard and Mouse** → **Keyboard Shortcuts**
2. Click **Add** to create a new shortcut
3. **Name:** Exit Kiosk Mode
4. **Command:** `/home/YOUR_USERNAME/exit-kiosk.sh` (replace YOUR_USERNAME)
5. **Key:** Click and press `Ctrl + Alt + E` (or your preferred combo)
6. Click **OK**

Now pressing `Ctrl + Alt + E` will exit kiosk mode instantly!

---

## Troubleshooting Kiosk Mode

### Chromium Won't Start

**Check if services are running:**
```bash
sudo systemctl status dashboard-backend
sudo systemctl status dashboard-frontend
```

Both should show `Active: active (running)` in green.

**Check if script is executable:**
```bash
ls -l ~/start-dashboard.sh
```

Should show: `-rwxr-xr-x` (the `x` means executable)

If not:
```bash
chmod +x ~/start-dashboard.sh
```

**Check autostart file:**
```bash
cat ~/.config/autostart/dashboard.desktop
```

Should contain the correct path to your start script.

---

### Kiosk Mode Starts But Shows Blank Screen

**Check frontend is accessible:**

Open a terminal (`Ctrl + Alt + T`) and test:
```bash
curl http://localhost:4173
```

If this fails, the frontend service isn't running properly.

**Check frontend logs:**
```bash
sudo journalctl -u dashboard-frontend -n 50
```

---

### Mouse Cursor Still Visible

**Check if unclutter is installed:**
```bash
which unclutter
```

If it returns nothing:
```bash
sudo apt install unclutter -y
```

**Manually hide cursor:**
```bash
unclutter -idle 0.1 &
```

---

### Screen Still Blanks/Sleeps

**Disable screen blanking again:**
```bash
xset s off
xset -dpms
xset s noblank
```

**Make it permanent in autostart:**
```bash
nano ~/.config/lxsession/LXDE-pi/autostart
```

Ensure these lines are present:
```
@xset s off
@xset -dpms
@xset s noblank
```

---

### Chromium Crashes or Shows Error Pages

**Clear Chromium cache:**
```bash
rm -rf ~/.cache/chromium
rm -rf ~/.config/chromium
```

**Restart kiosk mode:**
```bash
~/start-dashboard.sh
```

---

## Refreshing the Dashboard Without Exiting

Sometimes you just want to refresh the page:

### Method 1: Remote Refresh via SSH

```bash
# SSH into Pi
ssh username@192.168.1.X

# Send F5 keypress to Chromium (requires xdotool)
sudo apt install xdotool -y
DISPLAY=:0 xdotool key F5
```

### Method 2: Physical Button (Advanced)

You can wire a GPIO button to refresh the dashboard. See the optional enhancements section in the Raspberry Pi setup guide.

### Method 3: Restart Frontend Service

```bash
# Via SSH
ssh username@raspberrypi.local "sudo systemctl restart dashboard-frontend"
```

This will cause Chromium to reload the page automatically.

---

## Accessing Chromium DevTools in Kiosk Mode

If you need to debug the dashboard while in kiosk mode:

**Press `Ctrl + Shift + I`** or **`F12`**

This opens Chrome DevTools even in kiosk mode.

To close DevTools: **Press `Ctrl + Shift + I`** or **`F12`** again

---

## Remote Desktop Access (VNC)

If you want full GUI access to your Pi remotely:

### Enable VNC

```bash
sudo raspi-config
```

Navigate to: **Interface Options** → **VNC** → **Enable**

### Connect from Your Computer

1. Download **RealVNC Viewer** on your Mac/PC
2. Connect to: `raspberrypi.local` or the Pi's IP address
3. Login with your Pi username and password
4. You'll see the full desktop, including kiosk mode if it's running

---

## Best Practices

### For Daily Use

- **Use SSH** from your Mac/PC to manage the Pi without disrupting the display
- **Don't exit kiosk mode** unless you need to change system settings
- **Check logs remotely** instead of opening terminals on the Pi

### For Maintenance

- **SSH in first** to check service status before touching the Pi
- **Disable auto-start** before doing major updates or changes
- **Test manually** (with `~/start-dashboard.sh`) before rebooting

### For Troubleshooting

- **Check service logs first**: `sudo journalctl -u dashboard-backend -f`
- **Test services manually** before blaming kiosk mode
- **Use TTY terminal** (`Ctrl + Alt + F2`) if the desktop is frozen

---

## Summary of Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Exit kiosk mode | `Alt + F4` or `Ctrl + W` |
| Open terminal | `Ctrl + Alt + T` |
| Switch to TTY2 | `Ctrl + Alt + F2` |
| Return to desktop | `Ctrl + Alt + F7` |
| Open DevTools | `Ctrl + Shift + I` or `F12` |
| Custom exit (if configured) | `Ctrl + Alt + E` |

---

## Quick Reference Commands

```bash
# Exit kiosk mode
pkill chromium

# Start kiosk mode manually
~/start-dashboard.sh

# Disable auto-start (temporary)
mv ~/.config/autostart/dashboard.desktop ~/.config/autostart/dashboard.desktop.disabled

# Re-enable auto-start
mv ~/.config/autostart/dashboard.desktop.disabled ~/.config/autostart/dashboard.desktop

# Restart services
sudo systemctl restart dashboard-backend dashboard-frontend

# Check service status
sudo systemctl status dashboard-backend
sudo systemctl status dashboard-frontend

# View logs
sudo journalctl -u dashboard-backend -f
sudo journalctl -u dashboard-frontend -f

# SSH from another computer
ssh username@raspberrypi.local

# Refresh dashboard remotely (requires xdotool)
DISPLAY=:0 xdotool key F5
```

---

## Need Help?

- **Setup Issues:** See `RASPBERRY_PI_SETUP.md`
- **Service Issues:** Check logs with `sudo journalctl -u dashboard-backend -f`
- **GitHub Issues:** https://github.com/leedy/Dashboard/issues

---

Enjoy your dashboard! 🎉
