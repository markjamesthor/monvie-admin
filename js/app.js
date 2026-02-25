/**
 * 몽비스토리 관리자 대시보드 v0.2
 * vc 사업계획서 기반 — 실제 파이프라인, 유닛 이코노믹스, KPI 반영
 */

// ========== Auth ==========

const AUTH = {
  SESSION_KEY: 'monvie_admin_session',
  DURATION_MS: 7 * 24 * 60 * 60 * 1000, // 7일
  CREDENTIALS: { id: 'admin', pw: 'james' },

  check() {
    const raw = localStorage.getItem(this.SESSION_KEY);
    if (!raw) return false;
    try {
      const session = JSON.parse(raw);
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(this.SESSION_KEY);
        return false;
      }
      return true;
    } catch { return false; }
  },

  login(id, pw) {
    if (id === this.CREDENTIALS.id && pw === this.CREDENTIALS.pw) {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify({
        user: id,
        loginAt: Date.now(),
        expiresAt: Date.now() + this.DURATION_MS,
      }));
      return true;
    }
    return false;
  },

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    showLogin();
  },
};

function showLogin() {
  document.getElementById('login-screen').style.display = '';
  document.getElementById('app-screen').style.display = 'none';
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = '';
}

// ========== Constants (사업계획서 기반) ==========

const UNIT_ECONOMICS = {
  sellingPrice: 50000,
  printCost: 20000,
  shippingCost: 3000,
  paymentFee: 1500,
  packaging: 1000,
  gpuCost: 500,
  get variableCost() { return this.printCost + this.shippingCost + this.paymentFee + this.packaging + this.gpuCost; },
  get profitPerUnit() { return this.sellingPrice - this.variableCost; },
  get margin() { return ((this.profitPerUnit / this.sellingPrice) * 100).toFixed(1); },
};

const PHASES = {
  0: { label: 'Phase 0', desc: '1인 운영', fixedCost: 6500000, bep: 225 },
  1: { label: 'Phase 1', desc: '2인 운영', fixedCost: 14500000, bep: 503 },
  2: { label: 'Phase 2', desc: '5인 운영', fixedCost: 45000000, bep: 1800 },
};

const CURRENT_PHASE = 2;

const ORDER_STATUSES = [
  { key: 'making', label: '제작중', badge: 'badge-sky' },
  { key: 'made', label: '제작완료', badge: 'badge-indigo' },
  { key: 'paid', label: '결제완료', badge: 'badge-violet' },
  { key: 'generating_print', label: '인쇄파일생성', badge: 'badge-purple' },
  { key: 'print_requested', label: '인쇄요청', badge: 'badge-amber' },
  { key: 'printing', label: '인쇄중', badge: 'badge-orange' },
  { key: 'shipped', label: '배송중', badge: 'badge-teal' },
  { key: 'delivered', label: '배송완료', badge: 'badge-green' },
];

const THEMES = [
  { code: 'NAME', label: '노미네 왕국', emoji: '' },
  { code: 'BDAY', label: '생일 동화', emoji: '' },
  { code: 'CAT', label: '고양이 모험', emoji: '' },
  { code: 'ABC', label: 'ABC 영어', emoji: '' },
  { code: 'RYAN', label: '라이언 이야기', emoji: '' },
];

const BGQA_CHECKS = [
  '얼굴 검증', '마스크 무결성', '홀 감지', '색상 이상',
  '할로 감지', '전경 일관성', '아이템 검증', '잔여 객체',
];

// ========== Mock Data ==========

// 플로우: 제작중(무료) → 제작완료 → 결제완료 → 인쇄파일생성 → 인쇄요청 → 인쇄중 → 배송중 → 배송완료
// 일평균 ~1,200명 제작 시도, ~400명 결제 (전환율 ~33%)
const MOCK_ORDERS = [
  // 오늘 (2/26) — 제작 중 (무료 체험)
  { id: 'BK-20260226-387', buyer: '김서연', child: '서연', age: 4, theme: 'NAME', version: 'A', status: 'making', createdAt: '2026-02-26 10:32', phone: '010-1234-5678' },
  { id: 'BK-20260226-386', buyer: '이민준', child: '민준', age: 7, theme: 'NAME', version: 'B', status: 'making', createdAt: '2026-02-26 10:15', phone: '010-2345-6789' },
  { id: 'BK-20260226-385', buyer: '나윤서', child: '윤서', age: 5, theme: 'BDAY', version: 'A', status: 'making', createdAt: '2026-02-26 09:58', phone: '010-1122-3344' },
  { id: 'BK-20260226-384', buyer: '고은채', child: '은채', age: 3, theme: 'NAME', version: 'A', status: 'making', createdAt: '2026-02-26 09:42', phone: '010-2233-4455' },
  { id: 'BK-20260226-383', buyer: '박하은', child: '하은', age: 3, theme: 'NAME', version: 'A', status: 'making', createdAt: '2026-02-26 09:10', phone: '010-3456-7890' },
  { id: 'BK-20260226-382', buyer: '최도현', child: '도현', age: 5, theme: 'CAT', version: 'A', status: 'making', createdAt: '2026-02-26 08:45', phone: '010-4567-8901' },
  { id: 'BK-20260226-381', buyer: '장서아', child: '서아', age: 4, theme: 'NAME', version: 'A', status: 'making', createdAt: '2026-02-26 08:20', phone: '010-3344-5566' },
  // 제작 완료 (결제 대기)
  { id: 'BK-20260226-380', buyer: '신하율', child: '하율', age: 6, theme: 'ABC', version: 'B', status: 'made', createdAt: '2026-02-26 07:55', phone: '010-4455-6677' },
  { id: 'BK-20260226-379', buyer: '류다인', child: '다인', age: 4, theme: 'NAME', version: 'A', status: 'made', createdAt: '2026-02-26 07:30', phone: '010-5566-7788' },
  { id: 'BK-20260225-412', buyer: '정지우', child: '지우', age: 6, theme: 'NAME', version: 'B', status: 'made', createdAt: '2026-02-25 18:20', phone: '010-5678-9012' },
  { id: 'BK-20260225-411', buyer: '강예린', child: '예린', age: 4, theme: 'NAME', version: 'A', status: 'made', createdAt: '2026-02-25 17:45', phone: '010-6789-0123' },
  { id: 'BK-20260225-410', buyer: '윤시우', child: '시우', age: 8, theme: 'CAT', version: 'B', status: 'made', createdAt: '2026-02-25 16:10', phone: '010-7890-1234' },
  // 결제 완료
  { id: 'BK-20260225-409', buyer: '조하윤', child: '하윤', age: 3, theme: 'NAME', version: 'A', status: 'paid', createdAt: '2026-02-25 15:30', phone: '010-8901-2345' },
  { id: 'BK-20260225-408', buyer: '한수아', child: '수아', age: 5, theme: 'BDAY', version: 'A', status: 'paid', createdAt: '2026-02-25 14:20', phone: '010-9012-3456' },
  { id: 'BK-20260225-407', buyer: '문소이', child: '소이', age: 4, theme: 'NAME', version: 'A', status: 'paid', createdAt: '2026-02-25 13:50', phone: '010-7788-9900' },
  { id: 'BK-20260224-398', buyer: '오준서', child: '준서', age: 6, theme: 'ABC', version: 'B', status: 'paid', createdAt: '2026-02-24 17:00', phone: '010-0123-4567' },
  // 인쇄 파일 생성 & 요청
  { id: 'BK-20260224-397', buyer: '서유준', child: '유준', age: 4, theme: 'NAME', version: 'A', status: 'generating_print', createdAt: '2026-02-24 16:30', phone: '010-1111-2222' },
  { id: 'BK-20260224-396', buyer: '임다은', child: '다은', age: 7, theme: 'RYAN', version: 'B', status: 'generating_print', createdAt: '2026-02-24 15:00', phone: '010-2222-3333' },
  { id: 'BK-20260224-395', buyer: '송지호', child: '지호', age: 5, theme: 'NAME', version: 'A', status: 'print_requested', createdAt: '2026-02-24 14:00', phone: '010-3333-4444' },
  { id: 'BK-20260223-405', buyer: '홍길동', child: '태양', age: 4, theme: 'NAME', version: 'A', status: 'print_requested', createdAt: '2026-02-23 16:00', phone: '010-4444-5555' },
  { id: 'BK-20260223-404', buyer: '노지안', child: '지안', age: 3, theme: 'BDAY', version: 'A', status: 'print_requested', createdAt: '2026-02-23 14:30', phone: '010-5555-6666' },
  // 인쇄중
  { id: 'BK-20260223-402', buyer: '유서윤', child: '서윤', age: 5, theme: 'CAT', version: 'A', status: 'printing', createdAt: '2026-02-23 09:30', phone: '010-6666-7777' },
  { id: 'BK-20260223-401', buyer: '피수현', child: '수현', age: 7, theme: 'NAME', version: 'B', status: 'printing', createdAt: '2026-02-23 08:20', phone: '010-0011-2233' },
  // 배송중
  { id: 'BK-20260222-415', buyer: '배이준', child: '이준', age: 8, theme: 'NAME', version: 'B', status: 'shipped', createdAt: '2026-02-22 10:15', phone: '010-7777-8888', trackingNo: '6082012345678', carrier: 'CJ대한통운' },
  { id: 'BK-20260222-414', buyer: '성하린', child: '하린', age: 4, theme: 'CAT', version: 'A', status: 'shipped', createdAt: '2026-02-22 09:30', phone: '010-8888-9999', trackingNo: '6082098765432', carrier: 'CJ대한통운' },
  { id: 'BK-20260222-413', buyer: '장시온', child: '시온', age: 6, theme: 'NAME', version: 'B', status: 'shipped', createdAt: '2026-02-22 08:00', phone: '010-9999-0000', trackingNo: '4088812345678', carrier: '한진택배' },
  { id: 'BK-20260221-420', buyer: '곽지율', child: '지율', age: 5, theme: 'NAME', version: 'A', status: 'shipped', createdAt: '2026-02-21 17:00', phone: '010-2233-4455', trackingNo: '6082011111111', carrier: 'CJ대한통운' },
  { id: 'BK-20260221-419', buyer: '추연우', child: '연우', age: 3, theme: 'BDAY', version: 'A', status: 'shipped', createdAt: '2026-02-21 15:20', phone: '010-3344-5566', trackingNo: '4088822222222', carrier: '한진택배' },
  // 배송 완료
  { id: 'BK-20260220-390', buyer: '권예서', child: '예서', age: 5, theme: 'NAME', version: 'A', status: 'delivered', createdAt: '2026-02-20 09:00', phone: '010-1010-2020', trackingNo: '6082055555555', carrier: 'CJ대한통운' },
  { id: 'BK-20260219-385', buyer: '문지민', child: '지민', age: 7, theme: 'ABC', version: 'B', status: 'delivered', createdAt: '2026-02-19 14:00', phone: '010-2020-3030', trackingNo: '6082066666666', carrier: 'CJ대한통운' },
  { id: 'BK-20260218-372', buyer: '양수빈', child: '수빈', age: 4, theme: 'NAME', version: 'A', status: 'delivered', createdAt: '2026-02-18 11:30', phone: '010-3030-4040', trackingNo: '4088899999999', carrier: '한진택배' },
  { id: 'BK-20260217-368', buyer: '황은우', child: '은우', age: 3, theme: 'BDAY', version: 'A', status: 'delivered', createdAt: '2026-02-17 10:00', phone: '010-4040-5050', trackingNo: '6082077777777', carrier: 'CJ대한통운' },
  { id: 'BK-20260216-355', buyer: '안하준', child: '하준', age: 6, theme: 'NAME', version: 'B', status: 'delivered', createdAt: '2026-02-16 15:00', phone: '010-5050-6060', trackingNo: '6082088888888', carrier: 'CJ대한통운' },
  { id: 'BK-20260215-342', buyer: '진소윤', child: '소윤', age: 4, theme: 'RYAN', version: 'A', status: 'delivered', createdAt: '2026-02-15 13:00', phone: '010-6060-7070', trackingNo: '6082033333333', carrier: 'CJ대한통운' },
  { id: 'BK-20260214-330', buyer: '봉도윤', child: '도윤', age: 5, theme: 'NAME', version: 'A', status: 'delivered', createdAt: '2026-02-14 09:30', phone: '010-7070-8080', trackingNo: '4088844444444', carrier: '한진택배' },
  { id: 'BK-20260213-318', buyer: '엄시아', child: '시아', age: 3, theme: 'NAME', version: 'A', status: 'delivered', createdAt: '2026-02-13 11:00', phone: '010-8080-9090', trackingNo: '6082044444444', carrier: 'CJ대한통운' },
];

