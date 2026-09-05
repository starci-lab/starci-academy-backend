import type { BatchRequest, ExecutionMode } from "./api";

export interface ScheduleDraft {
  mode: ExecutionMode;
  timezone: string;
  count: string;
  start: string;
  end: string;
}

export type FieldErrors = Partial<Record<keyof ScheduleDraft, string>>;

function formatter(timezone: string): Intl.DateTimeFormat {
  if (timezone !== "UTC" && !/^[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)+$/.test(timezone)) {
    throw new Error("Nhập múi giờ IANA, ví dụ Asia/Ho_Chi_Minh hoặc UTC.");
  }
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone, calendar: "gregory", numberingSystem: "latn",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    });
  } catch {
    throw new Error("Múi giờ không hợp lệ. Dùng tên IANA, ví dụ Asia/Ho_Chi_Minh.");
  }
}

type DateParts = [number, number, number, number, number, number];

function dateParts(date: Date, fmt: Intl.DateTimeFormat): DateParts {
  const parts = fmt.formatToParts(date);
  return ["year", "month", "day", "hour", "minute", "second"].map((type) => Number(parts.find((part) => part.type === type)?.value)) as DateParts;
}

function utcValue(parts: DateParts): number {
  const date = new Date(0);
  date.setUTCFullYear(parts[0], parts[1] - 1, parts[2]);
  date.setUTCHours(parts[3], parts[4], parts[5], 0);
  return date.getTime();
}

export function isValidTimezone(timezone: string): boolean {
  try { formatter(timezone); return true; } catch { return false; }
}

export function localTimeToInstant(value: string, timezone: string): string {
  const fmt = formatter(timezone);
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Chọn đủ ngày và giờ (đến phút).");
  const target = [...match.slice(1).map(Number), 0] as DateParts;
  const naive = utcValue(target);
  const check = new Date(naive);
  if (target[0] < 1900 || target[0] > 9999 || check.getUTCFullYear() !== target[0] || check.getUTCMonth() + 1 !== target[1]
    || check.getUTCDate() !== target[2] || check.getUTCHours() !== target[3] || check.getUTCMinutes() !== target[4]) {
    throw new Error("Ngày hoặc giờ không hợp lệ. Vui lòng chọn lại.");
  }
  // Examine both sides of transitions, then round-trip candidates to distinguish
  // gaps and folds, including 30-minute DST and whole-day date-line changes.
  // No date parsing here ever uses the browser/host's local timezone.
  const offsets = new Set<number>();
  for (let hours = -72; hours <= 72; hours += 6) {
    const sampled = naive + hours * 3_600_000;
    offsets.add(utcValue(dateParts(new Date(sampled), fmt)) - sampled);
  }
  const candidates = [...offsets].map((offset) => naive - offset).filter((instant) => (
    dateParts(new Date(instant), fmt).every((part, index) => part === target[index])
  ));
  if (candidates.length === 0) throw new Error("Giờ này không tồn tại do đổi giờ tại múi giờ đã chọn. Chọn giờ khác.");
  if (candidates.length > 1) throw new Error("Giờ này xuất hiện hai lần do đổi giờ tại múi giờ đã chọn. Chọn giờ không trùng.");
  return new Date(candidates[0]!).toISOString();
}

export function instantToLocalTime(instant: string | Date, timezone: string): string {
  const parts = dateParts(new Date(instant), formatter(timezone));
  const [year, month, day, hour, minute] = parts.map((part) => String(part).padStart(2, "0")) as [string, string, string, string, string, string];
  return `${year.padStart(4, "0")}-${month}-${day}T${hour}:${minute}`;
}

export function formatInstant(instant: string | null | undefined, timezone: string): string {
  if (!instant) return "—";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: timezone, day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZoneName: "shortOffset",
    }).format(new Date(instant));
  } catch { return instant; }
}

export function validateSchedule(draft: ScheduleDraft, availableCount: number, now = Date.now()): {
  errors: FieldErrors;
  payload?: Omit<BatchRequest, "requestId">;
} {
  const errors: FieldErrors = {};
  const timezone = draft.timezone.trim();
  if (!isValidTimezone(timezone)) errors.timezone = "Nhập múi giờ IANA hợp lệ, ví dụ Asia/Ho_Chi_Minh hoặc UTC.";
  const count = Number(draft.count);
  if (!/^\d+$/.test(draft.count) || !Number.isSafeInteger(count) || count < 1) errors.count = "Nhập số nguyên từ 1 trở lên.";
  else if (count > availableCount) errors.count = `Chỉ còn ${availableCount.toLocaleString("vi-VN")} bản ghi có thể dùng. Hãy giảm số lượng.`;
  let startAt: string | undefined;
  let endAt: string | undefined;
  if (draft.mode === "scheduled" && !errors.timezone) {
    try { startAt = localTimeToInstant(draft.start, timezone); } catch (error) { errors.start = (error as Error).message; }
    try { endAt = localTimeToInstant(draft.end, timezone); } catch (error) { errors.end = (error as Error).message; }
    if (startAt && new Date(startAt).getTime() <= now) errors.start = "Giờ bắt đầu phải ở tương lai. Chọn lại thời gian hoặc dùng Chạy ngay.";
    if (startAt && endAt && new Date(endAt) <= new Date(startAt)) errors.end = "Giờ kết thúc phải sau giờ bắt đầu.";
  }
  if (Object.keys(errors).length > 0) return { errors };
  return { errors, payload: { mode: draft.mode, timezone, count, ...(draft.mode === "scheduled" && startAt && endAt ? { startAt, endAt } : {}) } };
}
