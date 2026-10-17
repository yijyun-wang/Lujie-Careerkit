# 錄階求職 Agent 升級開發方案

> 狀態：本地版已有 11 個工具契約；保留完整輪次預算、寫工具結果精簡和執行緒儲存衝突保護，已加固審批續接並阻止同一次確認被重複執行。結構化摘要與物件繫結尚未實現，按實際需求決定是否接入
> 最近更新：2026-10-03；在 `8b0c36d` 基線上補齊審批執行前保護及本地後端驗收
> 適用範圍：本輪只修改公開本地版；線上版需另行適配、驗證，不代表已部署

## 1. 結論先行

錄階第一階段不需要再引入 LangGraph、Mastra 或 OpenAI Agents SDK。專案已經安裝：

- `ai@6.0.199`
- `@ai-sdk/openai-compatible@2.0.48`
- `@ai-sdk/react@3.0.201`
- `streamdown@2.5.0` 與 `@streamdown/cjk@1.0.3`
- `zod@4.4.3`

AI SDK 6 已提供第一版所需的 Agent 迴圈、類型化工具、多步呼叫、停止條件、執行時上下文、UI 訊息流、工具審批和訊息裁剪能力。聊天介面已補充同一生態的 `@ai-sdk/react`，並使用 Streamdown 正確渲染流式 Markdown，不需要再疊一套 Agent 框架。

真正的工程重點不是“選哪個 Agent 框架”，而是：

1. 把錄階現有業務能力整理成輸入輸出穩定的工具；
2. 明確哪些操作只生成預覽，哪些操作需要使用者確認後寫入；
3. 分離業務事實、單次對話上下文和跨對話記憶；
4. 讓本地 SQLite 版與線上瀏覽器儲存版遵守同一工具協議；
5. 驗證所選模型是否真的支援穩定的工具呼叫，而不只驗證它能返回 JSON。

2026-10-02 複核：工具閉環已存在，後文候選設計不再作為必須逐項完成的排期。當前優先保證審批引數不可被替換、寫入目標正確和已有鏈路可驗證；結構化摘要、物件繫結、控制中心工具和長期記憶各自需要實際使用問題支援。資料庫和 Job 歸屬問題應在業務層修復，再由 Agent 複用，避免為 Agent 單獨建立一套業務規則。

## 2. 產品形態

### 2.1 吉祥物決定

建議保留胖糰子，去掉梯子和其他手持物：

- 胖糰子在右下角小尺寸下更容易識別，也更有親和力；
- 紙張角色更貼近“履歷”，但容易讓使用者把它理解成只負責文件；
- Agent 後續會覆蓋投遞、JD、履歷和面試，不應被一個紙張圖形限制能力認知；
- “階”不需要用梯子做字面表達，梯子會讓角色姿態顯得勉強。

可以保留輕微的折角或紙張邊緣作為品牌暗示，但主體仍是無道具的胖糰子。

### 2.2 預設態與展開態

- 預設態：糰子固定在視口右下角，直接懸浮，不套圓形容器。
- 點選後：開啟固定定位的浮層面板，覆蓋頁面內容，不改變主頁面寬度，不擠壓“求職階段”等模組。
- 面板頂部：當前對話標題、新對話、歷史對話、關閉。
- 首螢幕內容：一句能力說明和 3–4 個高頻任務入口，不堆砌全部功能。
- 執行結果：優先顯示結構化卡片、差異預覽和確認按鈕，不把所有結果都塞成大段文字。
- 大型成果：履歷、JD 比對報告和面試資料仍回到現有主工作區檢視和編輯，Agent 面板只負責發起、解釋和銜接。

### 2.3 當前能力與下一步邊界

當前本地版已經是“能操作錄階內部資料的實驗性求職助手”，不是隻有聊天和投遞卡片的早期原型。它已支援：

1. 搜尋 `Job` 及其可選 `Application`，並按名稱、學校、技能、專案等檢索履歷；
2. 按精確 ID 讀取完整脫敏履歷；
3. 經確認後新增或更新投遞卡片；
4. 根據使用者明確提供的經歷建立獨立履歷；
5. 選擇優化引數後生成並儲存 JD 客製履歷；
6. 選擇準備重點後生成並儲存面試資料；
7. 選擇模式後建立模擬面試題目和會話；
8. 只修改指定履歷的視覺模板；
9. 從結果卡片開啟履歷編輯器、求職資料庫或模擬面試工作區。

下一階段不再重複增加已有能力，而是補齊：

- “口述經歷 → 草稿預覽/差異 → 確認儲存”的更細粒度事實校驗；
- 現有履歷內容的受控區域性編輯，而不只是新建、JD 客製和換模板；
- 長對話的完整輪次裁剪、結構化摘要和任務狀態；
- 僅在使用者詢問整體進度時按需讀取控制中心摘要；
- 線上版瀏覽器儲存與客戶端確認執行；
- 模型工具能力探針、Token/快取與工具呼叫觀測。

明確不做：

- 自動開啟招募網站；
- 自動搜尋或篩選網際網路職缺；
- 自動填寫外部表單或代替使用者投遞；
- 在沒有確認的情況下建立、覆蓋或刪除業務記錄；
- 第一版就建設向量資料庫、多 Agent 協作或自主長期規劃。

## 3. 是否建立每次獨立對話歷史

建議建立獨立對話，但不要把每一個按鈕操作都拆成新對話。

推薦規則：

