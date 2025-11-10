# Error Boundary Testing Guide

## How to Test the Error Boundary

The error boundaries are now active on all dashboards. Here's how to verify they work:

### Option 1: Simulate an Error (Temporary Test)

Add this code to any dashboard component to trigger an error:

```jsx
// Add this inside a component like TodaysGames.jsx temporarily
useEffect(() => {
  // Uncomment to test error boundary
  // throw new Error('Test error for error boundary');
}, []);
```

### Option 2: Break an API Endpoint

1. Temporarily change an API URL in one of the dashboards to an invalid endpoint
2. The component will crash
3. The error boundary will catch it and show the error UI

### Option 3: Network Disconnect Test

1. Disconnect your Pi from the network
2. Let the dashboard try to fetch data
3. Some components may crash trying to access undefined data
4. Error boundary will catch and display fallback UI

## What Happens When an Error Occurs

1. **Error Screen Appears** with:
   - Warning icon (⚠️)
   - Dashboard name that crashed
   - "Try Again" button
   - "Reload Page" button
   - Auto-recovery message (10 seconds)

2. **Auto-Recovery**: After 10 seconds, the component automatically tries to reload

3. **Isolation**: Only the broken dashboard crashes, not the entire app

## Features

- ✅ Prevents frozen/blank screens
- ✅ Auto-recovery after 10 seconds
- ✅ Manual retry button
- ✅ Full page reload option
- ✅ Shows which dashboard crashed
- ✅ Tracks error count if it keeps failing

## Production Monitoring

Check browser console for errors:
- Press F12 on your browser
- Look for "Error caught by boundary:" messages
- These show what crashed and why

## Remove Test Code

After testing, remember to remove any intentional error-throwing code!
