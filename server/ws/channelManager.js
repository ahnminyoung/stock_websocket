import WebSocket from 'ws';

const VALID_CHANNELS = ['home-dashboard', 'domestic', 'overseas', 'watchlist'];

export const createChannelManager = () => {
  const channels = new Map(VALID_CHANNELS.map((name) => [name, new Set()]));
  const clientSubscriptions = new Map();

  const registerClient = (ws) => {
    const defaultSet = new Set(['home-dashboard']);
    clientSubscriptions.set(ws, defaultSet);
    channels.get('home-dashboard')?.add(ws);
  };

  const unregisterClient = (ws) => {
    const subscribed = clientSubscriptions.get(ws);

    if (!subscribed) {
      return;
    }

    subscribed.forEach((channel) => {
      channels.get(channel)?.delete(ws);
    });

    clientSubscriptions.delete(ws);
  };

  const subscribeMany = (ws, requestedChannels = []) => {
    if (!clientSubscriptions.has(ws)) {
      registerClient(ws);
    }

    const nextSet = clientSubscriptions.get(ws);

    requestedChannels.forEach((channel) => {
      if (!channels.has(channel)) {
        return;
      }

      nextSet.add(channel);
      channels.get(channel)?.add(ws);
    });

    return [...nextSet];
  };

  const getChannels = (ws) => [...(clientSubscriptions.get(ws) ?? [])];

  const broadcast = (targetChannels, message) => {
    const channelList = Array.isArray(targetChannels) ? targetChannels : [targetChannels];
    const recipients = new Set();

    channelList.forEach((channel) => {
      if (!channels.has(channel)) {
        return;
      }

      channels.get(channel).forEach((client) => recipients.add(client));
    });

    const serialized = JSON.stringify(message);

    recipients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    });
  };

  return {
    validChannels: VALID_CHANNELS,
    registerClient,
    unregisterClient,
    subscribeMany,
    getChannels,
    broadcast,
  };
};