- 使用者點選“新對話”時建立新執行緒；
- 一個目標儘量留在一個執行緒，例如“完善網易後端投遞”和“優化通用履歷”分別處理；
- 每個執行緒可綁定當前履歷、職缺或投遞記錄的引用；
- 使用者從具體職缺、履歷或投遞卡片喚起 Agent 時，自動把該物件設為本執行緒上下文；
- 切換執行緒後，不把上一執行緒原始訊息帶入新執行緒。

這樣確實會多一層資料模型和歷史列表 UI，但收益很明確：

- 不同職缺不會互相汙染上下文；
- 使用者能返回未完成任務；
- 工具呼叫和確認記錄可以追溯；
- 後續做摘要、成本控制和錯誤恢復更容易。

Vercel AI SDK 提供 `useChat`、`UIMessage`、服務端訊息 ID、訊息校驗和持久化回撥，但不會替錄階自動提供一個託管的“對話歷史資料庫”。Vercel 的官方 Chatbot 模板使用 Postgres 儲存歷史，這是一份參考實現，不是 AI SDK 自動贈送的儲存服務。錄階本地版應繼續用現有 SQLite；線上版繼續遵守“資料只儲存在當前瀏覽器”的產品邊界。

另外，Vercel Chat SDK 主要用於 Slack、Teams、Discord、Telegram 等外部聊天平台適配，不是錄階網頁內對話歷史所需的 SDK，當前不引入。

## 4. 上下文與記憶設計

不要把“記憶”理解為把全部歷史訊息永久塞給模型。錄階需要三層資訊，每層職責不同。

### 4.1 業務事實：現有資料庫是唯一真相

以下內容繼續由現有業務模型儲存：

- `Resume` / `ResumeVersion`
- `Job`
- `Application`
- `InterviewPreparation`
- `InterviewSession`

Agent 只通過工具按需讀取，不把這些記錄複製成另一套 Agent 專用長期記憶。職缺階段、面試時間或履歷正文發生變化時，資料庫中的當前值優先於對話摘要。

### 4.2 執行緒工作記憶：完成當前任務所需的資訊

每個執行緒繼續儲存完整 `UIMessage` 歷史，用於介面回放、審批恢復和審計。本地版已移除最近 12 條訊息的固定擷取：模型輸入按完整使用者輪次和約 12K Token 的歷史預算選擇；當前輪次與未完成呼叫/審批鏈保留，舊 reasoning 和空訊息按 SDK 規則清理。Token 使用保守的中英文估算，系統規則、工具定義和輸出另計，並非模型上下文上限的精確測量。必要內容超預算時明確報錯，不截斷當前任務或繼續寫入。

六個寫工具通過 `toModelOutput` 返回精簡執行結果，完整業務成果仍供介面顯示並儲存在原業務庫。預算檢查在 SDK 執行已批准工具之前執行，並在後續每個模型步驟重查。下面的摘要與物件繫結屬於後續目標，當前 `summary` 欄位仍未投入流程；超預算移出的舊約束尚不能自動恢復。

目標請求上下文按下列順序組裝：

1. 固定系統規則、當前日期和介面語言；
2. 當前 Agent 可用工具的名稱、說明和 Zod 引數結構；
3. 已有執行緒摘要——只有長對話產生摘要時才加入；
4. 最近若干個完整對話輪次，按 Token 預算保留；
5. 使用者本次訊息；
6. 本輪按需產生的工具結果。

錄階不傳送“當前頁面”。這個詞容易被誤解成頁面截圖、HTML 或整頁資料。未來只允許傳遞當前選中的業務物件 ID：

```ts
type AgentSubject =
  | { type: "resume"; resumeVersionId: string }
  | { type: "job"; jobId: string }
  | { type: "application"; applicationId: string }
  | { type: "interview"; interviewPreparationId: string }
  | null;
```

從全域性右下角寵物開啟時不傳物件；從具體履歷或職缺入口開啟時只傳 ID。模型不能直接相信 ID 對應的內容，仍需通過工具重新查詢當前資料庫。

目標上下文處理是一條順序流水線，不是三個互斥方案：

```text
SQLite 完整歷史
  → 程式清理舊 reasoning、已完成的陳舊工具引數/大結果和空訊息
  → 按“使用者問題 + Assistant 回答 + 相關工具呼叫/結果”組成完整輪次
  → 從最近輪次向前按約 12K Token 的初始預算保留
  → 只有必須移出仍有價值的舊輪次時，才合併更新結構化執行緒摘要
  → 系統規則 + 摘要 + 最近原始輪次 + 本次訊息
```

第一層和第二層完全由程式碼執行：複用當前 AI SDK 已安裝的 `pruneMessages` 清理可丟棄內容，再按完整輪次和 Token 估算選擇訊息。當前未完成的工具呼叫、審批和正在執行的任務必須保留。

第三層只在超過預算時呼叫當前配置的模型，把最舊的一批完整輪次壓縮為 Zod 校驗的結構化摘要：

```ts
type AgentThreadSummary = {
  goal: string;
  confirmedFacts: string[];
  decisions: string[];
  completedActions: string[];
  pendingQuestions: string[];
  constraints: string[];
  references: {
    resumeVersionId?: string;
    jobId?: string;
    applicationId?: string;
    interviewPreparationId?: string;
  };
};
```

摘要只描述對話目標、已確認事實、決策、完成動作、待辦和引用，不復制履歷/JD 正文。業務日期、職缺階段和記錄是否存在始終以資料庫為準。壓縮失敗時保留舊摘要和完整歷史，不覆蓋；已經壓縮過的輪次不重複壓縮，只合並新移出的批次。多數只聊幾輪的使用者不會觸發額外摘要呼叫。

