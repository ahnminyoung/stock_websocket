import { MockProvider } from '../providers/mockProvider.js';
import { normalizeMovers, normalizeSummary, normalizeWatchlist } from './marketNormalizer.js';

const SUMMARY_SOURCE_INTERVAL_MS = Number(process.env.SUMMARY_SOURCE_INTERVAL_MS ?? 5000);
const SUMMARY_TICK_INTERVAL_MS = Number(process.env.SUMMARY_TICK_INTERVAL_MS ?? 100);
const WATCHLIST_INTERVAL_MS = 7000;
const MOVERS_INTERVAL_MS = 10000;

const round = (value, digits = 2) => Number(Number(value ?? 0).toFixed(digits));
const lerp = (from, to, t) => from + (to - from) * t;

const interpolateQuote = (prev, next, t, nowIso) => {
  if (!prev) {
    return {
      ...next,
      updatedAt: nowIso,
    };
  }

  const price = round(lerp(prev.price ?? next.price ?? 0, next.price ?? 0, t), 2);

  return {
    ...next,
    price,
    prevClose: round(lerp(prev.prevClose ?? next.prevClose ?? 0, next.prevClose ?? 0, t), 2),
    change: round(lerp(prev.change ?? next.change ?? 0, next.change ?? 0, t), 2),
    changePct: round(lerp(prev.changePct ?? next.changePct ?? 0, next.changePct ?? 0, t), 2),
    volume: Math.round(lerp(prev.volume ?? next.volume ?? 0, next.volume ?? 0, t)),
    updatedAt: nowIso,
  };
};

const interpolateQuotes = (prevList = [], nextList = [], t, nowIso) => {
  const prevMap = new Map(prevList.map((item) => [item.symbol, item]));
  return nextList.map((next) => interpolateQuote(prevMap.get(next.symbol), next, t, nowIso));
};

const interpolateSummary = (prevSummary, nextSummary, t) => {
  const nowIso = new Date().toISOString();

  if (!prevSummary) {
    return {
      ...nextSummary,
      updatedAt: nowIso,
    };
  }

  return {
    ...nextSummary,
    globalBar: interpolateQuotes(prevSummary.globalBar, nextSummary.globalBar, t, nowIso),
    domestic: {
      ...nextSummary.domestic,
      indices: interpolateQuotes(
        prevSummary.domestic?.indices,
        nextSummary.domestic?.indices,
        t,
        nowIso
      ),
      nightFutures: interpolateQuotes(
        prevSummary.domestic?.nightFutures,
        nextSummary.domestic?.nightFutures,
        t,
        nowIso
      ),
      heatmap: nextSummary.domestic?.heatmap ?? [],
    },
    overseas: {
      ...nextSummary.overseas,
      indices: interpolateQuotes(
        prevSummary.overseas?.indices,
        nextSummary.overseas?.indices,
        t,
        nowIso
      ),
      heatmap: nextSummary.overseas?.heatmap ?? [],
    },
    fx: nextSummary.fx ? interpolateQuote(prevSummary.fx, nextSummary.fx, t, nowIso) : null,
    updatedAt: nowIso,
  };
};

export const createMarketScheduler = ({ cache, broadcaster, provider = new MockProvider() }) => {
  const timers = [];
  let previousSummary = null;
  let latestSummary = null;
  let lastSummarySourceAt = Date.now();

  const refreshSummary = async ({ broadcast = true } = {}) => {
    const raw = await provider.fetchSummary();
    const normalized = normalizeSummary(raw);
    previousSummary = latestSummary ?? normalized;
    latestSummary = normalized;
    lastSummarySourceAt = Date.now();
    cache.setSummary(normalized);

    if (broadcast) {
      broadcaster.broadcastSummary(normalized);
    }
  };

  const emitSummaryTick = async () => {
    if (!latestSummary) {
      return;
    }

    const elapsed = Date.now() - lastSummarySourceAt;
    const progress = SUMMARY_SOURCE_INTERVAL_MS > 0
      ? Math.min(elapsed / SUMMARY_SOURCE_INTERVAL_MS, 1)
      : 1;
    const interpolated = interpolateSummary(previousSummary, latestSummary, progress);
    cache.setSummary(interpolated);
    broadcaster.broadcastSummary(interpolated);
  };

  const refreshWatchlist = async ({ broadcast = true } = {}) => {
    const raw = await provider.fetchWatchlist();
    const normalized = normalizeWatchlist(raw);
    cache.setWatchlist(normalized);

    if (broadcast) {
      broadcaster.broadcastWatchlist(normalized);
    }
  };

  const refreshMovers = async ({ broadcast = true } = {}) => {
    const raw = await provider.fetchMovers();
    const normalized = normalizeMovers(raw);
    cache.setMovers(normalized);

    if (broadcast) {
      broadcaster.broadcastMovers(normalized);
    }
  };

  const safeRun = (job) => async () => {
    try {
      await job();
    } catch (error) {
      console.error('[scheduler] update failed:', error.message);
    }
  };

  const preload = async () => {
    await Promise.all([
      refreshSummary({ broadcast: false }),
      refreshWatchlist({ broadcast: false }),
      refreshMovers({ broadcast: false }),
    ]);
  };

  const start = () => {
    timers.push(setInterval(() => safeRun(refreshSummary)(), SUMMARY_SOURCE_INTERVAL_MS));
    timers.push(setInterval(() => safeRun(emitSummaryTick)(), SUMMARY_TICK_INTERVAL_MS));
    timers.push(setInterval(() => safeRun(refreshWatchlist)(), WATCHLIST_INTERVAL_MS));
    timers.push(setInterval(() => safeRun(refreshMovers)(), MOVERS_INTERVAL_MS));
  };

  const stop = () => {
    timers.forEach((timer) => clearInterval(timer));
  };

  return {
    preload,
    start,
    stop,
    refreshSummary,
    refreshWatchlist,
    refreshMovers,
  };
};
