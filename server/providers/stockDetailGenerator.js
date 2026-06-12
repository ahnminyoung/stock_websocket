import { THEME_STOCKS } from '../config/symbols.js';

function ihash(n) {
  let x = (n ^ 2747636419) >>> 0;
  x = Math.imul(x, 2654435769) >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 2246822519) >>> 0;
  x ^= x >>> 13;
  return x / 4294967296;
}

function symSeed(symbol) {
  return symbol.split('').reduce((acc, c, i) => (acc + c.charCodeAt(0) * (i + 7)) | 0, 1);
}

function rnd(seed, offset) {
  return ihash(seed + offset * 97);
}

function revTier(bp) {
  if (bp >= 400000) return [600e9, 2e12];
  if (bp >= 100000) return [150e9, 600e9];
  if (bp >= 50000)  return [60e9,  200e9];
  if (bp >= 20000)  return [20e9,  80e9];
  if (bp >= 10000)  return [8e9,   30e9];
  return [2e9, 12e9];
}

const NEWS_BY_THEME = {
  section1: [
    ['HBM4 공급 계약 체결…엔비디아 차세대 AI칩 탑재 확정', '수주', '한국경제'],
    ['1분기 영업이익 시장 전망치 30% 상회…D램 가격 반등 수혜', '실적', '매일경제'],
    ['2나노 공정 개발 투자 확대…2026년 양산 목표 설정', '기술', '조선비즈'],
    ['외국인 지분 역대 최고치…반도체 슈퍼사이클 재진입 기대', '수급', '이데일리'],
    ['차세대 반도체 SiC 모듈 신규 수주 1,200억 달성', '수주', '파이낸셜뉴스'],
    ['글로벌 AI 서버 수요 급증…연간 수주 목표 조기 달성 전망', '전략', '서울경제'],
    ['HBM3E 양산 수율 95% 돌파…경쟁사 대비 기술 우위 확보', '기술', '뉴시스'],
  ],
  section2: [
    ['현대차그룹 협동로봇 공급 MOU 체결…5년간 3,000억 규모', '수주', '한국경제'],
    ['협동로봇 시장 점유율 25% 돌파…1Q 매출 전년비 48% 급증', '실적', '매일경제'],
    ['AI 로봇 수요 폭발…수주잔고 사상 최초 1조원 돌파', '수주', '이데일리'],
    ['차세대 6축 산업용 로봇 신제품 출시…CES 2026 혁신상 수상', '기술', '조선비즈'],
    ['기관 순매수 6거래일 연속…로봇주 강세 지속 전망', '수급', '파이낸셜뉴스'],
    ['EU 제조업 자동화 정책 확대 수혜…유럽 수출 계약 추가 체결', '전략', '서울경제'],
    ['스마트 물류 로봇 양산 계약…대형 이커머스社 독점 납품 확정', '수주', '뉴시스'],
  ],
  section3: [
    ['누리호 후속 발사체 시스템 통합 계약 수주 확정', '수주', '한국경제'],
    ['국방부 위성 본체 납품 계약 체결…3,500억 규모', '수주', '매일경제'],
    ['1분기 방산·우주 수출 실적 호조…분기 최고 매출 갱신', '실적', '이데일리'],
    ['미국 스페이스X와 부품 공급 협력 MOU 체결 완료', '전략', '조선비즈'],
    ['한국형 GPS 위성 체계 구축 사업 주관 기업 선정', '수주', '파이낸셜뉴스'],
    ['저궤도 위성 통신망 구축 컨소시엄 참여 확정', '기술', '서울경제'],
    ['군 정찰위성 2호기 발사 성공…추가 수주 기대감 상승', '기술', '뉴시스'],
  ],
  section4: [
    ['초고압 변압기 미국 수출 신규 계약 2,800억 체결', '수주', '한국경제'],
    ['AI 데이터센터향 전력 기자재 수요 급증…분기 최대 수주 달성', '수주', '이데일리'],
    ['1분기 영업이익 전년비 65% 증가…전력기기 슈퍼사이클 효과', '실적', '매일경제'],
    ['MS·구글·아마존 DC 전력 인프라 수주전 입찰 참여', '전략', '조선비즈'],
    ['GIS 고압 차단기 신제품 출시…기존 대비 전력 효율 30% 개선', '기술', '파이낸셜뉴스'],
    ['외국인 보유 비중 역대 최고…전력주 랠리 지속 기대', '수급', '서울경제'],
    ['미국 IRA법 수혜로 北美 법인 설립…현지 수주 경쟁력 강화', '전략', '뉴시스'],
  ],
  section5: [
    ['AI DC향 800G 광트랜시버 대규모 양산 계약 체결', '수주', '한국경제'],
    ['1분기 매출 전년비 72% 급증…광통신 수요 폭발 수혜', '실적', '매일경제'],
    ['차세대 1.6T 광모듈 개발 성공…업계 최초 선점', '기술', '조선비즈'],
    ['빅테크 DC 망 확장으로 수주 잔고 사상 최대 기록', '수주', '이데일리'],
    ['미국 현지 법인 설립 완료…현지 수주 경쟁력 대폭 강화', '전략', '서울경제'],
    ['기관 매수세 집중…광통신 테마 대장주로 부상', '수급', '파이낸셜뉴스'],
    ['400G→800G 전환 사이클 도래…ASP 2배 상승 효과 기대', '전략', '뉴시스'],
  ],
  section6: [
    ['유럽 해상풍력 프로젝트 기자재 공급 계약 4,500억 체결', '수주', '한국경제'],
    ['미국 IRA 보조금 수혜 확정…태양광 모듈 가격 경쟁력 부각', '정책', '매일경제'],
    ['1분기 풍력·태양광 수주 합산 1조원 돌파', '실적', '이데일리'],
    ['글로벌 RE100 수요 대응…그린에너지 공급망 공격적 확대', '전략', '조선비즈'],
    ['대형 에너지저장장치(ESS) 납품 계약 신규 체결', '수주', '파이낸셜뉴스'],
    ['외국인 지분 증가세…신재생에너지 정책 기대감 반영', '수급', '서울경제'],
    ['탄소중립 목표 상향…2030년 재생에너지 비중 60% 확대', '정책', '뉴시스'],
  ],
  section7: [
    ['전고체 배터리 리튬 소재 독점 공급 계약 3년 연장 체결', '수주', '한국경제'],
    ['1분기 리튬 정제 생산량 전분기 대비 28% 증가', '실적', '매일경제'],
    ['글로벌 배터리 3사와 2028년까지 장기 공급 협약 갱신', '수주', '이데일리'],
    ['차세대 고니켈 양극재 개발 성공…에너지 밀도 15% 개선', '기술', '조선비즈'],
    ['칠레·아르헨티나 리튬 광산 지분 투자 확정…원가 경쟁력 확보', '전략', '파이낸셜뉴스'],
    ['기관 매수 지속…리튬 가격 회복세 속 수혜주 집중', '수급', '서울경제'],
    ['배터리 소재 수직계열화 완성…마진율 대폭 개선 전망', '전략', '뉴시스'],
  ],
  section8: [
    ['엔비디아 차세대 GB300 GPU 패키지 기판 공급 계약 체결', '수주', '한국경제'],
    ['유리기판 양산 라인 2호기 완공…월 생산 능력 3배 확대', '기술', '매일경제'],
    ['1분기 매출 전년비 115% 급증…유리기판 선점 효과 극대화', '실적', '이데일리'],
    ['인텔·TSMC와 차세대 패키징 기술 협력 MOU 체결', '전략', '조선비즈'],
    ['AI 반도체 패키징 수요 급증…수주 잔고 2조원 첫 돌파', '수주', '파이낸셜뉴스'],
    ['외국인 연속 순매수 12거래일…유리기판 대장주 부상', '수급', '서울경제'],
    ['일본 AGC와 기판 소재 공동 개발 협약…기술 경쟁력 강화', '기술', '뉴시스'],
  ],
  section9: [
    ['FDA 신약 허가 신청 완료…2026년 하반기 승인 기대', '공시', '한국경제'],
    ['글로벌 빅파마와 라이선스 아웃 계약…1조 2천억 규모 확정', '수주', '매일경제'],
    ['1분기 바이오시밀러 수출 전년비 38% 급증…유럽 시장 확대', '실적', '이데일리'],
    ['차세대 ADC 항암제 임상 2상 긍정적 결과 공개 발표', '기술', '조선비즈'],
    ['CMO 생산 라인 3호 증설 착공…글로벌 수주 역량 강화', '전략', '파이낸셜뉴스'],
    ['외국인 연속 매수…바이오 대형주 재평가 기대감 고조', '수급', '서울경제'],
    ['미국 법인 임상 파이프라인 3개 추가…기업가치 재산정 전망', '공시', '뉴시스'],
  ],
};