### 4.3 跨執行緒長期記憶：第一版不自動建立

第一版不自動從對話中提煉“使用者偏好”。原因是求職資訊涉及隱私，且模型可能把一次性的職缺條件錯誤記成長期偏好。

未來如果確有需求，只儲存使用者明確確認的結構化偏好，例如：

- 目標城市；
- 目標職缺方向；
- 預設履歷；
- 輸出語言和表達風格。

這些偏好應可檢視、修改和清除，不引入 Mem0、Letta、Supermemory 或向量資料庫。錄階現有 SQLite 和結構化欄位足以覆蓋首版。

### 4.4 控制中心只作為按需業務工具

控制中心不是預設系統上下文，也不寫入 Agent 長期記憶。它是資料庫當前狀態的派生檢視，儲存一份快照很快會過期。

後續新增只讀 `get_dashboard_context` 時遵守以下規則：

- 使用者問“我今天該做什麼”“根據整體進度給建議”“有哪些到期追蹤”時呼叫；
- 使用者直接要求改履歷、做 JD 優化或模擬面試時不呼叫；
- 複用現有控制中心彙總邏輯，最多返回 3 個優先事項和必要計數；
- 每次呼叫都重新計算，不把舊結果儲存為記憶；
- 如增加“今日行動建議”顯式按鈕，該按鈕可確定性觸發工具，普通自然語言仍由 Agent 判斷是否需要。

## 5. 推薦技術架構

```mermaid
flowchart LR
    UI[右下角糰子與浮層面板] --> CHAT[AI SDK UI / useChat]
    CHAT --> API[/api/agent/chat]
    API --> AGENT[ToolLoopAgent]
    AGENT --> READ[只讀業務工具]
    AGENT --> PREVIEW[變更提案工具]
    READ --> DOMAIN[現有 service / repository]
    PREVIEW --> CARD[確認卡片]
    CARD -->|使用者確認| COMMIT[確定性提交命令]
    COMMIT --> DOMAIN
    DOMAIN --> DATA[(Resume / Job / Application / Interview)]
    API --> THREADS[(AgentThread + UIMessage JSON)]
```

核心原則：模型負責理解目標、選擇工具和生成提案；真正寫資料的程式碼仍由確定性的業務函式完成。

### 5.1 Agent 執行時

使用現有 AI SDK 6：

- `ToolLoopAgent`：統一系統規則、模型和工具；
- `tool` + Zod：宣告輸入和輸出；
- API 請求與服務端執行緒讀取：注入執行緒 ID、語言和可選 `AgentSubject` 引用；
- `prepareStep`：裁剪上下文並限制當前步驟可用工具；
- `stopWhen: stepCountIs(...)`：避免迴圈失控和費用不可控；
- `createAgentUIStreamResponse`：向前端流式返回文本和工具狀態；
- `InferAgentUIMessage`：保持工具結果與前端渲染類型一致；
- `onStepFinish`：記錄工具名稱、耗時、結果狀態和 token 使用量。

第一版建議最多 6–8 步，不使用預設 20 步上限。錄階任務不是開放式網際網路研究，大部分操作應在 2–4 次工具呼叫內完成。

當前使用 DeepSeek Flash 的真實驗證還確認了一個相容性邊界：該模型在 OpenAI-compatible 介面下不接受“強制指定某個具體工具”的 `tool_choice`，會直接令請求失敗。當前實現通過 `activeTools` 只開放唯一正確的後續寫工具，同時保留普通自動工具選擇，既避免選錯，也不傳送該模型不相容的引數。未來模型能力探針必須覆蓋具體工具選擇、客戶端工具結果續接和審批續接，不能只測普通 JSON。

### 5.2 工具不是現有 API 的重複包裝

Agent 服務端工具直接呼叫現有 service / repository，不從服務端再請求自己的 HTTP API。API 路由、普通頁面和 Agent 工具應複用同一業務函式及 Zod schema。

建議工具分三類：

| 類別 | 示例 | 是否確認 |
| --- | --- | --- |
| 讀取 | 查詢履歷、職缺、投遞、面試資料 | 不需要 |
| 生成提案 | 解析投遞描述、準備履歷修改、生成 JD 比對計畫 | 不需要寫資料 |
| 提交變更 | 新增/更新投遞、建立履歷版本、儲存成果 | 必須確認 |

第一版優先採用“提案 → 確認 → 確定性提交”，而不是讓模型工具一呼叫就直接寫資料庫。它同時適配本地 SQLite 和線上瀏覽器儲存，也便於使用者看到將要發生什麼。

### 5.3 當前已經實現的執行鏈路

當前本地版提供九個業務能力，並額外註冊兩個客戶端選擇互動：三個讀取工具定位招募記錄或穩定業務 ID，六個寫工具複用現有業務函式並由 AI SDK 強制審批；兩個選擇互動只負責把使用者在卡片中的偏好送回模型，不屬於獨立業務能力。之所以不把選擇卡直接塞進寫工具，是因為當前 AI SDK 的審批響應只能提交同意、拒絕與原因，不能替換模型已經生成的工具輸入；硬合併會造成介面選擇與服務端實際引數不一致。引數選擇不寫資料，也不替代後續寫入確認：

`prepareStep` 會按當前使用者請求動態縮小可用工具：本輪尚未收到選擇卡結果時，模型看不到對應的 JD 或面試寫工具；收到選擇結果後只開放唯一對應的寫工具，但不傳送 DeepSeek Flash 不相容的強制指定工具引數。新使用者訊息會重新要求選擇，避免複用上一項任務的舊偏好，也減少 Flash 模型每一步需要區分的工具數量。

