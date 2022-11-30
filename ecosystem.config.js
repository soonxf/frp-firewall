//index.js 所在的文件夹
const path = "/frp/frp-firewall"
module.exports = {
  apps: [
    {
      name: 'frp-firewall',
      script: 'index.js',
      args: '-r',
      cwd: path,
      exec_mode: 'fork',
      //智能策略重启
      exp_backoff_restart_delay: 100,
      max_memory_restart: '300M',
      // instances: 1,
      watch: false,
      // watch: '.',
      error_file: `${path}/log/err.log`,
      out_file: `${path}/log/out.log`,
      log_file: `${path}/log/logs.log`,
    },
  ],
  deploy: {
    production: {
      user: 'SSH_USERNAME',
      host: 'SSH_HOSTMACHINE',
      ref: 'origin/master',
      repo: 'GIT_REPOSITORY',
      path: 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
