/**
 * Quantum Fate Lite · PM2 ecosystem config
 *
 * Run on Hostinger VPS:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup   (copy the suggested command)
 *
 * Logs: /home/<user>/.pm2/logs/quantum-fate-lite-*.log
 *
 * NOTE: Do NOT use env_file: ".env" — it can override NODE_ENV=production.
 * Instead, set required vars in the env block below, and keep secrets
 * in a .env file that your app reads via dotenv or Next.js built-in.
 */
module.exports = {
  apps: [
    {
      name: "quantum-fate-lite",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 0.0.0.0",
      cwd: "/home/<user>/domains/<your-domain>/public_html/quantum-fate-lite",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NEXT_PUBLIC_SITE_URL: "https://your-domain.com",
      },
    },
  ],
};
