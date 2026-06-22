/**
 * PM2 process config for the Brainotix site.
 * Usage on the server (from the project folder):
 *   pm2 start deploy/ecosystem.config.js
 *   pm2 save
 *
 * SMTP and other secrets are read from the project's .env file by server.js
 * (via dotenv), so they do NOT need to be repeated here.
 */
module.exports = {
  apps: [
    {
      name: 'brainotix',
      script: 'server.js',
      cwd: '/home/ubuntu/brainotix',   // <-- change if you clone elsewhere
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
