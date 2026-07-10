module.exports = {
  apps: [{
    name: "nooi",
    cwd: "/home/hadmin/nooi.net",
    script: "node_modules/.bin/next",
    args: "start -p 3000",
    instances: 1,
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
    },
    env_file: ".env.local",
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,
    // Auto-restart
    max_restarts: 10,
    restart_delay: 2000,
    // Logs
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    error_file: "/home/hadmin/.pm2/logs/nooi-error.log",
    out_file: "/home/hadmin/.pm2/logs/nooi-out.log",
    merge_logs: true,
  }],
};
