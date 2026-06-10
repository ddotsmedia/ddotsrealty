module.exports = {
  apps: [
    {
      name: "ddotsrealty",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3060",
      cwd: "/opt/ddotsrealty",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3060"
      },
      max_memory_restart: "600M",
      autorestart: true
    },
    {
      name: "ddotsrealty-worker",
      script: "node_modules/.bin/tsx",
      args: "src/server/jobs/worker.ts",
      cwd: "/opt/ddotsrealty",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      },
      max_memory_restart: "400M",
      autorestart: true
    }
  ]
};
