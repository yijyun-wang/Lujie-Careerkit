import type { InterviewPreparation } from "./interview-preparation";
import type {
  InterviewAnswers,
  InterviewQuestion,
  InterviewReport,
} from "./interview";
import type { ApplicationRecord, JobRecord, ResumeContent } from "./types";

type SampleResumeVersion = {
  id: string;
  jobId: string | null;
  name: string;
  summary: string;
  content: ResumeContent;
};

export const sampleResume: ResumeContent = {
  basics: {
    name: "",
    email: "",
    phone: "",
    city: "",
    links: [],
  },
  profile: {
    title: "AI 資料與模型評測方向",
    summary:
      "資訊工程學系大學部在學，具備大型語言模型資料分析、品質評測與推薦系統實驗經驗，能夠使用 SQL / Python 完成資料診斷，並將分析結論轉化為可執行的產品改進方案。",
  },
  education: [],
  experiences: [],
  internships: [],
  projects: [],
  skills: [],
  awards: [],
  selfReview: "",
};

const jiangHeResume: ResumeContent = {
  editor: {
    displayName: "姜禾的履歷",
    template: "academic",
    themeConfig: {
      primaryColor: "#111827",
      accentColor: "#315f92",
      fontFamily: "Inter",
      fontSize: "medium",
      logoSize: "medium",
      lineSpacing: 1.5,
      margin: {
        top: 20,
        right: 24,
        bottom: 20,
        left: 24,
      },
      sectionSpacing: 16,
      avatarStyle: "oneInch",
    },
  },
  basics: {
    name: "姜禾",
    email: "jianghe@example.com",
    phone: "0912-345-678",
    city: "新竹市",
    links: ["github.com/jianghe", "portfolio.example.com"],
  },
  profile: {
    title: "",
    summary: "",
  },
  education: [
    {
      school: "國立清華大學",
      degree: "學士",
      major: "資訊工程學系",
      start: "2023",
      end: "2027",
      highlights: [
        "GPA 3.8/4.0",
        "核心課程：資料結構、資料庫、機器學習、軟體工程",
      ],
    },
  ],
  experiences: [
    {
      company: "校內創新實驗室",
      role: "演算法實驗助理",
      start: "2024-10",
      end: "至今",
      highlights: [
        "圍繞校園知識問答場景拆解使用者需求，設計意圖分類、失敗樣本歸因和離線評測方案，整理 6 類核心問題標籤。",
        "協調 4 名成員完成 3 輪原型驗證，建立實驗記錄與指標看板，將單輪評測整理時間由 2 天縮短至 4 小時。",
      ],
    },
  ],
  internships: [
    {
      company: "Appier",
      role: "機器學習工程實習生",
      start: "2025-06",
      end: "2025-09",
      highlights: [
        "使用 SQL / Python 清洗並分析 18,000 餘條使用者回饋與模型呼叫記錄，建立問題類型、影響場景和嚴重程度三層標籤體系。",
        "抽樣複核 1,200 條回答並組織雙人一致性校驗，定位知識時效、指令遵循和安全拒答三類高頻失敗，形成每週品質看板。",
        "將分析結論整理為問題說明、影響範圍、候選方案和驗收指標，協同產品與演算法推進 2 項優化進入迭代時程。",
      ],
    },
  ],
  projects: [
    {
      name: "課程推薦系統實驗",
      role: "演算法與評估負責人",
      highlights: [
        "基於 12,000 餘條匿名課程互動記錄完成資料清洗、特徵分析與冷啟動規則設計，明確點選率和 Recall@20 為核心離線指標。",
        "使用 Python 搭建協同過濾基線並完成分層評測，Recall@20 相比熱門推薦基線提升 8.7%。",
        "透過誤差分析發現新使用者覆蓋不足，補充科系與年級特徵後改善冷啟動結果，並將實驗過程整理為可重現的實驗報告。",
      ],
    },
  ],
  skills: ["Python", "PyTorch", "機器學習", "推薦系統", "SQL", "資料分析"],
  awards: ["書卷獎（系排前 5%）", "系學會幹部"],
  selfReview:
    "對資料品質和模型效果問題保持敏感，習慣先定義業務目標與驗收標準，再透過資料驗證判斷。能夠在技術細節與產品表達之間切換，並主動記錄假設、證據和回顧結論。",
};

export const sampleResumeVersions: SampleResumeVersion[] = [
  {
    id: "rv-baidu-ai-original",
    jobId: null,
    name: "姜禾的履歷",
    summary: "範例履歷",
    content: jiangHeResume,
  },
];

