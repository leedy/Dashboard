const path = require('path');
const appDir = __dirname;

module.exports = {
  apps: [
    {
      name: 'dashboard-backend',
      cwd: path.join(appDir, 'backend'),
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
      },
      error_file: path.join(appDir, 'logs/backend-error.log'),
      out_file: path.join(appDir, 'logs/backend-out.log'),
      time: true,
    },
    {
      name: 'dashboard-vite',
      cwd: path.join(appDir, 'frontend'),
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
      },
      error_file: path.join(appDir, 'logs/vite-error.log'),
      out_file: path.join(appDir, 'logs/vite-out.log'),
      time: true,
    }
  ]
};