| 工具 | 類型 | 當前作用 |
| --- | --- | --- |
| `search_campus` | 讀取 | 按條件分頁搜尋校園徵才庫，每頁五條摘要；按招募記錄 ID 讀取詳情，不自動建立個人職缺或投遞 |
| `search_pipeline` | 讀取 | 搜尋後端 `Job`，同時返回該職缺可選的 `Application`；支援精確 ID、關鍵字、分頁，空關鍵字僅用於使用者明確要求“最近記錄” |
| `get_resume_context` | 讀取 | 按名稱、職缺、技能、學校、公司或專案檢索全部履歷後分頁；精確 ID 返回完整脫敏正文 |
| `configure_jd_optimization` | 選擇 | 展示四項 JD 優化開關及推薦項，把使用者選擇返回模型，不寫資料 |
| `configure_interview` | 選擇 | 展示綜合、專案、行為或 HR 模式及推薦項，把使用者選擇返回模型，不寫資料 |
| `update_application_card` | 寫入 | 新增或更新一張投遞卡片；由 AI SDK 的 `needsApproval` 強制要求使用者批准 |
| `create_resume_from_experience` | 寫入 | 把使用者明確口述的事實整理成一份新的獨立履歷並儲存，不修改已有履歷 |
| `create_jd_tailored_resume` | 寫入 | 基於精確履歷版本和現有職缺或完整 JD 生成新的客製版本，不覆蓋來源履歷 |
| `create_interview_preparation` | 寫入 | 基於精確職缺、履歷版本和使用者選擇的重點生成並儲存面試準備資料 |
| `create_mock_interview` | 寫入 | 基於精確職缺、履歷版本和使用者選擇的模式生成題目並儲存會話，隨後進入模擬面試頁 |
| `update_resume_presentation` | 寫入 | 只切換指定履歷版本的模板，保留正文、事實與分割槽 |

所有讀取限制都是“單次返回上限”，不是“只能看前幾條”：職缺和履歷工具先搜尋全部本地記錄，再按 `offset + limit` 返回，單次最多 20 條；校園徵才工具按 `page` 返回五條摘要。列表返回 `total` 與 `hasMore`，精確 ID 查詢不受列表位置影響。

完整履歷讀取統一複用 `buildAiResumeSnapshot`：刪除電子郵件、電話、連結、Logo、編輯器設定及內部優化後設資料，與 JD 比對和面試準備傳送履歷時使用同一脫敏邊界。

每輪請求的真實流程是：

1. API 從 SQLite 讀取該執行緒的完整 `UIMessage` 歷史併合並客戶端最新訊息；
2. 校驗訊息順序和當前工具 schema，拒絕客戶端新增 assistant 訊息或不相容的舊工具呼叫；
3. 將完整歷史交給 SDK 回放，`prepareCall` 和 `prepareStep` 只裁剪模型輸入；按完整輪次和歷史預算保留最近訊息及未完成互動；
4. 模型看到系統規則，以及當前步驟開放的工具說明和 Zod 輸入結構，由其通過結構化 function calling 選擇工具；
5. JD 與面試任務先顯示選擇卡；客戶端把使用者選項作為工具結果送回模型；
6. 寫工具顯示最終引數；收到使用者批准後先校驗歷史與預算，再以 `updatedAt` 比較更新持久化這次確認已被接收，儲存成功後才呼叫業務函式；併發舊請求在執行前返回 409；
7. 一輪結束後按最新持有的執行緒版本儲存完整歷史和結果，防止覆蓋另一請求已儲存的記錄；儲存失敗經流式錯誤返回。單次請求最多執行 8 個步驟。

當前沒有 embedding、向量資料庫或向量語義檢索。上下文由“最近完整輪次 + 按需查詢當前結構化業務資料”組成，資料庫始終是事實來源。模型執行時也不會閱讀本開發文件；它真正獲得的是 `career-agent.ts` 中的系統規則、工具描述、輸入 schema、訊息和工具返回值。

對於 Flash 等輕量模型，這個結構仍保持明確邊界：讀取、偏好選擇和寫入名稱不同，生成與儲存不重複拆分，搜尋順序寫進系統規則，寫操作還有程式碼層審批。Agent 只在使用者明確要求整條鏈路時才串聯多個工具，簡單請求只調用對應工具。但 Provider 和具體型號必須真正支援 OpenAI-compatible function calling；AI SDK 統一介面不代表每個相容服務都能可靠呼叫工具。當前能力探針仍未實現。

## 6. 下一階段工具缺口與合併原則

當前 11 個工具契約已經覆蓋主要本地業務流程。後續先檢查能否擴充套件已有工具的輸入或結果；只有職責、審批邊界或資料來源確實不同才新增工具。

### 6.1 `get_dashboard_context`：按需讀取控制中心

輸入：可選關注範圍，例如今日行動、到期追蹤或整體流程。
輸出：當前統計、最多 3 個優先事項及其穩定業務 ID。
約束：只讀、每次重新計算、普通履歷/JD/面試任務不自動呼叫，不能把快照儲存為長期記憶。

### 6.2 現有履歷的受控內容編輯

當前 `create_resume_from_experience` 負責建立獨立履歷，`create_jd_tailored_resume` 負責建立客製版本，`update_resume_presentation` 只改模板；三者邊界清楚，不應合成一個巨型工具。仍缺少的是“修改一份已有履歷的具體內容”。