export const sampleTailoredResumeVersion = {
  id: "rv-baidu-ai-tailored",
  jobId: "cmqgua8t70000a0cwl8o3xqwn",
  name: "JD比對優化-姜禾-Appier AI資料產品實習生",
  summary: "突出 AI 資料、效果評估與跨團隊協作證據的職缺客製版本。",
  content: {
    ...jiangHeResume,
    editor: {
      ...jiangHeResume.editor,
      displayName: "JD比對優化-姜禾-Appier AI資料產品實習生",
    },
    profile: {
      title: "AI 資料產品實習生",
      summary:
        "資訊工程學系大學部在學，具備大型語言模型資料分析、品質評測與產品迭代經驗。曾分析 18,000 餘條回饋和呼叫記錄、複核 1,200 條模型回答，並推動 2 項優化排入開發時程；能夠使用 SQL / Python 把使用者問題轉化為可驗證的資料方案。",
    },
    skills: [
      "Python",
      "SQL",
      "資料分析",
      "大型語言模型評測",
      "機器學習",
      "跨團隊協作",
    ],
    _tailoringBaseResume: jiangHeResume,
    _optimizationMeta: {
      company: "Appier",
      title: "AI 資料產品實習生",
      keywords: ["AI 資料", "模型評測", "資料分析", "跨團隊協作"],
      summary: "圍繞 AI 資料產品職缺重排履歷重點，保留原有事實。",
      changes: [
        "用資料規模、評測方法和推進結果補強 Appier 實習證據",
        "將大型語言模型資料品質與推薦系統評測經歷前置",
        "圍繞資料分析、模型評測和跨團隊推進統一職缺關鍵字",
      ],
      versionName: "JD比對優化-姜禾-Appier AI資料產品實習生",
    },
  } as ResumeContent,
};

export const sampleJobs: JobRecord[] = [
  {
    id: "cmqgzt65k0003a0cwskeetbo1",
    company: "91APP",
    title: "後端工程師（實習）",
    city: "台北市",
    source: "104人力銀行",
    link: "https://www.91app.com/careers/",
    deadline: "2026-11-18",
    jd: "工作內容：\n1. 參與電商平台與會員服務後端系統的設計、開發和維護；\n2. 使用 C# / Go 完成 API 開發、資料處理和效能優化；\n3. 與產品、前端和 QA 協作，排查線上問題並完善監控。\n條件要求：\n1. 資訊工程相關科系在學，熟悉資料結構、網路和作業系統基礎；\n2. 熟悉 MySQL、Redis，了解常見 Web 框架；\n3. 有課堂專題、開源貢獻或實習經驗者佳。\n工作待遇：時薪 NT$ 220 起，每週可出勤 3 天以上。",
  },
  {
    id: "cmqgua8t70000a0cwl8o3xqwn",
    company: "Appier",
    title: "AI 資料產品實習生",
    city: "台北市",
    source: "CakeResume",
    link: "https://www.appier.com/zh-tw/careers",
    deadline: "2026-11-20",
    jd: "工作內容：\n1. 參與大型語言模型資料產品的需求分析、方案設計和效果評估；\n2. 協助建置資料生產與品質評估流程，整理使用者回饋並形成迭代建議；\n3. 與演算法、工程和營運團隊合作推動功能上線與回顧。\n條件要求：\n1. 資訊工程、人工智慧或相關科系在學；\n2. 熟悉 SQL / Python，具備資料分析和結構化表達能力；\n3. 關注大型語言模型應用，有模型評測、資料治理或 AI 產品專案經驗者佳。\n工作待遇：時薪 NT$ 250 起。",
  },
  {
    id: "cmq1p2ksn0006ui8wbyrbxega",
    company: "聯發科技",
    title: "AI 軟體測試實習生",
    city: "新竹市",
    source: "1111人力銀行",
    link: "https://careers.mediatek.com/",
    deadline: "2026-11-22",
    jd: "工作內容：\n1. 參與 AI 平台與模型服務的測試計畫設計和測試案例執行；\n2. 建置介面、效能和穩定性自動化測試，追蹤缺陷至結案；\n3. 分析測試資料，協助定位模型效果與工程流程問題。\n條件要求：\n1. 熟悉軟體測試基礎、Python 和 Linux；\n2. 了解 API 測試、自動化測試或 CI/CD；\n3. 有機器學習基礎或 AI 應用測試經驗者佳。",
  },
  {
    id: "cmq1p21td0003ui8wzce4qda6",
    company: "趨勢科技",
    title: "生成式 AI 應用開發實習生",
    city: "台北市",
    source: "企業官網",
    link: "https://www.trendmicro.com/zh_tw/about/careers.html",
    deadline: "2026-11-25",
    jd: "工作內容：\n1. 參與生成式 AI 資安應用與工具鏈開發，完成需求拆解、程式開發和驗證；\n2. 優化模型呼叫、提示詞與評測流程，提升任務完成率和穩定性；\n3. 追蹤大型語言模型技術進展並整理可重複使用的工程元件。\n條件要求：\n1. 熟悉 Python，具備資料結構與演算法基礎；\n2. 了解大型語言模型推論、Agent 或 RAG 等技術；\n3. 有相關專題、競賽或開源經驗者佳。",
  },
  {
    id: "cmq1ox0mq0000ui8wt80spiuh",
    company: "LINE 台灣",
    title: "AI Agent 產品營運實習生",
    city: "台北市",
    source: "內部推薦",
    link: "https://careers.linecorp.com/",
    deadline: "2026-11-15",
    jd: "工作內容：\n1. 參與 AI Agent 產品的使用者營運、內容企劃與回饋蒐集；\n2. 結合使用資料和使用者訪談找出問題，推動產品體驗優化；\n3. 維護營運流程與知識庫，與產品和演算法團隊完成活動回顧。\n條件要求：\n1. 對 AI Agent 產品有持續使用和觀察；\n2. 具備資料分析、內容表達和跨團隊溝通能力；\n3. 有 AI 產品、社群或成長營運經驗者佳。",
  },
  {
    id: "job-meituan-backend",
    company: "Dcard",
    title: "後端工程實習生",
    city: "台北市",
    source: "Yourator",
    link: "https://about.dcard.tw/careers",
    deadline: "2026-11-28",
    jd: "工作內容：\n1. 參與社群平台後端服務和資料 API 開發；\n2. 負責服務監控、故障排除與效能優化；\n3. 與產品和 QA 協作，確保需求如期交付。\n條件要求：\n1. 熟悉 Go 或 Node.js、PostgreSQL 和常用資料結構；\n2. 了解快取、訊息佇列、高併發和 API 設計；\n3. 有完整後端專題或實習經驗者佳。\n工作待遇：月薪 NT$ 36,000 起（全職實習）。",
  },
];

