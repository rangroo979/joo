import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { SearchModal } from './components/SearchModal.tsx';
import { DisclaimerFooter } from './components/DisclaimerFooter.tsx';

import { HomeView } from './views/HomeView.tsx';
import { SearchStockView } from './views/SearchStockView.tsx';
import { StockDetailView } from './views/StockDetailView.tsx';
import { MarketAnalysisView } from './views/MarketAnalysisView.tsx';
import { NewsAnalysisView } from './views/NewsAnalysisView.tsx';
import { WatchlistView } from './views/WatchlistView.tsx';
import { StockCompareView } from './views/StockCompareView.tsx';
import { SettingsTermsView } from './views/SettingsTermsView.tsx';

import { Stock, MarketIndex, SystemStatus } from './types.ts';
import { DEMO_MARKET_INDICES, DEMO_KOREAN_STOCKS, DEMO_US_STOCKS } from './data/demoData.ts';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedStockCode, setSelectedStockCode] = useState<string>('005930');
  const [initialSearchQuery, setInitialSearchQuery] = useState<string>('');

  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [indices, setIndices] = useState<MarketIndex[]>(DEMO_MARKET_INDICES);
  const [featuredStocks, setFeaturedStocks] = useState<Stock[]>(DEMO_KOREAN_STOCKS);
  const [usStocks, setUsStocks] = useState<Stock[]>(DEMO_US_STOCKS);

  // Watchlist in localStorage
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ai_invest_watchlist');
      return saved ? JSON.parse(saved) : ['005930', '000660', '005380'];
    } catch {
      return ['005930', '000660', '005380'];
    }
  });

  // Recent Searches in localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ai_invest_recent_searches');
      return saved ? JSON.parse(saved) : ['삼성전자', 'SK하이닉스', '현대차'];
    } catch {
      return ['삼성전자', 'SK하이닉스', '현대차'];
    }
  });

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [compareStocksList, setCompareStocksList] = useState<Stock[]>([]);

  // Fetch system status and initial KRX stocks on mount
  const fetchStatusAndData = async (forceRefresh = false) => {
    try {
      const refreshParam = forceRefresh ? '?refresh=true' : '';
      const statusRes = await fetch(`/api/status${refreshParam}`);
      if (statusRes.ok) {
        const statusData: SystemStatus = await statusRes.json();
        setStatus(statusData);
      }

      const stocksRes = await fetch(`/api/krx/stocks${refreshParam}`);
      if (stocksRes.ok) {
        const stocksData = await stocksRes.json();
        if (stocksData.stocks && stocksData.stocks.length > 0) {
          setFeaturedStocks(stocksData.stocks);
        }
      }

      const indicesRes = await fetch('/api/market/indices');
      if (indicesRes.ok) {
        const indicesData = await indicesRes.json();
        setIndices(indicesData);
      }

      const usRes = await fetch('/api/market/us-stocks');
      if (usRes.ok) {
        const usData = await usRes.json();
        setUsStocks(usData);
      }
    } catch (e) {
      console.error('Initial data fetch error:', e);
    }
  };

  useEffect(() => {
    fetchStatusAndData();
  }, []);

  // Sync Watchlist
  useEffect(() => {
    try {
      localStorage.setItem('ai_invest_watchlist', JSON.stringify(watchlist));
    } catch (e) {
      console.error(e);
    }
  }, [watchlist]);

  // Sync Recent Searches
  useEffect(() => {
    try {
      localStorage.setItem('ai_invest_recent_searches', JSON.stringify(recentSearches));
    } catch (e) {
      console.error(e);
    }
  }, [recentSearches]);

  // Global Keyboard Shortcut: '/' to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleWatchlist = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWatchlist((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleAddRecentSearch = (term: string) => {
    if (!term.trim()) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item !== term);
      return [term, ...filtered].slice(0, 8);
    });
  };

  const handleRemoveRecentSearch = (term: string) => {
    setRecentSearches((prev) => prev.filter((item) => item !== term));
  };

  const handleSelectStock = (code: string) => {
    setSelectedStockCode(code);
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view: string, extraParam?: string) => {
    if (view === 'ai-analysis') {
      setCurrentView('detail');
    } else if (view === 'search' && extraParam) {
      setInitialSearchQuery(extraParam);
      setCurrentView('search');
    } else {
      setCurrentView(view);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompareWith = (stock: Stock) => {
    if (!compareStocksList.some((s) => s.code === stock.code)) {
      setCompareStocksList((prev) => [...prev, stock].slice(0, 3));
    }
    setCurrentView('compare');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const latestDateDisplay = status?.latestBusinessDate || '2026.09.28';

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        status={status}
        watchlistCount={watchlist.length}
        onNavigate={handleNavigate}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 md:pb-0">
        {/* Left Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          watchlistCount={watchlist.length}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {currentView === 'home' && (
            <HomeView
              indices={indices}
              featuredStocks={featuredStocks}
              usStocks={usStocks}
              onSelectStock={handleSelectStock}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              onNavigate={handleNavigate}
              latestBusinessDate={latestDateDisplay}
            />
          )}

          {currentView === 'search' && (
            <SearchStockView
              onSelectStock={handleSelectStock}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              initialQuery={initialSearchQuery}
              recentSearches={recentSearches}
              onAddRecent={handleAddRecentSearch}
              onRemoveRecent={handleRemoveRecentSearch}
              latestBusinessDate={latestDateDisplay}
            />
          )}

          {currentView === 'detail' && (
            <StockDetailView
              stockCode={selectedStockCode}
              onBack={() => setCurrentView('home')}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              onCompareWith={handleCompareWith}
              latestBusinessDate={latestDateDisplay}
            />
          )}

          {currentView === 'market' && (
            <MarketAnalysisView indices={indices} />
          )}

          {currentView === 'news' && (
            <NewsAnalysisView />
          )}

          {currentView === 'watchlist' && (
            <WatchlistView
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              onSelectStock={handleSelectStock}
              onNavigate={handleNavigate}
              latestBusinessDate={latestDateDisplay}
            />
          )}

          {currentView === 'compare' && (
            <StockCompareView
              initialStocks={compareStocksList}
              onSelectStock={handleSelectStock}
              latestBusinessDate={latestDateDisplay}
            />
          )}

          {currentView === 'settings' && (
            <SettingsTermsView
              status={status}
              onRefreshStatus={() => fetchStatusAndData(true)}
            />
          )}

          {/* Legal and Data Disclaimer */}
          <DisclaimerFooter />
        </main>
      </div>

      {/* Global Quick Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectStock={handleSelectStock}
        recentSearches={recentSearches}
        onRemoveRecent={handleRemoveRecentSearch}
        watchlist={watchlist}
        onToggleWatchlist={handleToggleWatchlist}
      />
    </div>
  );
}
