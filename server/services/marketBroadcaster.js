export const createMarketBroadcaster = (socketServer) => {
  const broadcastByType = (type, payload, channels) => {
    socketServer.broadcast(channels, {
      type,
      payload,
      timestamp: Date.now(),
    });
  };

  return {
    broadcastSummary(summary) {
      broadcastByType('summary:update', summary, ['home-dashboard', 'domestic', 'overseas']);
    },
    broadcastWatchlist(watchlist) {
      broadcastByType('watchlist:update', watchlist, [
        'home-dashboard',
        'watchlist',
        'domestic',
        'overseas',
      ]);
    },
    broadcastMovers(movers) {
      broadcastByType('movers:update', movers, ['home-dashboard', 'domestic', 'overseas']);
    },
  };
};