// 5개 파이프라인 병렬 실행 → 사용자가 최종 선택
// Pipeline 1: crop-ben2 (Crop + BEN2)
// Pipeline 2: crop-removebg (Crop + remove.bg API)
// Pipeline 3: sam2-birefnet (SAM2 + BiRefNet-HR matting)
// Pipeline 4: sam2-vitmatte (SAM2 + ViTMatte)
// Pipeline 5: crop-portrait (Crop + Portrait)
const MOCK_AI_LOG = [
  { id: 'BK-20260226-380', child: '하율', pipeline: 'sam2-birefnet', time: 2.1, bgqaScore: 95, autoApproved: true, ts: '07:56' },
  { id: 'BK-20260226-379', child: '다인', pipeline: 'crop-ben2', time: 1.4, bgqaScore: 92, autoApproved: true, ts: '07:31' },
  { id: 'BK-20260226-378', child: '소율', pipeline: 'sam2-birefnet', time: 2.3, bgqaScore: 88, autoApproved: true, ts: '07:13' },
  { id: 'BK-20260225-412', child: '지우', pipeline: 'sam2-vitmatte', time: 2.5, bgqaScore: 87, autoApproved: true, ts: '18:21' },
  { id: 'BK-20260225-411', child: '예린', pipeline: 'crop-ben2', time: 1.3, bgqaScore: 84, autoApproved: true, ts: '17:46' },
  { id: 'BK-20260225-410', child: '시우', pipeline: 'sam2-birefnet', time: 2.0, bgqaScore: 93, autoApproved: true, ts: '16:11' },
  { id: 'BK-20260225-409', child: '하윤', pipeline: 'crop-ben2', time: 1.2, bgqaScore: 97, autoApproved: true, ts: '15:31' },
  { id: 'BK-20260225-408', child: '수아', pipeline: 'sam2-birefnet', time: 2.2, bgqaScore: 91, autoApproved: true, ts: '14:21' },
  { id: 'BK-20260225-407', child: '소이', pipeline: 'crop-portrait', time: 1.0, bgqaScore: 94, autoApproved: true, ts: '13:51' },
  { id: 'BK-20260224-398', child: '준서', pipeline: 'sam2-birefnet', time: 2.4, bgqaScore: 96, autoApproved: true, ts: '17:01' },
  { id: 'BK-20260224-397', child: '유준', pipeline: 'crop-ben2', time: 1.1, bgqaScore: 98, autoApproved: true, ts: '16:31' },
  { id: 'BK-20260224-396', child: '다은', pipeline: 'sam2-vitmatte', time: 2.6, bgqaScore: 89, autoApproved: true, ts: '15:01' },
  { id: 'BK-20260224-395', child: '지호', pipeline: 'crop-removebg', time: 0.8, bgqaScore: 93, autoApproved: true, ts: '14:01' },
  { id: 'BK-20260224-394', child: '예나', pipeline: 'crop-portrait', time: 1.0, bgqaScore: 90, autoApproved: true, ts: '13:21' },
  { id: 'BK-20260224-393', child: '태양', pipeline: 'sam2-birefnet', time: 2.1, bgqaScore: 85, autoApproved: true, ts: '12:40' },
];

