import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseFixedResponseCsv } from "./response-sync.js";

const headers = ["Dấu thời gian", "Question, with comma", "Free text"];
const contract = {
  columnCount: headers.length,
  headerDigest: createHash("sha256").update(JSON.stringify(headers)).digest("hex"),
};

describe("fixed response CSV", () => {
  it("preserves every cell and creates stable row/source digests", () => {
    const csv = '\uFEFFDấu thời gian,"Question, with comma",Free text\r\n"06/09/2026 10:00:00","Yes","a, b"\r\n';
    const result = parseFixedResponseCsv(csv, "https://example.test/export.csv", contract);
    expect(result.headers).toEqual(headers);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ rowNumber: 1, submittedAtText: "06/09/2026 10:00:00", values: ["06/09/2026 10:00:00", "Yes", "a, b"] });
    expect(result.rows[0]!.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(result.digest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("fails closed on header drift and malformed rows, while accepting an initialized empty response sheet", () => {
    expect(() => parseFixedResponseCsv("a,b,c\n1,2,3\n", "https://example.test", contract)).toThrow("header contract changed");
    expect(() => parseFixedResponseCsv('Dấu thời gian,"Question, with comma",Free text\n1,2\n', "https://example.test", contract)).toThrow();
    const empty = parseFixedResponseCsv('Dấu thời gian,"Question, with comma",Free text\n', "https://example.test", contract);
    expect(empty.rows).toEqual([]);
    expect(empty.digest).toMatch(/^[a-f0-9]{64}$/);
  });
});
