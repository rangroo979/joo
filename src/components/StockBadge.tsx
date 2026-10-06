import React, { useState } from 'react';
import { Info, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface StockBadgeProps {
  isDemo?: boolean;
  market?: string;
  size?: 'sm' | 'md';
}

export const StockBadge: React.FC<StockBadgeProps> = ({ isDemo = false, market, size = 'sm' }) => {
  const [showModal, setShowModal] = useState(false);

  const isKrx = !isDemo && (market === 'KOSPI' || market === 'KOSDAQ' || !market);

  const padClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        className={`inline-flex items-center gap-1 rounded-full font-medium transition-all cursor-pointer ${padClass} ${
          isKrx
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
        }`}
        title="데이터 출처 확인"
      >
        {isKrx ? (
          <>
            <CheckCircle2 className="w-3 h-3" />
            <span>KRX</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-3 h-3" />
            <span>DEMO</span>
          </>
        )}
        <Info className="w-2.5 h-2.5 opacity-70 ml-0.5" />
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setShowModal(false);
          }}
        >
          <div
            className="bg-[#151c2e] border border-slate-700/80 rounded-2xl p-5 max-w-md w-full shadow-2xl relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              {isKrx ? (
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              <h3 className="font-semibold text-base text-slate-100">
                {isKrx ? '한국거래소(KRX) 공식 데이터' : '시뮬레이션 DEMO 데이터'}
              </h3>
            </div>

            <div className="text-sm text-slate-300 space-y-2 leading-relaxed bg-[#0b0f19] p-3.5 rounded-xl border border-slate-800">
              {isKrx ? (
                <>
                  <p className="font-medium text-emerald-300">
                    한국거래소(KRX)의 최근 거래일 기준 데이터입니다.
                  </p>
                  <p className="text-xs text-slate-400">
                    본 데이터는 한국거래소(KRX) 공식 일별매매정보를 통해 집계된 최근 거래일 종가 기준입니다.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-amber-300">
                    현재 실제 API가 연결되지 않은 시뮬레이션 데모 데이터입니다.
                  </p>
                  <p className="text-xs text-slate-400">
                    미국주식 및 시장지수, 샘플 뉴스는 기능 및 UI 시연을 위한 DEMO 데이터이며 실제 거래 가격으로 위장하지 않습니다.
                  </p>
                </>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
