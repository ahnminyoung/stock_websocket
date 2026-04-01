import express from 'express';
import http from 'http';
import { createMarketRoutes } from './routes/marketRoutes.js';
import { initializeSocketServer } from './ws/socketServer.js';
import { createMarketBroadcaster } from './services/marketBroadcaster.js';
import { createMarketScheduler } from './services/marketScheduler.js';
import { marketCache } from './cache/marketCache.js';
import { createMarketProvider } from './providers/providerFactory.js';

const PORT = Number(process.env.PORT ?? 4000);

const bootstrap = async () => {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.use('/api/market', createMarketRoutes({ cache: marketCache }));

  const socketServer = initializeSocketServer(server);
  const broadcaster = createMarketBroadcaster(socketServer);
  const { provider, name: providerName } = createMarketProvider();
  const scheduler = createMarketScheduler({
    cache: marketCache,
    broadcaster,
    provider,
  });

  await scheduler.preload();
  scheduler.start();

  server.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
    console.log('[server] websocket endpoint ws://localhost:' + PORT + '/ws');
    console.log(`[server] market provider: ${providerName}`);
  });

  const shutdown = () => {
    scheduler.stop();
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

bootstrap().catch((error) => {
  console.error('[server] failed to start', error);
  process.exit(1);
});