const MOCK_EXCEPTIONS = [
  { id: 'BK-20260226-378', type: 'ai_quality', message: 'BGQA 점수 미달 (68점) — 복잡한 배경, 모발 경계 부정확', time: '07:13', severity: 'warning', resolved: false },
  { id: 'BK-20260225-412', type: 'ai_quality', message: 'BGQA 점수 미달 (64점) — 얼굴 일부 가림, 사진 재업로드 요청', time: '어제 18:21', severity: 'warning', resolved: false },
  { id: 'BK-20260225-411', type: 'ai_quality', message: 'BGQA 점수 미달 (71점) — 아이템(인형) 일부 잘림', time: '어제 17:46', severity: 'warning', resolved: false },
  { id: 'BK-20260226-381', type: 'studio_inactive', message: '사진 미업로드 (주문 후 24시간 경과, 알림톡 1차 재발송 완료)', time: '08:20', severity: 'info', resolved: false },
  { id: 'BK-20260225-350', type: 'studio_inactive', message: '사진 미업로드 (주문 후 48시간 경과, 알림톡 2차 재발송)', time: '어제 09:00', severity: 'info', resolved: false },
  { id: 'BK-20260225-390', type: 'ai_failure', message: '배경 제거 실패 — GPU 메모리 부족 (동시 처리 과부하)', time: '어제 13:22', severity: 'error', resolved: true },
  { id: 'BK-20260224-380', type: 'print_fail', message: '북토리 FTP 전송 실패 — 네트워크 타임아웃 (재시도 성공)', time: '02-24 18:40', severity: 'error', resolved: true },
  { id: 'BK-20260223-350', type: 'ai_quality', message: 'BGQA 홀 감지 — 배경 제거 후 팔 영역 누락', time: '02-23 11:15', severity: 'warning', resolved: true },
  { id: 'BK-20260222-320', type: 'delivery_delay', message: 'SLA 위반 (D+5) — CJ대한통운 제주 지역 배송 지연', time: '02-22 09:00', severity: 'warning', resolved: true },
  { id: 'BK-20260221-290', type: 'print_fail', message: '인쇄 불량 — 표지 색상 편차 (재인쇄 요청 완료)', time: '02-21 15:30', severity: 'error', resolved: true },
];

// MoM 성장률: 35% → 28% → 32% → 22% → 25% (평균 ~28%)
const MOCK_MONTHLY_REVENUE = [
  { month: '9월', units: 3200, revenue: 160000000, makers: 9600 },
  { month: '10월', units: 4320, revenue: 216000000, makers: 13000 },
  { month: '11월', units: 5530, revenue: 276500000, makers: 16900 },
  { month: '12월', units: 7300, revenue: 365000000, makers: 21500 },
  { month: '1월', units: 8900, revenue: 445000000, makers: 26700 },
  { month: '2월', units: 10400, revenue: 520000000, makers: 31200 },
];

// 제작→결제 전환 퍼널 (일 평균 기준)
const MOCK_DAILY_FUNNEL = {
  today: { started: 412, completed: 276, paid: 138 },
  yesterday: { started: 1180, completed: 790, paid: 395 },
  avg7d: { started: 1200, completed: 810, paid: 400 },
  conversionRate: 33.3,
};

// ========== Utility Functions ==========

function fmt(n) {
  return new Intl.NumberFormat('ko-KR').format(n);
}

function fmtWon(n) {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '억';
  if (n >= 10000) return (n / 10000).toFixed(0) + '만';
  return fmt(n);
}

function getStatusInfo(key) {
  return ORDER_STATUSES.find(s => s.key === key) || { label: key, badge: 'badge-gray' };
}

function getThemeInfo(code) {
  return THEMES.find(t => t.code === code) || { code, label: code, emoji: '' };
}

function countByStatus(status) {
  return MOCK_ORDERS.filter(o => o.status === status).length;
}

function donut(pct, color = '#6c5ce7', size = 80, stroke = 8) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return `
    <div class="donut" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#f3f4f6" stroke-width="${stroke}"/>
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
          stroke-dasharray="${c}" stroke-dashoffset="${offset}" stroke-linecap="round"/>
      </svg>
      <div class="donut-label">${pct}%</div>
    </div>`;
}

function progressBar(pct, color = 'bg-primary') {
  const capped = Math.min(pct, 100);
  return `
    <div class="progress-bar">
      <div class="progress-fill ${color}" style="width:${capped}%"></div>
    </div>`;
}

function card(title, content, className = '') {
  return `<div class="bg-white rounded-xl border border-gray-100 p-5 ${className}">${title ? `<h2 class="text-sm font-semibold text-gray-700 mb-4">${title}</h2>` : ''}${content}</div>`;
}

// ========== Real-time Simulation ==========

// 이번 달 목표: 10,400권 판매, ~31,200명 제작 시도 (전환율 33.3%)
// 일평균: ~400권 결제, ~1,200명 제작시도
// 시간대별 가중치 (0시~23시) — 오전 10시~오후 10시 피크
const HOURLY_WEIGHT = [0.5,0.3,0.2,0.1,0.1,0.2,0.5,1.5,3,5,6.5,7,7,6.5,6,6.5,7,7.5,7,6,5,4,2.5,1];
const TOTAL_WEIGHT = HOURLY_WEIGHT.reduce((s,w) => s+w, 0);

const SIM = {
  dailyMakers: 1200,
  dailyCompleted: 810,
  dailyPaid: 400,
  // 파이프라인 단계별 평균 체류 수 (동시 존재하는 건수)
  avgInPipeline: {
    making: 45,
    made: 18,
    paid: 12,
    generating_print: 6,
    print_requested: 8,
    printing: 10,
    shipped: 25,
    delivered: 280,
  },
};

function getSimulatedCounts() {
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  const sec = now.getSeconds();

  // 오늘 이 시간까지 누적된 가중치 비율
  let cumWeight = 0;
  for (let h = 0; h < hour; h++) cumWeight += HOURLY_WEIGHT[h];
  cumWeight += HOURLY_WEIGHT[hour] * ((min * 60 + sec) / 3600);
  const dayProgress = cumWeight / TOTAL_WEIGHT;

  // 오늘 누적 수
  const todayStarted = Math.round(SIM.dailyMakers * dayProgress);
  const todayCompleted = Math.round(SIM.dailyCompleted * dayProgress);
  const todayPaid = Math.round(SIM.dailyPaid * dayProgress);

  // 파이프라인별 현재 건수 (기본값 + 약간의 랜덤 변동)
  const pipeline = {};
  for (const [key, avg] of Object.entries(SIM.avgInPipeline)) {
    const jitter = Math.round((Math.random() - 0.5) * avg * 0.1);
    pipeline[key] = Math.max(0, avg + jitter);
  }

  return { todayStarted, todayCompleted, todayPaid, pipeline, dayProgress };
}

// ========== State ==========

let currentPage = 'dashboard';
let orderFilter = 'all';
let simInterval = null;

// ========== Page Renderers ==========