後續可新增一個受控 `update_resume_content`，但必須複用編輯器現有 schema 和儲存邏輯，並滿足：

- 精確指定 `resumeVersionId`，不能按名稱猜；
- 只使用使用者明確提供或原履歷已有的事實；
- 先返回欄位級差異和事實風險，使用者確認後才儲存新版本；
- 預設不覆蓋來源版本；
- 改模板繼續使用 `update_resume_presentation`，不要讓內容編輯工具同時承擔視覺職責。

### 6.3 強化已有寫工具，而不是拆成重複工具

- `update_application_card`：補充原值 → 新值展示、確認期間資料變化校驗和更明確的相對日期回顯；
- `create_resume_from_experience`：增加缺失事實追問和可預覽草稿，不另建一套 Agent 專用履歷 schema；
- `create_jd_tailored_resume`：繼續複用現有 JD 優化設定與儲存邏輯，保持來源履歷不被覆蓋；
- `create_interview_preparation`：結果繼續進入職缺資料庫；
- `create_mock_interview`：只負責生成並儲存會話，真正逐題作答和回顧仍由模擬面試工作區承擔；
- `update_resume_presentation`：只處理現有模板列舉，不同時修改正文。

不增加單獨的 `open_artifact`：每個成果工具直接返回最合適的錄階路由，由結果卡片提供“點選開啟結果”。也不為“展示 JD 設定卡”“展示面試模式卡”再建立更多業務工具；當前兩個 `configure_*` 是客戶端引數互動契約，不是獨立業務能力。

## 7. 對話持久化

### 7.1 公開本地版

當前公開本地版採用一張最小表，不修改已釋出 migration：

```prisma
model AgentThread {
  id        String   @id @default(cuid())
  title     String   @default("新對話")
  messages  String   @default("[]")
  summary   String   @default("")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([updatedAt])
}
```

`messages` 儲存完整 `UIMessage[]` JSON，而不是隻儲存發給模型的 `ModelMessage`。從資料庫恢復後先做基礎結構校驗，發給 Agent 前再通過 `validateUIMessages` 按當前工具 schema 校驗；舊訊息結構不相容時拒絕繼續執行，不能讓模型執行其中的舊工具呼叫。

單表 JSON 是首版本地應用的有意簡化：執行緒整體讀寫、訊息量有限，不需要為分頁或跨訊息查詢先引入第二張表。只有真實對話規模導致整段讀寫成為瓶頸時，再拆分 `AgentMessage`，不能只為“看起來像聊天系統”提前複雜化。

儲存使用 `updatedAt` 條件更新，並保證新時間至少前進一毫秒。批准工具執行前，先在同一歷史中用 SDK 的 `output-error` 狀態持久化“確認已接收，結果尚未確認”，從而使同一次確認最多被一個請求接收；只有成功儲存的請求才執行。正常完成後用真實結果替換該狀態；中斷時仍未收到結果的已批准呼叫也保留這一提示，舊確認不能恢復成可執行狀態。讀取、引數選擇和拒絕操作無需額外預存。

此機制只防止同一確認的重放，不保證業務與歷史原子提交，也不提供自動恢復。儲存失敗、斷流或程序退出後可能已經有業務成果，也可能還沒開始；需重新開啟對話並核對業務庫後再決定是否發起新操作。停止聊天不會撤銷已開始的業務函式。不同執行緒或重新發起的不同工具呼叫仍需由業務層處理身份與重複建立問題。

當前尚未持久化頁面與業務物件繫結。後續加入時只儲存物件 ID，不建立外部索引鍵：刪除業務資料後仍應保留對話歷史；每次使用 ID 時重新查詢，找不到就標記為失效引用。

### 7.2 線上版

線上版按當前儲存約定使用瀏覽器 IndexedDB，不得把對話寫入伺服器 SQLite；舊 localStorage 僅用於相容遷移。保留現有資料庫、記錄 key 和遷移約定，不為上下文升級另建一套儲存。本輪沒有修改或驗證線上版的上下文與併發行為。

儲存相同的執行緒和訊息 DTO，只在一輪生成完成後寫入，不在每個 token 到達時重寫。線上版後續需在 IndexedDB 事務內完成版本比較與儲存，並驗證多標籤頁衝突；不能直接照搬本地 Prisma 實現。

線上版業務寫入由瀏覽器中的確定性提交命令完成。服務端 Agent 接收經過 Zod 校驗的最小上下文快照，只返回操作提案，不能直接訪問或假裝訪問使用者瀏覽器中的全部資料。

## 8. 模型相容與安全邊界

### 8.1 工具能力檢測

現有設定頁只驗證模型能否生成 JSON，不足以證明它能穩定呼叫工具。Agent 上線前增加一次輕量能力檢測：

1. 要求模型呼叫一個無副作用測試工具；
2. 驗證工具名和 Zod 輸入；
3. 驗證工具結果能回到下一步並生成最終回答；
4. 失敗時明確提示“當前模型不支援錄階 Agent 工具呼叫”，而不是把錯誤偽裝成普通回答。

AI SDK 統一了 Provider API，但無法保證所有 OpenAI-compatible 服務、本地模型和模型版本都實現相同品質的 function calling。

### 8.2 操作分級

| 風險級別 | 操作 | 行為 |
| --- | --- | --- |
| 低 | 查詢、彙總、跳轉、生成草稿 | 自動執行 |
| 中 | 新增投遞、更新階段、建立履歷版本 | 展示差異後確認 |
| 高 | 刪除資料、覆蓋內容、批次修改 | 第一版不開放；後續二次確認 |
| 外部 | 自動投遞、發訊息、瀏覽器控制 | 當前不開放 |

