import React, { useState, useEffect } from 'react';
import {
  Star,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Trash2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Stock } from '../types.ts';
import { StockBadge } from '../components/StockBadge.tsx';
import { StockMiniChart } from '../components/StockMiniChart.tsx';
import { formatPrice, formatChange, formatKoreanCurrency } from '../utils/formatters.ts';

interface WatchlistViewProps {
  watchlist: string[];
  onToggleWatchlist: (code: string, e: React.MouseEvent) => void;
  onSelectStock: (code: string) => void;
  onNavigate: (view: string, stockCode?: string) => void;
  latestBusinessDate: string;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  watchlist,
  onToggleWatchlist,
  onSelectStock,
  onNavigate,
  latestBusinessDate,
}) => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWatchlistStocks = async () => {
      setLoading(true);
      if (watchlist.length === 0) {
        setStocks([]);
        setLoading(false);
        return;
      }

      try {
        const promises = watchlist.map((code) =>
          fetch(`/api/krx/stocks/${encodeURIComponent(code)}`).then((r) => (r.ok ? r.json() : null))
        );
        const results = await Promise.all(promises);
        setStocks(results.filter((s): s is Stock => s !== null));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlistStocks();
  }, [watchlist]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
          <h1 className="text-2xl font-bold text-slate-100">나의 관심종목</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            {watchlist.length}개
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          등록한 관심종목의 {latestBusinessDate} 거래일 종가와 변동률을 확인하고 즉시 AI 심층 분석을 실행할 수 있습니다.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 space-y-3">
          <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">관심종목 데이터를 동기화하고 있습니다...</p>
        </div>
      ) : stocks.length === 0 ? (
        /* Empty State */
        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-10 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Star className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">등록된 관심종목이 없습니다</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            종목 검색 또는 홈 화면에서 별표(★) 아이콘을 눌러 관심종목을 등록해 보세요.
          </p>
          <button
            onClick={() => onNavigate('search')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow cursor-pointer transition-colors inline-flex items-center gap-1.5"
          >
            <span>종목 검색하러 가기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Watchlist Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stocks.map((stock) => {
            const changeInfo = formatChange(stock.change, stock.changeRate, stock.market);

            return (
              <div
                key={stock.code}
                onClick={() => onSelectStock(stock.code)}
                className="bg-[#111827] hover:bg-[#152035] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-100 group-hover:text-blue-400 transition-colors">
                          {stock.name}
                        </h3>
                        <StockBadge isDemo={stock.isDemo} market={stock.market} size="sm" />
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        <span>{stock.code} · {stock.market}</span>
                        <span className="ml-1.5 text-slate-400 font-sans">
                          · {stock.isDemo ? 'DEMO' : 'KRX'} · {latestBusinessDate} 거래일 기준
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => onToggleWatchlist(stock.code, e)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title="관심종목에서 제거"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">최근 거래일 종가</span>
                      <span className="text-xl font-bold font-mono text-slate-100">
                        {formatPrice(stock.close, stock.market)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">전일 대비</span>
                      <span className={`text-sm font-semibold flex items-center justify-end gap-1 ${changeInfo.colorClass}`}>
                        {changeInfo.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>{changeInfo.rateText}</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>시가총액: {formatKoreanCurrency(stock.marketCap)}</span>
                    <span>거래량: {stock.volume.toLocaleString()}주</span>
                  </div>

                  {stock.history && (
                    <div className="mt-3">
                      <StockMiniChart
                        data={stock.history}
                        isPositive={stock.changeRate >= 0}
                        height={35}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-blue-400 group-hover:text-blue-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Gemini 분석 바로가기
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
