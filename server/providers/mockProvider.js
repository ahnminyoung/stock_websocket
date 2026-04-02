import { MarketProvider } from './marketProvider.js';
import {
  DOMESTIC_HEATMAP,
  DOMESTIC_INDICES,
  DOMESTIC_NIGHT_FUTURES,
  DOMESTIC_MOVERS_POOL,
  DOMESTIC_WATCHLIST,
  FX_QUOTES,
  OVERSEAS_HEATMAP,
  OVERSEAS_INDICES,
  OVERSEAS_MOVERS_POOL,
  OVERSEAS_WATCHLIST,
} from '../config/symbols.js';

const CHART_BASE_PRICE_MAP = Object.fromEntries(
  [...DOMESTIC_INDICES, ...OVERSEAS_INDICES, ...FX_QUOTES, ...DOMESTIC_NIGHT_FUTURES].map((item) => [
    item.symbol,
    item.basePrice,
  ])
);

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
    const domesticNightFutures = DOMESTIC_NIGHT_FUTURES.map((item) => ({
      ...this.evolve(item),
      isProxy: Boolean(item.isProxy),
    }));
    const overseasIndices = OVERSEAS_INDICES.map((item) => this.evolve(item));
    const fx = this.evolve(FX_QUOTES[0]);

    const domesticHeatmap = DOMESTIC_HEATMAP.map((item) => this.evolve(item));
    const overseasHeatmap = OVERSEAS_HEATMAP.map((item) => this.evolve(item));

    return {
      globalBar: [...domesticIndices, ...overseasIndices, fx],
      domestic: {
        indices: domesticIndices,
        nightFutures: domesticNightFutures,
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

  aggregateCandles(candles, timeframe) {
    if (timeframe === 'day') {
      return candles;
    }

    const groupSize = timeframe === 'week' ? 5 : 22;
    const grouped = [];

    for (let i = 0; i < candles.length; i += groupSize) {
      const chunk = candles.slice(i, i + groupSize);
      if (!chunk.length) {
        continue;
      }

      grouped.push({
        ts: chunk.at(-1).ts,
        open: chunk[0].open,
        high: Math.max(...chunk.map((item) => item.high)),
        low: Math.min(...chunk.map((item) => item.low)),
        close: chunk.at(-1).close,
        volume: Math.round(chunk.reduce((sum, item) => sum + (item.volume ?? 0), 0)),
      });
    }

    return grouped;
  }

  movingAverage(candles, period) {
    const values = candles.map((_, index) => {
      if (index + 1 < period) {
        return null;
      }

      const slice = candles.slice(index - period + 1, index + 1);
      const sum = slice.reduce((acc, item) => acc + (item.close ?? 0), 0);
      return Number((sum / period).toFixed(2));
    });

    return values;
  }

  async fetchChart({ symbol = 'KOSPI', timeframe = 'day', range = '3m' } = {}) {
    const basePrice = CHART_BASE_PRICE_MAP[symbol] ?? 1000;
    const pointsByRange = {
      '1d': 72,
      '3m': 70,
      '1y': 220,
      '3y': 360,
      '10y': 560,
    };
    const length = pointsByRange[range] ?? 220;
    const source = [];
    let current = basePrice * 0.82;

    for (let i = 0; i < length; i += 1) {
      const drift = i < length * 0.45 ? 0.0012 : i < length * 0.7 ? -0.0007 : 0.0009;
      const wave = Math.sin(i / 6 + (symbol === 'KOSPI' ? 0.7 : 1.5)) * 0.0022;
      current = Math.max(1, current * (1 + drift + wave + (Math.random() - 0.5) * 0.0018));
      source.push(current);
    }

    const scale = basePrice / (source.at(-1) ?? basePrice);
    const normalized = source.map((value) => value * scale);
    const candles = normalized.map((close, index) => {
      const prevClose = normalized[Math.max(index - 1, 0)];
      const open = prevClose;
      const high = Math.max(open, close) * (1 + 0.0015);
      const low = Math.min(open, close) * (1 - 0.0015);
      const ts = Date.now() - (length - index - 1) * (timeframe === '5m' ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000);
      return {
        ts,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.round(200000 + Math.random() * 800000),
      };
    });

    const aggregated = timeframe === '5m' ? candles : this.aggregateCandles(candles, timeframe);
    return {
      symbol,
      timeframe,
      range,
      candles: aggregated,
      ma5: this.movingAverage(aggregated, 5),
      ma20: this.movingAverage(aggregated, 20),
      updatedAt: new Date().toISOString(),
      source: 'mock',
    };
  }
}