系統提示詞不能代替許可權控制。確認要求必須落在工具或提交命令層，不能只寫一句“請先詢問使用者”。

### 8.3 隱私與日誌

- 履歷進入模型前繼續使用 `buildAiResumeSnapshot`；
- 工具日誌只記錄工具名、業務 ID、耗時、狀態和錯誤類型，不記錄完整履歷、JD、API Key 或訊息正文；
- Agent 訊息和工具輸入均視為不可信輸入，服務端必須用 Zod 校驗；
- 工具返回面向模型的最小結果，避免把整份資料庫狀態反覆放入上下文；
- 不預設接入將對話上傳到第三方的 tracing 或記憶服務。

## 9. 推薦檔案結構

先保持少檔案，實際變大後再拆：

```text
src/components/agent/
  agent-assistant.tsx          # 糰子、浮層、歷史列表、訊息與確認卡片

src/lib/agent/
  career-agent.ts              # ToolLoopAgent、系統規則與工具註冊
  application-tools.ts         # 投遞工具 schema 與確定性執行
  workflow-tools.ts            # 履歷、JD、面試與模板的業務工具
  message-context.ts           # 訊息合併、完整輪次與預算；摘要尚待接入
  pet-position.ts              # 寵物位置邊界與持久化資料規範化
  thread-store.ts              # SQLite 執行緒與 UIMessage 持久化

src/app/api/agent/
  chat/route.ts
  threads/route.ts
  threads/[id]/route.ts
```

線上版複用訊息 DTO、Agent UI、工具 schema 和提案提交邏輯，只替換執行緒儲存和業務提交入口。不要為每個工具新增一條獨立 API 路由。

## 10. 當前實現與後續觸發條件

### 已完成：本地版可執行工具閉環

- 糰子入口、覆蓋式/全螢幕面板、拖動、歷史執行緒、語音輸入和 Markdown 渲染；
- `ToolLoopAgent`、流式狀態、客戶端引數選擇和服務端寫入審批；
- 職缺/投遞與履歷檢索；
- 投遞卡片、獨立履歷、JD 客製、面試準備、模擬面試和模板切換；
- 結果按類型跳轉到編輯器、職缺資料庫或模擬面試工作區；
- 修復 DeepSeek Flash 強制工具選擇不相容、舊配置卡誤操作和結果連結按鈕語義問題。

對應本地提交：`d08a8d2 feat: expand in-app career agent workflows`。

### 已實現：完整輪次預算與儲存保護（公開本地版）

1. 移除 12 條訊息限制，按完整輪次和約 12K Token 保守估算選擇模型歷史；
2. 清理舊 reasoning 和空訊息，六個寫工具給模型返回精簡結果；原始 UI 歷史與業務成果保留；
3. 在已批准工具執行前檢查，並在工具迴圈每步重查；必要內容超預算時明確報錯；
4. 保留當前輪次及未完成工具、審批鏈，避免單獨移除呼叫或結果；
5. 儲存時比較執行緒版本，衝突不覆蓋，並向客戶端返回可讀錯誤。

這裡是歷史裁剪與結果精簡，不是語義摘要。被移出模型上下文的早期約束不會自動保留，必要時應詢問使用者或重新讀取業務資料。約 12K Token 僅為歷史預算的保守估算，不包含系統規則、工具定義和模型輸出；實際模型視窗與 Token 消耗仍需真實 Provider 驗證。

### 本次複核：精簡重複處理，保護續接邊界

- 複用 SDK 的訊息和工具 schema 校驗，刪除路由中的重複全歷史校驗；
- 使用原生 `findLastIndex`，預算從後向前累計，儲存後不再無用回讀；
- 校園徵才精確詳情不再重複返回全庫篩選字典，搜尋仍保留可選篩選值；
- 客戶端只能提交原待審批工具的決定，或兩個待選擇工具的結果；不能改寫工具引數、歷史文本、已完成結果或重新開啟已完成呼叫；
- 保留執行已批准工具前及每步呼叫前的預算檢查、儲存衝突檢查與流式錯誤回傳，它們承擔不同的資料保護職責。

2026-10-03 繼續修復：復現了兩次併發確認執行兩次業務寫入的問題，已在執行前複用現有執行緒 CAS 接收確認；中斷或最終儲存失敗時保留結果不確定的提示並禁止重放。沒有新增表、佇列、依賴或自動重試。路由拆開 SDK 的校驗、轉換和執行入口，只為在它們之間插入持久化檢查，不重複校驗整段歷史。預設 Vitest 排除本機臨時審計及生成資源目錄，避免重複掃描殘缺測試副本。

### 2026-10-03 後端驗收