export const sampleApplications: ApplicationRecord[] = [
  {
    id: "cmqgzt65v0005a0cw4gpgz37f",
    jobId: "cmqgzt65k0003a0cwskeetbo1",
    status: "INTERVIEW",
    interviewRound: "FIRST",
    resumeVersionId: null,
    appliedAt: "2026-09-03",
    stageDate: "2026-11-12",
    nextFollowUpAt: null,
    notes: "已加入投遞追蹤。",
  },
  {
    id: "cmqgua8tg0002a0cwscbuxxq1",
    jobId: "cmqgua8t70000a0cwl8o3xqwn",
    status: "ASSESSMENT",
    resumeVersionId: sampleTailoredResumeVersion.id,
    appliedAt: "2026-09-02",
    stageDate: "2026-09-08",
    nextFollowUpAt: "2026-11-10",
    notes: "已加入投遞追蹤。",
  },
  {
    id: "cmq1p2ksw0008ui8wf2yh55ri",
    jobId: "cmq1p2ksn0006ui8wbyrbxega",
    status: "REJECTED",
    resumeVersionId: null,
    appliedAt: "2026-09-01",
    stageDate: "2026-09-12",
    nextFollowUpAt: null,
    notes: "已加入投遞追蹤。",
  },
  {
    id: "cmq1p21tm0005ui8w3u1taqyh",
    jobId: "cmq1p21td0003ui8wzce4qda6",
    status: "OFFER",
    resumeVersionId: "rv-baidu-ai-original",
    appliedAt: "2026-09-02",
    stageDate: "2026-09-20",
    nextFollowUpAt: null,
    notes: "已收到offer",
  },
  {
    id: "cmq1ox0n40002ui8w0au2hlxb",
    jobId: "cmq1ox0mq0000ui8wt80spiuh",
    status: "APPLIED",
    resumeVersionId: null,
    appliedAt: "2026-09-05",
    stageDate: "2026-09-05",
    nextFollowUpAt: "2026-11-09",
    notes: "已加入投遞追蹤。",
  },
  {
    id: "app-meituan-backend",
    jobId: "job-meituan-backend",
    status: "ARCHIVED",
    resumeVersionId: null,
    appliedAt: "2026-09-01",
    stageDate: "2026-09-21",
    nextFollowUpAt: null,
    notes: "流程已結束，保留記錄用於回顧。",
  },
];

