import express from 'express';
import cors from 'cors';
import { config } from './config';
import { vectorStoreManager } from './loaders/vectorStore';
import chatRoutes from './api/routes/chatRoutes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/api/v1', chatRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Virtual Assistant API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      chat: '/api/v1/chat',
      health: '/api/v1/health',
    },
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong',
  });
});

async function startServer() {
  try {
    console.log('Initializing Virtual Assistant...');
    
    await vectorStoreManager.initialize();
    console.log('Vector store initialized');
    
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`🔗 API URL: http://localhost:${config.port}`);
      console.log('✅ Virtual Assistant is ready!');
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();