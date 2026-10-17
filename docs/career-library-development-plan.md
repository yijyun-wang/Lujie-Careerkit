# 求職資料庫開發計畫與儲存說明

> 狀態：已實施
> 日期：2026-08-13
> 前置規範：[求職資料庫設計規範](./career-library-design-spec.md)

## 1. 先回答：資料現在到底存在哪裡

### 1.1 公開本地版

公開本地版使用 Prisma + SQLite。當前配置是：

```text
DATABASE_URL="file:./dev.db"
實際檔案：prisma/dev.db
```

`.db` 是一個 SQLite 資料庫檔案，不是 JSON 資料夾。複雜資料由 Prisma 宣告為 `Json` 欄位，寫入 SQLite 後以可校驗的 JSON 值儲存在對應表的列中；當前資料庫實際查詢到的底層儲存類型為 `text`。因此更準確的說法是：

> 資料儲存在 SQLite 的表和記錄中，其中部分列的內容採用 JSON 結構；磁碟上只有資料庫檔案，不會為每份資料另建一個 `.json` 檔案。

當前對映如下：

| 資料 | SQLite 表 | 普通列 | JSON 結構列 |
| --- | --- | --- | --- |
| 履歷檔案 | `Resume` | 獨立履歷的名稱、時間 | 無；實際內容由關聯的 `ResumeVersion` 儲存 |
| 基礎/通用優化履歷 | `ResumeVersion` | 名稱、摘要、時間、`resumeId`，通用版本 `jobId = null` | `content`，優化版本內部可含原履歷、診斷、優化後設資料和審閱狀態 |
| JD 客製履歷 | `ResumeVersion` | 名稱、摘要、時間、`jobId` | `content`，內部可含原履歷和優化後設資料 |
| JD 與職缺分析 | `Job` | 公司、職缺、JD、連結、時間 | `analysis` |
| 面試準備資料 | `InterviewPreparation` | `jobId`、履歷關聯、模式、時間 | `context`、`content` |
| 模擬面試與回顧 | `InterviewSession` | 狀態、當前題號、職缺和履歷關聯、時間 | `context`、`questions`、`answers`、`feedback` |
| 投遞狀態 | `Application` | 狀態、日期、備註及關聯 | 無主要成果 JSON |

“儲存在同一記錄中”的具體含義，例如一次模擬面試：資料庫中有一條 `InterviewSession` 記錄；問題、回答和回顧不是三個檔案，而是這條記錄的 `questions`、`answers`、`feedback` 三個 JSON 列。面試準備則是另一條 `InterviewPreparation` 記錄，它的完整準備資料位於 `content` JSON 列。兩者通過真實 `jobId` 關聯職缺；刪除職缺時 `jobId` 會置空，但資料正文繼續保留。

通用履歷優化也不是單獨的 Markdown 或 PDF 檔案。它是一條 `ResumeVersion`：優化後的完整履歷在 `content` 中；用於還原過程的原履歷、診斷、使用者選擇、優化草稿和採納狀態，可能位於同一個 `content` 物件的內部欄位中。

### 1.2 線上版

當前線上版沒有把業務資料寫入伺服器 SQLite。它呼叫：

```text
localStorage key：lujie-careerkit:online-demo:data:v2
儲存形式：JSON.stringify(整個 InitialData)
```

該 key 包含履歷、履歷版本、職缺、投遞、模擬面試和面試準備等業務資料。AI 設定另存於：

```text
lujie-careerkit:online-demo:ai-settings:v2
```

這些資料位於使用者當前瀏覽器、當前 origin 的站點儲存中，不在專案方的伺服器資料庫中。網站指令碼在同一 origin 下可以讀寫它；清理站點資料、更換域名/協議/埠、換瀏覽器或換裝置都不會自動同步。

IndexedDB 如果未來啟用，也仍然是使用者瀏覽器裡的本地站點儲存，不會因為從 localStorage 改成 IndexedDB 就自動上傳到專案方伺服器。它與 localStorage 的主要區別是容量、事務和結構化讀寫能力，不是“本地/雲端”的區別。是否向 AI 服務傳送所選履歷和 JD 屬於生成時的資料處理鏈路，與持久化位置是兩個問題，產品隱私說明需要分別披露。

### 1.3 容量核對

2026-08-13 對當前本地開發資料庫做了只讀統計：

- `prisma/dev.db` 檔案大小：約 **90.46 MiB**；
- SQLite 當前已佔用頁面：約 **7.12 MiB**；
- 已釋放但尚未歸還給檔案系統的空閒頁面：約 **83.34 MiB**；
- 當前履歷、職缺分析、面試準備、模擬面試等主要 JSON/文本欄位合計：約 **38 KiB**。

因此當前 `.db` 的 90 MiB 主要不是現有文字資料造成的，而是 SQLite 刪除舊資料後保留了大量可複用空閒頁。後續新增資料會先複用這些頁。首版資料庫只讀取和組織現有記錄，幾乎不增加持久化容量。

