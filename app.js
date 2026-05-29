const refs = {
  country: document.querySelector("#country"),
  originCountry: document.querySelector("#originCountry"),
  rateLookupText: document.querySelector("#rateLookupText"),
  productName: document.querySelector("#productName"),
  photoInput: document.querySelector("#photoInput"),
  photoPreview: document.querySelector("#photoPreview"),
  useCase: document.querySelector("#useCase"),
  functionText: document.querySelector("#functionText"),
  materialText: document.querySelector("#materialText"),
  notes: document.querySelector("#notes"),
  analyzeBtn: document.querySelector("#analyzeBtn"),
  copyOpinionBtn: document.querySelector("#copyOpinionBtn"),
  resultTitle: document.querySelector("#resultTitle"),
  primaryHs: document.querySelector("#primaryHs"),
  confidence: document.querySelector("#confidence"),
  countryLabel: document.querySelector("#countryLabel"),
  rateSummary: document.querySelector("#rateSummary"),
  principleBody: document.querySelector("#principleBody"),
  classificationBody: document.querySelector("#classificationBody"),
  rivalBody: document.querySelector("#rivalBody"),
  rateTable: document.querySelector("#rateTable"),
  requirementsList: document.querySelector("#requirementsList"),
  originBody: document.querySelector("#originBody"),
  opinionText: document.querySelector("#opinionText")
};

const countries = {
  KR: "대한민국",
  US: "미국",
  EU: "EU",
  JP: "일본"
};

const sourceFiles = [
  "2026 관세율표 법령집 주HS 1.0.4 p.20-37 통칙",
  "2016년 관세율표 용어 따라잡기",
  "K뷰티 화장품 HS 가이드북",
  "반도체 HS 표준해석지침",
  "디스플레이 HS 표준해석 지침",
  "이차전지 HS 표준해석 지침",
  "자동차 부품 HS 표준해석 지침",
  "해외직접구매 품목분류 100선",
  "세관분류사례1",
  "세관분류사례2"
];

const tariffData = Array.isArray(window.HS_TARIFF_DATA) ? window.HS_TARIFF_DATA : [];
const stopWords = new Set(["그리고", "또는", "으로", "에서", "하는", "사용", "제품", "물품", "기능", "재질", "용도", "구성", "수입", "예정"]);

const classificationPrinciples = [
  {
    step: "1",
    title: "통칙 우선 검토",
    source: "2026 관세율표 법령집 주HS 1.0.4 p.20-37",
    detail: "통칙 제1호를 출발점으로 호의 용어와 관련 부·류·주의 법적 효력을 먼저 확인합니다. 미완성품, 혼합물, 세트물품, 복합물품이면 통칙 제2호~제6호 적용 가능성을 순차 검토합니다."
  },
  {
    step: "2",
    title: "관련 부주·류주 확인",
    source: "관세율표 해당 부·류 주",
    detail: "특정 물품을 포함하거나 제외하는 주가 있는지 확인합니다. 주에서 배제되는 물품은 키워드가 유사해도 해당 호로 분류하지 않습니다."
  },
  {
    step: "3",
    title: "호의 용어 대조",
    source: "4단위 호와 6단위 소호 용어",
    detail: "물품의 객관적 특성, 용도, 기능, 재질, 구성요소가 호의 문언에 직접 부합하는지 확인합니다. 세율이나 인증 편의가 아니라 호의 용어가 우선입니다."
  },
  {
    step: "4",
    title: "호의 해설 검토",
    source: "HS 해설서 및 관세율표 해설",
    detail: "호에 포함되는 물품, 제외되는 물품, 부분품 판단, 주기능 판단, 세트물품 판단을 해설 기준으로 검토합니다."
  },
  {
    step: "5",
    title: "경합 세번 비교",
    source: "통칙 제3호 및 관련 해설",
    detail: "둘 이상의 호가 경합하면 더 구체적인 호, 본질적 특성을 부여하는 구성요소, 최후 순위 호 등 통칙상 우선순위로 배제 사유를 작성합니다."
  },
  {
    step: "6",
    title: "첨부 분류사례 대조",
    source: "세관분류사례1·2 및 품목별 표준해석 지침",
    detail: "유사 물품의 실제 결정례와 표준해석 지침을 참고하되, 사례는 보조 근거로 사용하고 통칙과 주·호의 용어 판단을 대체하지 않습니다."
  }
];

