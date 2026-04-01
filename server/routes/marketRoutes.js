import { Router } from 'express';

export const createMarketRoutes = ({ cache }) => {
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

  return router;
};
