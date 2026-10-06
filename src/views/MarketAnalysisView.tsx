import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  BarChart3,
  RefreshCw,
  Layers,
  Activity,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import { MarketIndex, MarketAIAnalysis } from '../types.ts';
import { StockBadge } from '../components/StockBadge.tsx';
import { StockMiniChart } from '../components/StockMiniChart.tsx';
import { formatChange } from '../utils/formatters.ts';

interface MarketAnalysisViewProps {
  indices: MarketIndex[];
}

export const MarketAnalysisView: React.FC<MarketAnalysisViewProps> = ({ indices }) => {
  const [analysis, setAnalysis] = useState<MarketAIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMarketAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/market-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indices }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketAnalysis();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <span>국내외 시장 분석</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            국내 및 글로벌 핵심 지수의 흐름을 한눈에 살피고, Gemini AI의 시장 진단을 확인합니다.
          </p>
        </div>

        <button
          onClick={fetchMarketAnalysis}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl cursor-pointer shadow transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? '분석 갱신 중...' : '시장 분석 갱신'}</span>
        </button>
      </div>

      {/* Notice Banner */}
      <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-2.5 text-xs text-slate-300">
        <Activity className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>지수 데이터 안내:</strong> 현재 실제 KRX 지수 및 해외 지수 스트리밍 API가 연결되지 않은 상태로, 전 지수 <strong>DEMO 시뮬레이션</strong>으로 표시됩니다.
        </span>
      </div>

      {/* Indices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {indices.map((idx) => {
          const isPos = idx.change >= 0;
          const changeInfo = formatChange(idx.change, idx.changeRate, idx.market === 'US' ? 'US' : 'KOSPI');

          return (
            <div
              key={idx.code}
              className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-md space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-100">{idx.name}</h3>
                  <span className="text-xs font-mono text-slate-400">{idx.code}</span>
                </div>
                <StockBadge isDemo={idx.isDemo} market={idx.code} size="sm" />
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-slate-100">
                  {idx.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`text-xs font-semibold flex items-center gap-1 ${changeInfo.colorClass}`}>
                  {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{changeInfo.rateText}</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>전일 대비</span>
                <span className={`font-mono font-semibold ${changeInfo.colorClass}`}>
                  {changeInfo.diffText}
                </span>
              </div>

              <div className="text-[10px] text-slate-500 flex items-center justify-between">
                <span>{!idx.isDemo && (idx.code === 'KOSPI' || idx.code === 'KOSDAQ') ? 'KRX 최근 거래일 지수' : '시뮬레이션 DEMO'}</span>
                <span>{idx.date || '2026.09.28'} 거래일 기준</span>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <StockMiniChart data={idx.history} isPositive={isPos} height={45} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Gemini AI Market Diagnosis */}
      <div className="bg-[#111827] rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-slate-100">Gemini AI 시장 진단 보고서</h2>
        </div>

        {loading ? (
          <div className="py-14 text-center space-y-2 text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">글로벌 거시 지표 및 시장 분위기를 진단하고 있습니다...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {/* Market Mood */}
            <div className="p-4 bg-[#0e1628] rounded-2xl border border-blue-900/30">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                <span>시장 분위기 요약</span>
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                {analysis.marketMood}
              </p>
            </div>

            {/* Bullish & Bearish Factors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#0d1624] rounded-2xl border border-emerald-900/30 space-y-2">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>주요 상승 요인</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {analysis.bullishFactors?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-[#17121c] rounded-2xl border border-amber-900/30 space-y-2">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>주요 하락 위험</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {analysis.bearishRisks?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold shrink-0">⚠</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sectors to watch & Key issues */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>관심 집중 업종</span>
                </h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  {analysis.sectorsToWatch?.map((sec, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-lg text-xs font-medium"
                    >
                      {sec}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  <span>주요 관전 포인트 및 이슈</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {analysis.keyIssues?.map((issue, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
