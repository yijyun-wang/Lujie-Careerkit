import { describe, expect, it } from "vitest";

import { preserveConfirmedJobLabel } from "./repository";

describe("job identity", () => {
  it("fills placeholders once and preserves confirmed or manually corrected names", () => {
    expect(preserveConfirmedJobLabel("待填寫公司", "字節跳動")).toBe("字節跳動");
    expect(preserveConfirmedJobLabel("字節跳動", "抖音AI")).toBe("字節跳動");
    expect(preserveConfirmedJobLabel("AI 產品實習生", "其他職缺")).toBe("AI 產品實習生");
  });
});
