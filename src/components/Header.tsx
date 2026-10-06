import React, { useState } from 'react';
import {
  Search,
  Star,
  Activity,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { SystemStatus } from '../types.ts';

interface HeaderProps {
  status: SystemStatus | null;
  watchlistCount: number;
  onNavigate: (view: string, stockCode?: string) => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  watchlistCount,
  onNavigate,
  onOpenSearch,
}) => {
  const [quickInput, setQuickInput] = useState('');

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      onNavigate('search', quickInput.trim());
      setQuickInput('');
    } else {
      onOpenSearch();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Title */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onNavigate('home')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-blue-400 transition-colors">
                AI 투자 분석
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                PRO DECISION
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              데이터로 더 현명하고 객관적인 투자 결정을
            </p>
          </div>
        </div>

        {/* Global Fast Search Bar */}
        <div className="flex-1 max-w-md mx-2 hidden md:block">
          <form onSubmit={handleQuickSubmit} className="relative">
            <input
              type="text"
              placeholder="종목명 또는 종목코드 검색 (예: 삼성전자, 005930)"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onClick={onOpenSearch}
              className="w-full bg-[#131b2e] hover:bg-[#162138] focus:bg-[#162138] text-sm text-slate-100 placeholder:text-slate-400 pl-10 pr-12 py-2 rounded-xl border border-slate-700/60 focus:border-blue-500 focus:outline-none transition-all cursor-pointer shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
              검색
            </span>
          </form>
        </div>

        {/* Right Status & Quick Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Icon Button */}
          <button
            onClick={onOpenSearch}
            className="md:hidden p-2 rounded-xl text-slate-300 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50"
            title="종목 검색"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* KRX Data Status Badge */}
          <div
            onClick={() => onNavigate('settings')}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
            title="데이터 연결 상태 확인"
          >
            {status?.krxConnected ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300 font-medium">KRX 거래일 데이터</span>
                <span className="text-[10px] text-slate-400">({status.latestBusinessDate})</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300 font-medium">DEMO 모드</span>
              </>
            )}
          </div>

          {/* Gemini AI Status Badge */}
          <div
            onClick={() => onNavigate('settings')}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
            title="Gemini AI 상태 확인"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-300 font-medium">Gemini 3.8</span>
          </div>

          {/* Watchlist Quick Button */}
          <button
            onClick={() => onNavigate('watchlist')}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition-all cursor-pointer"
          >
            <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <span className="hidden sm:inline">관심종목</span>
            {watchlistCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {watchlistCount}
              </span>
            )}
          </button>

          {/* Settings / Dictionary */}
          <button
            onClick={() => onNavigate('settings')}
            className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700 border border-slate-700/60 transition-colors cursor-pointer"
            title="설정 및 투자 용어 사전"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