const profiles = [
  {
    match: ["배터리", "리튬", "축전지", "셀", "팩", "에너지저장", "보조배터리"],
    hs: "8507.60",
    title: "리튬이온 축전지",
    confidence: "높음",
    basis: "제품의 본질적 기능이 전기 에너지 저장 및 공급에 있고 리튬이온 셀 또는 팩이 독립 물품으로 거래되는 경우 축전지 호 검토가 우선됩니다.",
    rivals: [
      ["8543.70", "고유 기능을 가진 전기기기", "배터리가 단순 구성품이 아니라 전체 물품의 본질을 이루는지에 따라 경합합니다."],
      ["8504.40", "정지형 변환기", "충전 회로가 포함되어도 주기능이 변환이 아닌 저장이면 배제 검토합니다."],
      ["9019.10", "마사지용 기기", "미용 마사지 기능이 주된 기능이면 기기 자체 분류와 경합합니다."]
    ],
    requirements: ["전기용품 및 생활용품 안전관리 대상 여부 확인", "배터리 운송 안전자료 및 UN38.3 시험자료 확인", "KC 인증 또는 공급자적합성확인 대상 여부 검토", "제품 표시사항과 사용설명서의 한글 표시 확인"],
    origin: "원산지 표시는 원칙적으로 현품 또는 최소포장에 명확하고 쉽게 지워지지 않는 방식으로 표시합니다. 소형 제품은 포장 표시 가능성을 함께 검토합니다."
  },
  {
    match: ["미용기기", "마사지", "온열", "진동", "led", "피부관리", "갈바닉", "이온", "뷰티디바이스"],
    hs: "8543.70",
    title: "고유 기능을 가진 기타 전기기기",
    confidence: "중간",
    basis: "피부 미용을 위한 온열, 진동, LED 조사 등 고유 전기적 기능이 결합된 기기는 의료기기나 단순 마사지기 해당 여부를 먼저 배제한 뒤 기타 전기기기 호를 검토합니다.",
    rivals: [
      ["9019.10", "마사지용 기기", "물리적 마사지가 본질적 기능이면 경합합니다."],
      ["9405.42", "LED 램프류", "조명 자체가 목적이면 조명기기 분류를 검토합니다."],
      ["8507.60", "리튬이온 축전지", "배터리가 내장 구성품인지 독립 거래 물품인지 확인합니다."]
    ],
    requirements: ["전기용품 안전관리 대상 여부 확인", "전파법 적합성평가 대상 여부 확인", "의료기기 광고·효능 표방 여부 확인", "피부 접촉부 재질과 표시사항 확인"],
    origin: "제품 본체 또는 포장에 원산지를 표시하고, 소비자가 구매 시 쉽게 확인할 수 있어야 합니다."
  },
  {
    match: ["화장품", "크림", "로션", "스킨", "샴푸"],
    hs: "3304.99",
    title: "피부 미용 또는 기초화장용 제품",
    confidence: "중간",
    basis: "피부에 직접 사용하는 미용 목적 조제품은 화장품류 검토가 우선되며, 의약적 효능 표시가 있으면 의약품류와 경합할 수 있습니다.",
    rivals: [
      ["3004.90", "의약품", "질병 치료 또는 예방 효능을 표방하면 경합합니다."],
      ["3401.30", "피부세척용 유기계면활성 제품", "세정이 주기능인 제품은 세척제 분류를 검토합니다."],
      ["3305.90", "두발용 제품", "사용 부위가 모발이면 두발용 제품으로 이동할 수 있습니다."]
    ],
    requirements: ["화장품 책임판매업자 요건 확인", "성분표 및 기능성화장품 심사 대상 여부 확인", "한글 표시사항 작성", "수입 전 표준통관예정보고 대상 여부 검토"],
    origin: "화장품 용기 또는 포장에 원산지를 표시하고, 소비자가 구매 시 쉽게 확인할 수 있어야 합니다."
  },
  {
    match: ["디스플레이", "모니터", "패널", "lcd", "oled"],
    hs: "8524.11",
    title: "평판 디스플레이 모듈",
    confidence: "중간",
    basis: "표시 기능을 수행하는 모듈인지, 완성 모니터인지, 특정 장비 전용 부분품인지에 따라 분류 기준이 달라집니다.",
    rivals: [
      ["8528.52", "모니터", "입력부와 외장 케이스를 갖춘 완성 모니터이면 경합합니다."],
      ["9013.80", "기타 광학기기", "표시 모듈이 아닌 광학 기능 중심이면 검토합니다."],
      ["8473.30", "컴퓨터 부분품", "컴퓨터 전용 부분품으로 인정되는지 검토합니다."]
    ],
    requirements: ["전파법 적합성평가 대상 여부 확인", "전기안전 인증 대상 여부 확인", "에너지효율 표시 대상 여부 검토", "모델명과 정격 표시 확인"],
    origin: "제품 후면 라벨 또는 포장에 원산지를 영문 또는 한글로 명확히 표시하는 방식을 권장합니다."
  },
  {
    match: ["반도체", "집적회로", "ic", "칩", "웨이퍼", "processor", "memory", "dram", "nand"],
    hs: "8542.31",
    title: "전자집적회로",
    confidence: "중간",
    basis: "능동소자와 회로가 반도체 기판 위에 집적된 물품이면 전자집적회로 호를 우선 검토합니다. 제조장비나 부분품이면 별도 호와 경합합니다.",
    rivals: [
      ["8486.20", "반도체 제조용 기계", "물품이 칩 자체가 아니라 제조 장비이면 경합합니다."],
      ["8541.49", "반도체 디바이스", "집적회로가 아닌 개별 반도체 소자이면 검토합니다."],
      ["8473.30", "컴퓨터 부분품", "컴퓨터 전용 모듈로 거래되는 경우 경합할 수 있습니다."]
    ],
    requirements: ["전략물자 해당 여부 확인", "전파법 또는 전기안전 대상 여부 확인", "모델명·사양서·데이터시트 확보", "원산지 및 제조공정 자료 확인"],
    origin: "포장 라벨 또는 거래서류에 원산지 표시 가능성을 검토하고, 소형 칩은 포장 단위 표시를 확인합니다."
  },
  {
    match: ["자동차", "차량", "브레이크", "범퍼", "기어", "서스펜션", "엔진부품", "차체", "핸들"],
    hs: "8708.99",
    title: "자동차 부분품과 부속품",
    confidence: "중간",
    basis: "차량에 전용 또는 주로 사용되는 부분품인지, 다른 호에 더 구체적으로 분류되는 물품인지 먼저 확인합니다.",
    rivals: [
      ["8512.20", "차량용 조명 또는 신호기기", "전기 조명·신호 기능이 특정되면 경합합니다."],
      ["8409.99", "엔진 부분품", "내연기관 전용 부분품이면 엔진 부분품 검토가 필요합니다."],
      ["4016.99", "고무 제품", "재질 특성이 본질이고 차량 전용성이 약하면 경합합니다."]
    ],
    requirements: ["자동차관리법상 자기인증 또는 부품 인증 대상 여부 확인", "KC 또는 전파법 대상 여부 확인", "차종 전용성 자료 확인", "안전 관련 부품 표시사항 확인"],
    origin: "부품 또는 최소포장에 원산지를 표시하고, 세트·키트 형태는 구성품별 표시 가능성을 확인합니다."
  },
  {
    match: ["의류", "티셔츠", "셔츠", "바지", "자켓", "재킷", "니트", "면", "폴리에스터"],
    hs: "6109.10",
    title: "면제 티셔츠 및 싱글릿",
    confidence: "검토 필요",
    basis: "의류는 편물/직물 여부, 성별, 용도, 섬유 조성, 의류 형태에 따라 류와 호가 달라지므로 재질과 제조방식을 우선 확인합니다.",
    rivals: [
      ["6205.20", "남성용 면제 셔츠", "직물 셔츠이면 편물 티셔츠와 경합하지 않습니다."],
      ["6110.20", "면제 스웨터류", "보온용 니트 상의이면 검토합니다."],
      ["6203.42", "남성용 면제 바지", "하의이면 별도 호를 검토합니다."]
    ],
    requirements: ["전기용품 및 생활용품 안전관리법상 섬유제품 표시 확인", "혼용률, 제조자, 취급상 주의사항 표시 확인", "어린이제품 해당 여부 검토", "원산지 표시 위치 확인"],
    origin: "의류는 봉제 라벨 또는 포장에 원산지와 섬유 조성을 명확히 표시합니다."
  },
  {
    match: ["플라스틱", "용기", "케이스", "사출", "pp", "pe", "abs", "폴리프로필렌", "폴리에틸렌"],
    hs: "3926.90",
    title: "기타 플라스틱 제품",
    confidence: "검토 필요",
    basis: "플라스틱 제품은 재질 자체보다 더 구체적인 용도·기능 호가 있는지 먼저 확인하고, 특정 호가 없을 때 기타 플라스틱 제품을 검토합니다.",
    rivals: [
      ["3923.10", "플라스틱 운반·포장용품", "포장용 용기이면 경합합니다."],
      ["4202.99", "케이스류", "휴대·보관용 케이스로 완성된 물품이면 검토합니다."],
      ["8480.71", "사출금형", "제품이 아니라 금형이면 별도 분류합니다."]
    ],
    requirements: ["식품 접촉 용기 여부 확인", "전기제품 부분품 여부 확인", "재질 증명서 및 용도 설명 확인", "재활용·환경표시 대상 여부 검토"],
    origin: "현품 표시가 곤란하면 최소포장에 원산지를 표시하는 방식을 검토합니다."
  },
  {
    match: ["장난감", "완구", "피규어", "인형", "퍼즐", "블록", "놀이", "어린이"],
    hs: "9503.00",
    title: "삼륜차·스쿠터·인형·기타 완구",
    confidence: "중간",
    basis: "놀이 또는 오락을 주목적으로 하는 물품은 완구류를 검토하되, 실제 기능성 제품이나 교육용 기기와 경합할 수 있습니다.",
    rivals: [
      ["9504.90", "오락용품", "게임기·테이블게임 등은 별도 검토합니다."],
      ["3926.40", "플라스틱 장식품", "놀이 기능보다 장식 목적이면 경합합니다."],
      ["8543.70", "기타 전기기기", "전기적 고유 기능이 본질이면 검토합니다."]
    ],
    requirements: ["어린이제품 안전특별법 대상 여부 확인", "KC 안전확인 또는 공급자적합성 대상 여부 확인", "연령 표시와 경고문구 확인", "배터리 포함 여부 확인"],
    origin: "완구 본체 또는 포장에 원산지와 안전표시를 함께 확인합니다."
  }
];