export const sampleInterviewPreparation = {
  id: "prep-baidu-ai-data",
  jobId: "cmqgua8t70000a0cwl8o3xqwn",
  resumeVersionId: sampleTailoredResumeVersion.id,
  mode: "comprehensive",
  context: {
    jd: sampleJobs[1].jd,
    resumeName: sampleTailoredResumeVersion.name,
    resume: sampleTailoredResumeVersion.content,
    focus: "comprehensive" as const,
    locale: "zh-TW" as const,
  },
  content: {
    meta: {
      company: "Appier",
      title: "AI 資料產品實習生",
      roleFamily: "AI 資料產品",
      roleSummary:
        "職缺串連使用者需求、資料生產和模型效果，需要能定義品質標準、分析失敗樣本，並協同演算法與工程把結論推進為可驗收的產品迭代。",
      assumptions: [
        "範例資料僅演示準備方法，真實面試前需核對最新工作內容、團隊業務和產品進展。",
        "履歷中的資料規模與結果均按範例候選人的既有材料作答，不在面試中延伸未驗證事實。",
      ],
    },
    capabilityProfile: {
      overview:
        "候選人的大型語言模型資料分析、失敗樣本歸因和跨團隊推進經歷與職缺高度相關；優勢是能夠從資料定位問題，主要短板是尚未獨立負責完整資料產品，需要用清晰的方法論證明可遷移能力。",
      dimensions: [
        {
          label: "資料分析",
          requirementLevel: "core",
          evidenceLevel: "strong",
          evidenceSummary: "使用 SQL / Python 分析 18,000 餘條業務記錄，並完成推薦系統分層評測。",
          nextStep: "準備欄位定義、清洗規則、異常處理和指標選擇的完整追問鏈路。",
        },
        {
          label: "模型評測",
          requirementLevel: "core",
          evidenceLevel: "strong",
          evidenceSummary: "複核 1,200 條回答、組織一致性校驗，並按失敗類型形成每週品質看板。",
          nextStep: "補充抽樣代表性、標註一致性閾值和線上指標聯動方式。",
        },
        {
          label: "產品思維",
          requirementLevel: "important",
          evidenceLevel: "partial",
          evidenceSummary: "能夠把分析結論整理為問題、影響範圍、方案與驗收指標，並推動 2 項優化時程。",
          nextStep: "明確為什麼優先做這兩項，以及上線後如何判斷改進有效。",
        },
        {
          label: "協作推進",
          requirementLevel: "important",
          evidenceLevel: "strong",
          evidenceSummary: "曾聯動產品和演算法對齊問題定義、優先順序和驗收標準。",
          nextStep: "準備一次存在分歧的具體場景，講清個人判斷、溝通和結果。",
        },
        {
          label: "AI 理解",
          requirementLevel: "bonus",
          evidenceLevel: "partial",
          evidenceSummary: "具備機器學習課程基礎、推薦系統實驗和真實大型語言模型業務資料經驗。",
          nextStep: "複習訓練資料、評測集與線上回饋的邊界，避免只談抽象概念。",
        },
      ],
    },
    evidenceMatrix: [
      {
        requirement: "資料分析與效果評估",
        resumeEvidence: ["分析 18,000 餘條回饋與呼叫記錄", "完成 1,200 條回答抽樣複核"],
        state: "direct",
        assessment: "具備從資料清洗、分類歸因到評測看板的直接證據。",
        action: "按目標、資料、方法、發現、決策和驗證六步複述 Appier 案例。",
      },
      {
        requirement: "跨團隊推進",
        resumeEvidence: ["將問題說明、影響範圍、候選方案與驗收指標寫入評審材料", "推動 2 項優化排入開發時程"],
        state: "direct",
        assessment: "能夠體現推動結果。",
        action: "講清產品與演算法最初的分歧、自己補充了什麼證據以及最終如何達成一致。",
      },
      {
        requirement: "AI 資料產品理解",
        resumeEvidence: ["大型語言模型業務失敗樣本歸因", "推薦系統離線評測與冷啟動分析"],
        state: "transferable",
        assessment: "技術背景可遷移，產品方法仍需顯性表達。",
        action: "用資料進入系統後的採集、生產、質檢、評測、上線回饋和迴流解釋完整閉環。",
      },
    ],
    knowledgeTopics: [
      {
        topic: "大型語言模型評測",
        priority: "must",
        whyRelevant: "職缺直接涉及效果評估。",
        explanation: "離線評測回答模型是否達到既定標準，線上指標驗證真實使用者價值；人工評測用於覆蓋幫助度、安全性等難以完全自動化的維度。",
        currentEvidence: "有抽樣複核、失敗分類與一致性校驗經驗。",
        targetLevel: "能夠從業務目標出發設計樣本、維度、評分規則、一致性檢查和結果迴流。",
        selfCheckQuestions: ["如何保證評測集具有代表性？", "評分者意見不一致時如何處理？", "離線分數提升但使用者投訴增加時如何判斷？"],
      },
      {
        topic: "資料品質",
        priority: "must",
        whyRelevant: "資料生產品質影響模型表現。",
        explanation: "從完整性、準確性、一致性、覆蓋度、時效性和合規性定義品質，並區分採集、清洗、標註、儲存和模型消費各環節責任。",
        currentEvidence: "有三層標籤、抽樣複核和雙人一致性檢查經驗。",
        targetLevel: "能夠為一個具體場景給出品質指標、抽檢策略、異常升級和閉環機制。",
        selfCheckQuestions: ["低頻高風險樣本如何進入抽檢？", "如何區分標註噪聲和模型能力問題？", "品質規則變化後如何重算歷史資料？"],
      },
      {
        topic: "產品閉環",
        priority: "should",
        whyRelevant: "職缺需要推動迭代。",
        explanation: "從使用者場景與業務目標出發，把問題量化為指標，再透過方案評審、灰度驗證和回顧形成可持續迭代。",
        currentEvidence: "有問題歸因、影響評估和推動時程經歷，尚缺獨立負責上線後的完整證據。",
        targetLevel: "能夠區分使用者回饋、問題現象和根因，並說明優先順序與驗收標準。",
        selfCheckQuestions: ["如何比較頻率低但風險高的問題？", "方案上線後應看領先指標還是結果指標？"],
      },
    ],
    deepDives: [
      {
        resumeItem: "Appier 機器學習工程實習",
        whyRelevant: "最接近目標職缺場景。",
        personalContributionFocus: "標籤體系設計、SQL / Python 分析、失敗樣本複核以及評審材料整理。",
        likelyFollowUps: ["18,000 條資料包含哪些欄位？", "1,200 條樣本如何抽取？", "兩項建議為什麼優先？", "你如何證明問題不是偶發現象？"],
        factsToConfirm: ["抽樣分層與一致性計算方式", "兩項優化的實際驗收指標", "本人和導師各自負責邊界"],
      },
      {
        resumeItem: "課程推薦系統實驗",
        whyRelevant: "可驗證資料分析與產品判斷。",
        personalContributionFocus: "資料清洗、基線搭建、Recall@20 分層評測和冷啟動誤差分析。",
        likelyFollowUps: ["為什麼選擇 Recall@20？", "如何避免資料洩漏？", "8.7% 提升如何計算？", "冷啟動規則有什麼代價？"],
        factsToConfirm: ["訓練驗證切分方式", "熱門推薦基線定義", "冷啟動特徵的可用性"],
      },
    ],
    targetedQuestions: [
      {
        question: "請用兩分鐘介紹你與 AI 資料產品最相關的經歷。",
        category: "自我介紹",
        preparationDirection: "圍繞 Appier 實習與資料閉環展開。",
        priority: "must",
      },
      {
        question: "為什麼選擇 AI 資料產品方向？",
        category: "職缺動機",
        preparationDirection: "串連技術背景、使用者價值和長期興趣。",
        priority: "must",
      },
      {
        question: "你會如何設計一套大型語言模型回答品質評測方案？",
        category: "專業能力",
        preparationDirection: "說明指標、樣本、人工標準和回顧。",
        priority: "must",
      },
      {
        question: "舉例說明你如何把分析結論推動到產品迭代。",
        category: "專案深挖",
        preparationDirection: "強調個人貢獻與協作過程。",
        priority: "must",
      },
      {
        question: "當演算法與產品對優先順序判斷不一致時你會怎麼做？",
        category: "行為面試",
        preparationDirection: "用事實、目標和小規模驗證推進共識。",
        priority: "should",
      },
      {
        question: "你會向面試官了解哪些團隊資訊？",
        category: "面試反問",
        preparationDirection: "關注資料閉環、實習生職責和評價標準。",
        priority: "should",
      },
    ],
    preparationPlan: {
      mustPrepare: ["90 秒職缺客製自我介紹", "Appier 實習完整追問鏈路", "大型語言模型評測方案", "資料品質歸因框架"],
      shouldPrepare: ["推薦系統專案的指標選擇與失敗嘗試", "跨團隊分歧案例", "職缺動機與 Appier 業務理解"],
      optional: ["近期體驗過的 AI 資料產品及改進建議", "可向面試官確認的團隊協作與評價機制"],
    },
    selfIntroduction:
      "面試官您好，我是姜禾，目前就讀於國立清華大學資訊工程學系。過去的經歷主要圍繞資料如何幫助模型和產品做出更可靠的判斷展開。在 Appier 實習期間，我使用 SQL 和 Python 分析 18,000 餘條使用者回饋與呼叫記錄，抽樣複核 1,200 條回答，建立問題類型、影響場景和嚴重程度三層標籤，並協同產品與演算法推動 2 項優化排入開發時程。在課程推薦系統中，我負責資料清洗和離線評測，透過分層誤差分析改善冷啟動表現。這些經歷讓我確認自己希望做串連使用者問題、資料方法和模型效果的 AI 資料產品工作，也期待在這個職缺上進一步參與完整的資料生產與評測閉環。",
    reverseQuestions: [
      "團隊當前的資料產品主要服務哪些模型或業務場景，最希望優先解決的品質問題是什麼？",
      "這個職缺會如何與演算法、工程和營運協作，實習生能否參與從問題定義到上線回顧的完整環節？",
      "如果我加入團隊，前三個月最重要的交付物和評價標準分別是什麼？",
    ],
  } satisfies InterviewPreparation,
};

