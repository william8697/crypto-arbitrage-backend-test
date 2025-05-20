// render.js - Render.com specific configurations
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const server = require('./server');

if (cluster.isMaster && process.env.NODE_ENV === 'production') {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Create a new worker
  });
} else {
  // Workers can share any TCP connection
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Worker ${process.pid} started on port ${port}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
});