一般情況下，結構化文字資料每份通常是 KB 級；更需要關注的是履歷內容中允許存在的 base64 圖片/Logo，它比純文字大得多，並且 base64 本身還會增加體積。PDF/DOCX 匯出不應回存資料庫。資料庫壓縮（例如 SQLite `VACUUM`）不是資料庫首版需求，不自動執行，避免無備份情況下進行大規模檔案重寫。

線上版當前使用 localStorage，配額由瀏覽器決定且不可依賴固定數值。資料庫本身不復制資料，因此不會加劇容量問題。後續如果實際資料量觸及配額，應單獨實施 localStorage 到 IndexedDB 的相容遷移，並同時提供匯出備份、配額失敗提示和恢復方案；首版不為資料庫順帶遷移儲存。

## 2. 架構決定

### 2.1 不新增“資料庫記錄”表

首版資料庫是現有成果的統一索引和檢視層，不建立 `LibraryItem` 資料表，也不把成果複製為新的 JSON。

這樣可以保證：

- 同一份 JD 客製履歷仍只存在於 `ResumeVersion`；
- 從履歷編輯器和資料庫開啟的是同一個版本；
- 刪除、重新命名和更新時間不會出現兩套狀態；
- 公開版無需資料庫遷移；
- 線上版無需修改 localStorage key 或複製整個資料集。

只在程式碼中建立一個輕量只讀檢視模型，把現有記錄對映為卡片和樹節點。

### 2.2 建議檢視模型

在 `src/lib/career-library.ts` 中定義最小必要類型與純函式：

```ts
type CareerArtifactKind =
  | "general-resume-optimization"
  | "job-resume-optimization"
  | "job-analysis"
  | "interview-preparation"
  | "mock-interview";

type CareerArtifactRef = {
  id: string;
  kind: CareerArtifactKind;
  title: string;
  jobId: string | null;
  updatedAt: string;
};
```

純函式負責：

- 從 `InitialData` 建立成果列表；
- 按 `jobId` 聚合職缺檔案；
- 按類型分組；
- 計算職缺檔案的數量和最近更新時間；
- 搜尋、排序；
- 根據實際欄位生成詳情樹，缺少歷史欄位時安全降級。

不建立通用倉儲抽象，不新增依賴，不在對映層寫資料。

## 3. 路由與應用外殼

### 3.1 導航

修改：

- `src/lib/navigation.ts`：`NavKey` 增加 `library`，路徑為 `/library`；`/library/...` 解析為 `library`。
- `src/components/app/navigation.tsx`：新增資料夾圖示的“求職資料庫”，順序緊跟 `pipeline`。
- `messages/zh-TW.json` 與 `messages/en.json`：同步導航、頁面、狀態和空狀態文案。

最終順序：

```text
控制中心
履歷編輯器
JD比對優化
面試助手
投遞職缺追蹤
求職資料庫
設定
```

### 3.2 頁面地址

建議使用可直接訪問和可返回的地址：

```text
/library                              預設按職缺
/library?group=type                   按分類
/library/jobs/{jobId}                 職缺檔案工作區
/library/artifacts/{kind}/{id}        成果工作區
```

使用一個 `src/app/library/[[...detail]]/page.tsx` 入口載入 `getAppData()` 並把初始目標傳給 `CareerKitApp`，避免為每類成果建立重複頁面檔案。

### 3.3 隱藏全域性外殼

參照現有 `isResumeEditor`，增加明確的 `isLibraryWorkspace` 狀態：

- 列表頁：顯示 `AppSidebar` 和 `AppTopbar`；
- 職缺/成果工作區：隱藏二者，主內容取消 `lg:ml-72` 和頁面容器寬度；
- 瀏覽器前進/後退必須同步列表、職缺工作區和成果工作區狀態。

不要把資料樹作為普通列表頁內部元件巢狀。

## 4. UI 實施拆分

遵循最少檔案原則，建議先落三個模組：

1. `src/components/library/career-library-view.tsx`
   - 按職缺/按分類切換；
   - 搜尋、排序、網格/列表；
   - 分類分段；
   - 內部複用同一個卡片元件。
2. `src/components/library/career-library-card.tsx`
   - 職缺和成果共享視覺骨架與統一檔案圖形；
   - 通過資料決定文字，不通過類型改變結構或插畫。
3. `src/components/library/career-library-workspace.tsx`
   - 頂部工作區工具欄；
   - 左側資料樹；
   - 右側按當前成果類型呼叫現有內容展示能力。

如果兩個元件可以在一個檔案中保持清晰，就不額外拆檔案。

優先複用：

- 現有按鈕、Badge、Tooltip、滾動區和圖示；
- 履歷優化已有的 before/after、診斷和修改摘要資料；
- 面試準備現有的結構化內容展示；
- 模擬面試已有的問題、回答和回顧展示；
- 履歷編輯器的全螢幕外殼尺寸和隱藏規則。

不復制已有成果渲染邏輯來做一套“資料庫專用版本”；需要時提取最小的共享展示元件。