export const sampleInterviewSession = {
  id: "interview-baidu-ai-data",
  jobId: "cmqgua8t70000a0cwl8o3xqwn",
  resumeVersionId: sampleTailoredResumeVersion.id,
  mode: "comprehensive",
  status: "COMPLETED",
  context: {
    company: "Appier",
    title: "AI 資料產品實習生",
    jd: sampleJobs[1].jd,
    resumeName: sampleTailoredResumeVersion.name,
    resume: sampleTailoredResumeVersion.content,
  },
  questions: [
    {
      id: "q-1",
      category: "self-introduction",
      prompt: "請用兩分鐘介紹你與 AI 資料產品最相關的經歷。",
      focus: "自我介紹",
      order: 0,
    },
    {
      id: "q-2",
      category: "motivation",
      prompt: "為什麼選擇 AI 資料產品方向和這個職缺？",
      focus: "職缺動機",
      order: 1,
    },
    {
      id: "q-3",
      category: "professional",
      prompt: "你會如何設計一套大型語言模型回答品質評測方案？",
      focus: "模型評測",
      order: 2,
    },
    {
      id: "q-4",
      category: "project",
      prompt: "請深挖一次你把資料分析結論推動到迭代時程的經歷。",
      focus: "專案職責",
      order: 3,
    },
    {
      id: "q-5",
      category: "professional",
      prompt: "你如何判斷資料品質問題來自採集、標註還是模型環節？",
      focus: "專業能力",
      order: 4,
    },
    {
      id: "q-6",
      category: "behavioral",
      prompt: "當團隊成員對問題優先順序意見不一致時，你會怎麼推進？",
      focus: "團隊協作",
      order: 5,
    },
    {
      id: "q-7",
      category: "failure",
      prompt: "分享一次分析結論沒有達到預期的經歷，以及你的回顧。",
      focus: "失敗回顧",
      order: 6,
    },
    {
      id: "q-8",
      category: "reverse-question",
      prompt: "你還有什麼問題想向面試官了解？",
      focus: "面試反問",
      order: 7,
    },
  ] satisfies InterviewQuestion[],
  answers: {
    "q-1": {
      questionId: "q-1",
      content:
        "面試官您好，我是姜禾，目前就讀於國立清華大學資訊工程學系。我的核心經歷是把模型問題轉化為可分析的資料，再把分析結論推進為產品改進。在 Appier 實習期間，我使用 SQL 和 Python 清洗並分析 18,000 餘條使用者回饋與呼叫記錄，抽樣複核 1,200 條回答，建立問題類型、影響場景和嚴重程度三層標籤。基於這些證據，我協同產品和演算法推動了 2 項優化排入開發時程。課程專案中，我還負責推薦系統的資料清洗和離線評測，透過誤差分析改善冷啟動表現。因為這些經歷，我希望繼續從事串連使用者需求、資料品質和模型效果的 AI 資料產品工作。",
      skipped: false,
      updatedAt: "2026-08-20T10:00:00.000Z",
    },
    "q-2": {
      questionId: "q-2",
      content:
        "我選擇 AI 資料產品，不是因為它只是 AI 和產品的組合，而是因為這個職缺需要把使用者表達不清的問題轉化為可定義、可採集、可評測的資料任務。我在 Appier 實習時發現，同一個「回答不好」的回饋，背後可能是知識過期、指令遵循不足或安全策略誤判，只有建立清晰的標籤和評測標準，演算法與產品才能討論同一個問題。這個過程很符合我的優勢：我有資訊工程與機器學習基礎，能夠理解模型邊界，也願意透過資料分析和跨團隊溝通推動落實。Appier 擁有大規模的行銷與廣告 AI 應用場景，我希望進一步學習如何把離線品質、線上回饋和產品決策串連成完整循環。",
      skipped: false,
      updatedAt: "2026-08-20T10:05:00.000Z",
    },
    "q-3": {
      questionId: "q-3",
      content:
        "我會先明確評測服務的業務決策，例如比較兩個模型版本，還是判斷一個版本能否上線；目標不同，指標權重也不同。第二步按真實流量、核心場景和高風險長尾分層抽樣，建立凍結測試集，並單獨維護從線上投訴迴流的挑戰集。第三步把品質拆成事實準確、指令遵循、幫助度、安全性和穩定性，為每個維度給出正反例和可操作的評分錨點。主觀題採用雙人盲評，計算一致性，分歧樣本交由第三人仲裁。自動指標適合做大規模篩查，但不能替代人工判斷。最後我會同時看總體分、關鍵場景最低線和錯誤分佈，並與採納率、重試率、投訴率等線上指標交叉驗證。每次版本回顧後把新失敗樣本回流到挑戰集，避免評測集只覆蓋舊問題。",
      skipped: false,
      updatedAt: "2026-08-20T10:10:00.000Z",
    },
    "q-4": {
      questionId: "q-4",
      content:
        "在 Appier 實習中，團隊收到的使用者回饋比較分散，大家知道模型存在問題，但很難判斷先改什麼。我的任務是把回饋變成可比較的證據。我先用 SQL 合併 18,000 餘條回饋和呼叫記錄，再抽樣複核 1,200 條回答，按問題類型、影響場景和嚴重程度建立三層標籤。分析後發現，知識時效問題頻率高但集中在少數場景，而指令遵循問題覆蓋更廣、對任務完成率影響更直接。我把結論整理成問題定義、代表案例、影響範圍、候選方案和驗收指標，並與產品、演算法逐項核對。評審中有人擔心樣本偏差，我補做了按入口和使用者類型的分層校驗。最終團隊優先排入兩項改進。我的貢獻不是決定演算法方案，而是讓優先順序討論建立在統一、可複核的資料證據上。",
      skipped: false,
      updatedAt: "2026-08-20T10:15:00.000Z",
    },
    "q-5": {
      questionId: "q-5",
      content:
        "我會先把鏈路拆成採集、清洗、標註、儲存、模型輸入和模型輸出六個環節，再用對照樣本逐層排除。首先檢查原始日誌是否缺失、截斷或分佈突變，確認採集完整性；其次比較清洗前後資料量與欄位分佈，排查規則誤刪和格式轉換；標註環節透過金標樣本、雙人一致性和分歧類型判斷標準是否模糊。如果輸入資料和標籤都穩定，我會固定同一批樣本對不同模型版本重現，結合信心分數、錯誤類型和日誌定位模型能力或工程鏈路問題。高風險問題不會只看平均值，而會單獨設攔截閾值。最後記錄問題首次出現的版本、影響範圍和重現條件，讓責任團隊可以驗證修復，而不是只得到一句「資料品質不好」。",
      skipped: false,
      updatedAt: "2026-08-20T10:20:00.000Z",
    },
    "q-6": {
      questionId: "q-6",
      content:
        "我會先確認分歧來自目標不同、證據不同，還是資源約束不同，而不是立刻爭論方案。在 Appier 的回饋分析中，產品更關注使用者投訴頻率，演算法更關注問題是否能透過當前版本解決。我先把候選問題放進統一表格，用影響使用者數、嚴重程度、解決成本和驗證週期四個維度比較，並把不確定項明確標出來。對仍有爭議的專案，我建議先做一週的小樣本驗證：補充分層抽樣，確認問題覆蓋範圍，再決定是否進入正式時程。這樣既沒有要求某一方憑感覺讓步，也避免為了追求完整證據拖延決策。最終兩項證據較充分、驗證成本可控的改進排入開發時程，其他問題進入持續觀察清單。",
      skipped: false,
      updatedAt: "2026-08-20T10:25:00.000Z",
    },
    "q-7": {
      questionId: "q-7",
      content:
        "在課程推薦系統的第一版實驗中，我只按總體 Recall@20 比較模型，結果雖然高於熱門推薦基線，但演示時新使用者的推薦明顯不穩定。回顧後發現，我把全量平均指標當成了全部使用者體驗，沒有按歷史互動數量分層，也沒有提前定義冷啟動驗收標準。我隨後把使用者分成無歷史、低活躍和高活躍三組，重新檢查覆蓋率與 Recall，並為無歷史使用者補充科系、年級和課程熱度規則。調整後總體提升幅度略有回落，但新使用者覆蓋明顯更穩定。這個經歷讓我形成兩個習慣：評測前先明確關鍵使用者分層和最低線；結果看起來很好時，主動檢查平均值是否掩蓋了局部失敗。",
      skipped: false,
      updatedAt: "2026-08-20T10:30:00.000Z",
    },
    "q-8": {
      questionId: "q-8",
      content:
        "我想了解三個方面。第一，團隊當前的資料產品主要服務哪些模型或業務場景，現階段最希望優先解決的品質問題是什麼？第二，這個職缺與演算法、工程和營運通常如何協作，實習生是否有機會參與從問題定義、方案設計到上線回顧的完整環節？第三，如果我加入團隊，前三個月最重要的交付物和評價標準分別是什麼？我希望根據真實工作目標儘快補齊需要的業務知識和方法。",
      skipped: false,
      updatedAt: "2026-08-20T10:35:00.000Z",
    },
  } satisfies InterviewAnswers,
  feedback: {
    overallScore: 86,
    dimensions: { jobFit: 90, structure: 86, evidence: 84, star: 83 },
    strengths: [
      "職缺符合度較高：能夠把資訊工程與 AI 背景、業務資料分析和產品推進串成穩定主線，而不是簡單羅列技能。",
      "專業題回答有完整方法：評測方案覆蓋目標、抽樣、維度、人工一致性、線上驗證和失敗樣本回流。",
      "專案回答具備可核驗的規模、方法和個人邊界，能主動區分「提供決策證據」與「決定演算法方案」。",
      "面對分歧與失敗時沒有迴避問題，能夠說明如何補證據、調整指標並形成後續工作習慣。",
    ],
    improvements: [
      "Appier 案例仍需在真實面試前確認抽樣分層、一致性計算方式和兩項優化的最終驗收結果，避免被追問時超出已有事實。",
      "部分回答偏長，正式面試應先給結論，再按兩到三個關鍵步驟展開，把單題控制在 90 秒至 2 分鐘。",
      "職缺動機對 Appier 具體業務的理解仍較概括，可在面試前補充目標產品、使用者場景和近期公開進展。",
      "推薦系統案例應準備訓練驗證切分、熱門基線定義和 Recall@20 選擇依據，以應對技術細節追問。",
    ],
    questionReviews: [
      {
        questionId: "q-1",
        diagnosis: "主線、資料規模和職缺動機完整，但資訊密度較高，口頭表達容易超過兩分鐘。",
        suggestion: "保留「我是誰—Appier 案例—課程專案—為什麼適合」四段，每段只講一個結論。",
        improvedAnswer:
          "面試官您好，我是國立清華大學資訊工程學系的姜禾。我的核心經歷是用資料定位模型問題，並推動產品改進。在 Appier 實習期間，我分析 18,000 餘條業務記錄、複核 1,200 條回答，建立三層問題標籤，並協同產品與演算法推動 2 項優化排入開發時程；課程專案中，我負責推薦系統的離線評測與冷啟動分析。我希望繼續做串連使用者需求、資料品質和模型效果的 AI 資料產品工作。",
      },
      {
        questionId: "q-2",
        diagnosis: "能夠解釋職缺價值和個人契合點，但對目標公司與具體業務場景的回答還不夠獨特。",
        suggestion: "面試前選擇一個真實 Appier AI 產品，補充使用者、關鍵資料問題和自己希望參與的環節。",
        improvedAnswer:
          "我選擇 AI 資料產品，是因為這個職缺把模糊使用者回饋轉化為可定義、可評測的資料任務，這與我在 Appier 實習中的經歷高度一致。我希望在 Appier 真實的大規模 AI 應用場景中，進一步學習如何把離線品質、線上回饋與產品決策串連起來；面試前我也會結合目標團隊的具體產品說明最希望參與的資料閉環。",
      },
      {
        questionId: "q-3",
        diagnosis: "框架完整且專業，但維度較多，若不先說明業務決策，容易像背誦評測清單。",
        suggestion: "第一句話先確認評測要支援什麼決策，再用一個具體場景解釋指標權重和上線門檻。",
        improvedAnswer:
          "如果目標是判斷客服問答模型能否上線，我會先把事實準確和安全設為硬門檻，再評估幫助度與穩定性；隨後按真實流量、核心任務和高風險長尾分層抽樣，使用帶正反例的評分規則進行雙人盲評，並把分歧樣本仲裁。最後將離線結果與採納率、重試率和投訴率交叉驗證，把新的線上失敗樣本回流到挑戰集。",
      },
      {
        questionId: "q-4",
        diagnosis: "資料、行動和協作邊界清晰，但尚未說明兩項優化排入開發時程後的實際結果。",
        suggestion: "如有真實上線結果則補充；若實習結束前尚未上線，應明確只陳述到時程階段。",
        improvedAnswer:
          "我透過 18,000 餘條記錄和 1,200 條複核樣本定位高頻失敗，再補做入口與使用者分層校驗，最終把問題定義、影響範圍、候選方案和驗收指標提交評審，推動 2 項優化排入開發時程。我的職責是提供可複核的優先順序證據；若面試官追問上線效果，我會如實說明當時追蹤到的階段。",
      },
      {
        questionId: "q-5",
        diagnosis: "歸因鏈路完整，能區分資料與模型問題，但缺少一個實際定位案例幫助面試官快速理解。",
        suggestion: "補充一次透過清洗前後分佈或固定樣本跨版本對照定位根因的具體例子。",
        improvedAnswer:
          "我會先拆分採集、清洗、標註和模型環節。比如某類回答準確率突然下降，我先比較原始日誌與清洗後欄位分佈；若資料穩定，再用固定樣本重現不同模型版本；若模型表現一致，則檢查標籤規則與雙人一致性。每一步都保留對照組和重現條件，最終給責任團隊一個可驗證的根因，而不是籠統歸為資料問題。",
      },
      {
        questionId: "q-6",
        diagnosis: "能夠把團隊分歧轉化為統一指標和小規模驗證，體現協作成熟度。",
        suggestion: "進一步突出自己如何主持對齊，以及驗證結果具體改變了哪一方的判斷。",
        improvedAnswer:
          "面對優先順序分歧，我先確認各方目標，再用影響使用者數、嚴重程度、解決成本和驗證週期統一比較標準。對證據不足的問題，我提出一週分層抽樣驗證，並負責整理結果。驗證證明指令遵循問題覆蓋更廣後，團隊同意優先時程兩項改進，其他問題進入觀察清單。",
      },
      {
        questionId: "q-7",
        diagnosis: "失敗原因、糾正動作和方法整理完整，是較可信的回顧回答。",
        suggestion: "補充調整後新使用者覆蓋或穩定性的具體指標；沒有可靠數字時不要臨時估算。",
        improvedAnswer:
          "第一版推薦系統只看總體 Recall@20，掩蓋了新使用者推薦不穩定。我按互動量重新分層，補充新使用者覆蓋指標，並加入科系、年級與課程熱度規則。雖然總體提升略有回落，但冷啟動表現更穩定。此後我會在實驗前定義關鍵人群最低線，並主動檢查平均值是否掩蓋局部失敗。",
      },
      {
        questionId: "q-8",
        diagnosis: "反問覆蓋業務問題、協作方式和評價標準，體現了對實際工作的關注。",
        suggestion: "現場根據前文選擇兩題即可，避免連續提問過多；優先追問面試官尚未介紹的內容。",
        improvedAnswer:
          "我想重點了解兩個問題：團隊當前最希望優先解決的資料品質問題是什麼？如果我加入，前三個月最重要的交付物和評價標準分別是什麼？如果時間允許，我還想了解這個職缺與演算法、工程和營運的日常協作方式。",
      },
    ],
    nextActions: [
      "逐項核對 Appier 案例中的資料規模、抽樣方式、一致性方法和專案邊界，只保留能夠被追問驗證的事實。",
      "將自我介紹、職缺動機和專案深挖分別錄音兩遍，壓縮到目標時長並檢查是否先給結論。",
      "補充 Appier 目標團隊或產品的公開資訊，形成一頁「使用者場景—資料問題—職缺貢獻」筆記。",
      "為推薦系統準備訓練驗證切分、基線定義、Recall@20 選擇和冷啟動改進四個技術追問。",
      "按問題目錄再模擬一輪，只重點練習 q-3、q-4、q-5 和 q-7，並重新生成回顧比較改進。",
    ],
  } satisfies InterviewReport,
  currentQuestionIndex: 7,
  completedAt: "2026-08-20T10:40:00.000Z",
};
