import { useEffect, useMemo, useState } from 'react';
import GlobalMarketBar from '../components/GlobalMarketBar.jsx';
import DomesticSection from '../components/DomesticSection.jsx';
import OverseasSection from '../components/OverseasSection.jsx';
import { fetchMovers, fetchSummary, fetchWatchlist } from '../services/marketApi.js';
import { useMarketStore } from '../stores/marketStore.js';
import { useMarketSocket } from '../hooks/useMarketSocket.js';

const statusClassMap = {
  connected: 'bg-emerald-500',
  connecting: 'bg-amber-400',
  disconnected: 'bg-slate-400',
  error: 'bg-rose-500',
};

function HomePage() {
  const [activeMarket, setActiveMarket] = useState('domestic');
  const setSummary = useMarketStore((state) => state.setSummary);
  const setWatchlist = useMarketStore((state) => state.setWatchlist);
  const setMovers = useMarketStore((state) => state.setMovers);
  const connectionStatus = useMarketStore((state) => state.connectionStatus);
  const updatedAt = useMarketStore((state) => state.summary.updatedAt);
  const summary = useMarketStore((state) => state.summary);

  useMarketSocket();

  useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      try {
        const [summary, watchlist, movers] = await Promise.all([
          fetchSummary(),
          fetchWatchlist(),
          fetchMovers(),
        ]);

        if (!mounted) {
          return;
        }

        setSummary(summary);
        setWatchlist(watchlist);
        setMovers(movers);
      } catch (error) {
        console.error('Failed to load initial market data', error);
      }
    };

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, [setSummary, setWatchlist, setMovers]);

  useEffect(() => {
    if (connectionStatus === 'connected') {
      return undefined;
    }

    const poll = async () => {
      try {
        const [summary, watchlist, movers] = await Promise.all([
          fetchSummary(),
          fetchWatchlist(),
          fetchMovers(),
        ]);
        setSummary(summary);
        setWatchlist(watchlist);
        setMovers(movers);
      } catch (error) {
        console.error('Fallback polling failed', error);
      }
    };

    poll();
    const timer = setInterval(poll, 4000);

    return () => {
      clearInterval(timer);
    };
  }, [connectionStatus, setSummary, setWatchlist, setMovers]);

  const selectedMarketLabel = useMemo(
    () => (activeMarket === 'domestic' ? '국내 시장' : '해외 시장'),
    [activeMarket]
  );

  const selectedMarketUpdatedAt = useMemo(() => {
    if (activeMarket === 'domestic') {
      return summary.domestic.indices?.[0]?.updatedAt ?? updatedAt;
    }

    return summary.overseas.indices?.[0]?.updatedAt ?? updatedAt;
  }, [activeMarket, summary.domestic.indices, summary.overseas.indices, updatedAt]);

  return (
    <main className="dashboard-shell">
      <header className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="market-toggle-wrap">
            <button
              type="button"
              className={`market-toggle-btn ${activeMarket === 'domestic' ? 'is-active-domestic' : ''}`}
              onClick={() => setActiveMarket('domestic')}
            >
              국내 시장
            </button>
            <button
              type="button"
              className={`market-toggle-btn ${activeMarket === 'overseas' ? 'is-active-overseas' : ''}`}
              onClick={() => setActiveMarket('overseas')}
            >
              해외 시장
            </button>
          </div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Stock Pulse Console</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">준실시간 주식/시황 대시보드</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">{selectedMarketLabel} 화면 표시 중</p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-2">
          <span className={`h-2.5 w-2.5 rounded-full ${statusClassMap[connectionStatus] ?? statusClassMap.disconnected}`} />
          <p className="text-sm font-semibold text-slate-700">WS: {connectionStatus}</p>
          <p className="text-xs text-slate-500">
            {selectedMarketUpdatedAt ? new Date(selectedMarketUpdatedAt).toLocaleTimeString('ko-KR') : '초기 로딩 중'}
          </p>
        </div>
      </header>

      <GlobalMarketBar />
      {activeMarket === 'domestic' ? <DomesticSection /> : <OverseasSection />}
    </main>
  );
}

export default HomePage;
