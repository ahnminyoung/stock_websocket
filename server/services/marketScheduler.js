import { MockProvider } from '../providers/mockProvider.js';
import { normalizeMovers, normalizeSummary, normalizeWatchlist } from './marketNormalizer.js';

const SUMMARY_INTERVAL_MS = 5000;
const WATCHLIST_INTERVAL_MS = 7000;
const MOVERS_INTERVAL_MS = 10000;

export const createMarketScheduler = ({ cache, broadcaster, provider = new MockProvider() }) => {
  const timers = [];

  const refreshSummary = async ({ broadcast = true } = {}) => {
    const raw = await provider.fetchSummary();
    const normalized = normalizeSummary(raw);
    cache.setSummary(normalized);

    if (broadcast) {
      broadcaster.broadcastSummary(normalized);
    }
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
    timers.push(setInterval(() => safeRun(refreshSummary)(), SUMMARY_INTERVAL_MS));
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
