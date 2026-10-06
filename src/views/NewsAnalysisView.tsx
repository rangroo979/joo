import React, { useState } from 'react';
import {
  Newspaper,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { NewsItem } from '../types.ts';
import { DEMO_NEWS_ITEMS } from '../data/demoData.ts';

export const NewsAnalysisView: React.FC = () => {
  const [newsList] = useState<NewsItem[]>(DEMO_NEWS_ITEMS);
  const [expandedId, setExpandedId] = useState<string | null>('news-1');

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <Newspaper className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-slate-100">뉴스 및 시장 이슈 분석</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            DEMO NEWS
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          실제 뉴스 API 미연결 상태로, 뉴스 감성 및 긍정/부정 영향 분석 구조를 시연하기 위한 샘플 뉴스입니다.
        </p>
      </div>

      {/* Transparency Banner */}
      <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-2.5 text-xs text-slate-300">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>샘플 뉴스 안내:</strong> 본 기사는 실제 언론사 기사가 아니며, AI 금융 뉴스 영향도 분석 기능 테스트를 위한 DEMO 데이터입니다.
        </span>
      </div>

      {/* News Articles List */}
      <div className="space-y-4">
        {newsList.map((item) => {
          const isExpanded = expandedId === item.id;

          return (
            <div
              key={item.id}
              className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-md transition-all"
            >
              {/* Header / Clickable Card summary */}
              <div
                onClick={() => toggleExpand(item.id)}
                className="p-5 cursor-pointer hover:bg-slate-800/40 transition-colors flex items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 rounded border border-amber-500/20 font-semibold text-[11px]">
                      샘플 뉴스
                    </span>
                    <span className="text-slate-400">{item.source}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.date}
                    </span>
                    {item.relatedStock && (
                      <span className="px-2 py-0.5 bg-blue-500/15 text-blue-300 rounded font-medium text-[11px]">
                        관련 종목: {item.relatedStock}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-100 hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/60 shrink-0">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Expanded AI Analysis Breakdown */}
              {isExpanded && item.aiAnalysis && (
                <div className="bg-[#0c1220] p-5 border-t border-slate-800/80 space-y-4 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Gemini AI 뉴스 영향도 진단</span>
                  </div>

                  {/* Core Content */}
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="font-semibold text-slate-200 block mb-1">핵심 요약:</span>
                    <p className="text-slate-300 leading-relaxed">{item.aiAnalysis.coreContent}</p>
                  </div>

                  {/* Positive & Negative Impacts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-[#0d1726] rounded-xl border border-emerald-900/30 space-y-1">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 긍정적 영향 요인
                      </span>
                      <p className="text-slate-300 leading-relaxed">{item.aiAnalysis.positiveImpact}</p>
                    </div>

                    <div className="p-3 bg-[#19131e] rounded-xl border border-rose-900/30 space-y-1">
                      <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> 부정적 영향 요인
                      </span>
                      <p className="text-slate-300 leading-relaxed">{item.aiAnalysis.negativeImpact}</p>
                    </div>
                  </div>

                  {/* Cautions */}
                  <div className="p-3 bg-amber-950/20 rounded-xl border border-amber-500/20 text-amber-300/90 leading-relaxed">
                    <strong className="text-amber-300">투자자 유의사항: </strong>
                    {item.aiAnalysis.cautions}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
