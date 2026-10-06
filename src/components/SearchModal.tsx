import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Star, TrendingUp, TrendingDown, ArrowRight, Clock } from 'lucide-react';
import { Stock } from '../types.ts';
import { StockBadge } from './StockBadge.tsx';
import { formatPrice, formatChange } from '../utils/formatters.ts';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStock: (code: string) => void;
  recentSearches: string[];
  onRemoveRecent: (item: string) => void;
  watchlist: string[];
  onToggleWatchlist: (code: string, e: React.MouseEvent) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectStock,
  recentSearches,
  onRemoveRecent,
  watchlist,
  onToggleWatchlist,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      searchStocks('');
    }
  }, [isOpen]);

  const searchStocks = async (searchTerm: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/krx/stocks/search?q=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.stocks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    searchStocks(val);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#121929] border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-left flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-400 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="종목명 또는 종목코드 검색 (예: 삼성전자, 005930, 카카오)"
            className="w-full bg-transparent text-base text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => handleQueryChange('')}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
          >
            ESC
          </button>
        </div>

        {/* Recent Searches */}
        {!query && recentSearches.length > 0 && (
          <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/40">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>최근 검색</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recentSearches.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg text-xs text-slate-200 cursor-pointer group"
                  onClick={() => handleQueryChange(item)}
                >
                  <span>{item}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRecent(item);
                    }}
                    className="text-slate-400 hover:text-rose-400 p-0.5 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="overflow-y-auto divide-y divide-slate-800/60 flex-1 p-2">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">
              <div className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p>KRX 종목 데이터를 검색하고 있습니다...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <p>일치하는 종목이 없습니다.</p>
              <p className="text-xs text-slate-400 mt-1">
                정확한 종목명이나 6자리 종목코드를 입력해 주세요.
              </p>
            </div>
          ) : (
            results.map((stock) => {
              const changeInfo = formatChange(stock.change, stock.changeRate, stock.market);
              const isStarred = watchlist.includes(stock.code);

              return (
                <div
                  key={stock.code}
                  onClick={() => {
                    onSelectStock(stock.code);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => onToggleWatchlist(stock.code, e)}
                      className="p-1 text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                      title={isStarred ? '관심종목 해제' : '관심종목 추가'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          isStarred ? 'text-amber-400 fill-amber-400' : ''
                        }`}
                      />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                          {stock.name}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {stock.code}
                        </span>
                        <StockBadge isDemo={stock.isDemo} market={stock.market} size="sm" />
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {stock.market} · {stock.isDemo ? 'DEMO' : 'KRX'} · 거래량 {stock.volume.toLocaleString()}주
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">최근 거래일 종가</span>
                    <div className="text-sm font-semibold text-slate-100 font-mono">
                      {formatPrice(stock.close, stock.market)}
                    </div>
                    <div className={`text-xs flex items-center justify-end gap-1 ${changeInfo.colorClass}`}>
                      {changeInfo.isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : changeInfo.isNegative ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : null}
                      <span>{changeInfo.rateText}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer tip */}
        <div className="p-3 bg-slate-900/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>* 최근 거래일 종가 기준 데이터입니다.</span>
          <span className="flex items-center gap-1 text-blue-400">
            상세분석 이동 <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
