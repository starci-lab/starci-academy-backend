import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { FIXED_FIELDS, FIXED_FORM_EDIT_ID } from "./dataset.js";
import { FIXED_RESPONSE_COLUMN_COUNT, FIXED_RESPONSE_SOURCE_KEY, parseFixedResponseCsv } from "./response-sync.js";

const headers = ["Dấu thời gian", "Question, with comma", "Free text"];
const contract = {
  columnCount: headers.length,
  headerDigest: createHash("sha256").update(JSON.stringify(headers)).digest("hex"),
};

describe("fixed response CSV", () => {
  it("derives the response width from the fixed answer contract plus its timestamp", () => {
    expect(FIXED_FIELDS).toHaveLength(53);
    expect(FIXED_RESPONSE_COLUMN_COUNT).toBe(54);
    expect(FIXED_RESPONSE_COLUMN_COUNT).toBe(FIXED_FIELDS.length + 1);
    expect(FIXED_RESPONSE_SOURCE_KEY).toBe(`google-form:${FIXED_FORM_EDIT_ID}`);
  });

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
