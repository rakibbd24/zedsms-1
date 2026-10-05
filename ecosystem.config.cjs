// PM2 process for the website on the VPS (README → Deploy, option B).
//   pm2 start ecosystem.config.cjs && pm2 save
// Listens on 127.0.0.1 only — Apache proxies zedsms.com to it (deploy/apache-proxy.conf).
module.exports = {
  apps: [
    {
      name: "zedsms-web",
      cwd: `${__dirname}/.next/standalone`,
      script: "server.js",
      env: { NODE_ENV: "production", PORT: "3005", HOSTNAME: "127.0.0.1" },
      instances: 1,
      max_memory_restart: "512M",
    },
  ],
};