const fallbackProfile = {
  hs: "미확정",
  title: "추가 정보 필요",
  confidence: "낮음",
  basis: "입력 정보에서 특정 호를 가리키는 신호가 충분히 확인되지 않았습니다. 물품의 정확한 명칭, 구성품, 작동 원리, 주기능, 재질, 사용 대상, 거래 형태를 보완해야 합니다.",
  rivals: [
    ["8479.89", "기타 기계류", "전기적 작동보다 기계적 작동이 주기능이면 경합합니다."],
    ["9031.80", "측정 또는 검사기기", "측정 결과를 제공하는 장비이면 검토합니다."],
    ["9506.99", "운동용품", "운동 또는 레저 전용 물품이면 경합합니다."]
  ],
  requirements: ["제품 안전 인증 대상 여부 확인", "전파법 적합성평가 대상 여부 확인", "수입식품, 화학물질, 의료기기 등 특별법 대상 여부 검토", "라벨, 설명서, 모델명, 제조자 정보 확인"],
  origin: "대부분의 수입 물품은 원산지 표시가 필요합니다. 현품 표시가 곤란하면 최소 판매 포장에 표시 가능 여부를 검토합니다."
};

const ratePriorityRules = [
  {
    rank: 1,
    codes: ["I", "M", "J", "K", "T"],
    keywords: ["덤핑방지", "상계", "보복", "긴급관세", "특정물품긴급관세", "농림축산물특별긴급관세", "조정관세(제69조) 제2호"],
    condition: "가장 우선하여 적용. 단, * 표시 관세는 실행관세 등에 추가 부과 여부 확인",
    label: "1순위"
  },
  {
    rank: 2,
    codes: ["FCL1", "FAS1", "FSG1", "FEF1", "FIN1", "FEU1", "FPE1", "FUS1", "FTR1", "FAU1", "FCA1", "FCO1", "FCN1", "FVN1", "FNZ1"],
    keywords: ["FTA", "칠레", "아세안", "싱가포르", "EFTA", "인도", "EU", "페루", "미국", "튀르키예", "호주", "캐나다", "콜롬비아", "중국", "베트남", "뉴질랜드"],
    condition: "3~7순위 세율보다 낮은 경우 우선 적용",
    label: "2순위"
  },
  {
    rank: 3,
    codes: ["C", "CIT", "D", "E1", "E2", "E3", "G", "F", "N", "W1", "W2"],
    keywords: ["WTO", "양허", "개도국", "아태협정", "유엔무역개발회의", "국제협력관세", "편익관세"],
    condition: "4~7순위보다 낮은 경우 우선 적용. W1/W2는 6,7순위보다 우선",
    label: "3순위"
  },
  {
    rank: 4,
    codes: ["L", "P"],
    keywords: ["조정관세(제69조) 제1호", "조정관세(제69조) 제3호", "조정관세(제69조) 제4호", "할당관세"],
    condition: "조정관세는 5~7순위보다 우선. 할당관세는 5순위보다 낮은 경우 우선 적용하고 6,7순위보다 우선",
    label: "4순위"
  },
  {
    rank: 5,
    codes: ["R"],
    keywords: ["최빈개발도상국", "특혜관세"],
    condition: "6,7순위보다 우선 적용",
    label: "5순위"
  },
  {
    rank: 6,
    codes: ["B"],
    keywords: ["잠정관세"],
    condition: "7순위보다 우선 적용",
    label: "6순위"
  },
  {
    rank: 7,
    codes: ["A"],
    keywords: ["기본관세"],
    condition: "다른 우선 적용 세율이 없을 때 적용",
    label: "7순위"
  }
];

