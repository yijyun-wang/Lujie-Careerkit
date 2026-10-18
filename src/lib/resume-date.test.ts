import { describe, expect, it } from "vitest";

import { normalizeResumeMonth, parseResumeMonth } from "./resume-date";

describe("resume dates", () => {
  it("parses common month formats", () => {
    expect(parseResumeMonth("2024-09")).toEqual({ year: "2024", month: "09" });
    expect(parseResumeMonth("2004/9")).toEqual({ year: "2004", month: "09" });
    expect(parseResumeMonth("2019.12")).toEqual({ year: "2019", month: "12" });
    expect(parseResumeMonth("2022年11月")).toEqual({ year: "2022", month: "11" });
    expect(parseResumeMonth("2023")).toEqual({ year: "2023", month: "" });
    expect(parseResumeMonth("至今")).toBeNull();
    expect(parseResumeMonth("2024/13")).toBeNull();
  });

  it("normalizes to YYYY-MM and 至今", () => {
    expect(normalizeResumeMonth("2004/9")).toBe("2004-09");
    expect(normalizeResumeMonth("2023")).toBe("2023");
    expect(normalizeResumeMonth("現在")).toBe("至今");
    expect(normalizeResumeMonth("Present")).toBe("至今");
    expect(normalizeResumeMonth("")).toBe("");
    expect(normalizeResumeMonth("2020 春季")).toBe("2020 春季");
  });
});
