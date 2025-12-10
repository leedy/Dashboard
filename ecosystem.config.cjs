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
    }
  ]
};