function headingCode(code) {
  return String(code).replace(/\D/g, "").slice(0, 4);
}

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^0-9a-zA-Z가-힣]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !stopWords.has(token));
}

function findGuideForCode(code) {
  return profiles.find((profile) => headingCode(profile.hs) === code);
}

function guideMatches(text) {
  const lower = text.toLowerCase();
  return profiles.map((profile) => ({
    profile,
    terms: profile.match.filter((word) => lower.includes(word.toLowerCase()))
  })).filter((item) => item.terms.length);
}

function scoreTariffEntry(entry, tokens, text, guides) {
  const lowerTerm = `${entry.code} ${entry.term}`.toLowerCase();
  let score = 0;
  const matchedTerms = [];

  tokens.forEach((token) => {
    if (lowerTerm.includes(token)) {
      score += token.length >= 4 ? 3 : 2;
      matchedTerms.push(token);
    }
  });

  if (text.includes(entry.code)) {
    score += 8;
    matchedTerms.push(entry.code);
  }

  guides.forEach((guide) => {
    if (headingCode(guide.profile.hs) === entry.code) {
      score += guide.terms.length * 5;
      matchedTerms.push(...guide.terms);
    }
  });

  return { score, matchedTerms: [...new Set(matchedTerms)] };
}

function pickProfile(text) {
  const normalizedText = text.toLowerCase();
  const tokens = tokenize(text);
  const guides = guideMatches(text);

  if (!tariffData.length) {
    return {
      ...fallbackProfile,
      matchedTerms: [],
      score: 0,
      rivals: fallbackProfile.rivals
    };
  }

  const scored = tariffData.map((entry) => {
    const result = scoreTariffEntry(entry, tokens, normalizedText, guides);
    return { ...entry, ...result };
  }).filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.code.localeCompare(b.code));

  if (!scored.length) {
    return {
      ...fallbackProfile,
      matchedTerms: [],
      score: 0,
      rivals: tariffData.slice(0, 5).map((entry) => [entry.code, entry.term, "입력 정보와 직접 매칭되지 않아 통칙과 호의 용어 기준으로 재검색이 필요합니다."])
    };
  }

  const top = scored[0];
  const guide = findGuideForCode(top.code);
  const rivals = scored.slice(1, 6).map((entry) => [
    entry.code,
    entry.term,
    `관세율표 p.${entry.page} 호의 용어와 입력 신호(${entry.matchedTerms.join(", ") || "간접 매칭"})를 비교 검토`
  ]);
  const confidence = top.score >= 16 ? "높음" : top.score >= 8 ? "중간" : "낮음";

  return {
    hs: top.code,
    title: top.term,
    confidence,
    basis: `관세율표 전체 ${tariffData.length}개 4단위 호 중 입력 정보와 가장 강하게 매칭된 후보입니다. 관세율표 p.${top.page}의 호의 용어를 기준으로 통칙, 관련 부주·류주, 호의 해설과 분류사례를 추가 검토해야 합니다.`,
    rivals: rivals.length ? rivals : fallbackProfile.rivals,
    requirements: guide ? guide.requirements : fallbackProfile.requirements,
    origin: guide ? guide.origin : fallbackProfile.origin,
    matchedTerms: top.matchedTerms,
    score: top.score,
    sourcePage: top.page
  };
}

