import React, { useState } from 'react';
import {
  Settings,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Search,
  Database,
  ShieldCheck,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { SystemStatus, TermDefinition } from '../types.ts';
import { INVESTMENT_TERMS } from '../data/demoData.ts';

interface SettingsTermsViewProps {
  status: SystemStatus | null;
  onRefreshStatus: () => void;
}

export const SettingsTermsView: React.FC<SettingsTermsViewProps> = ({
  status,
  onRefreshStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'terms'>('status');
  const [termSearch, setTermSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [selectedTerm, setSelectedTerm] = useState<TermDefinition | null>(null);

  const categories = ['전체', '기본용어', '가치평가', '재무제표', '시장거래'];

  const filteredTerms = INVESTMENT_TERMS.filter((item) => {
    const matchCat = selectedCategory === '전체' || item.category === selectedCategory;
    const matchSearch =
      item.term.toLowerCase().includes(termSearch.toLowerCase()) ||
      item.simpleExplanation.toLowerCase().includes(termSearch.toLowerCase()) ||
      (item.nameEn && item.nameEn.toLowerCase().includes(termSearch.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-400" />
            <span>설정 및 투자 용어 사전</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            시스템 데이터 연결 상태 점검과 초보 투자자를 위한 핵심 금융 용어 가이드
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-xl border border-slate-800 self-start sm:self-auto text-xs">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'status' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>데이터 연결 상태</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'terms' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>투자 용어 사전</span>
          </button>
        </div>
      </div>

      {/* Tab 1: 데이터 연결 상태 */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-slate-100">데이터 연결 및 소스 상태</h2>
              </div>
              <button
                onClick={onRefreshStatus}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>상태 새로고침</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* KRX_API_KEY: 등록됨 / 미등록 */}
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block text-sm">KRX_API_KEY</span>
                  <span className="text-[11px] text-slate-400">환경변수 보안 등록 여부</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {status?.krxConfigured ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 등록됨
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 font-semibold border border-rose-500/30">
                      <AlertTriangle className="w-3.5 h-3.5" /> 미등록
                    </span>
                  )}
                </div>
              </div>

              {/* 최근 거래일: YYYY.MM.DD */}
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block text-sm">최근 거래일</span>
                  <span className="text-[11px] text-slate-400">데이터 기준 영업일</span>
                </div>
                <div className="font-mono font-bold text-blue-400 text-sm">
                  {status?.latestBusinessDate || '2026.09.28'}
                </div>
              </div>

              {/* KRX 국내 종목: 정상 / 오류 */}
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block text-sm">KRX 국내 종목</span>
                  <span className="text-[11px] text-slate-400">유가증권 & 코스닥 일별매매 데이터</span>
                </div>
                <div>
                  {(status?.krxStockStatus === '정상' || (status?.krxConnected && ((status?.kospiStocksLoaded || 0) + (status?.kosdaqStocksLoaded || 0) > 0))) ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 정상 ({((status?.kospiStocksLoaded || 0) + (status?.kosdaqStocksLoaded || 0)).toLocaleString()}개)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 font-semibold border border-rose-500/30">
                      <AlertTriangle className="w-3.5 h-3.5" /> 오류
                    </span>
                  )}
                </div>
              </div>

              {/* KRX KOSPI 지수: 정상 / 오류 */}
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block text-sm">KRX KOSPI 지수</span>
                  <span className="text-[11px] text-slate-400">KOSPI 시리즈 일별시세정보 API</span>
                </div>
                <div>
                  {(status?.krxKospiIndexStatus === '정상' || (status?.krxConnected && !status?.isDemoFallback)) ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 정상
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 font-semibold border border-rose-500/30">
                      <AlertTriangle className="w-3.5 h-3.5" /> 오류
                    </span>
                  )}
                </div>
              </div>

              {/* KRX KOSDAQ 지수: 정상 / 오류 */}
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block text-sm">KRX KOSDAQ 지수</span>
                  <span className="text-[11px] text-slate-400">KOSDAQ 시리즈 일별시세정보 API</span>
                </div>
                <div>
                  {status?.krxKosdaqIndexStatus === '정상' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 정상
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30">
                      <AlertTriangle className="w-3.5 h-3.5" /> DEMO Fallback
                    </span>
                  )}
                </div>
              </div>

              {/* Gemini AI 연결 */}
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block text-sm">Gemini AI</span>
                  <span className="text-[11px] text-slate-400">gemini-3.8-flash 분석 엔진</span>
                </div>
                <div>
                  {status?.geminiConnected ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 정상
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30">
                      <AlertTriangle className="w-3.5 h-3.5" /> Fallback
                    </span>
                  )}
                </div>
              </div>

              {/* 해외 시장지수 및 미국주식: DEMO */}
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block text-sm">해외 시장지수 (S&P 500 / NASDAQ)</span>
                  <span className="text-[11px] text-slate-400">해외 실시간 API 미제공: DEMO 유지</span>
                </div>
                <div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30">
                    DEMO
                  </span>
                </div>
              </div>

              {/* 해외 시장지수 및 미국주식 */}
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block text-sm">미국주식 & 해외 시장지수</span>
                  <span className="text-[11px] text-slate-400">해외 브로커리지 API 미연결</span>
                </div>
                <div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30">
                    DEMO
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-950/20 border border-blue-500/20 rounded-2xl text-xs text-blue-200/90 leading-relaxed flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-blue-300">보안 및 개인정보 보호 고지: </strong>
                KRX_API_KEY 및 GEMINI_API_KEY는 서버측 환경변수에서만 사용되며, 브라우저, 로컬 스토리지 또는 클라이언트 네트워크 응답에 절대 노출되지 않습니다.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 투자 용어 사전 */}
      {activeTab === 'terms' && (
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111827] p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="용어 검색 (예: PER, 시가총액, ROE)"
                value={termSearch}
                onChange={(e) => setTermSearch(e.target.value)}
                className="w-full bg-[#0b0f19] text-xs text-slate-100 pl-8 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Terms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTerms.map((item) => (
              <div
                key={item.term}
                onClick={() => setSelectedTerm(item)}
                className="p-5 bg-[#111827] hover:bg-[#141e33] border border-slate-800 hover:border-blue-500/40 rounded-2xl shadow-md transition-all cursor-pointer group space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                        {item.term}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {item.category}
                      </span>
                    </div>
                    {item.nameEn && (
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{item.nameEn}</p>
                    )}
                  </div>
                  <HelpCircle className="w-4 h-4 text-blue-400/80 group-hover:text-blue-400" />
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {item.simpleExplanation}
                </p>

                <div className="pt-2 text-[11px] text-blue-400 group-hover:underline flex items-center gap-1">
                  자세한 해설 및 예시 보기 →
                </div>
              </div>
            ))}
          </div>

          {/* Modal for Detailed Explanation */}
          {selectedTerm && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
              onClick={() => setSelectedTerm(null)}
            >
              <div
                className="bg-[#131b2e] border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-left space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-white">{selectedTerm.term}</h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                        {selectedTerm.category}
                      </span>
                    </div>
                    {selectedTerm.nameEn && (
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedTerm.nameEn}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedTerm(null)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="font-bold text-slate-200 block mb-1 text-sm">한 줄 요약:</span>
                    <p>{selectedTerm.simpleExplanation}</p>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="font-bold text-slate-200 block mb-1 text-sm">상세 해설:</span>
                    <p>{selectedTerm.detailedExplanation}</p>
                  </div>

                  <div className="p-3 bg-blue-950/20 rounded-xl border border-blue-500/20">
                    <span className="font-bold text-blue-300 block mb-1 text-sm">실제 예시:</span>
                    <p className="text-blue-100">{selectedTerm.example}</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setSelectedTerm(null)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
