module.exports = {
  apps: [
    {
      name: "hanging-piece-backend",
      script: "dist/index.js",
      instances: 1,
      exec_mode: "cluster",

      // Memory management
      max_memory_restart: "3G",

      // Logging - files for persistence, PM2 monitor for real-time
      merge_logs: true,
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_file: "./logs/combined.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      time: true, // Auto-prefix logs with timestamps

      // Restart strategies for stability
      max_restarts: 10, // Max consecutive restarts before stopping
      min_uptime: "10s", // App must run 10s to be considered started
      restart_delay: 4000, // Wait 4s before restarting crashed app
      autorestart: true, // Auto-restart on crash

      // Graceful shutdown
      kill_timeout: 5000, // 5s grace period before SIGKILL
      listen_timeout: 8000, // 8s to wait for app to listen

      // Environment variables
      env: {
        NODE_ENV: "production",
        LOG_LEVEL: "info",
      },
    },
  ],
};