function parsePercent(text) {
  const match = text.match(/-?\d+(\.\d+)?\s*%/);
  return match ? Number(match[0].replace("%", "").trim()) : null;
}

function findPriorityRule(line) {
  const upper = line.toUpperCase();
  return ratePriorityRules.find((rule) => {
    const codeMatched = rule.codes.some((code) => new RegExp(`(^|\\s)${code}(\\s|$)`, "i").test(upper));
    const keywordMatched = rule.keywords.some((keyword) => line.includes(keyword));
    return codeMatched || keywordMatched;
  });
}

function parseRateLookup(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const rule = findPriorityRule(line) || {
        rank: 99,
        label: "미분류",
        condition: "세율 코드가 우선순위표와 매칭되지 않아 수기 확인 필요"
      };
      return {
        line,
        rate: parsePercent(line),
        rule
      };
    });
}

function pickExecutionCandidate(candidates) {
  if (!candidates.length) return null;
  const groupOne = candidates.filter((candidate) => candidate.rule.rank === 1);
  if (groupOne.length) {
    return groupOne.reduce((best, candidate) => {
      if (best.rate === null) return candidate;
      if (candidate.rate === null) return best;
      return candidate.rate > best.rate ? candidate : best;
    }, groupOne[0]);
  }

  return candidates.reduce((best, candidate) => {
    if (best.rate === null && candidate.rate !== null) return candidate;
    if (candidate.rate === null) return best;
    if (candidate.rate < best.rate) return candidate;
    if (candidate.rate === best.rate && candidate.rule.rank < best.rule.rank) return candidate;
    return best;
  }, candidates[0]);
}