function renderDashboard() {
  const sim = getSimulatedCounts();
  const thisMonthUnits = MOCK_MONTHLY_REVENUE[5].units;
  const thisMonthRevenue = MOCK_MONTHLY_REVENUE[5].revenue;
  const thisMonthMakers = MOCK_MONTHLY_REVENUE[5].makers;
  const convRate = MOCK_DAILY_FUNNEL.conversionRate;
  const phase = PHASES[CURRENT_PHASE];
  const bepPct = Math.round((thisMonthUnits / phase.bep) * 100);
  const activeExceptions = MOCK_EXCEPTIONS.filter(e => !e.resolved).length;

  // KPI Cards
  const kpis = `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="stat-card bg-white rounded-xl p-5 border border-gray-100">
        <div class="text-xs text-gray-400 mb-1">오늘 제작 시도</div>
        <div class="text-2xl font-extrabold text-gray-800" id="kpi-today-makers">${fmt(sim.todayStarted)}</div>
        <div class="text-xs text-gray-400 mt-1">결제 <span id="kpi-today-paid">${fmt(sim.todayPaid)}</span>건 · 일평균 ${fmt(SIM.dailyMakers)}</div>
      </div>
      <div class="stat-card bg-white rounded-xl p-5 border border-gray-100">
        <div class="text-xs text-gray-400 mb-1">제작→결제 전환율</div>
        <div class="text-2xl font-extrabold text-primary">${convRate}%</div>
        <div class="text-xs text-gray-400 mt-1">${fmt(thisMonthMakers)}명 제작 → ${fmt(thisMonthUnits)}명 결제</div>
      </div>
      <div class="stat-card bg-white rounded-xl p-5 border border-gray-100">
        <div class="text-xs text-gray-400 mb-1">이번 달 매출</div>
        <div class="text-2xl font-extrabold text-gray-800">${fmtWon(thisMonthRevenue)}원</div>
        <div class="text-xs text-gray-400 mt-1">${fmt(thisMonthUnits)}권 판매</div>
      </div>
      <div class="stat-card bg-white rounded-xl p-5 border border-gray-100">
        <div class="text-xs text-gray-400 mb-1">미처리 예외</div>
        <div class="text-2xl font-extrabold ${activeExceptions > 0 ? 'text-orange-500' : 'text-green-600'}">${activeExceptions}</div>
        <div class="text-xs text-gray-400 mt-1">총 ${MOCK_EXCEPTIONS.length}건 중</div>
      </div>
    </div>`;

  // BEP + Phase
  const bepSection = `
    <div class="bg-white rounded-xl border border-gray-100 p-5 mb-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-gray-700">BEP 달성 현황</h2>
        <div class="flex items-center gap-2">
          <span class="badge badge-violet">${phase.label}</span>
          <span class="text-xs text-gray-400">${phase.desc} · 월 고정비 ${fmtWon(phase.fixedCost)}원</span>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex-1">
          ${progressBar(bepPct, bepPct >= 100 ? 'bg-green-500' : 'bg-primary')}
        </div>
        <div class="text-sm font-bold ${bepPct >= 100 ? 'text-green-600' : 'text-gray-600'} whitespace-nowrap">
          ${thisMonthUnits} / ${phase.bep}권 (${bepPct}%)
        </div>
      </div>
      <div class="text-xs text-gray-400 mt-2">단위 수익 ${fmt(UNIT_ECONOMICS.profitPerUnit)}원 (마진 ${UNIT_ECONOMICS.margin}%) · 손익분기 ${phase.bep}권/월</div>
    </div>`;

  // Conversion Funnel (오늘 실시간)
  const completionRate = sim.todayStarted > 0 ? ((sim.todayCompleted / sim.todayStarted) * 100).toFixed(1) : '0.0';
  const payRate = sim.todayCompleted > 0 ? ((sim.todayPaid / sim.todayCompleted) * 100).toFixed(1) : '0.0';
  const overallRate = sim.todayStarted > 0 ? ((sim.todayPaid / sim.todayStarted) * 100).toFixed(1) : '0.0';
  const funnelSection = `
    <div class="bg-white rounded-xl border border-gray-100 p-5 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold text-gray-700">제작→결제 전환 퍼널</h2>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          <span class="text-xs text-gray-400">오늘 실시간</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex-1 text-center">
          <div class="bg-sky-50 rounded-lg py-4 px-3 border border-sky-100">
            <div class="text-2xl font-extrabold text-sky-700" id="funnel-started">${fmt(sim.todayStarted)}</div>
            <div class="text-xs text-sky-600 mt-1 font-medium">제작 시도</div>
          </div>
        </div>
        <div class="flex flex-col items-center text-gray-400 flex-shrink-0">
          <div class="text-xs font-semibold text-sky-500 mb-0.5" id="funnel-rate-1">${completionRate}%</div>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
        </div>
        <div class="flex-1 text-center">
          <div class="bg-indigo-50 rounded-lg py-4 px-3 border border-indigo-100">
            <div class="text-2xl font-extrabold text-indigo-700" id="funnel-completed">${fmt(sim.todayCompleted)}</div>
            <div class="text-xs text-indigo-600 mt-1 font-medium">제작 완료</div>
          </div>
        </div>
        <div class="flex flex-col items-center text-gray-400 flex-shrink-0">
          <div class="text-xs font-semibold text-indigo-500 mb-0.5" id="funnel-rate-2">${payRate}%</div>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
        </div>
        <div class="flex-1 text-center">
          <div class="bg-primary/5 rounded-lg py-4 px-3 border border-primary/20">
            <div class="text-2xl font-extrabold text-primary" id="funnel-paid">${fmt(sim.todayPaid)}</div>
            <div class="text-xs text-primary mt-1 font-medium">결제 완료</div>
          </div>
        </div>
      </div>
      <div class="mt-3 text-center">
        <span class="text-xs text-gray-400">전체 전환율</span>
        <span class="text-sm font-bold text-primary ml-1" id="funnel-overall">${overallRate}%</span>
        <span class="text-xs text-gray-400 ml-3">일평균: ${fmt(SIM.dailyMakers)}명 → ${fmt(SIM.dailyPaid)}명 (${MOCK_DAILY_FUNNEL.conversionRate}%)</span>
      </div>
    </div>`;

  // Pipeline (실시간 시뮬레이션)
  const pipelineCounts = ORDER_STATUSES.map(s => ({ ...s, count: sim.pipeline[s.key] || 0 }));
  const pipelineHtml = pipelineCounts.map((s, i) => {
    const arrow = i < pipelineCounts.length - 1
      ? '<div class="text-gray-300 flex-shrink-0 text-xs">&rarr;</div>' : '';
    return `
      <div class="pipeline-step ${s.badge.replace('badge-', 'bg-').replace('bg-bg-', 'bg-')} bg-opacity-30 rounded-lg px-2.5 py-2 text-center min-w-[72px] flex-shrink-0 cursor-default border border-transparent hover:border-gray-200">
        <div class="text-lg font-bold" id="pipe-${s.key}">${s.count}</div>
        <div class="text-[10px] whitespace-nowrap">${s.label}</div>
      </div>${arrow}`;
  }).join('');

  const pipeline = card('주문 파이프라인', `
    <div class="flex items-center gap-1.5 overflow-x-auto pb-2">${pipelineHtml}</div>
  `, 'mb-6');

  // Two columns: Revenue chart + Recent exceptions
  const maxRev = Math.max(...MOCK_MONTHLY_REVENUE.map(m => m.revenue));
  const barChart = MOCK_MONTHLY_REVENUE.map(m => {
    const h = Math.round((m.revenue / maxRev) * 100);
    const grossProfit = m.units * UNIT_ECONOMICS.profitPerUnit;
    const gh = Math.round((grossProfit / maxRev) * 100);
    return `
      <div class="flex flex-col items-center gap-1 flex-1">
        <div class="flex gap-0.5 w-full">
          <div class="flex-1 text-[9px] text-primary font-semibold text-center truncate">${fmtWon(m.revenue)}</div>
          <div class="flex-1 text-[9px] text-emerald-600 font-semibold text-center truncate">${fmtWon(grossProfit)}</div>
        </div>
        <div class="w-full relative flex gap-0.5" style="height:120px">
          <div class="flex-1 bg-gray-100 rounded-t relative">
            <div class="bar-chart-bar absolute bottom-0 w-full bg-primary rounded-t opacity-80" style="height:${h}%"></div>
          </div>
          <div class="flex-1 bg-gray-100 rounded-t relative">
            <div class="bar-chart-bar absolute bottom-0 w-full bg-emerald-400 rounded-t opacity-80" style="height:${gh}%"></div>
          </div>
        </div>
        <div class="text-[10px] text-gray-500 font-medium">${m.month}</div>
      </div>`;
  }).join('');

  const chartLegend = `
    <div class="flex items-center gap-4 mb-3">
      <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-sm bg-primary opacity-80"></div><span class="text-[10px] text-gray-500">매출</span></div>
      <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-sm bg-emerald-400 opacity-80"></div><span class="text-[10px] text-gray-500">매출총이익</span></div>
    </div>`;

  const revenueChart = card('월별 매출 추이', chartLegend + `<div class="flex items-end gap-2">${barChart}</div>`);

  const exceptionList = MOCK_EXCEPTIONS.filter(e => !e.resolved).map(e => {
    const sevBadge = e.severity === 'error' ? 'badge-red' : e.severity === 'warning' ? 'badge-amber' : 'badge-sky';
    const sevLabel = e.severity === 'error' ? '오류' : e.severity === 'warning' ? '경고' : '정보';
    return `
      <div class="flex items-start gap-3 py-2.5 border-t border-gray-50 first:border-t-0">
        <span class="badge ${sevBadge} mt-0.5">${sevLabel}</span>
        <div class="flex-1 min-w-0">
          <div class="text-sm text-gray-700">${e.message}</div>
          <div class="text-xs text-gray-400 mt-0.5">${e.id} · ${e.time}</div>
        </div>
      </div>`;
  }).join('') || '<div class="text-sm text-gray-400 py-4 text-center">미처리 예외 없음</div>';

  const exceptionsCard = card('미처리 예외', exceptionList);

  // Theme breakdown
  const themeCounts = THEMES.map(t => ({
    ...t,
    count: MOCK_ORDERS.filter(o => o.theme === t.code).length,
  }));
  const totalTheme = themeCounts.reduce((s, t) => s + t.count, 0);
  const themeRows = themeCounts.sort((a, b) => b.count - a.count).map(t => {
    const pct = totalTheme ? Math.round((t.count / totalTheme) * 100) : 0;
    return `
      <div class="flex items-center gap-3 py-1.5">
        <span class="text-sm w-24 text-gray-600">${t.label}</span>
        <div class="flex-1">${progressBar(pct, 'bg-primary')}</div>
        <span class="text-xs text-gray-500 w-16 text-right">${t.count}건 (${pct}%)</span>
      </div>`;
  }).join('');

  const themeCard = card('테마별 주문', themeRows);

  return kpis + bepSection + funnelSection + pipeline + `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      ${revenueChart}
      ${exceptionsCard}
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      ${themeCard}
      ${card('SLA 현황 (D+3 목표)', `
        <div class="flex items-center gap-6">
          ${donut(92, '#10b981')}
          <div>
            <div class="text-sm text-gray-600">최근 30일 SLA 준수율</div>
            <div class="text-2xl font-bold text-green-600 mt-1">92%</div>
            <div class="text-xs text-gray-400 mt-1">평균 배송일: D+2.6</div>
          </div>
        </div>
      `)}
    </div>`;
}

