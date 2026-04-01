export class MarketProvider {
  async fetchSummary() {
    throw new Error('fetchSummary must be implemented by provider');
  }

  async fetchWatchlist() {
    throw new Error('fetchWatchlist must be implemented by provider');
  }

  async fetchMovers() {
    throw new Error('fetchMovers must be implemented by provider');
  }
}
