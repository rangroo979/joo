import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Star,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Send,
  RefreshCw,
  BarChart2,
  Calendar,
  Layers,
  Scale,
  ShieldAlert,
} from 'lucide-react';
import { Stock, StockAIAnalysis } from '../types.ts';
import { StockBadge } from '../components/StockBadge.tsx';
import { StockMiniChart } from '../components/StockMiniChart.tsx';
import { formatPrice, formatChange, formatKoreanCurrency } from '../utils/formatters.ts';

interface StockDetailViewProps {
  stockCode: string;
  onBack: () => void;
  watchlist: string[];
  onToggleWatchlist: (code: string, e: React.MouseEvent) => void;
  onCompareWith: (stock: Stock) => void;
  latestBusinessDate: string;
}

export const StockDetailView: React.FC<StockDetailViewProps> = ({
  stockCode,
  onBack,
  watchlist,
  onToggleWatchlist,
  onCompareWith,
  latestBusinessDate,
}) => {
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chart view mode
  const [chartMode, setChartMode] = useState<'area' | 'candles'>('area');

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<StockAIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Q&A with Gemini
  const [question, setQuestion] = useState('');
  const [chatLog, setChatLog] = useState<Array<{ q: string; a: string; timestamp: string }>>([]);
  const [qaLoading, setQaLoading] = useState(false);

  useEffect(() => {
    fetchStockDetail(stockCode);
  }, [stockCode]);

  const fetchStockDetail = async (code: string) => {
    setLoading(true);
    setError(null);
    setAiAnalysis(null);
    try {
      const res = await fetch(`/api/krx/stocks/${encodeURIComponent(code)}`);
      if (!res.ok) {
        throw new Error('해당 종목 데이터를 불러올 수 없습니다.');
      }
      const data: Stock = await res.json();
      setStock(data);
      // Auto-trigger AI analysis on load
      runAiAnalysis(data);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const runAiAnalysis = async (targetStock: Stock) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: targetStock }),
      });
      if (!res.ok) {
        throw new Error('현재 AI 분석 기능을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
      }
      const data: StockAIAnalysis = await res.json();
      setAiAnalysis(data);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setAiError(errMsg);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendQuestion = async (qText: string) => {
    if (!qText.trim() || !stock || qaLoading) return;
    setQaLoading(true);
    const userQ = qText.trim();
    setQuestion('');

    try {
      const res = await fetch('/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock, question: userQ }),
      });
      const data = await res.json();
      const answer = data.answer || '답변을 생성하지 못했습니다.';

      const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      setChatLog((prev) => [...prev, { q: userQ, a: answer, timestamp: timeStr }]);
    } catch (err) {
      console.error(err);
      const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      setChatLog((prev) => [
        ...prev,
        {
          q: userQ,
          a: '현재 AI 질문 응답 기능을 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
          timestamp: timeStr,
        },
      ]);
    } finally {
      setQaLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 space-y-3">
        <div className="inline-block w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-base font-medium">종목 상세 데이터를 불러오고 있습니다...</p>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-100">데이터를 불러오지 못했습니다</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          {error || '해당 거래일의 데이터가 존재하지 않거나 일시적인 통신 장애입니다.'}
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl cursor-pointer"
          >
            뒤로 가기
          </button>
          <button
            onClick={() => fetchStockDetail(stockCode)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl cursor-pointer"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const isStarred = watchlist.includes(stock.code);
  const changeInfo = formatChange(stock.change, stock.changeRate, stock.market);

  const quickQuestions = [
    '이 종목의 장점은 뭐야?',
    '거래량은 어떤 상태야?',
    '최근 거래일 기준 위험요인은 뭐야?',
    '시가총액과 거래량을 고려하면 어떤 특징이 있어?',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>목록으로 돌아가기</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onCompareWith(stock)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium cursor-pointer transition-colors"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>비교함에 추가</span>
          </button>

          <button
            onClick={(e) => onToggleWatchlist(stock.code, e)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
              isStarred
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isStarred ? 'text-amber-400 fill-amber-400' : ''}`} />
            <span>{isStarred ? '관심종목 해제' : '관심종목 등록'}</span>
          </button>
        </div>
      </div>

      {/* Stock Header & Price Summary Card */}
      <div className="bg-[#111827] rounded-3xl border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {stock.name}
              </h1>
              <span className="font-mono text-sm px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {stock.code}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 font-semibold border border-blue-500/20">
                {stock.market}
              </span>
              <StockBadge isDemo={stock.isDemo} market={stock.market} size="md" />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-medium text-slate-300">
                {stock.isDemo ? 'DEMO' : 'KRX'} · {latestBusinessDate} 거래일 기준
              </span>
              <span className="text-slate-400">(한국거래소 공식 일별매매 종가 데이터)</span>
            </div>
          </div>

          {/* Large Price Display */}
          <div className="text-left md:text-right">
            <span className="text-xs text-slate-400 block mb-0.5">최근 거래일 종가</span>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
              {formatPrice(stock.close, stock.market)}
            </div>
            <div className={`text-sm sm:text-base font-bold flex items-center md:justify-end gap-1.5 mt-1 ${changeInfo.colorClass}`}>
              {changeInfo.isPositive ? <TrendingUp className="w-4 h-4" /> : changeInfo.isNegative ? <TrendingDown className="w-4 h-4" /> : null}
              <span>{changeInfo.text}</span>
              <span>({changeInfo.rateText})</span>
            </div>
          </div>
        </div>

        {/* OHLC & Volume & Valuation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-6 text-xs">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 block">시가</span>
            <span className="text-slate-100 font-mono font-semibold text-sm mt-0.5 block">
              {formatPrice(stock.open, stock.market)}
            </span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/60">
            <span className="text-rose-400 block">고가</span>
            <span className="text-slate-100 font-mono font-semibold text-sm mt-0.5 block">
              {formatPrice(stock.high, stock.market)}
            </span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/60">
            <span className="text-blue-400 block">저가</span>
            <span className="text-slate-100 font-mono font-semibold text-sm mt-0.5 block">
              {formatPrice(stock.low, stock.market)}
            </span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 block">거래량</span>
            <span className="text-slate-100 font-mono font-semibold text-sm mt-0.5 block">
              {stock.volume.toLocaleString()}주
            </span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 block">거래대금</span>
            <span className="text-slate-100 font-mono font-semibold text-sm mt-0.5 block">
              {formatKoreanCurrency(stock.tradingValue)}
            </span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/60 sm:col-span-2 lg:col-span-2">
            <span className="text-slate-400 block">시가총액 / 상장주식수</span>
            <span className="text-slate-100 font-mono font-semibold text-sm mt-0.5 block">
              {formatKoreanCurrency(stock.marketCap)}{' '}
              <span className="text-slate-400 text-xs font-normal">({stock.listedShares.toLocaleString()}주)</span>
            </span>
          </div>
        </div>

        {/* Chart View with Mode Toggles */}
        <div className="mt-6 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-slate-200">최근 가격 흐름 차트</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setChartMode('area')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  chartMode === 'area' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                영역 차트
              </button>
              <button
                onClick={() => setChartMode('candles')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  chartMode === 'candles' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                캔들스틱
              </button>
            </div>
          </div>

          <div className="bg-[#0b0f19] p-4 rounded-2xl border border-slate-800/80">
            <StockMiniChart
              data={stock.history}
              isPositive={stock.changeRate >= 0}
              height={140}
              showCandles={chartMode === 'candles'}
              interactive={true}
            />
          </div>
        </div>
      </div>

      {/* 2. Gemini AI Comprehensive Analysis Section */}
      <div className="bg-[#111827] rounded-3xl border border-blue-900/30 p-6 shadow-xl space-y-6 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Gemini AI 종목 분석</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                  gemini-3.8-flash
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                한국거래소 공식 데이터를 전달받아 객관적이고 균형 잡힌 분석을 수행합니다.
              </p>
            </div>
          </div>

          <button
            onClick={() => runAiAnalysis(stock)}
            disabled={aiLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl cursor-pointer shadow transition-all self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
            <span>{aiLoading ? '분석 중...' : 'AI 분석 새로고침'}</span>
          </button>
        </div>

        {/* AI Loading State */}
        {aiLoading && (
          <div className="py-14 text-center space-y-3">
            <div className="inline-block w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-200">
              Gemini AI가 기업 데이터를 분석하고 있습니다.
            </p>
            <p className="text-xs text-slate-400">
              시가총액, 거래량, 가격 변동성 및 시장 위치를 다각도로 평가 중입니다.
            </p>
          </div>
        )}

        {/* AI Error State */}
        {!aiLoading && aiError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{aiError}</span>
            </div>
            <button
              onClick={() => runAiAnalysis(stock)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer"
            >
              재시도
            </button>
          </div>
        )}

        {/* AI Analysis Result */}
        {!aiLoading && aiAnalysis && (
          <div className="space-y-6">
            {/* [AI 종합 분석] */}
            <div className="p-4 bg-[#0e1526] rounded-2xl border border-blue-900/30">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>[AI 종합 분석]</span>
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed font-normal">
                {aiAnalysis.summary}
              </p>
            </div>

            {/* [긍정적 요인] & [주의 요인] Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Positive Factors */}
              <div className="p-4 bg-[#0d1624] rounded-2xl border border-emerald-900/30 space-y-2.5">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>[긍정적 요인]</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {aiAnalysis.positiveFactors.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risk Factors */}
              <div className="p-4 bg-[#17121c] rounded-2xl border border-amber-900/30 space-y-2.5">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>[주의 요인]</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {aiAnalysis.riskFactors.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-amber-400 font-bold shrink-0">⚠</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* [5개 분석 항목: 수익성, 성장성, 안정성, 밸류에이션, 시장 모멘텀] */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>[분석 항목 평가 및 근거]</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {Object.entries(aiAnalysis.metrics).map(([key, metric]) => {
                  const statusColors = {
                    좋음: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                    보통: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
                    주의: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                  };
                  const badgeClass = statusColors[metric.status] || statusColors['보통'];

                  return (
                    <div
                      key={key}
                      className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-200">{metric.title}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeClass}`}>
                          {metric.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {metric.reason}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Data Base Date & Disclaimer */}
            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="font-medium text-slate-300">
                본 분석은 {aiAnalysis.baseDate} {aiAnalysis.isDemoData ? 'DEMO 시뮬레이션' : 'KRX 거래일'} 데이터를 기준으로 작성되었습니다.
              </p>
              <div className="flex items-center gap-1.5 text-amber-400/90">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>
                  본 서비스의 AI 분석 결과는 투자 참고용 정보이며, 투자 권유 또는 수익을 보장하지 않습니다. 실제 투자 결정과 그에 따른 책임은 사용자 본인에게 있습니다.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. "AI에게 이 종목 질문하기" Interactive Section */}
      <div className="bg-[#111827] rounded-3xl border border-slate-800 p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-base font-bold text-slate-100">AI에게 이 종목 질문하기</h3>
            <p className="text-xs text-slate-400">
              {stock.name}의 거래 데이터만을 기반으로 균형 있고 객관적인 답변을 제공합니다.
            </p>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((qText, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuestion(qText)}
              disabled={qaLoading}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-xl text-xs border border-slate-700/60 transition-colors cursor-pointer flex items-center gap-1.5 text-left"
            >
              <span>{qText}</span>
            </button>
          ))}
        </div>

        {/* Chat Log Display */}
        {chatLog.length > 0 && (
          <div className="space-y-4 max-h-96 overflow-y-auto p-4 bg-[#0b0f19] rounded-2xl border border-slate-800 divide-y divide-slate-800/60">
            {chatLog.map((chat, idx) => (
              <div key={idx} className="pt-3 first:pt-0 space-y-2">
                {/* User Q */}
                <div className="flex items-start gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 text-[11px] font-bold shrink-0 mt-0.5">
                    질문
                  </span>
                  <p className="text-xs font-semibold text-slate-100">{chat.q}</p>
                  <span className="text-[10px] text-slate-400 ml-auto shrink-0">{chat.timestamp}</span>
                </div>

                {/* AI Answer */}
                <div className="flex items-start gap-2 bg-[#121b2d] p-3 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed">
                  <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="whitespace-pre-line">{chat.a}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Question Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuestion(question);
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            placeholder={`${stock.name}에 대해 궁금한 점을 질문해 보세요 (예: 시가총액과 거래량 특성은?)`}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={qaLoading}
            className="w-full bg-[#0b0f19] text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 pl-4 pr-12 py-3 rounded-2xl border border-slate-700/80 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!question.trim() || qaLoading}
            className="absolute right-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow"
          >
            {qaLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>

        <p className="text-[11px] text-slate-400">
          * AI 답변은 투자 참고용이며, 특정 종목의 매수 또는 매도를 권유하지 않습니다.
        </p>
      </div>
    </div>
  );
};
