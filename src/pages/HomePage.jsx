import { useEffect, useMemo, useState } from 'react';
import GlobalMarketBar from '../components/GlobalMarketBar.jsx';
import DomesticSection from '../components/DomesticSection.jsx';
import OverseasSection from '../components/OverseasSection.jsx';
import ThemeHeatmap from '../components/ThemeHeatmap.jsx';
import { fetchMovers, fetchSummary, fetchWatchlist } from '../services/marketApi.js';
import { useMarketStore } from '../stores/marketStore.js';
import { useMarketSocket } from '../hooks/useMarketSocket.js';

function HomePage() {
  const [activeMarket, setActiveMarket] = useState('domestic');
  const [activeView, setActiveView] = useState('market');
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

  const connectionDotClass = connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-clay-500';
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
      <header className="panel shrink-0 px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap min-w-0 items-center gap-2">
            <div className="market-toggle-wrap shrink-0">
              <button
                type="button"
                className={`market-toggle-btn ${activeView === 'market' && activeMarket === 'domestic' ? 'is-active-domestic' : ''}`}
                onClick={() => { setActiveView('market'); setActiveMarket('domestic'); }}
              >
                국내 시장
              </button>
              <button
                type="button"
                className={`market-toggle-btn ${activeView === 'market' && activeMarket === 'overseas' ? 'is-active-overseas' : ''}`}
                onClick={() => { setActiveView('market'); setActiveMarket('overseas'); }}
              >
                해외 시장
              </button>
              <button
                type="button"
                className={`market-toggle-btn ${activeView === 'theme' ? 'is-active-domestic' : ''}`}
                onClick={() => setActiveView('theme')}
              >
                테마 히트맵
              </button>
            </div>
            <h1 className="truncate text-lg font-bold text-ink">주식/시황 대시보드</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-cream-200 px-3 py-1.5">
            <span className={`h-2 w-2 rounded-full ${connectionDotClass}`} />
            <p className="text-xs font-semibold text-ink-soft">한국시간 {kstTimeLabel}</p>
          </div>
        </div>
      </header>

      <div
        className="flex flex-col gap-2.5 lg:flex-1 lg:min-h-0 lg:grid"
        style={{ gridTemplateRows: '2fr 3fr' }}
      >
        <GlobalMarketBar />
        {activeView === 'theme'
          ? <ThemeHeatmap />
          : activeMarket === 'domestic'
            ? <DomesticSection />
            : <OverseasSection />
        }
      </div>
    </main>
  );
}

export default HomePage;