function rateRows(profile, countryCode, originCountry, lookupText) {
  const candidates = parseRateLookup(lookupText);
  const executionCandidate = pickExecutionCandidate(candidates);

  if (!candidates.length) {
    return [
      {
        hs: profile.hs,
        candidate: "Uni-pass 세번조회 결과 입력 필요",
        priority: "세율적용우선순위.xlsx 기준 검토 대기",
        condition: "관세법령정보포털 CLIP에서 세번·상품검색으로 HS 코드별 세율 상세정보를 조회",
        execution: "조회값 입력 후 산정",
        note: `${countries[countryCode]} 수입, ${originCountry} 원산지 기준으로 실제 고시세율을 확인해야 합니다.`
      },
      ...profile.rivals.map((item) => ({
        hs: item[0],
        candidate: "경합 세번도 Uni-pass에서 각각 조회",
        priority: "동일 우선순위표 적용",
        condition: "경합 코드 확정 가능성이 있으면 코드별 세율 상세정보 비교",
        execution: "세번 확정 후 산정",
        note: "추천 코드와 경합 코드의 실행세율 차이는 조회값 입력 후 비교합니다."
      }))
    ];
  }

  return [
    ...candidates.map((candidate) => ({
      hs: profile.hs,
      candidate: candidate.line,
      priority: candidate.rule.label,
      condition: candidate.rule.condition,
      execution: candidate === executionCandidate ? "실행세율 후보" : "경합 세율",
      note: candidate === executionCandidate ? "입력된 조회값 중 우선순위 조건상 적용 후보" : "더 우선하거나 더 낮은 조건부 세율 존재 여부 확인"
    })),
    ...profile.rivals.map((item) => ({
      hs: item[0],
      candidate: "경합 세번은 별도 조회 필요",
      priority: "동일 우선순위표 적용",
      condition: "경합 코드의 세율 상세정보를 Uni-pass에서 다시 조회",
      execution: "세번 확정 후 산정",
      note: "경합 코드가 최종 분류될 경우 해당 코드의 후보세율로 실행세율을 재산정합니다."
    }))
  ];
}

