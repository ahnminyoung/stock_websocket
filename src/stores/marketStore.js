import { create } from 'zustand';

const defaultSummary = {
  globalBar: [],
  domestic: {
    indices: [],
    nightFutures: [],
    heatmap: [],
  },
  overseas: {
    indices: [],
    heatmap: [],
  },
  fx: null,
  updatedAt: null,
};

const defaultWatchlist = {
  domestic: [],
  overseas: [],
  updatedAt: null,
};

const defaultMovers = {
  domestic: {
    gainers: [],
    losers: [],
  },
  overseas: {
    gainers: [],
    losers: [],
  },
  updatedAt: null,
};

const mergeSummary = (prev, next) => ({
  ...prev,
  ...next,
  domestic: {
    ...prev.domestic,
    ...(next.domestic ?? {}),
  },
  overseas: {
    ...prev.overseas,
    ...(next.overseas ?? {}),
  },
});

const mergeWatchlist = (prev, next) => ({
  ...prev,
  ...next,
});

const mergeMovers = (prev, next) => ({
  ...prev,
  ...next,
  domestic: {
    ...prev.domestic,
    ...(next.domestic ?? {}),
  },
  overseas: {
    ...prev.overseas,
    ...(next.overseas ?? {}),
  },
});

export const useMarketStore = create((set) => ({
  summary: defaultSummary,
  watchlist: defaultWatchlist,
  movers: defaultMovers,
  connectionStatus: 'disconnected',
  setSummary: (summary) => set((state) => ({ summary: mergeSummary(state.summary, summary) })),
  setWatchlist: (watchlist) =>
    set((state) => ({ watchlist: mergeWatchlist(state.watchlist, watchlist) })),
  setMovers: (movers) => set((state) => ({ movers: mergeMovers(state.movers, movers) })),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  applySocketMessage: (message) =>
    set((state) => {
      const { type, payload } = message ?? {};

      if (!type) {
        return {};
      }

      if (type === 'summary:update') {
        return { summary: mergeSummary(state.summary, payload ?? {}) };
      }

      if (type === 'watchlist:update') {
        return { watchlist: mergeWatchlist(state.watchlist, payload ?? {}) };
      }

      if (type === 'movers:update') {
        return { movers: mergeMovers(state.movers, payload ?? {}) };
      }

      if (type === 'connection:status') {
        return { connectionStatus: payload?.status ?? state.connectionStatus };
      }

      return {};
    }),
}));
