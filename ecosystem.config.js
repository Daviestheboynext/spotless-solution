module.exports = {
  apps: [{
    name: 'spotless-solution',
    script: 'src/app.js',
    instances: 'max',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/spotless-solution.git',
      path: '/var/www/spotless-solution',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