function renderPrinciples(profile) {
  const signalText = profile.matchedTerms.length
    ? `감지 신호: ${profile.matchedTerms.join(", ")}`
    : "감지 신호 부족: 물품명, 기능, 재질, 용도 정보를 더 구체화해야 합니다.";

  refs.principleBody.innerHTML = classificationPrinciples.map((item) => `
    <article class="principle-card">
      <div class="principle-index">${item.step}</div>
      <div>
        <h4>${item.title}</h4>
        <p class="principle-source">${item.source}</p>
        <p>${item.detail}</p>
      </div>
    </article>
  `).join("") + `
    <article class="principle-card principle-emphasis">
      <div class="principle-index">결론</div>
      <div>
        <h4>${profile.hs} ${profile.title}</h4>
        <p class="principle-source">${signalText}</p>
        <p>현재 앱의 추천은 초안입니다. 최종 분류는 통칙, 관련 부주·류주, 호의 용어, 호의 해설, 경합 세번 배제, 첨부 분류사례 대조가 모두 기록된 뒤 확정하는 흐름으로 설계합니다.</p>
      </div>
    </article>
  `;
}

function renderAnalysis() {
  const product = refs.productName.value.trim() || "미기재 물품";
  const countryCode = refs.country.value;
  const country = countries[countryCode];
  const originCountry = refs.originCountry.value.trim() || "원산지 미기재";
  const joinedText = [product, refs.useCase.value, refs.functionText.value, refs.materialText.value, refs.notes.value].join(" ");
  const profile = pickProfile(joinedText);
  const evidenceItems = sourceFiles.map((file, index) => {
    const tag = index < 2 ? "관세율표" : index > 7 ? "분류사례" : "전문자료";
    return `<li><span class="tag">${tag}</span>${file}에서 관련 용어, 주기능, 유사 품목 판단 기준을 확인하는 근거 슬롯</li>`;
  }).join("");

  refs.resultTitle.textContent = `${product} 검토 결과`;
  refs.primaryHs.textContent = profile.hs;
  refs.confidence.textContent = `분류 확신도: ${profile.confidence}`;
  refs.countryLabel.textContent = country;
  refs.rateSummary.textContent = `${country} 수입, ${originCountry} 원산지 기준`;
  renderPrinciples(profile);

  refs.classificationBody.classList.remove("empty-state");
  refs.classificationBody.innerHTML = `
    <p><strong>추천 분류:</strong> HS ${profile.hs} ${profile.title}</p>
    <p><strong>입력 신호:</strong> ${profile.matchedTerms.length ? profile.matchedTerms.join(", ") : "특정 후보와 직접 연결되는 키워드가 부족합니다."}</p>
    <p><strong>통칙 우선 판단:</strong> 2026 관세율표 법령집 주HS 1.0.4 p.20-37의 통칙을 먼저 적용합니다. 통칙 제1호에 따라 호의 용어와 관련 부주·류주를 우선 검토하고, 물품의 상태나 구성에 따라 통칙 제2호~제6호 적용 여부를 확인합니다.</p>
    <p><strong>핵심 판단:</strong> ${profile.basis}</p>
    <p><strong>검토 논리:</strong> 물품명, 용도, 기능, 재질 정보를 종합하되, 키워드 매칭만으로 확정하지 않습니다. 관련 부주·류주, 호의 용어, 호의 해설, 경합 세번 배제 사유, 첨부 분류사례를 순서대로 검토해야 합니다.</p>
    <ul class="evidence-list">${evidenceItems}</ul>
  `;

  refs.rivalBody.innerHTML = profile.rivals.map((item) => `
    <article class="rival-card">
      <h4><span class="tag warn">${item[0]}</span>${item[1]}</h4>
      <p>${item[2]}</p>
    </article>
  `).join("");

  refs.rateTable.innerHTML = rateRows(profile, countryCode, originCountry, refs.rateLookupText.value).map((row, index) => `
    <tr>
      <td><strong>${row.hs}</strong>${index === 0 ? " <span class=\"tag\">추천</span>" : ""}</td>
      <td>${row.candidate}</td>
      <td>${row.priority}</td>
      <td>${row.condition}</td>
      <td><strong>${row.execution}</strong></td>
      <td>${row.note}</td>
    </tr>
  `).join("");

  refs.requirementsList.innerHTML = profile.requirements.map((item) => `<li>${item}</li>`).join("");
  refs.originBody.innerHTML = `
    <p><strong>표기 필요성:</strong> 수입 물품은 원칙적으로 원산지 표시 검토가 필요합니다.</p>
    <p><strong>표시 방법:</strong> ${profile.origin}</p>
    <p><strong>확인 포인트:</strong> 제조국, 최종 실질적 변형 국가, 포장 단위, 소비자에게 전달되는 표시 위치를 함께 확인합니다.</p>
  `;

  refs.opinionText.textContent = buildOpinion(product, country, originCountry, profile);
}

