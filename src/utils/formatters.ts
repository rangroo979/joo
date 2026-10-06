export function formatKoreanNumber(val: number): string {
  if (!Number.isFinite(val)) return '0';
  return val.toLocaleString('ko-KR');
}

export function formatKoreanCurrency(amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) return '0원';

  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  const trillion = Math.floor(abs / 1_000_000_000_000);
  const hundredMillion = Math.floor((abs % 1_000_000_000_000) / 100_000_000);
  const tenThousand = Math.floor((abs % 100_000_000) / 10_000);

  if (trillion > 0) {
    if (hundredMillion > 0) {
      return `${sign}약 ${trillion}조 ${hundredMillion.toLocaleString()}억원`;
    }
    return `${sign}약 ${trillion}조원`;
  }

  if (hundredMillion > 0) {
    if (tenThousand > 0) {
      return `${sign}약 ${hundredMillion.toLocaleString()}억 ${tenThousand.toLocaleString()}만원`;
    }
    return `${sign}약 ${hundredMillion.toLocaleString()}억원`;
  }

  if (tenThousand > 0) {
    return `${sign}약 ${tenThousand.toLocaleString()}만원`;
  }

  return `${sign}${abs.toLocaleString()}원`;
}

export function formatPrice(price: number, market = 'KOSPI'): string {
  if (!Number.isFinite(price)) return '0';
  if (market === 'US') {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${price.toLocaleString('ko-KR')}원`;
}

export function formatChange(change: number, changeRate: number, market = 'KOSPI'): {
  text: string;
  rateText: string;
  colorClass: string;
  bgClass: string;
  isPositive: boolean;
  isNegative: boolean;
} {
  const isPos = change > 0 || changeRate > 0;
  const isNeg = change < 0 || changeRate < 0;

  const sign = isPos ? '+' : '';
  const pricePrefix = market === 'US' ? '$' : '';
  const priceSuffix = market === 'US' ? '' : '원';

  const text = `${sign}${change.toLocaleString('ko-KR')}${priceSuffix}`;
  const rateText = `${sign}${changeRate.toFixed(2)}%`;

  // Korean Stock Market Convention: UP is RED, DOWN is BLUE
  let colorClass = 'text-slate-400';
  let bgClass = 'bg-slate-800/60 text-slate-300';

  if (isPos) {
    colorClass = 'text-rose-500 font-semibold';
    bgClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
  } else if (isNeg) {
    colorClass = 'text-blue-500 font-semibold';
    bgClass = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  }

  return {
    text: `${pricePrefix}${text}`,
    rateText,
    colorClass,
    bgClass,
    isPositive: isPos,
    isNegative: isNeg,
  };
}
