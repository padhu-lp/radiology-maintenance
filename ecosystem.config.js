// PM2 process definition for the production server.
//
// Port 3100 is used rather than the default 3000 because this VPS already
// serves other sites - check with `ss -ltnp` before assuming it is free.
//
//   pm2 start ecosystem.config.js
//   pm2 save
//
module.exports = {
  apps: [
    {
      name: 'radiology',
      cwd: '/var/www/radiology',

      // Invoke the Next binary directly. Going through `npm start` adds a
      // shell layer that swallows signals, so PM2 restarts become unreliable.
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3100',

      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,

      // Next.js can leak slowly under load; recycle rather than fall over.
      max_memory_restart: '512M',

      env: {
        NODE_ENV: 'production',
        PORT: 3100,
      },

      error_file: '/var/log/pm2/radiology-error.log',
      out_file: '/var/log/pm2/radiology-out.log',
      merge_logs: true,
      time: true,
    },
  ],
}
