export type ExecutionMode = "immediate" | "scheduled";
export type JobStatus = "pending" | "running" | "succeeded" | "failed" | "uncertain" | "cancelled" | "expired";
export type BatchAction = "pause" | "resume" | "cancel";

export interface FixedMeta {
  formTitle: string;
  formUrl: string;
  datasetName: string;
  datasetDigest: string;
  eligibleCount: number;
  availableCount: number;
  synthetic: true;
  enabled: boolean;
  disabledReason?: string | null;
}

export interface BatchRequest {
  mode: ExecutionMode;
  count: number;
  timezone: string;
  startAt?: string;
  endAt?: string;
  requestId: string;
}

export interface FixedJob {
  id: string;
  rowId: string;
  scheduledAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  status: JobStatus;
  detail?: string | null;
}

export interface FixedBatch {
  id: string;
  mode: ExecutionMode;
  timezone: string;
  startAt: string;
  endAt: string;
  count: number;
  status: "pending" | "scheduled" | "paused" | "running" | "completed" | "attention" | "cancelled";
  createdAt: string;
  counts: Record<JobStatus, number>;
  jobs?: FixedJob[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  constructor(message: string, status = 0, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function isDefinitiveBatchRejection(error: unknown): error is ApiError {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 409) return error.code === "INSUFFICIENT_ROWS";
  return error.status >= 400 && error.status < 500 && ![408, 425, 429].includes(error.status);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  init.signal?.addEventListener("abort", abort, { once: true });
  if (init.signal?.aborted) controller.abort();
  const timeout = globalThis.setTimeout(abort, 20_000);
  try {
    const response = await fetch(`/api/fixed${path}`, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const error = body as { message?: string | string[]; error?: string; code?: unknown } | null;
      const message = Array.isArray(error?.message) ? error.message.join("; ") : error?.message ?? error?.error;
      throw new ApiError(message || `Máy chủ trả về lỗi ${response.status}. Vui lòng thử lại.`, response.status, typeof error?.code === "string" ? error.code : undefined);
    }
    if (!body || typeof body !== "object") throw new ApiError("Phản hồi máy chủ không hợp lệ. Vui lòng thử lại.");
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(controller.signal.aborted
      ? "Yêu cầu hết thời gian chờ hoặc đã dừng. Chưa xác định được kết quả từ máy chủ."
      : "Không kết nối được máy chủ. Kiểm tra kết nối và thử lại.");
  } finally {
    globalThis.clearTimeout(timeout);
    init.signal?.removeEventListener("abort", abort);
  }
}

export const api = {
  meta: (signal?: AbortSignal) => request<FixedMeta>("/meta", { signal: signal ?? null }),
  batches: (signal?: AbortSignal) => request<{ items: FixedBatch[] }>("/batches", { signal: signal ?? null }),
  batch: (id: string, signal?: AbortSignal) => request<FixedBatch>(`/batches/${encodeURIComponent(id)}`, { signal: signal ?? null }),
  createBatch: (body: BatchRequest) => request<FixedBatch>("/batches", { method: "POST", body: JSON.stringify(body) }),
  action: (id: string, action: BatchAction) => request<FixedBatch>(`/batches/${encodeURIComponent(id)}/${action}`, { method: "POST" }),
};
