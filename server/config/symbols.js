export const DOMESTIC_INDICES = [
  { symbol: 'KOSPI', name: '코스피', basePrice: 2748.41, volatility: 0.004 },
  { symbol: 'KOSDAQ', name: '코스닥', basePrice: 912.34, volatility: 0.005 },
];

export const DOMESTIC_NIGHT_FUTURES = [
  {
    symbol: 'KOSPI_NIGHT_FUT',
    name: '코스피200 야간선물',
    basePrice: 812.05,
    volatility: 0.006,
    naverCode: 'FUT',
    scale: 100,
  },
  {
    symbol: 'KOSDAQ_NIGHT_FUT',
    name: '코스닥 야간선물 (대체지표)',
    basePrice: 1116.18,
    volatility: 0.0065,
    naverCode: 'KOSDAQ',
    scale: 100,
    isProxy: true,
  },
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

// 테마별 종목 — themeId로 섹션 구분
export const THEME_STOCKS = [
  // 반도체 (고정: 삼성전자·하이닉스·제주반도체·한미반도체·이수페타시스·현대모비스·DB하이텍 + 관련주 2)
  { symbol: '005930.KS', name: '삼성전자',    basePrice:  83200, volatility: 0.009, themeId: 'section1' },
  { symbol: '000660.KS', name: 'SK하이닉스',  basePrice: 188500, volatility: 0.012, themeId: 'section1' },
  { symbol: '080220.KS', name: '제주반도체',  basePrice:  18000, volatility: 0.018, themeId: 'section1' },
  { symbol: '042700.KS', name: '한미반도체',  basePrice: 120000, volatility: 0.014, themeId: 'section1' },
  { symbol: '000990.KS', name: 'DB하이텍',   basePrice:  43000, volatility: 0.012, themeId: 'section1' },
  { symbol: '007660.KS', name: '이수페타시스', basePrice:  38000, volatility: 0.016, themeId: 'section1' },
  { symbol: '012330.KS', name: '현대모비스',  basePrice: 235000, volatility: 0.009, themeId: 'section1' },
  { symbol: '403870.KS', name: 'HPSP',       basePrice:  60000, volatility: 0.013, themeId: 'section1' },
  { symbol: '058470.KS', name: '리노공업',    basePrice: 195000, volatility: 0.011, themeId: 'section1' },
  // 로봇 (고정: 로보티즈·레인보우로보틱스·로보스타·현대오토에버·하이젠알엔엠 + 관련주 4)
  { symbol: '108490.KS', name: '로보티즈',        basePrice:  18000, volatility: 0.014, themeId: 'section2' },
  { symbol: '277810.KS', name: '레인보우로보틱스', basePrice: 130000, volatility: 0.016, themeId: 'section2' },
  { symbol: '090360.KS', name: '로보스타',        basePrice:  52000, volatility: 0.012, themeId: 'section2' },
  { symbol: '307950.KS', name: '현대오토에버',    basePrice: 195000, volatility: 0.01,  themeId: 'section2' },
  { symbol: '160190.KS', name: '하이젠알앤엠',    basePrice:  36000, volatility: 0.022, themeId: 'section2' },
  { symbol: '454910.KS', name: '두산로보틱스',    basePrice:  85000, volatility: 0.015, themeId: 'section2' },
  { symbol: '117730.KS', name: '티로보틱스',      basePrice:  12000, volatility: 0.02,  themeId: 'section2' },
  { symbol: '058610.KS', name: '에스피지',        basePrice:  18000, volatility: 0.013, themeId: 'section2' },
  { symbol: '056080.KS', name: '유진로봇',        basePrice:   5000, volatility: 0.02,  themeId: 'section2' },
  // 우주 (고정: 한국항공우주·컨텍·아스트 + 관련주 6)
  { symbol: '047810.KS', name: '한국항공우주',       basePrice:  68000, volatility: 0.011, themeId: 'section3' },
  { symbol: '451760.KS', name: '컨텍',               basePrice:  18000, volatility: 0.022, themeId: 'section3' },
  { symbol: '067390.KS', name: '아스트',             basePrice:   8000, volatility: 0.02,  themeId: 'section3' },
  { symbol: '012450.KS', name: '한화에어로스페이스',  basePrice: 218000, volatility: 0.012, themeId: 'section3' },
  { symbol: '079550.KS', name: 'LIG넥스원',          basePrice: 165000, volatility: 0.01,  themeId: 'section3' },
  { symbol: '099320.KS', name: '쎄트렉아이',          basePrice:  32000, volatility: 0.016, themeId: 'section3' },
  { symbol: '211270.KS', name: 'AP위성',             basePrice:  42000, volatility: 0.019, themeId: 'section3' },
  { symbol: '274090.KS', name: '켄코아에어로스페이스', basePrice:  35000, volatility: 0.018, themeId: 'section3' },
  { symbol: '189300.KS', name: '인텔리안테크',        basePrice:  18000, volatility: 0.017, themeId: 'section3' },
  // 데이터센터 전력
  { symbol: '010120.KS', name: 'LS ELECTRIC',  basePrice: 235000, volatility: 0.012, themeId: 'section4' },
  { symbol: '267260.KS', name: '현대일렉트릭', basePrice: 380000, volatility: 0.014, themeId: 'section4' },
  { symbol: '298040.KS', name: '효성중공업',   basePrice: 280000, volatility: 0.013, themeId: 'section4' },
  { symbol: '103590.KS', name: '일진전기',     basePrice:  38000, volatility: 0.016, themeId: 'section4' },
  { symbol: '000500.KS', name: '가온전선',     basePrice:  95000, volatility: 0.015, themeId: 'section4' },
  { symbol: '033100.KS', name: '제룡전기',     basePrice:  68000, volatility: 0.018, themeId: 'section4' },
  { symbol: '147830.KS', name: '제룡산업',     basePrice:  28000, volatility: 0.02,  themeId: 'section4' },
  { symbol: '001440.KS', name: '대한전선',     basePrice:  18000, volatility: 0.016, themeId: 'section4' },
  { symbol: '062040.KS', name: '산일전기',     basePrice:  58000, volatility: 0.02,  themeId: 'section4' },
  // 광통신 (고정: 대한광통신·RFHIC·오이솔루션 + 관련주 6)
  { symbol: '010170.KS', name: '대한광통신',   basePrice:  24000, volatility: 0.022, themeId: 'section5' },
  { symbol: '218410.KS', name: 'RFHIC',       basePrice:  28000, volatility: 0.02,  themeId: 'section5' },
  { symbol: '138080.KS', name: '오이솔루션',  basePrice:  35000, volatility: 0.02,  themeId: 'section5' },
  { symbol: '046970.KS', name: '우리로광통신', basePrice:   8000, volatility: 0.022, themeId: 'section5' },
  { symbol: '050890.KS', name: '쏠리드',      basePrice:  12000, volatility: 0.016, themeId: 'section5' },
  { symbol: '032500.KS', name: '케이엠더블유', basePrice:  18000, volatility: 0.018, themeId: 'section5' },
  { symbol: '368770.KS', name: '파이버프로',   basePrice:  20000, volatility: 0.02,  themeId: 'section5' },
  { symbol: '056360.KS', name: '코위버',       basePrice:   9000, volatility: 0.016, themeId: 'section5' },
  { symbol: '049080.KS', name: '기가레인',     basePrice:   5000, volatility: 0.025, themeId: 'section5' },
  // 신재생에너지 (고정: OCI홀딩스·HD현대에너지솔루션·LS머트리얼즈 + 관련주 6)
  { symbol: '010060.KS', name: 'OCI홀딩스',          basePrice:  68000, volatility: 0.014, themeId: 'section6' },
  { symbol: '329180.KS', name: 'HD현대에너지솔루션',  basePrice: 115000, volatility: 0.013, themeId: 'section6' },
  { symbol: '417200.KS', name: 'LS머트리얼즈',       basePrice:  24000, volatility: 0.016, themeId: 'section6' },
  { symbol: '112610.KS', name: '씨에스윈드',         basePrice:  58000, volatility: 0.013, themeId: 'section6' },
  { symbol: '009830.KS', name: '한화솔루션',         basePrice:  29000, volatility: 0.013, themeId: 'section6' },
  { symbol: '034020.KS', name: '두산에너빌리티',      basePrice:  22000, volatility: 0.013, themeId: 'section6' },
  { symbol: '044490.KS', name: '태웅',               basePrice:  18000, volatility: 0.015, themeId: 'section6' },
  { symbol: '018000.KS', name: '유니슨',             basePrice:   5000, volatility: 0.02,  themeId: 'section6' },
  { symbol: '100130.KS', name: '동국S&C',            basePrice:  38000, volatility: 0.014, themeId: 'section6' },
  // 리튬
  { symbol: '005490.KS', name: '포스코홀딩스', basePrice: 427000, volatility: 0.009, themeId: 'section7' },
  { symbol: '278280.KS', name: '천보',          basePrice:  88000, volatility: 0.015, themeId: 'section7' },
  { symbol: '025900.KS', name: '동화기업',      basePrice:  45000, volatility: 0.014, themeId: 'section7' },
  { symbol: '121600.KS', name: '나노신소재',    basePrice:  58000, volatility: 0.015, themeId: 'section7' },
  { symbol: '005070.KS', name: '코스모신소재',  basePrice:  35000, volatility: 0.016, themeId: 'section7' },
  { symbol: '066970.KS', name: '엘앤에프',      basePrice:  95000, volatility: 0.016, themeId: 'section7' },
  { symbol: '003670.KS', name: 'POSCO퓨처엠',  basePrice: 220000, volatility: 0.013, themeId: 'section7' },
  { symbol: '086520.KS', name: '에코프로',      basePrice:  82000, volatility: 0.018, themeId: 'section7' },
  { symbol: '247540.KS', name: '에코프로비엠',  basePrice: 128000, volatility: 0.017, themeId: 'section7' },
  // 유리기판
  { symbol: '011790.KS', name: 'SKC',        basePrice:  50000, volatility: 0.016, themeId: 'section8' },
  { symbol: '120110.KS', name: '코오롱인더',  basePrice:  28000, volatility: 0.013, themeId: 'section8' },
  { symbol: '009150.KS', name: '삼성전기',   basePrice: 158000, volatility: 0.011, themeId: 'section8' },
  { symbol: '008060.KS', name: '대덕전자',   basePrice:  22000, volatility: 0.014, themeId: 'section8' },
  { symbol: '222800.KS', name: '심텍',       basePrice:  18000, volatility: 0.015, themeId: 'section8' },
  { symbol: '007810.KS', name: '코리아써키트', basePrice:  8000, volatility: 0.018, themeId: 'section8' },
  { symbol: '036010.KS', name: '아비코전자',  basePrice:  12000, volatility: 0.018, themeId: 'section8' },
  { symbol: '195870.KS', name: '해성디에스',  basePrice:  18000, volatility: 0.02,  themeId: 'section8' },
  { symbol: '131970.KS', name: '두산테스나',  basePrice: 170000, volatility: 0.022, themeId: 'section8' },
  // 바이오
  { symbol: '196170.KS', name: '알테오젠',        basePrice: 280000, volatility: 0.016, themeId: 'section9' },
  { symbol: '000100.KS', name: '유한양행',        basePrice:  95000, volatility: 0.011, themeId: 'section9' },
  { symbol: '207940.KS', name: '삼성바이오로직스', basePrice: 867000, volatility: 0.008, themeId: 'section9' },
  { symbol: '185750.KS', name: '종근당',          basePrice: 105000, volatility: 0.011, themeId: 'section9' },
  { symbol: '003850.KS', name: '보령',            basePrice:  18000, volatility: 0.013, themeId: 'section9' },
  { symbol: '069620.KS', name: '대웅제약',        basePrice: 115000, volatility: 0.012, themeId: 'section9' },
  { symbol: '068270.KS', name: '셀트리온',        basePrice: 177400, volatility: 0.01,  themeId: 'section9' },
  { symbol: '128940.KS', name: '한미약품',        basePrice: 310000, volatility: 0.013, themeId: 'section9' },
  { symbol: '006280.KS', name: '녹십자',          basePrice:  85000, volatility: 0.011, themeId: 'section9' },
];
