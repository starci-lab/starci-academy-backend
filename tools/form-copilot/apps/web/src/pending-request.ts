import type { BatchRequest } from "./api";
import type { ScheduleDraft } from "./schedule";

export const PENDING_KEY = "form-copilot.fixed.pending.v1";
export interface PendingRequest { payload: BatchRequest; draft: ScheduleDraft }

export function readPending(storage: Pick<Storage, "getItem">): PendingRequest | null {
  const raw = storage.getItem(PENDING_KEY);
  if (!raw) return null;
  const value = JSON.parse(raw) as PendingRequest;
  // Pre-selection releases stored pending requests without this field. Preserve
  // their exact previous behavior (mixed pool) instead of stranding the retry.
  if (value.payload && value.payload.selection === undefined) value.payload.selection = "mixed";
  if (value.draft && value.draft.selection === undefined) value.draft.selection = value.payload?.selection ?? "mixed";
  if (!value.payload || !value.draft || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.payload.requestId)
    || !["immediate", "scheduled"].includes(value.payload.mode)
    || typeof value.payload.timezone !== "string" || !Number.isSafeInteger(value.payload.count) || value.payload.count < 1
    || !["mixed", "completing", "screened_out"].includes(value.payload.selection)
    || !["mode", "selection", "timezone", "count", "start", "end"].every((key) => typeof value.draft[key as keyof ScheduleDraft] === "string")
    || (value.payload.mode === "scheduled" && (!value.payload.startAt || !value.payload.endAt))) {
    throw new Error("Yêu cầu chờ trong tab này không đọc được. Kiểm tra lịch sử trước khi xóa dữ liệu phiên; không tạo lô mới khi chưa xác định kết quả.");
  }
  return value;
}

export function savePending(storage: Pick<Storage, "setItem">, pending: PendingRequest): void {
  storage.setItem(PENDING_KEY, JSON.stringify(pending));
}