function renderOrdersPage() {
  const statusOptions = [{ key: 'all', label: '전체' }, ...ORDER_STATUSES];
  const filtered = orderFilter === 'all' ? MOCK_ORDERS : MOCK_ORDERS.filter(o => o.status === orderFilter);

  const filterBtns = statusOptions.map(s => {
    const count = s.key === 'all' ? MOCK_ORDERS.length : countByStatus(s.key);
    const active = orderFilter === s.key ? 'active' : 'bg-gray-100 text-gray-600 hover:bg-gray-200';
    return `<button class="filter-btn text-xs px-3 py-1.5 rounded-full font-medium ${active}" data-filter="${s.key}">${s.label} (${count})</button>`;
  }).join('');

  const rows = filtered.map(o => {
    const st = getStatusInfo(o.status);
    const th = getThemeInfo(o.theme);
    return `
      <tr class="table-row border-t border-gray-50">
        <td class="py-3 px-4 text-xs font-mono text-gray-500">${o.id}</td>
        <td class="py-3 px-4 text-sm">${o.buyer}</td>
        <td class="py-3 px-4 text-sm">${o.child} (${o.age}세)</td>
        <td class="py-3 px-4 text-xs text-gray-500">${th.label}</td>
        <td class="py-3 px-4"><span class="badge ${o.version === 'A' ? 'badge-sky' : 'badge-violet'}">${o.version === 'A' ? 'Baby' : 'Kids'}</span></td>
        <td class="py-3 px-4"><span class="badge ${st.badge}">${st.label}</span></td>
        <td class="py-3 px-4 text-xs text-gray-400">${o.createdAt}</td>
      </tr>`;
  }).join('');

  return `
    <div class="flex flex-wrap gap-2 mb-4">${filterBtns}</div>
    ${card('', `
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm text-gray-500">${filtered.length}건</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[10px] text-gray-400 uppercase tracking-wider">
              <th class="py-2 px-4">주문번호</th>
              <th class="py-2 px-4">구매자</th>
              <th class="py-2 px-4">아이</th>
              <th class="py-2 px-4">테마</th>
              <th class="py-2 px-4">버전</th>
              <th class="py-2 px-4">상태</th>
              <th class="py-2 px-4">주문일</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `)}`;
}

function renderAIPage() {
  const total = MOCK_AI_LOG.length;
  const avgTime = (MOCK_AI_LOG.reduce((s, l) => s + l.time, 0) / total).toFixed(1);
  const avgScore = Math.round(MOCK_AI_LOG.reduce((s, l) => s + l.bgqaScore, 0) / total);
  const successRate = 100; // 완전 자동화

  // Stats
  const stats = `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="stat-card bg-white rounded-xl p-5 border border-gray-100">
        <div class="text-xs text-gray-400 mb-1">처리 건수</div>
        <div class="text-2xl font-extrabold text-gray-800">${total}</div>
        <div class="text-xs text-gray-400 mt-1">최근 2일 샘플</div>
      </div>
      <div class="stat-card bg-white rounded-xl p-5 border border-gray-100">
        <div class="text-xs text-gray-400 mb-1">자동화율</div>
        <div class="text-2xl font-extrabold text-green-600">${successRate}%</div>
        <div class="text-xs text-green-500 mt-1">완전 자동화</div>
      </div>
      <div class="stat-card bg-white rounded-xl p-5 border border-gray-100">
        <div class="text-xs text-gray-400 mb-1">평균 처리시간</div>
        <div class="text-2xl font-extrabold text-gray-800">${avgTime}초</div>
        <div class="text-xs text-gray-400 mt-1">5개 파이프라인 병렬</div>
      </div>
      <div class="stat-card bg-white rounded-xl p-5 border border-gray-100">
        <div class="text-xs text-gray-400 mb-1">평균 BGQA 점수</div>
        <div class="text-2xl font-extrabold text-gray-800">${avgScore}</div>
        <div class="text-xs text-gray-400 mt-1">100점 만점</div>
      </div>
    </div>`;

  // Pipeline distribution (사용자가 최종 선택한 파이프라인)
  const PIPELINE_LABELS = {
    'crop-ben2': '1. Crop + BEN2',
    'crop-removebg': '2. Crop + remove.bg',
    'sam2-birefnet': '3. SAM2 + BiRefNet',
    'sam2-vitmatte': '4. SAM2 + ViTMatte',
    'crop-portrait': '5. Crop + Portrait',
  };
  const pipelineCounts = {};
  MOCK_AI_LOG.forEach(l => { pipelineCounts[l.pipeline] = (pipelineCounts[l.pipeline] || 0) + 1; });
  const pipelineBars = Object.entries(pipelineCounts).sort((a, b) => b[1] - a[1]).map(([key, count]) => {
    const pct = Math.round((count / total) * 100);
    return `
      <div class="flex items-center gap-3 py-1.5">
        <span class="text-xs w-40 text-gray-600 font-mono">${PIPELINE_LABELS[key] || key}</span>
        <div class="flex-1">${progressBar(pct, 'bg-indigo-500')}</div>
        <span class="text-xs text-gray-500 w-16 text-right">${count}건 (${pct}%)</span>
      </div>`;
  }).join('');
  const pipelineNote = `<div class="text-[10px] text-gray-400 mt-3">5개 파이프라인 병렬 실행 후 사용자가 최종 결과 선택</div>`;

  // BGQA checks overview
  const bgqaOverview = BGQA_CHECKS.map(check => `
    <div class="flex items-center justify-between py-1">
      <span class="text-xs text-gray-600">${check}</span>
      <span class="badge badge-green">통과</span>
    </div>
  `).join('');

  // Processing log
  const logRows = MOCK_AI_LOG.map(l => `
    <tr class="table-row border-t border-gray-50">
      <td class="py-2.5 px-4 text-xs font-mono text-gray-500">${l.id}</td>
      <td class="py-2.5 px-4 text-sm">${l.child}</td>
      <td class="py-2.5 px-4 text-xs font-mono text-gray-500">${PIPELINE_LABELS[l.pipeline] || l.pipeline}</td>
      <td class="py-2.5 px-4 text-xs">${l.time}초</td>
      <td class="py-2.5 px-4"><span class="badge ${l.bgqaScore >= 80 ? 'badge-green' : 'badge-amber'}">${l.bgqaScore}점</span></td>
      <td class="py-2.5 px-4 text-xs text-gray-400">${l.ts}</td>
    </tr>
  `).join('');

  return stats + `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      ${card('파이프라인 선택 분포', pipelineBars + pipelineNote)}
      ${card('BGQA 8항목 체크리스트', bgqaOverview)}
    </div>
    ${card('처리 로그', `
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead><tr class="text-[10px] text-gray-400 uppercase tracking-wider">
            <th class="py-2 px-4">주문번호</th>
            <th class="py-2 px-4">아이</th>
            <th class="py-2 px-4">선택 파이프라인</th>
            <th class="py-2 px-4">처리시간</th>
            <th class="py-2 px-4">BGQA</th>
            <th class="py-2 px-4">처리시각</th>
          </tr></thead>
          <tbody>${logRows}</tbody>
        </table>
      </div>
    `)}`;
}