- 70 個測試檔案、330 項測試通過，類型檢查和定向 ESLint 通過。一次預設併發復跑遇到本機記憶體不足，使用 `node node_modules/vitest/vitest.mjs run --maxWorkers=2` 後全部通過。
- 生產構建通過。本機預設併發構建也遇到記憶體不足；僅在驗收程序設定 `NODE_OPTIONS=--max-old-space-size=1024`、`CIRCLE_NODE_TOTAL=3`，使用兩個靜態構建 worker 完成，未修改專案構建配置。
- 獨立合成 SQLite 中，同一次審批的併發競爭僅一個請求成功，業務檢查寫入一次；重新讀取歷史後舊確認仍不能重放。
- 使用本機已配置的 DeepSeek Flash，在獨立測試資料庫中跑通校園徵才搜尋與詳情、獨立履歷建立、JD 客製、面試準備和投遞追蹤。引數選擇與寫入審批由測試指令碼提交；資料庫核對為 1 份獨立履歷、1 個職缺、1 份面試資料、1 張正確關聯的投遞卡。校園徵才查詢和 JD 客製均未自動建立投遞。
- 實測發現引數卡返回後模型可能誤報寫工具不可用。刪除寫工具說明中重複要求先呼叫配置工具的措辭，改為使用已完成配置卡的結果；失敗樣例及上述整條鏈路複驗通過。保留 `auto` 和 `activeTools`，未引入服務返回 400 的強制工具選擇，也不據此保證模型永不誤選。
- 真實模型驗證覆蓋上述五段後端流程，不代表全部模型、全部工具或 UI 已驗收。未修改個人業務資料，未重新打包桌面安裝器，未同步線上版；歷史預算仍不等於語義摘要。

### 接下來優先驗證的真實問題

- 其他 Provider、模型版本及實際介面的工具呼叫、引數選擇和審批續接；本次單一模型後端驗收不能替代這些驗證；
- 不同執行緒或使用者重新發起的操作是否重複建立業務物件；若需要自動重試或恢復，仍需處理業務結果與執行記錄的原子提交，不能把本次確認防重放當作完整冪等系統；
- 職缺身份、同名消歧、履歷目標選擇與已有業務儲存邏輯。由共享 service/repository 修復，不為每個工具另建儲存。

### 有明確需求時再實現

- **物件繫結**：使用者頻繁從履歷或職缺頁面說“修改這個”時，增加可選物件引用，讀取資料庫當前狀態；
- **執行緒摘要**：真實長對話持續丟失早期約束時，利用已有 `AgentThread.summary` 做增量摘要，覆蓋被裁剪的完整輪次，並驗證事實與費用；
- **可控履歷編輯**：擴充套件到修改既有正文時，先展示欄位差異並確認，再儲存新版本；
- **控制中心工具**：確有整體進度問答需求時，複用現有彙總，不預設注入快照；
- **線上版同步**：作為獨立變更適配瀏覽器儲存、驗證並授權釋出，不能把公開本地版檢查視作線上已完成。

跨執行緒長期記憶、向量庫、多 Agent、第二套執行時與跨天任務恢復均不屬於當前必做範圍。

## 11. 測試與完成標準

以下是對應能力實現或釋出時的驗收清單；尚未實現的候選能力不代表當前已通過，也不要求為了滿足清單先新增功能：

1. 兩個對話繫結不同職缺時上下文不串線；
2. “昨天投遞、下週二一面”等相對日期能顯示絕對日期後再確認；
3. 同一職缺不會重複建立 Job 或 Application；
4. 多個同名職缺時必須詢問，不能猜測；
5. 使用者拒絕確認時資料庫沒有任何變化；
6. 提交前目標記錄已變化時停止並重新生成差異；
7. 履歷修改不新增原履歷不存在的事實；
8. 刪除職缺或履歷後，舊執行緒能開啟並正確顯示引用已失效；
9. 歷史訊息恢復後通過當前工具 schema 校驗；
10. 不支援工具呼叫的模型得到清晰提示；
11. Agent 迴圈達到步數上限時安全停止；
12. 公開版 SQLite 與線上版瀏覽器儲存分別完成真實行為驗證；
13. 上下文永遠從使用者訊息開始，不截斷為孤立的 Assistant 回答；
14. 舊工具大結果被清理，但最近未完成呼叫和審批完整保留；
15. 超過預算時只壓縮舊完整輪次，摘要失敗不破壞舊摘要和原始歷史；
16. 履歷/JD/職缺階段在摘要與資料庫衝突時以資料庫當前值為準；
17. 使用者直接改履歷時不讀取控制中心，詢問整體進度時才呼叫控制中心工具；
18. DeepSeek Flash 等相容模型不會收到已知不支援的強制指定工具引數。

釋出前仍需執行全量 Vitest、ESLint、TypeScript/Next.js 生產構建，並真實操作兩個首發閉環。

## 12. 框架研究結論

| 方案 | 能力 | 對錄階的代價 | 結論 |
| --- | --- | --- | --- |
| Vercel AI SDK 6 | Provider 無關、ToolLoopAgent、工具、流式 UI、審批、訊息裁剪 | 記憶語義和持久化仍由應用設計 | 採用；專案已安裝 |
| OpenAI Agents SDK TS | 小型抽象、Session、HITL、Guardrail、Tracing、多 Agent | 新增第二套執行時；非 OpenAI 模型雖可接 AI SDK 介面卡，但收益與現有能力重疊 | 暫不採用 |
| LangGraph.js | Checkpoint、可恢復圖、Interrupt、長期任務、時間旅行 | 心智模型、狀態圖和持久化更重 | 只有出現跨小時/跨天可恢復工作流時再評估 |
| Mastra | Agent、Workflow、Memory、RAG、Evals、Observability 一體化 | 引入較大框架面並重復現有 Provider、儲存和業務結構 | 更適合綠地專案，當前不採用 |
| VoltAgent | TypeScript Agent、Workflow、Memory、Observability 與 MCP | 核心包本身仍帶來一套完整 Agent 執行時，與現有 AI SDK 能力和錄階儲存邊界重複 | 小而完整，但不是本專案當前最小增量 |
| TanStack AI | Headless UI、工具、審批、持久化與多 Provider Adapter | 更像 AI SDK 的替代層而不是補充層；生態仍新，遷移會重寫現有 AI 路由 | 繼續觀察，不在這次升級中替換穩定底座 |
| BeeAI Framework | Agent、Workflow、Memory、工具與遙測 | 框架維護方已明確不再繼續維護，且會引入自己的執行時 | 排除 |
| Vercel Chat SDK | 多聊天平台 Adapter 與 Bot 狀態 | 解決 Slack/Teams/Discord 等渠道，不解決當前網頁內助手核心問題 | 當前不採用 |

