import { useEffect, useMemo, useState } from 'react';
import GlobalMarketBar from '../components/GlobalMarketBar.jsx';
import DomesticSection from '../components/DomesticSection.jsx';
import OverseasSection from '../components/OverseasSection.jsx';
import { fetchMovers, fetchSummary, fetchWatchlist } from '../services/marketApi.js';
import { useMarketStore } from '../stores/marketStore.js';
import { useMarketSocket } from '../hooks/useMarketSocket.js';

function HomePage() {
  const [activeMarket, setActiveMarket] = useState('domestic');
  const [now, setNow] = useState(() => Date.now());
  const setSummary = useMarketStore((state) => state.setSummary);
  const setWatchlist = useMarketStore((state) => state.setWatchlist);
  const setMovers = useMarketStore((state) => state.setMovers);
  const connectionStatus = useMarketStore((state) => state.connectionStatus);

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

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const connectionDotClass = connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500';
  const kstTimeLabel = useMemo(
    () =>
      new Date(now).toLocaleTimeString('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour12: false,
      }),
    [now]
  );

  return (
    <main className="dashboard-shell">
      <header className="panel p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="market-toggle-wrap shrink-0">
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
            <h1 className="truncate text-xl font-extrabold text-slate-900 sm:text-2xl">주식/시황 대시보드</h1>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
            <span className={`h-2.5 w-2.5 rounded-full ${connectionDotClass}`} />
            <p className="text-sm font-semibold text-slate-700">한국시간 {kstTimeLabel}</p>
          </div>
        </div>

      </header>

      <GlobalMarketBar />
      {activeMarket === 'domestic' ? <DomesticSection /> : <OverseasSection />}
    </main>
  );
}

export default HomePage;