function renderPrintPage() {
  const printStatuses = [
    { label: '인쇄파일생성', status: 'generating_print' },
    { label: '인쇄요청', status: 'print_requested' },
    { label: '인쇄중', status: 'printing' },
  ];

  const printStats = printStatuses.map(ps => {
    const count = countByStatus(ps.status);
    return `
      <div class="stat-card bg-white rounded-xl p-5 border border-gray-100">
        <div class="text-xs text-gray-400 mb-1">${ps.label}</div>
        <div class="text-2xl font-extrabold text-gray-800">${count}</div>
      </div>`;
  }).join('');

  const printOrders = MOCK_ORDERS.filter(o =>
    ['generating_print', 'print_requested', 'printing'].includes(o.status)
  );

  const rows = printOrders.map(o => {
    const st = getStatusInfo(o.status);
    const th = getThemeInfo(o.theme);
    return `
      <tr class="table-row border-t border-gray-50">
        <td class="py-3 px-4"><input type="checkbox" class="rounded print-checkbox" data-id="${o.id}"></td>
        <td class="py-3 px-4 text-xs font-mono text-gray-500">${o.id}</td>
        <td class="py-3 px-4 text-sm">${o.buyer}</td>
        <td class="py-3 px-4 text-sm">${o.child}</td>
        <td class="py-3 px-4 text-xs text-gray-500">${th.label}</td>
        <td class="py-3 px-4"><span class="badge ${o.version === 'A' ? 'badge-sky' : 'badge-violet'}">${o.version === 'A' ? 'Baby' : 'Kids'}</span></td>
        <td class="py-3 px-4"><span class="badge ${st.badge}">${st.label}</span></td>
        <td class="py-3 px-4 text-xs text-gray-400">${o.createdAt}</td>
      </tr>`;
  }).join('');

  return `
    <div class="grid grid-cols-3 gap-4 mb-6">${printStats}</div>
    ${card('', `
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold text-gray-700">인쇄 큐 (${printOrders.length}건)</h2>
        <div class="flex gap-2">
          <button class="bg-gray-100 text-gray-600 text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition" id="select-all-print">전체 선택</button>
          <button class="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark transition" id="batch-print-btn">북토리 일괄 전송</button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead><tr class="text-[10px] text-gray-400 uppercase tracking-wider">
            <th class="py-2 px-4 w-10"></th>
            <th class="py-2 px-4">주문번호</th>
            <th class="py-2 px-4">구매자</th>
            <th class="py-2 px-4">아이</th>
            <th class="py-2 px-4">테마</th>
            <th class="py-2 px-4">버전</th>
            <th class="py-2 px-4">상태</th>
            <th class="py-2 px-4">주문일</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `)}
    ${card('인쇄 불량률', `
      <div class="flex items-center gap-6">
        ${donut(0.3, '#10b981')}
        <div>
          <div class="text-sm text-gray-600">최근 30일 불량률</div>
          <div class="text-2xl font-bold text-green-600 mt-1">0.3%</div>
          <div class="text-xs text-green-500 mt-1">목표 0.5% 이하 달성</div>
        </div>
      </div>
    `, 'mt-6')}`;
}

function renderShippingPage() {
  const shippedOrders = MOCK_ORDERS.filter(o => ['shipped', 'delivered'].includes(o.status));

  const shippedCount = MOCK_ORDERS.filter(o => o.status === 'shipped').length;
  const deliveredCount = MOCK_ORDERS.filter(o => o.status === 'delivered').length;

  const stats = `
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="stat-card bg-white rounded-xl p-5 border border-gray-100">
        <div class="text-xs text-gray-400 mb-1">배송중</div>
        <div class="text-2xl font-extrabold text-teal-600">${shippedCount}</div>
      </div>
      <div class="stat-card bg-white rounded-xl p-5 border border-gray-100">
        <div class="text-xs text-gray-400 mb-1">배송완료</div>
        <div class="text-2xl font-extrabold text-green-600">${deliveredCount}</div>
      </div>
      <div class="stat-card bg-white rounded-xl p-5 border border-gray-100">
        <div class="text-xs text-gray-400 mb-1">SLA 준수 (D+3)</div>
        <div class="text-2xl font-extrabold text-green-600">92%</div>
      </div>
    </div>`;

  const rows = shippedOrders.filter(o => o.trackingNo).map(o => {
    const st = getStatusInfo(o.status);
    return `
      <tr class="table-row border-t border-gray-50">
        <td class="py-3 px-4 text-xs font-mono text-gray-500">${o.id}</td>
        <td class="py-3 px-4 text-sm">${o.buyer}</td>
        <td class="py-3 px-4 text-xs font-mono text-gray-600">${o.trackingNo}</td>
        <td class="py-3 px-4 text-xs text-gray-500">${o.carrier}</td>
        <td class="py-3 px-4"><span class="badge ${st.badge}">${st.label}</span></td>
        <td class="py-3 px-4 text-xs text-gray-400">${o.createdAt}</td>
      </tr>`;
  }).join('');

  return stats + card('배송 추적', `
    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead><tr class="text-[10px] text-gray-400 uppercase tracking-wider">
          <th class="py-2 px-4">주문번호</th>
          <th class="py-2 px-4">구매자</th>
          <th class="py-2 px-4">송장번호</th>
          <th class="py-2 px-4">택배사</th>
          <th class="py-2 px-4">상태</th>
          <th class="py-2 px-4">주문일</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `);
}

function renderExceptionsPage() {
  const unresolvedCount = MOCK_EXCEPTIONS.filter(e => !e.resolved).length;

  const rows = MOCK_EXCEPTIONS.map(e => {
    const sevBadge = e.severity === 'error' ? 'badge-red' : e.severity === 'warning' ? 'badge-amber' : 'badge-sky';
    const sevLabel = e.severity === 'error' ? '오류' : e.severity === 'warning' ? '경고' : '정보';
    return `
      <tr class="table-row border-t border-gray-50">
        <td class="py-3 px-4"><span class="badge ${sevBadge}">${sevLabel}</span></td>
        <td class="py-3 px-4 text-xs font-mono text-gray-500">${e.id}</td>
        <td class="py-3 px-4 text-xs text-gray-500">${e.type.replace(/_/g, ' ')}</td>
        <td class="py-3 px-4 text-sm text-gray-700">${e.message}</td>
        <td class="py-3 px-4 text-xs text-gray-400">${e.time}</td>
        <td class="py-3 px-4">
          ${e.resolved
            ? '<span class="badge badge-green">해결됨</span>'
            : '<button class="text-xs text-primary font-semibold hover:underline resolve-btn" data-id="' + e.id + '">처리</button>'
          }
        </td>
      </tr>`;
  }).join('');

  return `
    <div class="flex items-center gap-4 mb-4">
      <span class="badge badge-red">${unresolvedCount}건 미처리</span>
      <span class="badge badge-green">${MOCK_EXCEPTIONS.length - unresolvedCount}건 해결됨</span>
    </div>
    ${card('', `
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead><tr class="text-[10px] text-gray-400 uppercase tracking-wider">
            <th class="py-2 px-4">심각도</th>
            <th class="py-2 px-4">주문번호</th>
            <th class="py-2 px-4">유형</th>
            <th class="py-2 px-4">내용</th>
            <th class="py-2 px-4">시간</th>
            <th class="py-2 px-4">상태</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `)}`;
}