如果未來出現以下任意兩個條件，再重新評估 LangGraph 或 Mastra：

- 任務需要執行數小時或數天；
- 服務重啟後必須從中間步驟恢復；
- 有複雜並行分支、補償事務和人工審批佇列；
- 多 Agent 協作成為核心產品能力；
- 需要專門的 Agent 運維平台，而不僅是應用日誌和評測。

在此之前，現有 AI SDK + 錄階自己的業務工具系統是最簡單、風險最低、最符合專案架構的方案。

### 12.1 寵物互動方案

Codex 的寵物並非完全不可參考：OpenAI 公開倉庫包含 TUI 寵物的資源包下載、動畫狀態、內建目錄和環境動作實現，官方 Skills 倉庫也公開了 8×9 精靈圖契約。但桌面應用中負責浮動 WebView 展示和互動的完整渲染層，目前沒有在公開倉庫中找到，不能把 Codex 桌面寵物當作一個可直接安裝的前端元件。

現有開源專案中，與錄階網頁形態最接近的是 `gibbon/agent-pet`：Apache-2.0、React 18+、無執行時依賴，支援拖動、localStorage 位置持久化、九種動畫狀態和自訂精靈圖。不過它自帶懸浮容器、氣泡和狀態 API，會與錄階已經實現的 Agent 面板重複；專案本身也較新。當前不新增依賴，只複用其已驗證的互動思路，用瀏覽器原生 Pointer Events、CSS 動畫和 localStorage 接入現有面板。

`pixelpets` 提供看向滑鼠、拖拽、撫摸、打字/滾動反應和 Agent 狀態聯動，互動性更豐富，但它是 Electron 全螢幕透明桌面應用，不適合直接嵌入 Next.js 頁面。它可作為以後豐富動作和情緒狀態的產品參考，不作為本次執行時依賴。

當前寵物形態與行為邊界：

- 保留已有胖糰子/紙張混合形象 `public/brand/lujie-agent.svg`，不覆蓋資產；
- 新增獨立紙團子候選 `public/brand/lujie-agent-paper-v1.png`，確認形象後再決定是否替換預設皮膚；
- 寵物預設只顯示本體，點選才開啟覆蓋式面板，不改變頁面佈局；
- 本體可拖動並記住位置，拖動結束不會誤開啟面板；
- 空閒時輕微呼吸，思考時加快動作，滑鼠移動時有輕微朝向反饋；
- 系統開啟“減少動態效果”時停用迴圈動畫和滑鼠追隨；
- 首版不引入完整精靈圖執行時。只有確認需要揮手、行走、睡眠、成功/失敗等逐幀動作時，再評估接入 `agent-pet` 或按 Codex 圖集契約製作獨立動作包。

## 13. 主要一手資料

- [Vercel AI SDK：Agents](https://ai-sdk.dev/docs/agents)
- [Vercel AI SDK：Building Agents](https://ai-sdk.dev/docs/agents/building-agents)
- [Vercel AI SDK：Loop Control](https://ai-sdk.dev/docs/agents/loop-control)
- [Vercel AI SDK：Memory](https://ai-sdk.dev/docs/agents/memory)
- [Vercel AI SDK：Chatbot Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence)
- [Vercel AI SDK：Tool Usage and Approval](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage)
- [Vercel 官方 Chatbot 模板](https://github.com/vercel/chatbot)
- [Vercel Chat SDK](https://github.com/vercel/chat)
- [OpenAI Agents SDK TypeScript](https://openai.github.io/openai-agents-js/)
- [OpenAI Agents SDK：Sessions](https://openai.github.io/openai-agents-js/guides/sessions/)
- [OpenAI Agents SDK：Human in the Loop](https://openai.github.io/openai-agents-js/guides/human-in-the-loop/)
- [LangGraph.js](https://github.com/langchain-ai/langgraphjs)
- [LangGraph：Persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence)
- [LangGraph：Interrupts](https://docs.langchain.com/oss/javascript/langgraph/interrupts)
- [Mastra](https://github.com/mastra-ai/mastra)
- [VoltAgent](https://github.com/VoltAgent/voltagent)
- [TanStack AI](https://tanstack.com/ai/latest)
- [BeeAI Framework](https://github.com/i-am-bee/beeai-framework)
- [OpenAI Codex：寵物資源包](https://github.com/openai/codex/blob/main/codex-rs/tui/src/pets/asset_pack.rs)
- [OpenAI Codex：寵物動畫模型](https://github.com/openai/codex/blob/main/codex-rs/tui/src/pets/model.rs)
- [OpenAI Codex：環境動作](https://github.com/openai/codex/blob/main/codex-rs/tui/src/pets/ambient.rs)
- [OpenAI Skills：Codex 寵物圖集契約](https://github.com/openai/skills/blob/main/skills/.curated/hatch-pet/references/codex-pet-contract.md)
- [agent-pet：網頁 Agent 寵物元件](https://github.com/gibbon/agent-pet)
- [pixelpets：Electron 互動桌面寵物](https://github.com/JOhnsonKC201/pixelpets)
