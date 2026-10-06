import React from 'react';
import {
  Home,
  Search,
  Sparkles,
  BarChart3,
  Newspaper,
  Star,
  Scale,
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, stockCode?: string) => void;
  watchlistCount: number;
}

export const navItems = [
  { id: 'home', label: '홈', icon: Home },
  { id: 'search', label: '종목검색', icon: Search },
  { id: 'ai-analysis', label: 'AI 분석', icon: Sparkles },
  { id: 'market', label: '시장분석', icon: BarChart3 },
  { id: 'news', label: '뉴스분석', icon: Newspaper },
  { id: 'watchlist', label: '관심종목', icon: Star },
  { id: 'compare', label: '종목비교', icon: Scale },
  { id: 'settings', label: '설정 & 용어', icon: BookOpen },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  watchlistCount,
}) => {
  return (
    <>
      {/* PC Sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-[#0d1322] border-r border-slate-800/80 p-4 min-h-[calc(100vh-65px)]">
        <div className="space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            메뉴
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (item.id === 'ai-analysis' && currentView === 'detail');
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'watchlist' && watchlistCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {watchlistCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Informative Side Box */}
        <div className="mt-auto pt-6">
          <div className="p-3.5 rounded-xl bg-[#141d31] border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 객관적 분석</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              투자 결정을 대신하지 않고, 긍정적 요인과 위험 요인을 균형 있게 제시합니다.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c1220]/95 backdrop-blur-md border-t border-slate-800 px-2 py-2 flex items-center justify-around">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || (item.id === 'ai-analysis' && currentView === 'detail');
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
        {/* Extra drawer/more button */}
        <button
          onClick={() => onNavigate('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            currentView === 'settings' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>더보기</span>
        </button>
      </nav>
    </>
  );
};
