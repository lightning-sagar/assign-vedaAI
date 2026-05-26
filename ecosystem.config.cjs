module.exports = {
  apps: [
    {
      name: "vedaai-backend",
      cwd: "./backend",
      script: "dist/index.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 4000
      }
    },
    {
      name: "vedaai-frontend",
      cwd: "./frontend",
      script: "../node_modules/next/dist/bin/next",
      args: "start -p 3000",
      interpreter: "node",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