const QUARTERS = ['2025Q1', '2025Q2', '2025Q3', '2025Q4', '2026Q1E'];

export function generateStockDetail(code, currentPriceOverride) {
  const sym = code.includes('.') ? code : `${code}.KS`;
  const meta = THEME_STOCKS.find((s) => s.symbol === sym);
  if (!meta) return null;

  const seed = symSeed(meta.symbol);
  const bp = meta.basePrice;
  const currentPrice = currentPriceOverride ?? bp;

  const [revLow, revHigh] = revTier(bp);
  const qRevBase = revLow + rnd(seed, 1) * (revHigh - revLow);
  const opMarginBase = 0.04 + rnd(seed, 2) * 0.20;
  const netMarginBase = opMarginBase * (0.55 + rnd(seed, 3) * 0.30);

  const financials = QUARTERS.map((q, i) => {
    const seasonFactor = 0.8 + rnd(seed, 10 + i) * 0.45;
    const trendFactor = 1 + i * (0.02 + rnd(seed, 20) * 0.04);
    const rev = qRevBase * seasonFactor * trendFactor;
    const opMargin = opMarginBase * (0.7 + rnd(seed, 30 + i) * 0.5);
    const netMargin = netMarginBase * (0.7 + rnd(seed, 40 + i) * 0.5);
    return {
      quarter: q,
      revenue: Math.round(rev / 1e8) * 1e8,
      operatingProfit: Math.round(rev * opMargin / 1e8) * 1e8,
      netProfit: Math.round(rev * netMargin / 1e8) * 1e8,
      operatingMargin: Number((opMargin * 100).toFixed(1)),
    };
  });

  let shares;
  if (bp >= 400000) shares = 70e6;
  else if (bp >= 100000) shares = 200e6;
  else if (bp >= 50000)  shares = 500e6;
  else if (bp >= 20000)  shares = 1e9;
  else                   shares = 200e6;
  shares *= (0.6 + rnd(seed, 50) * 0.8);

  const marketCap = currentPrice * shares;
  const flowScale = marketCap * 0.002;

  const foreignFlow  = (rnd(seed, 60) - 0.5) * flowScale;
  const instFlow     = (rnd(seed, 61) - 0.5) * flowScale;
  const retailFlow   = -(foreignFlow + instFlow) * (0.85 + rnd(seed, 62) * 0.3);
  const foreignRatio = Number((18 + rnd(seed, 63) * 42).toFixed(1));

  const w52High = Math.round(bp * (1.15 + rnd(seed, 70) * 0.35));
  const w52Low  = Math.round(bp * (0.55 + rnd(seed, 71) * 0.30));

  const templates = NEWS_BY_THEME[meta.themeId] ?? NEWS_BY_THEME.section1;
  const indices = [...Array(templates.length).keys()].sort((a, b) => rnd(seed, 80 + a) - rnd(seed, 80 + b));
  const today = new Date(2026, 4, 21);
  const news = indices.slice(0, 6).map((idx, i) => {
    const [title, cat, source] = templates[idx];
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    return { title, category: cat, source, date: `${d.getMonth() + 1}/${d.getDate()}` };
  });

  return {
    symbol: meta.symbol,
    code: meta.symbol.split('.')[0],
    name: meta.name,
    currentPrice,
    financials,
    market: { marketCap, foreignFlow, instFlow, retailFlow, foreignRatio, w52High, w52Low },
    news,
  };
}
