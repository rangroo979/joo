import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Star,
  Activity,
  Layers,
  Scale,
} from 'lucide-react';
import { Stock, MarketIndex } from '../types.ts';
import { StockBadge } from '../components/StockBadge.tsx';
import { StockMiniChart } from '../components/StockMiniChart.tsx';
import { formatPrice, formatChange, formatKoreanCurrency } from '../utils/formatters.ts';

interface HomeViewProps {
  indices: MarketIndex[];
  featuredStocks: Stock[];
  usStocks: Stock[];
  onSelectStock: (code: string) => void;
  watchlist: string[];
  onToggleWatchlist: (code: string, e: React.MouseEvent) => void;
  onNavigate: (view: string, stockCode?: string) => void;
  latestBusinessDate: string;
}

export const HomeView: React.FC<HomeViewProps> = ({
  indices,
  featuredStocks,
  usStocks,
  onSelectStock,
  watchlist,
  onToggleWatchlist,
  onNavigate,
  latestBusinessDate,
}) => {
  const representativeCodes = ['005930', '000660', '005380', '035420', '035720', '373220'];
  const representativeStocks = React.useMemo(() => {
    if (!featuredStocks || featuredStocks.length === 0) return [];
    const matched = representativeCodes
      .map((code) => featuredStocks.find((s) => s.code === code))
      .filter((s): s is Stock => Boolean(s));
    if (matched.length > 0) return matched;
    return featuredStocks.slice(0, 6);
  }, [featuredStocks]);
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner with Clear Platform Identity */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121c33] via-[#0f172a] to-[#0b0f19] border border-blue-900/40 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI 기반 투자 의사결정 지원 플랫폼</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            데이터로 더 현명하고 객관적인 투자 결정을
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            재무지표, 기업정보, 시장 데이터와 뉴스를 한 화면에서 확인하고,
            Gemini AI가 주요 긍정요인과 위험요인을 분석합니다.
          </p>

          {/* Data Transparency Banner */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>국내 종목: <strong>KRX 최근 거래일 데이터</strong> ({latestBusinessDate} 기준)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>시장지수 및 해외: <strong>DEMO 시뮬레이션</strong></span>
            </div>
          </div>
        </div>

        {/* Decorative Background Glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 1. Market Overview Indices */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-slate-100">주요 시장 지수</h2>
            <span className="text-xs text-slate-400 font-normal ml-1">
              (국내·해외 지수 API 미연결: DEMO)
            </span>
          </div>
          <button
            onClick={() => onNavigate('market')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
          >
            시장 심층 분석 <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {indices.map((idx) => {
            const isPos = idx.change >= 0;
            const changeInfo = formatChange(idx.change, idx.changeRate, idx.market === 'US' ? 'US' : 'KOSPI');

            return (
              <div
                key={idx.code}
                onClick={() => onNavigate('market')}
                className="bg-[#111827] hover:bg-[#141e33] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition-all cursor-pointer shadow-md group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-200 group-hover:text-blue-400 transition-colors">
                      {idx.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {idx.code}
                    </span>
                  </div>
                  <StockBadge isDemo={true} size="sm" />
                </div>

                <div className="flex items-baseline justify-between mt-2">
                  <div className="text-xl font-bold font-mono text-slate-100">
                    {idx.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-xs font-semibold flex items-center gap-1 ${changeInfo.colorClass}`}>
                    {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{changeInfo.rateText}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60">
                  <StockMiniChart data={idx.history} isPositive={isPos} height={36} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Major Featured Korean Stocks (KRX) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-100">국내 대표 종목 (KRX 기준)</h2>
              <span className="text-xs text-slate-400">
                {latestBusinessDate} 거래일 종가 기준
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              한국거래소 공식 일별매매데이터 기준입니다.
            </p>
          </div>
          <button
            onClick={() => onNavigate('search')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            전체 종목 검색 <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {representativeStocks.map((stock) => {
            const changeInfo = formatChange(stock.change, stock.changeRate, stock.market);
            const isStarred = watchlist.includes(stock.code);

            return (
              <div
                key={stock.code}
                onClick={() => onSelectStock(stock.code)}
                className="bg-[#111827] hover:bg-[#152035] border border-slate-800/80 hover:border-blue-500/40 rounded-2xl p-4 transition-all cursor-pointer shadow-md group relative"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => onToggleWatchlist(stock.code, e)}
                      className="text-slate-500 hover:text-amber-400 p-0.5 transition-colors cursor-pointer"
                    >
                      <Star className={`w-4 h-4 ${isStarred ? 'text-amber-400 fill-amber-400' : ''}`} />
                    </button>
                    <div>
                      <h3 className="font-bold text-base text-slate-100 group-hover:text-blue-400 transition-colors">
                        {stock.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        <span className="font-mono">{stock.code}</span>
                        <span>·</span>
                        <span>{stock.market}</span>
                        <span>·</span>
                        <span className="text-slate-400">
                          {stock.isDemo ? 'DEMO' : 'KRX'} · {latestBusinessDate} 거래일 기준
                        </span>
                      </div>
                    </div>
                  </div>
                  <StockBadge isDemo={stock.isDemo} market={stock.market} size="sm" />
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

                {/* Additional metrics */}
                <div className="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div>
                    <span className="text-slate-400">시가총액: </span>
                    <span className="font-medium text-slate-300">{formatKoreanCurrency(stock.marketCap)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">거래량: </span>
                    <span className="font-medium text-slate-300">{stock.volume.toLocaleString()}주</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/40 text-blue-400 group-hover:text-blue-300 font-medium">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Gemini 분석 보기
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. US Stocks (DEMO) Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">해외 대표 종목 (DEMO)</h2>
            <span className="text-xs text-amber-400 font-medium">
              * 미국 주식 API 미연결 (기능 체험용 DEMO)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {usStocks.map((stock) => {
            const changeInfo = formatChange(stock.change, stock.changeRate, 'US');

            return (
              <div
                key={stock.code}
                onClick={() => onSelectStock(stock.code)}
                className="bg-[#111827] hover:bg-[#152035] border border-slate-800 rounded-2xl p-4 transition-all cursor-pointer shadow-md group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-100 group-hover:text-blue-400 transition-colors">
                      {stock.name}
                    </h3>
                    <span className="text-xs font-mono text-slate-400">{stock.code}</span>
                  </div>
                  <StockBadge isDemo={true} market="US" size="sm" />
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <div className="text-lg font-bold font-mono text-slate-100">
                    {formatPrice(stock.close, 'US')}
                  </div>
                  <div className={`text-xs font-semibold ${changeInfo.colorClass}`}>
                    {changeInfo.rateText}
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <span>거래량: {stock.volume.toLocaleString()}</span>
                  <span className="text-blue-400 group-hover:underline">분석</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Decision Support Tools Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('search')}
          className="p-5 rounded-2xl bg-[#111827] border border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer shadow group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-100 group-hover:text-blue-400 transition-colors">
            KRX 전 종목 검색
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            유가증권(KOSPI) 및 코스닥(KOSDAQ) 전 종목의 최근 거래일 종가와 시가총액을 검색합니다.
          </p>
        </div>

        <div
          onClick={() => onNavigate('compare')}
          className="p-5 rounded-2xl bg-[#111827] border border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer shadow group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-100 group-hover:text-indigo-400 transition-colors">
            종목 1:1:1 다차원 비교
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            최대 3개 종목의 시가총액, 거래량, 가격 변동성을 나란히 비교하고 Gemini 종합 의견을 확인합니다.
          </p>
        </div>

        <div
          onClick={() => onNavigate('settings')}
          className="p-5 rounded-2xl bg-[#111827] border border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer shadow group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-100 group-hover:text-emerald-400 transition-colors">
            투자 용어 & 지표 사전
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            PER, PBR, ROE, 거래대금 등 초보 투자자도 쉽게 이해할 수 있는 핵심 지표 가이드를 제공합니다.
          </p>
        </div>
      </div>
    </div>
  );
};
