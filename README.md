<p align="center">
  <img src="public/brand/lujie-mark.svg" alt="錄階標識" width="72" />
</p>

<h1 align="center">錄階 / LuJie CareerKit</h1>

<p align="center">
  <strong>從履歷編輯到拿到 Offer 的求職 Agent 工作台，覆蓋履歷編輯、JD 比對、投遞追蹤、模擬面試和回顧等。</strong>
</p>
<p align="center">
  <a href="README.en.md">English</a> · 繁體中文
</p>

> [!NOTE]
> **台灣在地化版本**：本儲存庫 fork 自 [Chozzc/Lujie-Careerkit](https://github.com/Chozzc/Lujie-Careerkit)，並針對台灣求職做了以下調整：
> - 介面、AI 提示與 Agent Skills 全面改為**台灣繁體中文**與台灣慣用詞（履歷、職缺、專案、人資面談等）；
> - 投遞管道改為台灣常用平台（104 人力銀行、1111 人力銀行、CakeResume、Yourator、LinkedIn 等），範例資料改為台灣公司與職缺；
> - **移除中國校招資料庫**（隱藏「校園徵才資訊庫」模組與對應的 Agent 檢索工具）；
> - **不使用任何中國的線上服務**：移除 DeepSeek、通義千問／阿里雲百鍊、Kimi、智譜、豆包、MiniMax、矽基流動等模型供應商，新增 Google Gemini 與 Anthropic Claude 官方 API；圖片與掃描版履歷改由你選擇的多模態模型解析；
> - 求職情境同時涵蓋實習、社會新鮮人與有經驗的轉職者。
>
> 原專案的設計、功能與授權歸原作者所有；以下說明大致沿用上游 README，並標註與本分支不同之處。
<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" />
  <img alt="React" src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-6-2d3748?logo=prisma" />
  <img alt="SQLite" src="https://img.shields.io/badge/SQLite-local--data-044a64?logo=sqlite" />
  <img alt="Docker Image" src="https://github.com/Chozzc/Lujie-Careerkit/actions/workflows/docker-image.yml/badge.svg" />
  <img alt="License" src="https://img.shields.io/badge/license-Apache--2.0-blue" />
</p>

https://github.com/user-attachments/assets/87b60f61-447b-4397-9b23-078008142f75

## 專案簡介

錄階面向實習、社會新鮮人與轉職求職場景，把履歷編輯、職缺比對、求職資料管理、面試準備、模擬練習和投遞追蹤放在一個由 Agent 驅動的工作台裡。你可以針對不同職缺維護多份履歷版本，根據職缺描述生成更貼合要求的履歷與面試資料，並把每一次分析、練習和投遞進展持續累積下來。

## 線上預覽

造訪 [https://lujie.chozzc.dev](https://lujie.chozzc.dev) 體驗上游的線上預覽（簡體中文版，不含本分支的台灣在地化）。線上預覽的個人資料儲存在當前瀏覽器中，不會自動同步到本機原始碼或 Docker 安裝。

## 功能演示

<table width="100%">
  <tr>
    <th width="50%">控制中心</th>
    <th width="50%">錄階 Agent · 可自主呼叫內建求職工具</th>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="public/images/08-dashboard-workflow.gif" alt="控制中心：流程統計、投遞入口與快速開始" width="100%" />
    </td>
    <td width="50%" valign="top">
      <img src="public/images/01-agent-workflow.gif" alt="錄階 Agent：以面試準備演示檢索、參數選擇、確認與儲存" width="100%" />
    </td>
  </tr>
  <tr>
    <th width="50%">校園徵才資訊庫（上游功能，本分支已隱藏）</th>
    <th width="50%">履歷編輯器</th>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="public/images/07-campus-workflow.gif" alt="校園徵才資訊庫：關鍵字搜尋、屆別篩選與招募詳情" width="100%" />
    </td>
    <td width="50%" valign="top">
      <img src="public/images/02-resume-workflow.gif" alt="履歷編輯器：版本選擇、編輯與模板預覽" width="100%" />
    </td>
  </tr>
  <tr>
    <th width="50%">JD 比對優化</th>
    <th width="50%">面試助手</th>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="public/images/03-jd-workflow.gif" alt="JD 比對優化：優化設定與客製成果" width="100%" />
    </td>
    <td width="50%" valign="top">
      <img src="public/images/04-interview-workflow.gif" alt="面試助手：準備資料、逐題練習與回顧" width="100%" />
    </td>
  </tr>
  <tr>
    <th width="50%">求職資料庫</th>
    <th width="50%">投遞追蹤</th>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="public/images/05-library-workflow.gif" alt="求職資料庫：職缺檔案與已儲存成果" width="100%" />
    </td>
    <td width="50%" valign="top">
      <img src="public/images/06-tracking-workflow.gif" alt="投遞追蹤：看板、追蹤日期與備註" width="100%" />
    </td>
  </tr>
</table>

## 功能亮點

- **結構化履歷編輯**：維護多份履歷版本，可從任意履歷建立獨立副本進行嘗試性調整；編輯教育、實習、專案、技能等模組，切換模板和主題，並匯出 PDF、PNG 或可編輯 DOCX。
- **AI 分析履歷**：先診斷當前履歷的行動與結果、事實證據、表達和結構，再由使用者選擇要處理的問題與優化方向；確認後生成獨立優化版本，並保留原履歷。
- **求職信與應徵訊息**：結合當前履歷、完整 JD 和使用者補充的到職安排，生成適合正式投遞的求職信，或重點前置、適合 104／1111「主動應徵」與 CakeResume 等平台的應徵訊息，並支援編輯、複製與重新生成。
- **JD 比對優化**：貼上包含公司、完整職缺名稱、要求和職責的目標 JD，讓 AI 在不編造經歷的前提下診斷比對點、重排重點、優化表達並儲存職缺客製版本。
- **專屬面試準備資料**：結合所選履歷與完整 JD，生成資料概覽、能力輪廓、證據與差距、核心知識、經歷深挖、針對性問題和準備計畫，按履歷長期儲存，並可匯出為可編輯 Word 文件或適合列印的 PDF。
- **投遞進展管理**：記錄公司、職缺、投遞管道（104、1111、CakeResume、Yourator、LinkedIn、獵頭、內部推薦等）、階段、截止日期、追蹤日期、備註、JD 和繫結履歷版本。
- **模擬面試與回顧**：根據履歷和 JD 生成面試題，儲存逐題回答，並生成可回看、可繼續改進的 AI 回顧報告。
- **求職資料庫**：按職缺或資料類型整理原始 JD、職缺客製履歷、面試準備、模擬問答和 AI 回顧；進入職缺檔案即可連續檢視、編輯或刪除具體成果。
- **應用內 Agent**：檢索已有職缺與去識別化履歷，並在使用者選擇參數、確認寫入後建立獨立履歷、生成 JD 客製履歷、面試準備與模擬面試，切換履歷模板或維護投遞追蹤卡片。
- **求職 Agent Skills**：將錄階中已經打磨的履歷優化、面試準備、模擬面試和求職溝通流程整理為四個 Skill，讓 Codex、Claude Code 等編碼代理也能複用。
- **資料與隱私可控**：履歷、職缺、投遞、資料庫成果、Agent 對話和設定儲存在本機 SQLite 資料庫裡，適合個人長期維護。

## 應用內 Agent

點選右下角小助手開啟 Agent，可拖動位置、放大對話、新建會話和回看歷史。它複用設定頁配置的模型和 API Key；使用前請先完成 AI 配置並測試連線。對話儲存在本機 SQLite 中。

使用流程是：**描述需求 → 檢索並明確目標 → 選擇參數（需要時）→ 核對並確認寫入 → 開啟成果**。檢索不需要審批；建立或更新業務資料時，會展示具體目標和操作內容，你可以確認或取消。JD 客製先選擇優化方向，面試準備和模擬面試先選擇模式，隨後仍需確認寫入。

例如：

| 你想做什麼 | 範例指令 |
| --- | --- |
| 查投遞並設定追蹤 | 找到 Appier 的投遞記錄，把下次追蹤設為 2026-10-09，並追加備註「寄送追蹤信」。 |
| 從經歷建立履歷 | 根據下面這些真實經歷建立一份獨立履歷，目標職缺是後端開發：…… |
| 客製職缺履歷 | 用我的後端開發履歷比對這份完整 JD，生成一個新版本：…… |
| 準備面試 | 用 Appier 這個職缺和對應客製履歷生成專案深挖面試準備資料。 |
| 開始模擬面試 | 用同一個職缺和履歷建立一場綜合模擬面試。 |
| 調整履歷外觀 | 找到我的基礎履歷，切換為經典模板。 |

範例中的職缺和履歷需要存在於你的資料庫；目標不明確或缺少完整 JD 時，先補充資訊。當前原始碼提供以下能力：

- 根據自然語言檢索已有職缺和投遞卡片；
- 按名稱、職缺、技能、學校、公司或專案檢索履歷，並按 ID 讀取經過隱私過濾的完整內容；
- 草擬新增或更新投遞卡片的操作，並在使用者明確確認後執行；
- 根據使用者口述的真實經歷建立新的獨立履歷；
- 根據完整 JD 建立新的職缺客製履歷版本；
- 根據指定職缺和履歷生成面試準備資料；
- 讓使用者選擇面試模式後生成模擬面試，並直接進入答題介面；
- 在保留履歷事實與區塊的前提下切換現有模板；
- 結合當前上下文提供履歷、JD、面試和求職規劃建議。

當前版本不會覆蓋已有履歷正文，也不能刪除業務資料或操作外部招募網站；任何業務寫入都必須由使用者確認。

完整對話歷史儲存在本機；模型按長度預算讀取最近完整輪次，保留未完成的工具和確認過程。歷史摘要與跨對話記憶尚未實現，長對話中的早期條件可能需要再次說明。必要內容過長或歷史儲存發生衝突時會顯示提示，請核對已生成的成果後繼續。

## Agent Skills

錄階不只提供應用介面，也把其中適合交給程式碼代理（coding agent）執行的求職流程整理成了四個 Agent Skill。每個 Skill 都包含完整的執行步驟、研究要求、事實邊界和品質檢查。

| Skill                    | 用途                                             |
| ------------------------ | ------------------------------------------------ |
| `resume-improvement`     | 診斷並優化履歷，也可結合 JD 做職缺客製           |
| `prepare-job-interview`  | 主動研究公司與職缺，生成結構化面試準備資料       |
| `mock-interview-coach`   | 開展逐題模擬面試、動態追問和循證回顧             |
| `job-application-writer` | 撰寫求職信、104 應徵訊息、Email、內部推薦和追蹤訊息 |

複製（clone）儲存庫後，從專案目錄啟動 Codex，直接描述任務即可；Codex 會根據任務自動選擇對應 Skill，也可以用 `$resume-improvement` 等名稱明確指定。Claude Code 等其他編碼代理也可以直接讀取相應的 `SKILL.md` 來執行同一套流程。

例如：

- `使用 $resume-improvement 分析這份履歷，並針對後端開發職缺提出修改建議。`
- `使用 $prepare-job-interview，結合我的履歷和這份 JD 生成面試準備資料。`

涉及具體公司或職缺時，Skill 會在搜尋工具可用且使用者未禁止聯網的情況下主動研究，並要求標註來源、區分事實與推斷，禁止編造候選人的經歷、技能或成果。

## 資料與隱私

- 履歷、版本、職缺、投遞、面試準備資料、模擬記錄、Agent 對話和設定儲存在 `prisma/dev.db`。
- Docker 將個人資料儲存在掛載的資料卷中；本機原始碼、Docker 和線上預覽之間不會自動同步個人資料。
- API Key 在應用內設定頁配置，儲存到 SQLite 前會先加密。
- `LUJIE_SETTINGS_SECRET` 是本機加密金鑰，用來保護已儲存的 AI Key。請在 `.env.local` 裡使用足夠長的隨機字串。
- AI 任務會將必要的履歷、JD 或對話內容傳送給所選模型服務；個人資料本機儲存不表示 AI 請求完全離線。Agent 讀取履歷時會過濾電子郵件、電話等聯絡資訊。

## 快速開始

### 環境要求

- Node.js 20.9 或更高版本
- npm
- Chrome 或 Edge：瀏覽器語音識別體驗更完整

### Docker 部署（推薦）

```bash
docker run -d --name lujie-careerkit \
  -p 3000:3000 \
  -v lujie-data:/data \
  -e LUJIE_SETTINGS_SECRET="replace-with-a-long-random-string" \
  ghcr.io/chozzc/lujie-careerkit:latest
```

> [!IMPORTANT]
> `ghcr.io/chozzc/lujie-careerkit` 是上游發布的映像檔（簡體中文、含中國校招資料）。要使用本台灣在地化分支，請在專案目錄自行建置：`docker build -t lujie-careerkit-tw .`，再把上面指令中的映像檔名稱換成 `lujie-careerkit-tw`。

開啟 [http://localhost:3000](http://localhost:3000)。SQLite 資料會儲存在 Docker volume `lujie-data` 中，API Key 在應用內設定頁配置。

`LUJIE_SETTINGS_SECRET` 用於加密本機儲存的設定金鑰，請替換成一串足夠長的隨機字串。

使用 `latest` 會跟隨公開 `main` 的映像檔建置。需要固定版本時，請從 [GHCR 已發布標籤](https://github.com/Chozzc/Lujie-Careerkit/pkgs/container/lujie-careerkit)選擇；本機尚未推送的原始碼功能不會自動出現在映像檔中。

### 本機開發

```bash
git clone https://github.com/Chozzc/Lujie-Careerkit.git
cd Lujie-Careerkit
npm ci
```

建立本機環境檔案，並生成一個加密金鑰：

```bash
cp .env.example .env.local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env.local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

把生成的值寫入 `.env.local` 的 `LUJIE_SETTINGS_SECRET`，然後啟動應用：

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。應用會在首次使用時建立本機資料庫結構和範例資料。

## 環境變數

```env
DATABASE_URL="file:./dev.db"
LUJIE_SETTINGS_SECRET="change-me-to-a-long-random-string"
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_MODEL="gpt-6-luna"
```

`OPENAI_BASE_URL` 和 `OPENAI_MODEL` 只用於首次預設值。真實 API Key 請在應用內設定頁配置。

## AI 服務配置

1. 開啟應用內設定頁。
2. 選擇模型服務商。
3. 填寫 Base URL、模型名稱和 API Key。
4. 儲存後點擊測試連線。

儲存有效配置後即可使用 AI，建議先測試連線；上次連線測試失敗時，需修正配置並重新測試。

## 版本更新

### v0.4.0

新增校園徵才資訊庫（本分支已隱藏）、擴充應用內 Agent 求職工作流，並加強儲存和操作確認保護。

#### 校園徵才資訊庫與機會檢索

- 新增搜尋、七項獨立篩選、排序和招募詳情；原始碼與 Docker 分發附帶招募資料快照，資訊以招募方官方公告為準。
- Agent 新增校園徵才檢索和詳情訪問，首次引導從八步擴充為九步，加入校園徵才資訊庫。

#### Agent 工作流與操作保護

- 擴充獨立履歷建立、JD 客製、面試準備、模擬面試、模板切換和投遞追蹤；所有業務寫入仍需確認，需要時先選擇任務參數。
- 模型按預算讀取最近完整輪次，保留待完成工具與審批。
- 加強確認和歷史儲存檢查，防止同一次審批重放，並在歷史併發更新衝突時提示。

#### 儲存、資料管理與匯出

- 履歷儲存改為序列執行，隔離舊編輯會話的遲到結果，切換頁面前等待儲存；瀏覽器關閉未儲存的編輯頁面時提醒。
- 修復資料庫無效刪除入口，清理範例資料時保留使用者自建記錄。
- 修復面試資料列印依賴彈窗、履歷預覽與匯出字型差異。

#### 模型配置與執行支援

- 更新模型目錄並加入 MiniMax 支援。
- 補齊 Docker 遷移執行依賴與校園徵才資料打包。

#### 功能演示與文件

- 更新雙語說明、功能 GIF 和產品演示影片。

### v0.3.0

#### 求職資料庫與職缺檔案

- 新增「按職缺 / 按分類」兩種瀏覽方式，支援公司分組、搜尋、排序和範例職缺標識，集中整理原始 JD、職缺客製履歷、面試準備、模擬問答與 AI 回顧。
- 每個職缺都有獨立檔案頁，以目錄結構組織資料，並提供職缺概覽、準備路徑、成果列表和資料構成統計。
- 原始 JD、面試準備和模擬回答可以修改並儲存；職缺名稱和成果標題可以手動修正，長標題會在目錄中安全省略顯示。

#### 應用內求職 Agent

- 新增可拖動開啟的應用內求職 Agent，複用設定頁已經配置並測試成功的 OpenAI-compatible 模型，並將多輪對話儲存在本機。
- Agent 可以根據自然語言檢索已有職缺和投遞記錄，並讀取過濾電子郵件、電話等聯絡資訊後的履歷概覽。
- Agent 可以草擬新增或更新投遞卡片的操作；真正寫入前必須由使用者明確確認，避免自然語言誤解直接改動業務資料。
- v0.3.0 初版尚不支援 JD 客製和面試生成，這些能力見上方 v0.4.0 原始碼更新；直接覆蓋已有履歷正文、刪除業務資料和自動投遞仍不支援。

#### 首次引導與範例資料更新

- 初版提供八步引導：控制中心 → 連線 AI → 認識 Agent → 履歷編輯 → JD 比對 → 面試助手 → 求職資料庫 → 投遞職缺追蹤。
- 內建六個結構化範例職缺，並提供一條完整的範例流程（本分支已改為台灣的 Appier 範例）：基礎履歷、職缺客製履歷、專業面試準備、八道完整模擬回答、逐題評價與 AI 回顧。
- 設定頁新增「一鍵清空範例資料」，只刪除內建範例職缺、範例履歷及其生成資料，保留使用者自己建立的資料和 AI 設定；「重置並恢復範例資料」仍用於完整重置本機業務資料。

### v0.2.5

#### 將求職流程整理為 Agent Skills

- 將錄階中已經打磨的履歷優化、面試準備、模擬面試和求職申請寫作流程整理為四個 Agent Skill。
- Skill 位於 `.agents/skills`，Codex 可在儲存庫內直接發現，Claude Code 等其他編碼代理也可讀取並複用相同流程。

## 常見問題

### 1. 必須配置 API Key 才能使用嗎？

不是。履歷編輯、資料庫瀏覽、投遞追蹤等基礎功能可以本機使用；應用內 Agent、JD 比對、面試準備資料、模擬面試和 AI 回顧等 AI 功能需要配置 OpenAI-compatible 服務的 API Key。

### 2. 我的資料儲存在哪裡？

原始碼本機執行預設儲存在 `prisma/dev.db`，Docker 儲存在掛載的資料卷，線上預覽儲存在當前瀏覽器。資料庫和對應加密金鑰需要一起備份，不應該提交到 GitHub。

### 3. 控制中心的資料怎麼計算？

- **投遞職缺**：統計已進入投遞追蹤看板的職缺，不包含還未投遞的 JD 比對草稿。
- **活躍流程**：統計仍在推進中的職缺，包括已投遞、筆試 / 線上測驗、面試中。
- **到期追蹤**：只統計活躍流程。優先使用手動設定的下次追蹤日期；已投遞且未設定下次追蹤時，按投遞後 7 天作為建議追蹤日；筆試 / 線上測驗和面試中使用當前階段日期。
- **Offer**：統計已標記為 Offer 的職缺。

### 4. `LUJIE_SETTINGS_SECRET` 是什麼？

它是本機加密金鑰，用來加密儲存到 SQLite 的 API Key。換掉這個值後，舊資料庫裡已經儲存的 API Key 可能無法解密，需要重新在設定頁儲存。

### 5. 可以換成別的模型服務嗎？

可以。只要服務相容 OpenAI 介面，就可以在設定頁填寫對應的 Base URL、模型名稱和 API Key。

## 專案結構

```text
.github/workflows/      GitHub Actions workflow，包括 GHCR 映像檔發布
Dockerfile              生產容器映像檔定義
docker-compose.yml      本機 Docker 啟動與 SQLite 持久化卷配置
prisma/                 Prisma schema 與本機 SQLite 執行資料
scripts/                資料遷移腳本
src/app/                Next.js 頁面與 API 路由
src/components/         工作台、履歷、面試和共享 UI
src/hooks/              瀏覽器 Hook，例如語音識別
src/lib/                Repository、AI、匯出、解析和領域邏輯
src/stores/             履歷編輯器狀態
src/types/              共享 TypeScript 類型宣告
public/brand/           品牌標識和封面資產
public/images/          README 功能 GIF 和截圖
third-party/            第三方授權條款說明
```

## 致謝

履歷編輯器複用並改造了 [JadeAI](https://github.com/LingyiChen-AI/JadeAI) 的部分設計思路和實現概念。JadeAI 使用 Apache License 2.0；對應授權條款副本儲存在 `third-party/JadeAI-LICENSE.txt`。

## 授權條款

錄階使用 [Apache License 2.0](LICENSE) 開源。第三方宣告見 [NOTICE](NOTICE)。
