import { Router } from 'express';

export const createMarketRoutes = ({ cache, provider }) => {
  const router = Router();

  router.get('/summary', (req, res) => {
    const summary = cache.getSummary();

    if (!summary) {
      return res.status(503).json({ success: false, message: 'summary data is not ready' });
    }

    return res.json({ success: true, data: summary });
  });

  router.get('/watchlist', (req, res) => {
    const watchlist = cache.getWatchlist();

    if (!watchlist) {
      return res.status(503).json({ success: false, message: 'watchlist data is not ready' });
    }

    return res.json({ success: true, data: watchlist });
  });

  router.get('/movers', (req, res) => {
    const movers = cache.getMovers();

    if (!movers) {
      return res.status(503).json({ success: false, message: 'movers data is not ready' });
    }

    return res.json({ success: true, data: movers });
  });

  router.get('/chart', async (req, res) => {
    try {
      const symbol = String(req.query.symbol ?? 'KOSPI').toUpperCase();
      const timeframe = String(req.query.timeframe ?? 'day').toLowerCase();
      const range = String(req.query.range ?? '3m').toLowerCase();

      const data = await provider.fetchChart({
        symbol,
        timeframe,
        range,
      });

      return res.json({ success: true, data });
    } catch (error) {
      console.error('[routes] chart fetch failed:', error.message);
      return res.status(500).json({
        success: false,
        message: 'failed to fetch chart data',
      });
    }
  });

  return router;
};
