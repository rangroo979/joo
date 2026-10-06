export interface KrxRawStock {
  BAS_DD: string;
  ISU_CD: string;
  ISU_NM: string;
  MKT_NM: string;
  SECT_TP_NM: string;
  TDD_CLSPRC: string;
  CMPPREVDD_PRC: string;
  FLUC_RT: string;
  TDD_OPNPRC: string;
  TDD_HGPRC: string;
  TDD_LWPRC: string;
  ACC_TRDVOL: string;
  ACC_TRDVAL: string;
  MKTCAP: string;
  LIST_SHRS: string;
}

export interface KrxResponse {
  OutBlock_1: KrxRawStock[];
}

export interface Stock {
  date: string;
  code: string;
  name: string;
  market: 'KOSPI' | 'KOSDAQ' | 'US' | string;
  securityType: string;

  close: number;
  change: number;
  changeRate: number;

  open: number;
  high: number;
  low: number;

  volume: number;
  tradingValue: number;
  marketCap: number;
  listedShares: number;

  isDemo?: boolean;
  history?: Array<{
    date: string;
    close: number;
    open: number;
    high: number;
    low: number;
    volume: number;
  }>;
}

export interface MarketIndex {
  code: string;
  name: string;
  market: string;
  value: number;
  change: number;
  changeRate: number;
  isDemo: boolean;
  history: number[];
}

export interface AIAnalysisMetric {
  title: string;
  status: '좋음' | '보통' | '주의';
  reason: string;
}

export interface StockAIAnalysis {
  summary: string;
  positiveFactors: string[];
  riskFactors: string[];
  metrics: {
    profitability: AIAnalysisMetric;
    growth: AIAnalysisMetric;
    stability: AIAnalysisMetric;
    valuation: AIAnalysisMetric;
    momentum: AIAnalysisMetric;
  };
  baseDate: string;
  isDemoData: boolean;
}

export interface MarketAIAnalysis {
  marketMood: string;
  bullishFactors: string[];
  bearishRisks: string[];
  sectorsToWatch: string[];
  keyIssues: string[];
  baseDate: string;
}

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  source: string;
  summary: string;
  relatedStock?: string;
  isDemo: boolean;
  aiAnalysis?: {
    coreContent: string;
    positiveImpact: string;
    negativeImpact: string;
    cautions: string;
  };
}

export interface TermDefinition {
  term: string;
  nameEn?: string;
  category: '기본용어' | '가치평가' | '재무제표' | '시장거래';
  simpleExplanation: string;
  detailedExplanation: string;
  example: string;
}

export interface SystemStatus {
  krxConfigured: boolean;
  krxConnected: boolean;
  kospiStatus?: '정상' | '오류' | string;
  kosdaqStatus?: '정상' | '오류' | string;
  kospiStocksLoaded: number;
  kosdaqStocksLoaded: number;
  latestBusinessDate: string;
  isDemoFallback: boolean;
  geminiConnected: boolean;
}
