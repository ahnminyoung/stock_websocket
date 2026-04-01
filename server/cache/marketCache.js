class MarketCache {
  constructor() {
    this.data = {
      summary: null,
      watchlist: null,
      movers: null,
    };
  }

  setSummary(summary) {
    this.data.summary = summary;
  }

  setWatchlist(watchlist) {
    this.data.watchlist = watchlist;
  }

  setMovers(movers) {
    this.data.movers = movers;
  }

  getSummary() {
    return this.data.summary;
  }

  getWatchlist() {
    return this.data.watchlist;
  }

  getMovers() {
    return this.data.movers;
  }
}

export const marketCache = new MarketCache();
