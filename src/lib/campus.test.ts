import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFile, stat } from "node:fs/promises";
import { campusDatasetSchema, campusDeadline, campusQuerySchema, taipeiDate, queryCampus, type CampusDataset, type CampusRecord } from "./campus";
import { GET } from "@/app/api/campus/route";

vi.mock("node:fs/promises", () => ({ readFile: vi.fn(), stat: vi.fn() }));

const record: CampusRecord = {
  id: "example-1", company: "示例科技", companyType: "民企", industry: "網際網路",
  recruitmentTypes: ["秋招", "實習"], targets: ["2027屆", "2026屆"], location: "北京蘇州",
  positions: "Software Engineer 軟體工程師", updatedAt: "2026-09-11", deadlineRaw: "2026-09-14",
  deadlineDate: "2026-09-14", applyUrl: "https://example.com/apply", noticeUrl: null,
  exams: ["需要筆試"], reviewNote: "", sourceRows: "2",
};
const dataset: CampusDataset = { schemaVersion: 1, sourceName: "Synthetic test data", preparedAt: "2026-09-14", records: [record] };
const query = (input = {}) => campusQuerySchema.parse(input);

describe("campus catalog", () => {
  it("sorts dates in both directions with unknown dates last and filters deadline states", () => {
    const data = { ...dataset, records: [
      { ...record, id: "unknown", company: "unknown", deadlineDate: null, deadlineRaw: "儘快投遞", updatedAt: null },
      { ...record, id: "later", company: "later", deadlineDate: "2026-10-01", updatedAt: "2026-09-12" },
      { ...record, id: "earlier", company: "earlier", deadlineDate: "2026-09-13" },
      { ...record, id: "invalid", company: "invalid", deadlineDate: null, deadlineRaw: "2026-11-31" },
    ] };
    const ids = (input: object) => queryCampus(data, query(input), "2026-09-14").records.map((item) => item.id);
    expect(ids({ sort: "deadline_asc" })).toEqual(["earlier", "later", "invalid", "unknown"]);
    expect(ids({ sort: "deadline_desc" })).toEqual(["later", "earlier", "invalid", "unknown"]);
    expect(ids({ sort: "updated_asc" }).at(-1)).toBe("unknown");
    expect(ids({ sort: "updated_desc" })[0]).toBe("later");
    expect(ids({ deadline: "dated", sort: "deadline_asc" })).toEqual(["later"]);
    expect(ids({ deadline: "expired" })).toEqual(["earlier"]);
    expect(ids({ deadline: "unspecified" })).toEqual(["unknown"]);
    expect(ids({ deadline: "invalid" })).toEqual(["invalid"]);
    expect(campusQuerySchema.safeParse({ sort: "bad" }).success).toBe(false);
    expect(campusQuerySchema.safeParse({ deadline: "open" }).success).toBe(false);
  });

  it("matches all keywords and exact multi-value filters without confusing early recruitment", () => {
    const data = { ...dataset, records: [record, { ...record, id: "early", recruitmentTypes: ["秋招提前批"] }] };
    expect(queryCampus(data, query({ q: "示例 SOFTWARE", recruitmentType: "秋招", target: "2027屆", location: "蘇州", exam: "需要筆試", industry: "網際網路", companyType: "民企" })).records.map((item) => item.id)).toEqual(["example-1"]);
    expect(queryCampus(data, query({ q: "示例 銷售" })).total).toBe(0);
    expect(queryCampus(data, query({ companyType: "外企" })).total).toBe(0);
    expect(queryCampus(data, query({ target: "2028屆" })).total).toBe(0);
    expect(queryCampus(data, query()).facets.recruitmentType).toHaveLength(3);
  });

  it("paginates deterministically without mutating data, and clamps out-of-range pages", () => {
    const data = { ...dataset, records: Array.from({ length: 41 }, (_, i) => ({ ...record, id: String(i).padStart(3, "0"), company: String(i).padStart(3, "0"), updatedAt: i === 40 ? "2026-09-12" : record.updatedAt })) };
    const first = queryCampus(data, query());
    const second = queryCampus(data, query({ page: 2 }));
    expect(first.records[0].id).toBe("040");
    expect(first.records).toHaveLength(20);
    expect(second.records).toHaveLength(20);
    expect(new Set([...first.records, ...second.records].map((item) => item.id)).size).toBe(40);
    expect(queryCampus(data, query({ page: 999 })).page).toBe(3);
    expect(data.records[0].id).toBe("000");
    expect(queryCampus(null, query()).source).toBeNull();
  });

  it("uses the China calendar day and never treats vague or invalid dates as open recruitment", () => {
    expect(taipeiDate(new Date("2026-09-13T16:00:00Z"))).toBe("2026-09-14");
    expect(campusDeadline(record, "2026-09-14")).toBe("dated");
    expect(campusDeadline(record, "2026-09-15")).toBe("expired");
    expect(campusDeadline({ deadlineDate: null, deadlineRaw: "儘快投遞" }, "2026-09-14")).toBe("unspecified");
    expect(campusDeadline({ deadlineDate: null, deadlineRaw: "2026-11-31" }, "2026-09-14")).toBe("invalid");
  });

  it("reads a linked record independently of the current filters and page", () => {
    const result = queryCampus(dataset, query({ recordId: record.id, q: "不存在", page: 999 }));
    expect(result.records).toEqual([]);
    expect(result.selectedRecord).toEqual(record);
    expect(queryCampus(dataset, query({ recordId: "missing" })).selectedRecord).toBeNull();
    expect(campusQuerySchema.safeParse({ recordId: " " }).success).toBe(false);
  });

  it("rejects unsafe URLs, impossible normalized dates, duplicate IDs and invalid queries", () => {
    for (const applyUrl of ["javascript:alert(1)", "file:///etc/passwd", "data:text/html,test", "//example.com"]) {
      expect(campusDatasetSchema.safeParse({ ...dataset, records: [{ ...record, applyUrl }] }).success).toBe(false);
    }
    expect(campusDatasetSchema.safeParse({ ...dataset, records: [{ ...record, deadlineDate: "2026-11-31" }] }).success).toBe(false);
    expect(campusDatasetSchema.safeParse({ ...dataset, records: [record, record] }).success).toBe(false);
    for (const input of [{ page: 0 }, { page: 1.5 }, { page: "NaN" }, { q: "a".repeat(121) }]) expect(campusQuerySchema.safeParse(input).success).toBe(false);
  });
});

