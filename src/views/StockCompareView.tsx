import React, { useState, useEffect } from 'react';
import {
  Scale,
  Plus,
  X,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  RefreshCw,
  Search,
  Layers,
} from 'lucide-react';
import { Stock } from '../types.ts';
import { StockBadge } from '../components/StockBadge.tsx';
import { formatPrice, formatChange, formatKoreanCurrency } from '../utils/formatters.ts';

interface StockCompareViewProps {
  initialStocks?: Stock[];
  onSelectStock: (code: string) => void;
  latestBusinessDate: string;
}

export const StockCompareView: React.FC<StockCompareViewProps> = ({
  initialStocks = [],
  onSelectStock,
  latestBusinessDate,
}) => {
  const [selectedStocks, setSelectedStocks] = useState<Stock[]>(initialStocks);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // AI Comparison Result
  const [comparisonAi, setComparisonAi] = useState<any | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // If no initial stocks, populate with Samsung & SK Hynix
  useEffect(() => {
    if (selectedStocks.length === 0) {
      Promise.all([
        fetch('/api/krx/stocks/005930').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/krx/stocks/000660').then((r) => (r.ok ? r.json() : null)),
      ]).then(([s1, s2]) => {
        const defaults = [s1, s2].filter(Boolean);
        if (defaults.length > 0) setSelectedStocks(defaults);
      });
    }
  }, []);

  const handleSearch = async (term: string) => {
    setSearchQuery(term);
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/krx/stocks/search?q=${encodeURIComponent(term)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.stocks || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addStock = (stock: Stock) => {
    if (selectedStocks.length >= 3) {
      alert('최대 3개 종목까지 동시에 비교할 수 있습니다.');
      return;
    }
    if (selectedStocks.some((s) => s.code === stock.code)) {
      alert('이미 비교 목록에 추가된 종목입니다.');
      return;
    }
    setSelectedStocks([...selectedStocks, stock]);
    setSearchQuery('');
    setShowSearchDropdown(false);
    setComparisonAi(null);
  };

  const removeStock = (code: string) => {
    setSelectedStocks(selectedStocks.filter((s) => s.code !== code));
    setComparisonAi(null);
  };

  const runAiComparison = async () => {
    if (selectedStocks.length === 0) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/gemini/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stocks: selectedStocks }),
      });
      if (res.ok) {
        const data = await res.json();
        setComparisonAi(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <Scale className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-bold text-slate-100">종목 다차원 비교</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            최대 3종목
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          한국거래소 최근 거래일 데이터를 기반으로 주요 종목의 시가총액, 거래량, 가격 흐름을 비교하고 Gemini AI의 종합 분석을 제공합니다.
        </p>
      </div>

      {/* Stock Selection & Adder Bar */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold mr-1">비교 중인 종목:</span>

          {selectedStocks.map((stock) => (
            <div
              key={stock.code}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 font-medium"
            >
              <span>{stock.name} ({stock.code})</span>
              <button
                onClick={() => removeStock(stock.code)}
                className="text-slate-400 hover:text-rose-400 p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {selectedStocks.length < 3 && (
            <div className="relative">
              <button
                onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>종목 추가 ({selectedStocks.length}/3)</span>
              </button>

              {showSearchDropdown && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-[#151d30] border border-slate-700 rounded-2xl p-3 shadow-2xl z-30 space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="종목명 검색 (예: 현대차)"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full bg-[#0b0f19] text-xs text-slate-100 pl-8 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
                      autoFocus
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-800 text-xs">
                    {searchResults.map((stock) => (
                      <div
                        key={stock.code}
                        onClick={() => addStock(stock)}
                        className="p-2 hover:bg-slate-800 cursor-pointer flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-200">{stock.name}</span>
                        <span className="font-mono text-[11px] text-slate-400">{stock.code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      {selectedStocks.length > 0 && (
        <div className="bg-[#111827] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#0e1424] text-slate-400 border-b border-slate-800 text-xs">
                <tr>
                  <th className="py-4 px-4 w-44 font-semibold text-slate-400">비교 항목</th>
                  {selectedStocks.map((s) => (
                    <th key={s.code} className="py-4 px-4 font-bold text-slate-100">
                      <div className="flex items-center gap-2">
                        <span
                          className="hover:text-blue-400 cursor-pointer text-base"
                          onClick={() => onSelectStock(s.code)}
                        >
                          {s.name}
                        </span>
                        <StockBadge isDemo={s.isDemo} market={s.market} size="sm" />
                      </div>
                      <span className="font-mono text-xs text-slate-400 font-normal">
                        {s.code} · {s.market} · {s.isDemo ? 'DEMO' : 'KRX'} · {latestBusinessDate} 거래일 기준
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60 font-medium">
                {/* 1. 최근 거래일 종가 */}
                <tr>
                  <td className="py-3 px-4 text-slate-400 bg-slate-900/40">최근 거래일 종가</td>
                  {selectedStocks.map((s) => (
                    <td key={s.code} className="py-3 px-4 font-mono font-bold text-slate-100">
                      {formatPrice(s.close, s.market)}
                    </td>
                  ))}
                </tr>

                {/* 2. 전일 대비 및 등락률 */}
                <tr>
                  <td className="py-3 px-4 text-slate-400 bg-slate-900/40">전일 대비 (등락률)</td>
                  {selectedStocks.map((s) => {
                    const changeInfo = formatChange(s.change, s.changeRate, s.market);
                    return (
                      <td key={s.code} className="py-3 px-4 font-mono">
                        <div className={`inline-flex items-center gap-1 font-semibold ${changeInfo.colorClass}`}>
                          {changeInfo.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : changeInfo.isNegative ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                          <span>{changeInfo.text}</span>
                          <span>({changeInfo.rateText})</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* 3. 시가총액 */}
                <tr>
                  <td className="py-3 px-4 text-slate-400 bg-slate-900/40">시가총액</td>
                  {selectedStocks.map((s) => (
                    <td key={s.code} className="py-3 px-4 font-mono text-slate-200">
                      {formatKoreanCurrency(s.marketCap)}
                    </td>
                  ))}
                </tr>

                {/* 4. 거래량 */}
                <tr>
                  <td className="py-3 px-4 text-slate-400 bg-slate-900/40">거래량</td>
                  {selectedStocks.map((s) => (
                    <td key={s.code} className="py-3 px-4 font-mono text-slate-200">
                      {s.volume.toLocaleString()}주
                    </td>
                  ))}
                </tr>

                {/* 5. 거래대금 */}
                <tr>
                  <td className="py-3 px-4 text-slate-400 bg-slate-900/40">거래대금</td>
                  {selectedStocks.map((s) => (
                    <td key={s.code} className="py-3 px-4 font-mono text-slate-200">
                      {formatKoreanCurrency(s.tradingValue)}
                    </td>
                  ))}
                </tr>

                {/* 6. 상장주식수 */}
                <tr>
                  <td className="py-3 px-4 text-slate-400 bg-slate-900/40">상장주식수</td>
                  {selectedStocks.map((s) => (
                    <td key={s.code} className="py-3 px-4 font-mono text-slate-300">
                      {s.listedShares.toLocaleString()}주
                    </td>
                  ))}
                </tr>

                {/* Future Extensibility Placeholder for PER/PBR/ROE */}
                <tr className="bg-slate-900/20">
                  <td className="py-3 px-4 text-slate-400">재무 지표 (PER / PBR / ROE)</td>
                  {selectedStocks.map((s) => (
                    <td key={s.code} className="py-3 px-4 text-slate-400 text-xs">
                      외부 재무 API 연결 준비 중 (임의 수치 미표시)
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* AI Comparison Trigger Section */}
          <div className="p-6 bg-[#0e1526] border-t border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span>Gemini 종목 다차원 비교 분석</span>
                </h3>
                <p className="text-xs text-slate-400">
                  각 종목의 규모, 수급 특징, 시장 위치를 비교하여 객관적인 시사점을 제공합니다.
                </p>
              </div>

              <button
                onClick={runAiComparison}
                disabled={aiLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow cursor-pointer transition-colors self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                <span>{aiLoading ? '비교 분석 생성 중...' : 'AI 비교 분석 실행'}</span>
              </button>
            </div>

            {aiLoading && (
              <div className="py-10 text-center space-y-2 text-slate-400">
                <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-medium">선택된 종목 데이터를 종합 분석하고 있습니다...</p>
              </div>
            )}

            {comparisonAi && !aiLoading && (
              <div className="space-y-4 pt-2 text-xs">
                {/* Overview */}
                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800">
                  <h4 className="font-bold text-indigo-300 mb-1">비교 총평:</h4>
                  <p className="text-slate-200 leading-relaxed">{comparisonAi.overview}</p>
                </div>

                {/* Per stock comparison points */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {comparisonAi.comparisonPoints?.map((cp: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                      <h5 className="font-bold text-slate-100 text-sm">{cp.stockName}</h5>
                      <div>
                        <span className="text-emerald-400 font-semibold block">강점:</span>
                        <p className="text-slate-300 leading-relaxed">{cp.strengths}</p>
                      </div>
                      <div>
                        <span className="text-amber-400 font-semibold block">위험요인:</span>
                        <p className="text-slate-300 leading-relaxed">{cp.risks}</p>
                      </div>
                      <div>
                        <span className="text-blue-400 font-semibold block">거래 특성:</span>
                        <p className="text-slate-400 leading-relaxed">{cp.tradingProfile}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Portfolio insight */}
                {comparisonAi.portfolioInsight && (
                  <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-xl text-blue-200/90 leading-relaxed">
                    <strong className="text-blue-300">투자자 참고 시사점: </strong>
                    {comparisonAi.portfolioInsight}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
