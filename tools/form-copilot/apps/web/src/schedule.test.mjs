import assert from "node:assert/strict";
import test from "node:test";
import { formatInstant, instantToLocalTime, isValidTimezone, localTimeToInstant, validateSchedule } from "./schedule.ts";
import { readPending, savePending, PENDING_KEY } from "./pending-request.ts";

test("IANA conversion is independent of host timezone and handles quarter-hour offsets", () => {
  assert.equal(localTimeToInstant("2030-09-04T12:00", "Asia/Ho_Chi_Minh"), "2030-09-04T05:00:00.000Z");
  assert.equal(localTimeToInstant("2030-09-04T12:00", "Asia/Kathmandu"), "2030-09-04T06:15:00.000Z");
  assert.equal(instantToLocalTime("2030-09-04T05:00:00.000Z", "Asia/Ho_Chi_Minh"), "2030-09-04T12:00");
});

test("rejects nonexistent and ambiguous local times including half-hour changes", () => {
  assert.throws(() => localTimeToInstant("2026-03-08T02:30", "America/New_York"), /không tồn tại/);
  assert.throws(() => localTimeToInstant("2026-11-01T01:30", "America/New_York"), /hai lần/);
  assert.throws(() => localTimeToInstant("2026-10-04T02:15", "Australia/Lord_Howe"), /không tồn tại/);
  assert.throws(() => localTimeToInstant("2026-04-05T01:45", "Australia/Lord_Howe"), /hai lần/);
  assert.throws(() => localTimeToInstant("2011-12-30T12:00", "Pacific/Apia"), /không tồn tại/);
});

test("rejects invalid dates, overflowed clock, unsupported zone and abbreviations", () => {
  for (const value of ["2026-02-29T12:00", "2026-13-01T12:00", "2026-01-01T24:00", "2026-01-01T12:60", ""]) {
    assert.throws(() => localTimeToInstant(value, "UTC"));
  }
  assert.equal(isValidTimezone("Not/A_Zone"), false);
  assert.equal(isValidTimezone("EST"), false);
  assert.equal(isValidTimezone("+07:00"), false);
  assert.equal(isValidTimezone("UTC"), true);
  assert.equal(localTimeToInstant("2028-02-29T12:00", "UTC"), "2028-02-29T12:00:00.000Z");
});

const draft = { mode: "scheduled", selection: "mixed", timezone: "Asia/Ho_Chi_Minh", count: "5", start: "2030-09-04T12:00", end: "2030-09-04T13:00" };

test("scheduled payload is UTC with selected timezone and an exact count", () => {
  assert.deepEqual(validateSchedule(draft, 10, 0), { errors: {}, payload: {
    mode: "scheduled", selection: "mixed", timezone: "Asia/Ho_Chi_Minh", count: 5,
    startAt: "2030-09-04T05:00:00.000Z", endAt: "2030-09-04T06:00:00.000Z",
  } });
});

test("rejects exhausted/invalid counts and past or reversed windows", () => {
  for (const count of ["0", "1.5", "-1", "2e1", "", "9007199254740992"]) assert.ok(validateSchedule({ ...draft, count }, 100, 0).errors.count);
  assert.ok(validateSchedule(draft, 4, 0).errors.count);
  assert.ok(validateSchedule(draft, 10, Date.parse("2031-01-01")).errors.start);
  assert.ok(validateSchedule({ ...draft, end: draft.start }, 10, 0).errors.end);
});

test("immediate mode omits unused window but still validates timezone and count", () => {
  const result = validateSchedule({ ...draft, mode: "immediate", start: "", end: "" }, 10);
  assert.deepEqual(result.payload, { mode: "immediate", selection: "mixed", timezone: draft.timezone, count: 5 });
  assert.ok(validateSchedule({ ...draft, mode: "immediate", timezone: "nonsense" }, 10).errors.timezone);
  assert.equal(formatInstant(null, "UTC"), "—");
});

test("pending request survives a reload byte-for-byte, preserving retry key and payload", () => {
  const data = new Map();
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  assert.equal(readPending(storage), null);
  const pending = { draft, payload: { ...validateSchedule(draft, 10, 0).payload, requestId: "287c8d1d-63de-4216-8f46-05a1da0b2304" } };
  savePending(storage, pending);
  assert.deepEqual(readPending(storage), pending);
  storage.setItem(PENDING_KEY, JSON.stringify({ ...pending, payload: { ...pending.payload, requestId: "invalid" } }));
  assert.throws(() => readPending(storage), /không đọc được/);
});
