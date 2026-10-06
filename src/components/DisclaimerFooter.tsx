import React from 'react';
import { ShieldAlert, Database, Cpu } from 'lucide-react';

export const DisclaimerFooter: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-[#080c14] py-8 px-4 sm:px-6 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Compliance & Regulatory Disclaimer */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-slate-200">투자 유의사항 및 법적 면책 고지</h4>
            <p className="leading-relaxed text-slate-300">
              본 서비스의 AI 분석 결과는 투자 참고용 정보이며, 투자 권유 또는 수익을 보장하지 않습니다.
              실제 투자 결정과 그에 따른 모든 법적·재정적 책임은 사용자 본인에게 있습니다.
              본 서비스는 자본시장법상 투자자문 또는 유사투자자문업이 아닙니다.
            </p>
          </div>
        </div>

        {/* Data Architecture & Source notice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-slate-200">데이터 출처:</strong> 국내 종목은 한국거래소(KRX) 최근 거래일 공식 데이터이며, 해외 주식 및 시장지수는 시뮬레이션 DEMO 데이터입니다.
            </span>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
            <Cpu className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong className="text-slate-200">AI 분석 모델:</strong> Gemini AI를 통해 주어진 금융 데이터를 바탕으로 객관적인 긍정/위험 요인을 도출합니다.
            </span>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400 pt-2 border-t border-slate-800/40">
          © AI 투자 분석·의사결정 지원 플랫폼. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
