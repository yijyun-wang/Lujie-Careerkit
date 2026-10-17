import { describe, expect, it } from "vitest";

import { analyzeJobInput, jobAnalysisInputSchema } from "./job-analysis";

describe("analyzeJobInput", () => {
  it("extracts practical JD signals while leaving identity recognition to AI", () => {
    const result = analyzeJobInput(`
      字節跳動 - 前端開發實習生
      base：北京/上海，可轉正，投遞截止：2026-06-20
      工作內容：參與抖音電商活動頁開發，負責 React 元件、效能優化和資料埋點。
      應徵條件：熟悉 JavaScript、TypeScript、React，瞭解瀏覽器渲染和網路請求。
      加分項：有大型專案經驗，熟悉 Next.js 或工程化。
    `);

    expect(result.company).toBe("待填寫公司");
    expect(result.title).toBe("待分析職缺");
    expect(result.deadline).toBe("2026-06-20");
    expect(result.keywords).toEqual(
      expect.arrayContaining(["React", "TypeScript", "JavaScript", "Next.js"]),
    );
    expect(result.requirements.length).toBeGreaterThan(0);
    expect(result.bonusPoints.join("")).toContain("工程化");
    expect(result).not.toHaveProperty("matchScore");
  });

  it("returns an empty-state friendly analysis when JD text is blank", () => {
    const result = analyzeJobInput("");

    expect(result.company).toBe("待填寫公司");
    expect(result.title).toBe("待分析職缺");
    expect(result.keywords).toEqual([]);
    expect(result.risks).toContain("缺少職缺 JD，無法判斷關鍵字和比對缺口。");
    expect(result).not.toHaveProperty("matchScore");
  });

  it("rejects invalid calendar dates and non-string list values", () => {
    const valid = analyzeJobInput("美團 - 後端開發實習生\n要求 Java");

    expect(jobAnalysisInputSchema.safeParse({ ...valid, deadline: "2026-02-30" }).success).toBe(false);
    expect(jobAnalysisInputSchema.safeParse({ ...valid, risks: [42] }).success).toBe(false);
  });
});