## 5. 資料與操作邊界

### 5.1 資料識別

- 通用優化履歷：`ResumeVersion.jobId` 為空，且 `content._tailoringBaseResume` 存在。
- JD 客製履歷：`ResumeVersion.jobId` 非空。
- 普通履歷副本：不滿足以上條件，不進入資料庫。
- 職缺分析：`Job.analysis` 有有效內容時進入。
- 面試準備：每條 `InterviewPreparation` 都是一項成果。
- 模擬面試：每條 `InterviewSession` 都是一項成果；只有存在有效 `feedback` 時顯示覆盤節點。

### 5.2 刪除與修改

- 職缺檔案是派生分組，首版不能整檔刪除。
- 成果刪除複用現有 API 和倉儲函式，不增加“資料庫刪除副本”。
- `Job.analysis` 當前與職缺記錄同表，首版只讀，不提供單獨刪除職缺分析，避免誤刪整個職缺及關聯投遞。
- 從資料庫開啟優化履歷編輯器時編輯原 `ResumeVersion`。
- 刪除成果後，列表和職缺計數從當前 `InitialData` 重新派生。

### 5.3 歷史相容

舊資料可能缺少 `_optimizationStages`、結構化診斷或新版面試回顧。處理原則：

- 有欄位才顯示節點；
- 無欄位時仍可展示優化後履歷、摘要、問題與回答等現有內容；
- 不把“欄位不存在”解釋成“使用者沒有能力”；
- 不為舊記錄寫回偽造的預設內容；
- 無需修改現有儲存 key 或資料庫歷史 migration。

## 6. 原入口遷移

資料庫完成並驗證後，刪除 `AppPageHeader` 中用於完整瀏覽以下歷史成果的右上角下拉式清單：

- 優化履歷版本列表；
- 已生成面試準備資料列表；
- 模擬面試與回顧記錄列表。

保留當前流程中的直接操作：

- 生成完成後檢視本次結果；
- 進入履歷編輯器；
- 前往求職資料庫。

遷移完成後不保留兩套歷史管理入口或相容選單。

## 7. 實施順序

### 階段一：只讀資料索引

1. 增加 `library` 導航和中英文文案。
2. 實現成果識別、按職缺聚合、按分類分組、搜尋和排序純函式。
3. 建立 `/library` 列表頁，完成統一卡片。
4. 此階段不改變資料庫、localStorage 和任何生成 API。

### 階段二：獨立工作區

1. 增加職缺檔案深連結和資料樹。
2. 增加成果深連結和動態資料樹。
3. 複用現有結果元件顯示正文。
4. 完成關閉、返回、瀏覽器前進/後退和已刪除記錄狀態。

### 階段三：管理動作與入口收斂

1. 接入已有成果刪除和開啟履歷操作。
2. 增加必要的刪除確認和錯誤反饋。
3. 從原頁面右上角移除完整歷史下拉式清單。
4. 在生成完成頁增加“前往求職資料庫”。

### 階段四：線上版同步

1. 移植共享 UI、類型和純對映邏輯到私有線上版。
2. 複用線上版現有 `InitialData` 和 localStorage 儲存流程。
3. 不更改 `lujie-careerkit:online-demo:data:v2`，不引入伺服器持久化。
4. 驗證重新整理、清理站點資料、配額寫入失敗和中英文文案。

## 8. 最小測試計畫

新增一個針對派生邏輯的小型 Vitest 測試檔案，至少覆蓋：

1. 通用優化與普通履歷副本不會混淆；
2. JD 客製履歷同時出現在對應職缺和“履歷成果 / 職缺客製”；
3. 同一成果只生成一個 `id + kind` 引用，不復制資料；
4. 職缺計數和最近更新時間正確；
5. 歷史通用優化缺少診斷時不生成診斷節點；
6. 未完成模擬面試不生成 AI 回顧節點；
7. 搜尋和最近更新排序正確；
8. 沒有成果的職缺不生成職缺檔案。

實現完成後執行：

```text
npm test
npm run lint
npx tsc --noEmit
npm run build
```

並做最小真實互動檢查：

- 導航進入資料庫；
- 按職缺/按分類切換；
- 點選職缺與成果進入全螢幕工作區；
- 工作區中不出現雙層側欄；
- 瀏覽器返回恢復原列表和篩選；
- 刪除一項可刪除成果後兩種檢視同步更新。

## 9. 首版明確不做

- 不新增資料庫表或 migration；
- 不遷移 localStorage 到 IndexedDB；
- 不實現正文全文搜尋；
- 不儲存第二份成果快照；
- 不把求職信/招呼語假裝成已儲存資料；
- 不支援整檔刪除職缺；
- 不順帶重構全部導航或結果頁；
- 不自動壓縮或重寫使用者的 SQLite 資料庫。

後續只有在“求職信等獨立文件正式支援儲存”時，再評估是否需要一個通用生成文件模型；在此之前，現有表已經覆蓋首版資料庫。
