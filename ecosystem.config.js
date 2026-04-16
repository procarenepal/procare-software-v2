module.exports = {
  apps: [
    {
      name: 'procare-frontend',
      script: 'railway-server.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend.log',
      time: true,
      max_restarts: 5,
      restart_delay: 5000
    },
    {
      name: 'procare-sms-backend',
      script: 'sms-backend/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        CRON_ENABLED: 'true'
      },
      error_file: './logs/sms-backend-error.log',
      out_file: './logs/sms-backend-out.log', 
      log_file: './logs/sms-backend.log',
      time: true,
      max_restarts: 10,
      restart_delay: 3000,
      // SMS backend should keep running for cron jobs
      autorestart: true,
      watch: false
    },
    {
      name: 'procare-cron-runner',
      script: 'sms-backend/cron-runner.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/cron-error.log',
      out_file: './logs/cron-out.log',
      log_file: './logs/cron.log',
      time: true,
      max_restarts: 10,
      restart_delay: 5000,
      // Cron jobs should keep running
      autorestart: true,
      watch: false
    }
  ]
};
