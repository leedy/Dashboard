module.exports = {
  apps: [
    {
      name: 'dashboard-backend',
      cwd: '/home/leedy/Dashboard/backend',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/home/leedy/Dashboard/logs/backend-error.log',
      out_file: '/home/leedy/Dashboard/logs/backend-out.log',
      time: true,
    }
  ]
};
