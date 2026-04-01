const toWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}/ws`;
};

export const createMarketSocket = ({ onOpen, onClose, onError, onMessage }) => {
  const socket = new WebSocket(toWsUrl());

  socket.addEventListener('open', () => {
    onOpen?.();
  });

  socket.addEventListener('close', () => {
    onClose?.();
  });

  socket.addEventListener('error', () => {
    onError?.();
  });

  socket.addEventListener('message', (event) => {
    try {
      const parsed = JSON.parse(event.data);
      onMessage?.(parsed);
    } catch (error) {
      console.error('Failed to parse websocket payload', error);
    }
  });

  const send = (payload) => {
    const body = JSON.stringify(payload);

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(body);
      return;
    }

    socket.addEventListener(
      'open',
      () => {
        socket.send(body);
      },
      { once: true }
    );
  };

  return {
    subscribe(channels) {
      const channelList = Array.isArray(channels) ? channels : [channels];
      send({ type: 'subscribe', channels: channelList });
    },
    ping() {
      send({ type: 'ping' });
    },
    close() {
      socket.close();
    },
  };
};
