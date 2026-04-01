import { MarketProvider } from './marketProvider.js';
import {
  DOMESTIC_HEATMAP,
  DOMESTIC_INDICES,
  DOMESTIC_MOVERS_POOL,
  DOMESTIC_WATCHLIST,
  FX_QUOTES,
  OVERSEAS_HEATMAP,
  OVERSEAS_INDICES,
  OVERSEAS_MOVERS_POOL,
  OVERSEAS_WATCHLIST,
} from '../config/symbols.js';

export class MockProvider extends MarketProvider {
  constructor() {
    super();
    this.state = new Map();
  }

  getState(meta) {
    if (!this.state.has(meta.symbol)) {
      const baseline = meta.basePrice;
      this.state.set(meta.symbol, {
        price: baseline,
        prevClose: baseline * (0.994 + Math.random() * 0.012),
        volume: Math.round(40000 + Math.random() * 500000),
      });
    }

    return this.state.get(meta.symbol);
  }

  evolve(meta) {
    const current = this.getState(meta);
    const volatility = meta.volatility ?? 0.01;

    const drift = (Math.random() - 0.5) * 2 * volatility;
    const microWave = (Math.random() - 0.5) * volatility * 0.35;

    const nextPrice = Math.max(0.1, current.price * (1 + drift + microWave));
    current.price = nextPrice;

    if (Math.random() < 0.03) {
      current.prevClose = current.prevClose * (1 + (Math.random() - 0.5) * 0.002);
    }

    current.volume = Math.max(1000, Math.round(current.volume * (0.86 + Math.random() * 0.3)));

    const change = nextPrice - current.prevClose;
    const changePct = (change / current.prevClose) * 100;

    return {
      symbol: meta.symbol,
      name: meta.name,
      price: nextPrice,
      prevClose: current.prevClose,
      change,
      changePct,
      volume: current.volume,
      updatedAt: new Date().toISOString(),
    };
  }

  withUniqueBySymbol(items) {
    const map = new Map();
    items.forEach((item) => {
      map.set(item.symbol, item);
    });
    return [...map.values()];
  }

  async fetchSummary() {
    const domesticIndices = DOMESTIC_INDICES.map((item) => this.evolve(item));
    const overseasIndices = OVERSEAS_INDICES.map((item) => this.evolve(item));
    const fx = this.evolve(FX_QUOTES[0]);

    const domesticHeatmap = DOMESTIC_HEATMAP.map((item) => this.evolve(item));
    const overseasHeatmap = OVERSEAS_HEATMAP.map((item) => this.evolve(item));

    return {
      globalBar: [...domesticIndices, ...overseasIndices, fx],
      domestic: {
        indices: domesticIndices,
        heatmap: domesticHeatmap,
      },
      overseas: {
        indices: overseasIndices,
        heatmap: overseasHeatmap,
      },
      fx,
      updatedAt: new Date().toISOString(),
    };
  }

  async fetchWatchlist() {
    return {
      domestic: DOMESTIC_WATCHLIST.map((item) => this.evolve(item)),
      overseas: OVERSEAS_WATCHLIST.map((item) => this.evolve(item)),
      updatedAt: new Date().toISOString(),
    };
  }

  pickMovers(pool) {
    const quotes = this.withUniqueBySymbol(pool).map((item) => this.evolve(item));
    const sorted = [...quotes].sort((a, b) => b.changePct - a.changePct);

    return {
      gainers: sorted.slice(0, 6),
      losers: sorted.slice(-6).reverse(),
    };
  }

  async fetchMovers() {
    return {
      domestic: this.pickMovers(DOMESTIC_MOVERS_POOL),
      overseas: this.pickMovers(OVERSEAS_MOVERS_POOL),
      updatedAt: new Date().toISOString(),
    };
  }
}