function renderFinancePage() {
  const thisMonth = MOCK_MONTHLY_REVENUE[5];
  const lastMonth = MOCK_MONTHLY_REVENUE[4];
  const phase = PHASES[CURRENT_PHASE];
  const operatingProfit = (thisMonth.units * UNIT_ECONOMICS.profitPerUnit) - phase.fixedCost;
  const operatingMargin = ((operatingProfit / thisMonth.revenue) * 100).toFixed(1);
  const growthRate = (((thisMonth.units - lastMonth.units) / lastMonth.units) * 100).toFixed(1);

  const kpis = `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="stat-card bg-white rounded-xl p-5 border border-gray-100">
        <div class="text-xs text-gray-400 mb-1">이번 달 매출</div>
        <div class="text-2xl font-extrabold text-gray-800">${fmtWon(thisMonth.revenue)}원</div>
        <div class="text-xs text-green-500 mt-1">전월 대비 +${growthRate}%</div>
      </div>
      <div class="stat-card bg-white rounded-xl p-5 border border-gray-100">
        <div class="text-xs text-gray-400 mb-1">영업이익</div>
        <div class="text-2xl font-extrabold ${operatingProfit > 0 ? 'text-green-600' : 'text-red-500'}">${fmtWon(operatingProfit)}원</div>
        <div class="text-xs text-gray-400 mt-1">영업이익률 ${operatingMargin}%</div>
      </div>
      <div class="stat-card bg-white rounded-xl p-5 border border-gray-100">
        <div class="text-xs text-gray-400 mb-1">단위 수익</div>
        <div class="text-2xl font-extrabold text-gray-800">${fmt(UNIT_ECONOMICS.profitPerUnit)}원</div>
        <div class="text-xs text-primary mt-1">마진 ${UNIT_ECONOMICS.margin}%</div>
      </div>
      <div class="stat-card bg-white rounded-xl p-5 border border-gray-100">
        <div class="text-xs text-gray-400 mb-1">판매 권수</div>
        <div class="text-2xl font-extrabold text-gray-800">${thisMonth.units}권</div>
        <div class="text-xs text-gray-400 mt-1">일평균 ${Math.round(thisMonth.units / 26)}권</div>
      </div>
    </div>`;

  // Unit economics breakdown
  const costs = [
    { label: '판매가', value: UNIT_ECONOMICS.sellingPrice, color: 'bg-primary', pct: 100 },
    { label: '인쇄비', value: UNIT_ECONOMICS.printCost, color: 'bg-red-400', pct: (UNIT_ECONOMICS.printCost / UNIT_ECONOMICS.sellingPrice * 100) },
    { label: '배송비', value: UNIT_ECONOMICS.shippingCost, color: 'bg-orange-400', pct: (UNIT_ECONOMICS.shippingCost / UNIT_ECONOMICS.sellingPrice * 100) },
    { label: '결제수수료 (3%)', value: UNIT_ECONOMICS.paymentFee, color: 'bg-amber-400', pct: (UNIT_ECONOMICS.paymentFee / UNIT_ECONOMICS.sellingPrice * 100) },
    { label: '포장/자재', value: UNIT_ECONOMICS.packaging, color: 'bg-yellow-400', pct: (UNIT_ECONOMICS.packaging / UNIT_ECONOMICS.sellingPrice * 100) },
    { label: 'GPU/클라우드', value: UNIT_ECONOMICS.gpuCost, color: 'bg-indigo-400', pct: (UNIT_ECONOMICS.gpuCost / UNIT_ECONOMICS.sellingPrice * 100) },
  ];
  const costRows = costs.map(c => `
    <div class="flex items-center gap-3 py-1.5">
      <span class="text-xs w-28 text-gray-600">${c.label}</span>
      <div class="flex-1">${progressBar(c.pct, c.color)}</div>
      <span class="text-xs text-gray-700 w-20 text-right font-medium">${fmt(c.value)}원</span>
    </div>`).join('');

  const costBreakdown = `
    ${costRows}
    <div class="border-t border-gray-200 mt-3 pt-3 flex items-center justify-between">
      <span class="text-sm font-semibold text-gray-700">변동비 합계</span>
      <span class="text-sm font-bold text-gray-800">${fmt(UNIT_ECONOMICS.variableCost)}원</span>
    </div>
    <div class="flex items-center justify-between mt-1">
      <span class="text-sm font-semibold text-green-600">단위 순이익</span>
      <span class="text-sm font-bold text-green-600">${fmt(UNIT_ECONOMICS.profitPerUnit)}원 (${UNIT_ECONOMICS.margin}%)</span>
    </div>`;

  // Monthly revenue chart
  const maxRev = Math.max(...MOCK_MONTHLY_REVENUE.map(m => m.revenue));
  const bars = MOCK_MONTHLY_REVENUE.map(m => {
    const h = Math.round((m.revenue / maxRev) * 100);
    const grossProfit = m.units * UNIT_ECONOMICS.profitPerUnit;
    const gh = Math.round((grossProfit / maxRev) * 100);
    const operatingProfit = grossProfit - phase.fixedCost;
    return `
      <div class="flex flex-col items-center gap-1 flex-1">
        <div class="flex gap-0.5 w-full">
          <div class="flex-1 text-[9px] text-primary font-semibold text-center truncate">${fmtWon(m.revenue)}</div>
          <div class="flex-1 text-[9px] text-emerald-600 font-semibold text-center truncate">${fmtWon(grossProfit)}</div>
        </div>
        <div class="w-full relative flex gap-0.5" style="height:140px">
          <div class="flex-1 bg-gray-100 rounded-t relative">
            <div class="bar-chart-bar absolute bottom-0 w-full bg-primary rounded-t opacity-80" style="height:${h}%"></div>
          </div>
          <div class="flex-1 bg-gray-100 rounded-t relative">
            <div class="bar-chart-bar absolute bottom-0 w-full bg-emerald-400 rounded-t opacity-80" style="height:${gh}%"></div>
          </div>
        </div>
        <div class="text-[10px] text-gray-500 font-medium">${m.month}</div>
        <div class="text-[10px] ${operatingProfit >= 0 ? 'text-green-500' : 'text-red-400'}">${operatingProfit >= 0 ? '+' : ''}${fmtWon(operatingProfit)}</div>
      </div>`;
  }).join('');

  // Phase roadmap
  const phaseInfo = `
    <div class="space-y-3">
      ${Object.entries(PHASES).map(([key, p]) => {
        const isCurrent = parseInt(key) === CURRENT_PHASE;
        return `
          <div class="flex items-center gap-3 p-3 rounded-lg ${isCurrent ? 'bg-primary/5 border border-primary/20' : 'bg-gray-50'}">
            <div class="w-8 h-8 rounded-full ${isCurrent ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'} flex items-center justify-center text-xs font-bold">${key}</div>
            <div class="flex-1">
              <div class="text-sm font-semibold ${isCurrent ? 'text-primary' : 'text-gray-600'}">${p.label} — ${p.desc}</div>
              <div class="text-xs text-gray-400">고정비 ${fmtWon(p.fixedCost)}원/월 · BEP ${fmt(p.bep)}권/월</div>
            </div>
            ${isCurrent ? '<span class="badge badge-violet">현재</span>' : ''}
          </div>`;
      }).join('')}
    </div>`;

  // Financial simulation
  const simRows = [3000, 5000, 10000, 15000, 20000].map(units => {
    const rev = units * UNIT_ECONOMICS.sellingPrice;
    const varCost = units * UNIT_ECONOMICS.variableCost;
    const gross = units * UNIT_ECONOMICS.profitPerUnit;
    const op = gross - phase.fixedCost;
    const margin = ((op / rev) * 100).toFixed(1);
    return `
      <tr class="table-row border-t border-gray-50">
        <td class="py-2.5 px-4 text-sm font-medium">${fmt(units)}권</td>
        <td class="py-2.5 px-4 text-xs text-gray-600">${fmtWon(rev)}원</td>
        <td class="py-2.5 px-4 text-xs text-gray-600">${fmtWon(varCost)}원</td>
        <td class="py-2.5 px-4 text-xs text-gray-600">${fmtWon(gross)}원</td>
        <td class="py-2.5 px-4 text-xs font-medium ${op >= 0 ? 'text-green-600' : 'text-red-500'}">${fmtWon(op)}원</td>
        <td class="py-2.5 px-4 text-xs ${parseFloat(margin) >= 0 ? 'text-green-600' : 'text-red-500'}">${margin}%</td>
      </tr>`;
  }).join('');

  return kpis + `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      ${card('유닛 이코노믹스', costBreakdown)}
      ${card('월별 매출/영업이익 추이', `
        <div class="flex items-center gap-4 mb-3">
          <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-sm bg-primary opacity-80"></div><span class="text-[10px] text-gray-500">매출</span></div>
          <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-sm bg-emerald-400 opacity-80"></div><span class="text-[10px] text-gray-500">매출총이익</span></div>
        </div>
        <div class="flex items-end gap-2">${bars}</div>
      `)}
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      ${card('Phase 로드맵', phaseInfo)}
      ${card('손익 시뮬레이션 (Phase 2 기준)', `
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead><tr class="text-[10px] text-gray-400 uppercase tracking-wider">
              <th class="py-2 px-4">월 판매량</th>
              <th class="py-2 px-4">매출</th>
              <th class="py-2 px-4">변동비</th>
              <th class="py-2 px-4">매출총이익</th>
              <th class="py-2 px-4">영업이익</th>
              <th class="py-2 px-4">이익률</th>
            </tr></thead>
            <tbody>${simRows}</tbody>
          </table>
        </div>
        <div class="text-xs text-gray-400 mt-3">고정비: ${fmtWon(phase.fixedCost)}원/월 (인건비 2,500만, GPU 200만, 클라우드 100만, SaaS 50만, 마케팅 1,500만, 기타 150만)</div>
      `)}
    </div>`;
}

