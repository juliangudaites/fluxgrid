module.exports = {
  apps: [
    {
      name: 'fluxgrid',
      cwd: 'C:/Users/julia/voidlink/server',
      script: 'src/index.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
      },
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};