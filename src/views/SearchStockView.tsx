import React, { useState, useEffect } from 'react';
import {
  Search,
  Star,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Clock,
  X,
  Filter,
} from 'lucide-react';
import { Stock } from '../types.ts';
import { StockBadge } from '../components/StockBadge.tsx';
import { formatPrice, formatChange, formatKoreanCurrency } from '../utils/formatters.ts';

interface SearchStockViewProps {
  onSelectStock: (code: string) => void;
  watchlist: string[];
  onToggleWatchlist: (code: string, e: React.MouseEvent) => void;
  initialQuery?: string;
  recentSearches: string[];
  onAddRecent: (term: string) => void;
  onRemoveRecent: (term: string) => void;
  latestBusinessDate: string;
}

export const SearchStockView: React.FC<SearchStockViewProps> = ({
  onSelectStock,
  watchlist,
  onToggleWatchlist,
  initialQuery = '',
  recentSearches,
  onAddRecent,
  onRemoveRecent,
  latestBusinessDate,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'KOSPI' | 'KOSDAQ'>('ALL');
  const [sortBy, setSortBy] = useState<'marketCap' | 'tradingValue' | 'changeRate' | 'name'>('marketCap');
  const [sortAsc, setSortAsc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSearchResults = async (searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/krx/stocks/search?q=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) {
        throw new Error('데이터를 불러오지 못했습니다.');
      }
      const data = await res.json();
      setStocks(data.stocks || []);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchResults(query);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onAddRecent(query.trim());
    }
    fetchSearchResults(query);
  };

  const handleTermClick = (term: string) => {
    setQuery(term);
    onAddRecent(term);
    fetchSearchResults(term);
  };

  // Filter & Sort
  const filtered = stocks.filter((stock) => {
    if (marketFilter === 'ALL') return true;
    return stock.market === marketFilter;
  });

  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'marketCap') diff = a.marketCap - b.marketCap;
    else if (sortBy === 'tradingValue') diff = a.tradingValue - b.tradingValue;
    else if (sortBy === 'changeRate') diff = a.changeRate - b.changeRate;
    else if (sortBy === 'name') return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);

    return sortAsc ? diff : -diff;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Description */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <span>KRX 종목 검색</span>
          <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
            {latestBusinessDate} 거래일 기준
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          한국거래소(KRX) KOSPI 및 KOSDAQ 통합 상장 종목을 종목명이나 코드로 자유롭게 검색하세요.
        </p>
      </div>

      {/* Main Search Input Form */}
      <form onSubmit={handleSearchSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="종목명 또는 종목코드 검색"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              fetchSearchResults(e.target.value);
            }}
            className="w-full bg-[#111827] text-base text-slate-100 placeholder:text-slate-400 pl-11 pr-24 py-3.5 rounded-2xl border border-slate-700/80 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-lg"
          />
          <Search className="w-5 h-5 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                fetchSearchResults('');
              }}
              className="absolute right-14 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow cursor-pointer transition-colors"
          >
            검색
          </button>
        </div>

        {/* Recent Search Keywords */}
        {recentSearches.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" /> 최근 검색:
            </span>
            {recentSearches.map((term) => (
              <div
                key={term}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 cursor-pointer transition-colors"
                onClick={() => handleTermClick(term)}
              >
                <span>{term}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveRecent(term);
                  }}
                  className="text-slate-400 hover:text-rose-400 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </form>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#111827] rounded-xl border border-slate-800 text-xs">
        {/* Market Filter Tabs */}
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          <span className="text-slate-400 mr-2">시장:</span>
          {(['ALL', 'KOSPI', 'KOSDAQ'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMarketFilter(m)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                marketFilter === m
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {m === 'ALL' ? '전체' : m}
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">정렬:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none"
          >
            <option value="marketCap">시가총액순</option>
            <option value="tradingValue">거래대금순</option>
            <option value="changeRate">등락률순</option>
            <option value="name">종목명순</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            title={sortAsc ? '오름차순' : '내림차순'}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stock Results Table / Cards */}
      <div className="bg-[#111827] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">KRX 주식 데이터를 조회하고 있습니다...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-400 space-y-3">
            <p className="text-sm">{error}</p>
            <button
              onClick={() => fetchSearchResults(query)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <p className="text-sm font-medium text-slate-300">검색 결과가 없습니다.</p>
            <p className="text-xs text-slate-400">
              다른 종목명이나 종목코드를 입력해 보세요.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#0e1424] text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">관심</th>
                  <th className="py-3 px-4">종목명 / 종목코드</th>
                  <th className="py-3 px-3">시장</th>
                  <th className="py-3 px-4 text-right">최근 거래일 종가</th>
                  <th className="py-3 px-4 text-right">전일 대비 (등락률)</th>
                  <th className="py-3 px-4 text-right hidden sm:table-cell">시가총액</th>
                  <th className="py-3 px-4 text-right hidden md:table-cell">거래량</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {sorted.map((stock) => {
                  const changeInfo = formatChange(stock.change, stock.changeRate, stock.market);
                  const isStarred = watchlist.includes(stock.code);

                  return (
                    <tr
                      key={stock.code}
                      onClick={() => {
                        onAddRecent(stock.name);
                        onSelectStock(stock.code);
                      }}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => onToggleWatchlist(stock.code, e)}
                          className="text-slate-500 hover:text-amber-400 transition-colors p-1 cursor-pointer"
                          title={isStarred ? '관심종목 해제' : '관심종목 추가'}
                        >
                          <Star className={`w-4 h-4 ${isStarred ? 'text-amber-400 fill-amber-400' : ''}`} />
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                            {stock.name}
                          </span>
                          <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                            {stock.code}
                          </span>
                          <StockBadge isDemo={stock.isDemo} market={stock.market} size="sm" />
                          <span className="text-[11px] text-slate-400 hidden xl:inline">
                            · {stock.isDemo ? 'DEMO' : 'KRX'} · {latestBusinessDate} 기준
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-xs text-slate-400">{stock.market}</span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-100">
                        {formatPrice(stock.close, stock.market)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono">
                        <div className={`inline-flex items-center gap-1 font-semibold ${changeInfo.colorClass}`}>
                          {changeInfo.isPositive ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : changeInfo.isNegative ? (
                            <TrendingDown className="w-3.5 h-3.5" />
                          ) : null}
                          <span>{changeInfo.rateText}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right text-slate-300 font-mono hidden sm:table-cell">
                        {formatKoreanCurrency(stock.marketCap)}
                      </td>

                      <td className="py-3 px-4 text-right text-slate-400 font-mono hidden md:table-cell">
                        {stock.volume.toLocaleString()}주
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
