module.exports = {
  apps: [
    {
      name: 'securecomm-backend',
      script: './backend/server.js',
      cwd: '/Users/bhavesh/securecomm-platform',
      env: {
        PORT: '3000',
        JWT_SECRET: 'securecomm_jwt_secret_change_in_prod',
        HQ_PASSWORD: 'hq@admin123',
        DB_URL: 'postgresql://postgres:securecomm123@localhost:5432/securecomm',
        PUBLIC_URL: 'https://api.inv.works',
        DEVICE_KEY: 'sc-dk-inv-works-2024-secure',
        WG_UI_PORT: '51821',
        WG_PASSWORD: 'hq@admin123',
      },
      watch: false,
      restart_delay: 2000,
      max_restarts: 10,
      log_file: '/tmp/securecomm-backend.log',
    },
    {
      name: 'securecomm-ddns',
      script: './backend/ddns.js',
      cwd: '/Users/bhavesh/securecomm-platform',
      env: {
        CF_API_TOKEN: 'cfut_MUGjYWVYFGtVh37G9nEIm91oHbC4uvHcyZAT2F7Ie02bd682',
        CF_ZONE_ID:   '2da3a60a428f26e026bc23d707ccf844',
      },
      watch: false,
      restart_delay: 5000,
      log_file: '/tmp/securecomm-ddns.log',
    },
    {
      name: 'securecomm-tunnel',
      script: 'cloudflared',
      args: 'tunnel run securecomm',
      interpreter: 'none',
      watch: false,
      restart_delay: 3000,
      log_file: '/tmp/securecomm-tunnel.log',
    },
  ],
};