function buildOpinion(product, country, originCountry, profile) {
  const today = new Date().toISOString().slice(0, 10);
  return `품목분류 검토 의견서

작성일자: ${today}
수입국가: ${country}
원산지/수출국: ${originCountry}
검토물품: ${product}

1. 물품 설명
- 용도: ${refs.useCase.value.trim()}
- 기능: ${refs.functionText.value.trim()}
- 재질 및 구성: ${refs.materialText.value.trim()}
- 추가 설명: ${refs.notes.value.trim()}

2. 검토 분류
- 추천 HS 코드: ${profile.hs}
- 품명: ${profile.title}

3. 분류 원칙 검토
- 2026 관세율표 법령집 주HS 1.0.4 p.20-37의 통칙을 우선 적용한다.
- 통칙 제1호에 따라 호의 용어와 관련 부주·류주를 먼저 검토한다.
- 물품이 미완성품, 혼합물, 복합물품, 세트물품 또는 포장용기와 함께 제시된 물품인지 확인하고 통칙 제2호~제6호 적용 가능성을 검토한다.
- 관련 부주·류주에서 포함 또는 제외 규정이 있는지 확인한다.
- 후보 호의 용어와 호의 해설을 대조하여 포함 물품과 제외 물품을 확인한다.
- 경합 세번은 더 구체적인 호, 본질적 특성, 최후 순위 호 등 통칙상 기준으로 배제한다.
- 첨부 분류사례와 표준해석 지침은 보조 근거로 대조하되, 통칙과 주·호의 용어 판단을 대체하지 않는다.

4. 분류 근거
${profile.basis}
본 물품은 제출된 물품 설명, 사진, 구성요소, 용도 및 기능을 기준으로 객관적 특성을 검토하였다. 다만 최종 세번 확정은 통칙, 관련 부주·류주, 호의 용어, 호의 해설, 경합 세번 배제, 첨부 분류사례 대조 순서로 검토하여야 한다.

5. 경합 세번
${profile.rivals.map((item) => `- ${item[0]} ${item[1]}: ${item[2]}`).join("\n")}

6. 수입 요건 및 표시
${profile.requirements.map((item) => `- ${item}`).join("\n")}
- 원산지 표시: ${profile.origin}

7. 세율 적용 우선순위 및 실행세율
- 세율은 기본세율을 곧바로 적용하지 않고, Uni-pass 관세법령정보포털 CLIP의 세번조회에서 해당 HS 코드의 세율 상세정보를 먼저 확인한다.
- 동일 물품에 둘 이상의 세율이 경합하는 경우 세율적용우선순위.xlsx의 순서에 따라 하나의 세율을 실행세율로 판단한다.
- 1순위 세율은 가장 우선하여 적용하고, FTA 세율은 2순위이나 3~7순위보다 낮은 경우에 우선 적용한다. WTO/아태/편익관세, 조정·할당관세, 최빈국특혜, 잠정관세, 기본관세는 우선순위표의 조건에 따라 순차 검토한다.
- 단, * 표시 관세는 실행관세 등에 추가하여 부과될 수 있으므로 세율 상세정보의 부가 조건을 별도로 확인한다.

8. 유의사항
본 의견서는 앱 프로토타입이 생성한 초안이며, 실제 신고 전에는 최신 관세율표, 수입국 세율 DB, 세관 질의회신, 인증기관 요건을 통해 최종 확인이 필요하다.`;
}

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`#${button.dataset.tab}`).classList.add("active");
  });
});

refs.photoInput.addEventListener("change", () => {
  const file = refs.photoInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    refs.photoPreview.innerHTML = `<img src="${reader.result}" alt="업로드한 물품 사진">`;
  };
  reader.readAsDataURL(file);
});

refs.analyzeBtn.addEventListener("click", renderAnalysis);

refs.copyOpinionBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(refs.opinionText.textContent);
    refs.copyOpinionBtn.textContent = "복사됨";
  } catch (error) {
    refs.copyOpinionBtn.textContent = "직접 선택해 복사";
  }
  window.setTimeout(() => {
    refs.copyOpinionBtn.textContent = "의견서 복사";
  }, 1400);
});

renderAnalysis();