function renderSettingsPage() {
  return `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      ${card('AI 서버', `
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">서버 URL</label>
            <input type="text" value="https://ai.monviestory.co.kr" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" readonly>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">GPU</label>
            <input type="text" value="RTX 4070 Super (12GB VRAM)" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" readonly>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">기본 배경제거 모델</label>
            <select class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option selected>BiRefNet-Portrait (기본)</option>
              <option>BiRefNet-HR-Matting</option>
              <option>BEN2</option>
              <option>BiRefNet-HR</option>
              <option>BiRefNet-Dynamic</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">BGQA 자동승인 임계값</label>
            <input type="number" value="80" class="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <span class="text-xs text-gray-400 ml-2">점 이상이면 자동 승인</span>
          </div>
        </div>
      `)}
      ${card('알림 설정', `
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-700">알림톡 자동 발송</div>
              <div class="text-xs text-gray-400">주문 상태 변경 시 고객에게 카카오 알림톡 발송</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer">
              <div class="w-9 h-5 bg-gray-200 peer-checked:bg-primary rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            </label>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-700">북토리 자동 인쇄 요청</div>
              <div class="text-xs text-gray-400">승인 완료 → 인쇄파일 생성 → 자동 전송 (크론잡)</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer">
              <div class="w-9 h-5 bg-gray-200 peer-checked:bg-primary rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            </label>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-700">Slack 에러 알림</div>
              <div class="text-xs text-gray-400">예외 발생 시 Slack 채널에 자동 알림</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer">
              <div class="w-9 h-5 bg-gray-200 peer-checked:bg-primary rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            </label>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-700">사진 미업로드 리마인더</div>
              <div class="text-xs text-gray-400">주문 후 24시간 경과 시 알림톡 재발송</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer">
              <div class="w-9 h-5 bg-gray-200 peer-checked:bg-primary rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            </label>
          </div>
        </div>
      `)}
      ${card('인쇄/배송', `
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">인쇄 파트너</label>
            <input type="text" value="북토리 (Booktory)" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" readonly>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">배송 추적 API</label>
            <input type="text" value="Sweet Tracker" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" readonly>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">SLA 목표</label>
            <div class="flex items-center gap-2">
              <input type="text" value="D+3" class="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <span class="text-xs text-gray-400">주문일 기준 배송 완료 목표일</span>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">사양</label>
            <div class="text-sm text-gray-600">20페이지 · 하드커버 · 풀컬러 · 250mm x 200mm · 재단여백 3mm</div>
          </div>
        </div>
      `)}
      ${card('고정비 구조 (Phase 2 · 5인)', `
        <div class="space-y-2">
          ${[
            ['인건비 (4인 + 대표)', '2,500만원'],
            ['GPU 서버 (멀티 GPU)', '200만원'],
            ['클라우드/인프라 (Firebase, Cloudflare, CDN)', '100만원'],
            ['SaaS/도구 (Midjourney, AI 어시스턴트)', '50만원'],
            ['마케팅', '1,500만원'],
            ['기타 (세무, 사무실, 통신)', '150만원'],
          ].map(([label, value]) => `
            <div class="flex items-center justify-between py-1">
              <span class="text-sm text-gray-600">${label}</span>
              <span class="text-sm font-medium text-gray-800">${value}</span>
            </div>
          `).join('')}
          <div class="border-t border-gray-200 pt-2 mt-2 flex items-center justify-between">
            <span class="text-sm font-semibold text-gray-700">합계</span>
            <span class="text-sm font-bold text-gray-800">4,500만원/월</span>
          </div>
        </div>
      `)}
    </div>`;
}

// ========== Page Titles ==========

const PAGE_TITLES = {
  dashboard: '대시보드',
  orders: '주문 관리',
  ai: 'AI 모니터링',
  print: '인쇄 관리',
  shipping: '배송 현황',
  exceptions: '예외 처리',
  finance: '재무 현황',
  settings: '설정',
};

// ========== Navigation ==========

// 실시간 숫자 업데이트 (DOM 직접 조작 — 전체 리렌더 없이)
function tickDashboard() {
  if (currentPage !== 'dashboard') return;
  const sim = getSimulatedCounts();

  const el = (id) => document.getElementById(id);
  if (el('kpi-today-makers')) el('kpi-today-makers').textContent = fmt(sim.todayStarted);
  if (el('kpi-today-paid')) el('kpi-today-paid').textContent = fmt(sim.todayPaid);

  // 퍼널
  if (el('funnel-started')) el('funnel-started').textContent = fmt(sim.todayStarted);
  if (el('funnel-completed')) el('funnel-completed').textContent = fmt(sim.todayCompleted);
  if (el('funnel-paid')) el('funnel-paid').textContent = fmt(sim.todayPaid);
  if (el('funnel-rate-1') && sim.todayStarted > 0) el('funnel-rate-1').textContent = ((sim.todayCompleted / sim.todayStarted) * 100).toFixed(1) + '%';
  if (el('funnel-rate-2') && sim.todayCompleted > 0) el('funnel-rate-2').textContent = ((sim.todayPaid / sim.todayCompleted) * 100).toFixed(1) + '%';
  if (el('funnel-overall') && sim.todayStarted > 0) el('funnel-overall').textContent = ((sim.todayPaid / sim.todayStarted) * 100).toFixed(1) + '%';

  // 파이프라인
  for (const [key, count] of Object.entries(sim.pipeline)) {
    if (el('pipe-' + key)) el('pipe-' + key).textContent = count;
  }
}

function startSimulation() {
  if (simInterval) clearInterval(simInterval);
  simInterval = setInterval(tickDashboard, 3000); // 3초마다 업데이트
}

function stopSimulation() {
  if (simInterval) { clearInterval(simInterval); simInterval = null; }
}

function navigate(page) {
  currentPage = page;
  orderFilter = 'all';

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
    if (el.dataset.page !== page) {
      el.classList.add('text-gray-600');
    } else {
      el.classList.remove('text-gray-600');
    }
  });

  document.getElementById('page-title').textContent = PAGE_TITLES[page] || page;

  stopSimulation();
  const content = document.getElementById('page-content');
  switch (page) {
    case 'dashboard': content.innerHTML = renderDashboard(); startSimulation(); break;
    case 'orders': content.innerHTML = renderOrdersPage(); break;
    case 'ai': content.innerHTML = renderAIPage(); break;
    case 'print': content.innerHTML = renderPrintPage(); break;
    case 'shipping': content.innerHTML = renderShippingPage(); break;
    case 'exceptions': content.innerHTML = renderExceptionsPage(); break;
    case 'finance': content.innerHTML = renderFinancePage(); break;
    case 'settings': content.innerHTML = renderSettingsPage(); break;
    default: content.innerHTML = renderDashboard();
  }

  window.scrollTo(0, 0);
}

// ========== Init ==========

document.addEventListener('DOMContentLoaded', () => {
  // Auth check
  if (AUTH.check()) {
    showApp();
  } else {
    showLogin();
  }

  // Login form
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('login-id').value.trim();
    const pw = document.getElementById('login-pw').value;
    if (AUTH.login(id, pw)) {
      document.getElementById('login-error').classList.add('hidden');
      showApp();
      navigate('dashboard');
    } else {
      document.getElementById('login-error').classList.remove('hidden');
      document.getElementById('login-pw').value = '';
    }
  });

  // Logout
  document.getElementById('user-avatar').addEventListener('click', () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      AUTH.logout();
    }
  });

  const now = new Date();
  const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
  document.getElementById('header-date').textContent = dateStr;

  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.dataset.page);
    });
  });

  // Event delegation
  document.addEventListener('click', (e) => {
    // Batch print button
    if (e.target.closest('#batch-print-btn')) {
      alert('북토리 일괄 인쇄 요청이 전송되었습니다. (목업)');
    }

    // Select all print checkboxes
    if (e.target.closest('#select-all-print')) {
      document.querySelectorAll('.print-checkbox').forEach(cb => { cb.checked = true; });
    }

    // Order filter buttons
    const filterBtn = e.target.closest('.filter-btn');
    if (filterBtn && currentPage === 'orders') {
      orderFilter = filterBtn.dataset.filter;
      navigate('orders');
    }

    // Exception resolve
    const resolveBtn = e.target.closest('.resolve-btn');
    if (resolveBtn) {
      const id = resolveBtn.dataset.id;
      const ex = MOCK_EXCEPTIONS.find(e => e.id === id);
      if (ex) {
        ex.resolved = true;
        navigate(currentPage);
      }
    }
  });

  navigate('dashboard');
});
