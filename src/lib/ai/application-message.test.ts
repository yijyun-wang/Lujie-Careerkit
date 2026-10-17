import { describe, expect, it } from "vitest";

import { buildApplicationMessagePrompt } from "./application-message";

const resume = {
  basics: {
    name: "陳同學",
    email: "private@example.com",
    phone: "13800000000",
    city: "北京",
    links: ["https://example.com/private"],
  },
  profile: { title: "AI 產品實習生", summary: "關注 Agent 產品落地。" },
  education: [],
  experiences: [],
  internships: [],
  projects: [
    {
      name: "Agent 求職助手",
      role: "產品與開發",
      period: "2026",
      highlights: ["完成 RAG 知識庫與評測流程設計"],
    },
  ],
  skills: ["RAG", "Prompt 工程"],
  awards: [],
  selfReview: "",
};

describe("application message AI task", () => {
  it("puts explicit availability first in greeting prompts without leaking contact details", () => {
    const prompt = buildApplicationMessagePrompt({
      kind: "greeting",
      jd: "招募 AI 產品實習生，要求每週到職五天。",
      resume,
      extraContext: "可立即到職，連續實習 6 個月，每週 5 天。",
      locale: "zh-TW",
    });

    expect(prompt).toContain("第一句話先給招募方最關心的硬比對資訊");
    expect(prompt).toContain("104、CakeResume、LinkedIn");
    expect(prompt).toContain("可立即到職，連續實習 6 個月，每週 5 天");
    expect(prompt).toContain("Agent 求職助手");
    expect(prompt).toContain("不能改寫為“主導、獨立、全權負責”");
    expect(prompt).toContain("不能擴寫為全職");
    expect(prompt).not.toContain("private@example.com");
    expect(prompt).not.toContain("13800000000");
    expect(prompt).not.toContain("example.com/private");
  });

  it("keeps cover letters formal and evidence-based", () => {
    const prompt = buildApplicationMessagePrompt({
      kind: "cover-letter",
      jd: "招募 AI 產品實習生，負責 RAG 產品設計。",
      resume,
      locale: "zh-TW",
    });

    expect(prompt).toContain("電子郵件、LinkedIn 私訊或 104 應徵信等正式投遞");
    expect(prompt).toContain("2-3 個最有說服力的真實經歷或能力證據");
    expect(prompt).toContain("嚴禁編造");
  });
});
