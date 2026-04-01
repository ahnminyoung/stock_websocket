import { WebSocketServer } from 'ws';
import { createChannelManager } from './channelManager.js';

const safeParse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const send = (ws, body) => {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(body));
  }
};

export const initializeSocketServer = (httpServer) => {
  const wss = new WebSocketServer({ noServer: true });
  const channelManager = createChannelManager();

  httpServer.on('upgrade', (request, socket, head) => {
    const isSocketPath = request.url?.startsWith('/ws');

    if (!isSocketPath) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws) => {
    channelManager.registerClient(ws);

    send(ws, {
      type: 'connection:status',
      payload: { status: 'connected' },
    });

    ws.on('message', (buffer) => {
      const message = safeParse(buffer.toString());

      if (!message) {
        return;
      }

      if (message.type === 'subscribe') {
        const channels = Array.isArray(message.channels)
          ? message.channels
          : message.channel
            ? [message.channel]
            : [];

        const subscribed = channelManager.subscribeMany(ws, channels);

        send(ws, {
          type: 'subscription:ack',
          payload: { channels: subscribed },
        });
      }

      if (message.type === 'ping') {
        send(ws, { type: 'pong' });
      }
    });

    ws.on('close', () => {
      channelManager.unregisterClient(ws);
    });

    ws.on('error', () => {
      channelManager.unregisterClient(ws);
    });
  });

  const broadcast = (channels, message) => {
    channelManager.broadcast(channels, message);
  };

  return {
    wss,
    channelManager,
    broadcast,
  };
};
