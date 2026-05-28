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
  "2026 관세율표 법령집 주HS 1.0.4",
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

const profiles = [
  {
    match: ["배터리", "리튬", "충전", "축전지"],
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
  }
];

const fallbackProfile = {
  hs: "8543.70",
  title: "고유 기능을 가진 기타 전기기기",
  confidence: "검토 필요",
  basis: "제공 정보만으로 특정 호가 확정되지 않을 때는 물품의 객관적 특성, 주기능, 구성요소, 용도 설명을 기준으로 기타 전기기기 해당 여부를 우선 검토합니다.",
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

function pickProfile(text) {
  const lower = text.toLowerCase();
  return profiles.find((profile) => profile.match.some((word) => lower.includes(word.toLowerCase()))) || fallbackProfile;
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

  refs.classificationBody.classList.remove("empty-state");
  refs.classificationBody.innerHTML = `
    <p><strong>추천 분류:</strong> HS ${profile.hs} ${profile.title}</p>
    <p><strong>핵심 판단:</strong> ${profile.basis}</p>
    <p><strong>검토 논리:</strong> 물품명, 용도, 기능, 재질 정보를 종합하면 주기능과 객관적 특성이 분류 판단의 중심입니다. 사진 정보는 외관, 포장, 표시사항, 구성품 확인 자료로 사용합니다.</p>
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

3. 분류 근거
${profile.basis}
본 물품은 제출된 물품 설명, 사진, 구성요소, 용도 및 기능을 기준으로 객관적 특성을 검토하였다. 제공 PDF 자료의 품목별 해설, 표준해석 지침, 세관분류사례 양식을 참조하여 주기능 중심으로 판단한다.

4. 경합 세번
${profile.rivals.map((item) => `- ${item[0]} ${item[1]}: ${item[2]}`).join("\n")}

5. 수입 요건 및 표시
${profile.requirements.map((item) => `- ${item}`).join("\n")}
- 원산지 표시: ${profile.origin}

6. 세율 적용 우선순위 및 실행세율
- 세율은 기본세율을 곧바로 적용하지 않고, Uni-pass 관세법령정보포털 CLIP의 세번조회에서 해당 HS 코드의 세율 상세정보를 먼저 확인한다.
- 동일 물품에 둘 이상의 세율이 경합하는 경우 세율적용우선순위.xlsx의 순서에 따라 하나의 세율을 실행세율로 판단한다.
- 1순위 세율은 가장 우선하여 적용하고, FTA 세율은 2순위이나 3~7순위보다 낮은 경우에 우선 적용한다. WTO/아태/편익관세, 조정·할당관세, 최빈국특혜, 잠정관세, 기본관세는 우선순위표의 조건에 따라 순차 검토한다.
- 단, * 표시 관세는 실행관세 등에 추가하여 부과될 수 있으므로 세율 상세정보의 부가 조건을 별도로 확인한다.

7. 유의사항
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