describe("read-only campus API", () => {
  let stamp = 0;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(stat).mockResolvedValue({ size: 2000, mtimeMs: ++stamp } as Awaited<ReturnType<typeof stat>>);
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(dataset));
  });

  it("returns paged data and rejects malformed requests before reading a file", async () => {
    const bad = await GET(new Request("http://localhost/api/campus?page=-1"));
    expect(bad.status).toBe(400);
    expect(stat).not.toHaveBeenCalled();
    const response = await GET(new Request("http://localhost/api/campus?q=SOFTWARE"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = await response.json();
    expect(body.records[0].id).toBe(record.id);
    expect(body.source).not.toHaveProperty("url");
  });

  it("distinguishes a missing dataset from a corrupt or unreadable one and recovers on retry", async () => {
    vi.mocked(stat).mockRejectedValueOnce(Object.assign(new Error("missing"), { code: "ENOENT" }));
    const empty = await GET(new Request("http://localhost/api/campus"));
    expect(empty.status).toBe(200);
    expect((await empty.json()).source).toBeNull();
    vi.mocked(readFile).mockResolvedValueOnce("broken JSON");
    expect((await GET(new Request("http://localhost/api/campus"))).status).toBe(503);
    expect((await GET(new Request("http://localhost/api/campus"))).status).toBe(200);
    vi.mocked(stat).mockRejectedValueOnce(Object.assign(new Error("denied"), { code: "EACCES" }));
    expect((await GET(new Request("http://localhost/api/campus"))).status).toBe(503);
  });
});
