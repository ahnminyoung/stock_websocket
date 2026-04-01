export const DOMESTIC_INDICES = [
  { symbol: 'KOSPI', name: '코스피', basePrice: 2748.41, volatility: 0.004 },
  { symbol: 'KOSDAQ', name: '코스닥', basePrice: 912.34, volatility: 0.005 },
];

export const OVERSEAS_INDICES = [
  { symbol: 'NASDAQ', name: '나스닥', basePrice: 18280.45, volatility: 0.0035 },
  { symbol: 'S&P500', name: 'S&P 500', basePrice: 5268.72, volatility: 0.0025 },
];

export const FX_QUOTES = [
  { symbol: 'USD/KRW', name: '달러/원', basePrice: 1332.5, volatility: 0.0012 },
];

export const DOMESTIC_WATCHLIST = [
  { symbol: '005930.KS', name: '삼성전자', basePrice: 83200, volatility: 0.008 },
  { symbol: '000660.KS', name: 'SK하이닉스', basePrice: 188500, volatility: 0.01 },
  { symbol: '035420.KS', name: 'NAVER', basePrice: 213000, volatility: 0.009 },
  { symbol: '207940.KS', name: '삼성바이오로직스', basePrice: 867000, volatility: 0.007 },
  { symbol: '051910.KS', name: 'LG화학', basePrice: 398000, volatility: 0.0095 },
  { symbol: '068270.KS', name: '셀트리온', basePrice: 177400, volatility: 0.0085 },
];

export const OVERSEAS_WATCHLIST = [
  { symbol: 'AAPL', name: 'Apple', basePrice: 193.64, volatility: 0.009 },
  { symbol: 'MSFT', name: 'Microsoft', basePrice: 428.91, volatility: 0.007 },
  { symbol: 'NVDA', name: 'NVIDIA', basePrice: 923.45, volatility: 0.013 },
  { symbol: 'AMZN', name: 'Amazon', basePrice: 182.72, volatility: 0.01 },
  { symbol: 'GOOGL', name: 'Alphabet', basePrice: 166.32, volatility: 0.008 },
  { symbol: 'TSLA', name: 'Tesla', basePrice: 199.44, volatility: 0.015 },
];

export const DOMESTIC_HEATMAP = [
  { symbol: '005930.KS', name: '삼성전자', basePrice: 83200, volatility: 0.009 },
  { symbol: '000660.KS', name: 'SK하이닉스', basePrice: 188500, volatility: 0.012 },
  { symbol: '207940.KS', name: '삼성바이오로직스', basePrice: 867000, volatility: 0.008 },
  { symbol: '051910.KS', name: 'LG화학', basePrice: 398000, volatility: 0.011 },
  { symbol: '035420.KS', name: 'NAVER', basePrice: 213000, volatility: 0.01 },
  { symbol: '005380.KS', name: '현대차', basePrice: 251000, volatility: 0.008 },
  { symbol: '006400.KS', name: '삼성SDI', basePrice: 407000, volatility: 0.012 },
  { symbol: '005490.KS', name: 'POSCO홀딩스', basePrice: 427000, volatility: 0.009 },
  { symbol: '055550.KS', name: '신한지주', basePrice: 51400, volatility: 0.007 },
  { symbol: '373220.KS', name: 'LG에너지솔루션', basePrice: 383500, volatility: 0.014 },
  { symbol: '068270.KS', name: '셀트리온', basePrice: 177400, volatility: 0.01 },
  { symbol: '028260.KS', name: '삼성물산', basePrice: 155900, volatility: 0.0075 },
];

export const OVERSEAS_HEATMAP = [
  { symbol: 'AAPL', name: 'Apple', basePrice: 193.64, volatility: 0.01 },
  { symbol: 'MSFT', name: 'Microsoft', basePrice: 428.91, volatility: 0.008 },
  { symbol: 'NVDA', name: 'NVIDIA', basePrice: 923.45, volatility: 0.015 },
  { symbol: 'AMZN', name: 'Amazon', basePrice: 182.72, volatility: 0.011 },
  { symbol: 'GOOGL', name: 'Alphabet', basePrice: 166.32, volatility: 0.009 },
  { symbol: 'TSLA', name: 'Tesla', basePrice: 199.44, volatility: 0.017 },
  { symbol: 'META', name: 'Meta', basePrice: 502.11, volatility: 0.012 },
  { symbol: 'AVGO', name: 'Broadcom', basePrice: 1302.47, volatility: 0.013 },
  { symbol: 'AMD', name: 'AMD', basePrice: 184.26, volatility: 0.016 },
  { symbol: 'NFLX', name: 'Netflix', basePrice: 621.19, volatility: 0.012 },
  { symbol: 'QCOM', name: 'Qualcomm', basePrice: 169.37, volatility: 0.011 },
  { symbol: 'INTC', name: 'Intel', basePrice: 41.73, volatility: 0.014 },
];

export const DOMESTIC_MOVERS_POOL = [...DOMESTIC_WATCHLIST, ...DOMESTIC_HEATMAP];
export const OVERSEAS_MOVERS_POOL = [...OVERSEAS_WATCHLIST, ...OVERSEAS_HEATMAP];
