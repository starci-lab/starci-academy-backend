import { useEffect, useRef, useState } from "react";
import { CalendarClock, Check, ChevronDown, ChevronRight, CircleAlert, Clock3, Database, FileCheck2, History, LoaderCircle, Pause, Play, RefreshCw, ShieldCheck, Square, WandSparkles } from "lucide-react";
import { api, isDefinitiveBatchRejection, type BatchAction, type ExecutionMode, type FixedBatch, type JobStatus, type ResponseSelection } from "./api";
import { formatInstant, instantToLocalTime, validateSchedule, type FieldErrors, type ScheduleDraft } from "./schedule";
import { PENDING_KEY, readPending, savePending, type PendingRequest } from "./pending-request";
import { useFixedData } from "./use-fixed-data";
import { batchDisplayStatus } from "./batch-status";

const statusLabels: Record<string, string> = {
  pending: "Chờ xử lý", scheduled: "Đã lên lịch", running: "Đang xử lý", paused: "Tạm dừng",
  completed: "Đã kết thúc", attention: "Cần kiểm tra", cancelled: "Đã hủy",
  succeeded: "Đã hoàn tất", screened_out: "Đã sàng lọc và gửi", failed: "Thất bại", uncertain: "Chưa rõ kết quả", expired: "Hết hạn",
};
const countOrder: JobStatus[] = ["pending", "running", "succeeded", "screened_out", "failed", "uncertain", "cancelled", "expired"];
const fieldNames: Record<keyof ScheduleDraft, string> = { mode: "Cách thực hiện", selection: "Loại câu trả lời", timezone: "Múi giờ", count: "Số lượng", start: "Bắt đầu", end: "Kết thúc" };
const fieldIds: Record<keyof ScheduleDraft, string> = { mode: "mode-immediate", selection: "selection-mixed", timezone: "timezone", count: "count", start: "start", end: "end" };
const selectionLabels: Record<ResponseSelection, string> = { mixed: "Trộn theo dữ liệu", completing: "Good · hợp lệ", screened_out: "Bad · không hợp lệ" };
const commonZones = ["Asia/Ho_Chi_Minh", "Asia/Bangkok", "Asia/Singapore", "Asia/Tokyo", "UTC", "Europe/London", "Europe/Paris", "America/New_York", "America/Los_Angeles", "Australia/Sydney"];

function initialDraft(): ScheduleDraft {
  const timezone = "Asia/Ho_Chi_Minh";
  return { mode: "immediate", selection: "mixed", timezone, count: "10",
    start: instantToLocalTime(new Date(Date.now() + 3_600_000), timezone),
    end: instantToLocalTime(new Date(Date.now() + 86_400_000), timezone) };
}

function restoreRequest(): { pending: PendingRequest | null; error: string | null } {
  try { return { pending: readPending(window.sessionStorage), error: null }; }
  catch (error) { return { pending: null, error: "Không thể khôi phục yêu cầu đang chờ. " + (error as Error).message }; }
}

function StatusBadge({ status }: { status: string }) {
  return <span className={"status-badge status-" + status}>{statusLabels[status] ?? status}</span>;
}

function BatchDetail({ batch, busy, onAction }: { batch: FixedBatch; busy: string | null; onAction: (action: BatchAction) => void }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [page, setPage] = useState(1);
  const heading = useRef<HTMLHeadingElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const jobs = batch.jobs ?? [];
  const pageSize = 20;
  const pages = Math.max(1, Math.ceil(jobs.length / pageSize));
  const currentPage = Math.min(page, pages);
  const pending = batch.counts.pending;
  const unfinished = pending + batch.counts.running;
  const processed = batch.count - batch.counts.pending - batch.counts.running;

  useEffect(() => { setConfirmCancel(false); setPage(1); }, [batch.id]);
  useEffect(() => { if (confirmCancel) cancelButton.current?.focus(); }, [confirmCancel]);
  useEffect(() => { if (!busy && document.activeElement === document.body) heading.current?.focus(); }, [busy]);

  return (
    <section className="batch-detail" aria-labelledby={"detail-" + batch.id}>
      <div className="section-heading">
        <div><span className="eyebrow">Chi tiết lô</span><h3 id={"detail-" + batch.id} ref={heading} tabIndex={-1}>{batch.count.toLocaleString("vi-VN")} bản ghi synthetic</h3></div>
        <StatusBadge status={batchDisplayStatus(batch)} />
      </div>
      <p className="batch-id">Mã lô <code>{batch.id}</code></p>
      <dl className="detail-facts">
        <div><dt>Hình thức</dt><dd>{batch.mode === "immediate" ? "Gửi ngay" : "Theo khung giờ"}</dd></div>
        <div><dt>Loại câu trả lời</dt><dd>{selectionLabels[batch.selection]}</dd></div>
        <div><dt>Múi giờ hiển thị</dt><dd>{batch.timezone}</dd></div>
        <div><dt>Bắt đầu</dt><dd>{formatInstant(batch.startAt, batch.timezone)}</dd></div>
        <div><dt>Kết thúc</dt><dd>{formatInstant(batch.endAt, batch.timezone)}</dd></div>
        <div><dt>Đã tạo lúc</dt><dd>{formatInstant(batch.createdAt, batch.timezone)}</dd></div>
      </dl>
      <div className="progress-heading"><strong>{Math.max(0, processed)} / {batch.count} đã kết thúc xử lý</strong><span>{batch.counts.succeeded + batch.counts.screened_out} đã xác nhận gửi</span></div>
      <progress value={Math.max(0, processed)} max={Math.max(1, batch.count)} aria-label="Số bản ghi đã kết thúc xử lý, không đồng nghĩa gửi thành công" />
      <dl className="count-grid">{countOrder.map((status) => <div className={"count-tile count-" + status} key={status}><dt>{statusLabels[status]}</dt><dd>{batch.counts[status]}</dd></div>)}</dl>
      {batch.counts.uncertain > 0 && <div className="banner warning"><CircleAlert size={19} aria-hidden="true" /><p><strong>Có kết quả chưa xác định.</strong> Cần đối chiếu tại nguồn nhận. Các bản ghi này không tự động thử gửi lại.</p></div>}
      {unfinished > 0 && batch.status !== "cancelled" && (
        <div className="batch-controls">
          {batch.status === "paused"
            ? <button type="button" className="button secondary" disabled={Boolean(busy)} onClick={() => onAction("resume")}><Play size={16} aria-hidden="true" />{busy === "resume" ? "Đang tiếp tục…" : "Tiếp tục"}</button>
            : <button type="button" className="button secondary" disabled={Boolean(busy)} onClick={() => onAction("pause")}><Pause size={16} aria-hidden="true" />{busy === "pause" ? "Đang tạm dừng…" : "Tạm dừng"}</button>}
          <button type="button" className="button danger" disabled={Boolean(busy)} aria-expanded={confirmCancel} onClick={() => setConfirmCancel(true)}><Square size={15} aria-hidden="true" />Hủy phần chưa gửi</button>
        </div>
      )}
      {(pending > 0 || batch.counts.running > 0) && <p className="helper">Tạm dừng/hủy chỉ chặn công việc chưa gửi. Không thể thu hồi bản ghi đã qua bước gửi cuối.</p>}
      {confirmCancel && unfinished > 0 && batch.status !== "cancelled" && <div className="cancel-confirm" role="alert">
        <strong>Hủy phần chưa gửi của lô này?</strong><p>Có {pending} bản ghi đang chờ. Các bản ghi đã gửi hoặc đang xác nhận vẫn được giữ trong lịch sử.</p>
        <div className="button-row"><button type="button" ref={cancelButton} className="button danger" disabled={Boolean(busy)} onClick={() => { setConfirmCancel(false); onAction("cancel"); }}>Xác nhận hủy</button><button type="button" className="button secondary" onClick={() => setConfirmCancel(false)}>Giữ lại</button></div>
      </div>}
      <div className="section-heading jobs-heading"><h4>Lịch sử từng bản ghi</h4><span className="helper">{jobs.length} bản ghi</span></div>
      {!batch.jobs ? <p className="loading-line"><LoaderCircle size={18} className="spin" aria-hidden="true" />Đang tải chi tiết bản ghi…</p> : jobs.length === 0 ? <p className="helper">Lô này chưa có bản ghi chi tiết.</p> : <>
        <ol className="job-list" start={(currentPage - 1) * pageSize + 1}>
          {jobs.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((job) => <li key={job.id}>
            <div className="job-heading"><strong>{job.rowId}</strong><StatusBadge status={job.status} /></div>
            <dl className="job-times"><div><dt>Dự kiến</dt><dd>{formatInstant(job.scheduledAt, batch.timezone)}</dd></div><div><dt>Bắt đầu</dt><dd>{formatInstant(job.startedAt, batch.timezone)}</dd></div><div><dt>Kết thúc</dt><dd>{formatInstant(job.finishedAt, batch.timezone)}</dd></div></dl>
            <p className="job-detail">{job.detail || "Chưa có ghi chú xử lý."}</p>
            {job.status === "screened_out" && <dl className="job-times"><div><dt>Trang kết thúc</dt><dd>{job.terminalPageTitle || job.terminalPageId || "—"}</dd></div><div><dt>Lý do đóng sớm</dt><dd>{job.closeReason || "—"}</dd></div></dl>}
          </li>)}
        </ol>
        {pages > 1 && <nav className="pagination" aria-label="Phân trang bản ghi"><button type="button" className="button secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Trước</button><span>Trang {currentPage} / {pages}</span><button type="button" className="button secondary" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Tiếp</button></nav>}
      </>}
    </section>
  );
}

export function App() {
  const data = useFixedData();
  const [restored] = useState(restoreRequest);
  const [draft, setDraft] = useState<ScheduleDraft>(() => restored.pending?.draft ?? initialDraft());
  const [pending, setPending] = useState<PendingRequest | null>(restored.pending);
  const [storageError, setStorageError] = useState<string | null>(restored.error);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [historyLimit, setHistoryLimit] = useState(10);
  const mutation = useRef(false);
  const pendingRef = useRef(pending);
  const errorSummary = useRef<HTMLDivElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const requestHeading = useRef<HTMLHeadingElement>(null);
  const [focusError, setFocusError] = useState(0);
  const meta = data.meta;
  const availableForDraft = !meta ? 0 : draft.mode !== "immediate" || draft.selection === "mixed" ? meta.availableCount
    : draft.selection === "completing" ? meta.availableCompletingCount : meta.availableScreenedOutCount;
  const locked = Boolean(pending || busy || storageError);
  const preview = validateSchedule(draft, availableForDraft);
  const errorsPresent = Object.values(errors).some(Boolean);

  useEffect(() => { if (focusError) errorSummary.current?.focus(); }, [focusError]);

  function change<K extends keyof ScheduleDraft>(key: K, value: ScheduleDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => key === "mode" ? {} : { ...current, [key]: undefined });
    setActionError(null);
    setNotice(null);
  }

  function validateField(key: keyof ScheduleDraft) {
    const next = validateSchedule(draft, availableForDraft).errors;
    setErrors((current) => ({ ...current, [key]: next[key] }));
  }

  async function submit(event?: React.FormEvent, modeOverride?: ExecutionMode) {
    event?.preventDefault();
    if (mutation.current || storageError) return;
    setActionError(null); setNotice(null);
    let attempt = pendingRef.current;
    if (!attempt) {
      if (!meta) return;
      const attemptDraft = modeOverride ? { ...draft, mode: modeOverride } : draft;
      const attemptAvailable = attemptDraft.mode !== "immediate" || attemptDraft.selection === "mixed" ? meta.availableCount
        : attemptDraft.selection === "completing" ? meta.availableCompletingCount : meta.availableScreenedOutCount;
      const result = validateSchedule(attemptDraft, attemptAvailable);
      setErrors(result.errors);
      if (!result.payload) { setFocusError((value) => value + 1); return; }
      try {
        if (!globalThis.crypto?.randomUUID) throw new Error("Cần HTTPS hoặc localhost để tạo mã yêu cầu an toàn.");
        attempt = { payload: { ...result.payload, requestId: globalThis.crypto.randomUUID() }, draft: { ...attemptDraft } };
        savePending(window.sessionStorage, attempt);
        pendingRef.current = attempt;
        setPending(attempt);
      } catch (error) {
        setStorageError("Chưa gửi yêu cầu: không thể lưu mã chống lặp. " + (error as Error).message);
        return;
      }
    }
    mutation.current = true;
    setBusy("create");
    try {
      const batch = await api.createBatch(attempt.payload);
      if (typeof batch.id !== "string" || !batch.counts) throw new Error("Phản hồi thiếu mã lô. Thử lại cùng mã yêu cầu để xác nhận kết quả.");
      data.acceptBatch(batch);
      window.sessionStorage.removeItem(PENDING_KEY);
      pendingRef.current = null; setPending(null);
      setNotice(meta?.enabled
        ? "Đã ghi nhận lô. Theo dõi từng bản ghi bên dưới; chỉ trạng thái “Đã xác nhận gửi” là có xác nhận từ form."
        : "Đã lưu kế hoạch. Trạng thái gửi tại lần tải gần nhất: đang tắt. Xem lịch sử để theo dõi trạng thái thực tế của lô.");
      requestAnimationFrame(() => noticeRef.current?.focus());
    } catch (error) {
      // An HTTP rejection is safe to edit; transport errors and 5xx may occur
      // after the server committed. Keep the exact request until reconciled.
      if (isDefinitiveBatchRejection(error)) {
        try { window.sessionStorage.removeItem(PENDING_KEY); pendingRef.current = null; setPending(null); void data.refresh(true); }
        catch { setStorageError("Không thể xóa mã yêu cầu bị từ chối khỏi phiên. Kiểm tra quyền lưu trữ của trình duyệt."); }
      }
      setActionError((error as Error).message);
      requestAnimationFrame(() => errorSummary.current?.focus());
    } finally { mutation.current = false; setBusy(null); }
  }

  async function act(action: BatchAction) {
    if (!data.detail || mutation.current) return;
    mutation.current = true; setBusy(action); setActionError(null); setNotice(null);
    try {
      const batch = await api.action(data.detail.id, action);
      data.acceptBatch(batch);
      setNotice(action === "cancel" ? "Đã ghi nhận hủy phần chưa gửi. Lịch sử và các kết quả đã có được giữ nguyên."
        : action === "pause" ? "Đã tạm dừng công việc đang chờ. Công việc đã qua bước gửi cuối vẫn được theo dõi."
          : "Đã ghi nhận tiếp tục. Công việc chỉ được gửi khi máy chủ cho phép gửi form.");
    } catch (error) { setActionError((error as Error).message + " Làm mới lịch sử để xác nhận trạng thái trước khi thao tác lại."); requestAnimationFrame(() => errorSummary.current?.focus()); }
    finally { mutation.current = false; setBusy(null); void data.refresh(); }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Đến nội dung chính</a>
      <header className="topbar">
        <a className="brand" href="#main"><span className="brand-mark"><WandSparkles size={21} aria-hidden="true" /></span><span>Form Copilot<small>Fixed-form workspace</small></span></a>
        <div className="top-actions"><span className={"connection " + (meta && !data.readError ? "connected" : "")}><i aria-hidden="true" />{data.loading ? "Đang kết nối" : data.readError ? "Mất kết nối" : "Máy chủ sẵn sàng"}</span><a className="button secondary" href="#history"><History size={17} aria-hidden="true" /><span>Lịch sử</span></a></div>
      </header>
      <main id="main">
        <section className="hero" aria-labelledby="page-title">
          <div><span className="eyebrow"><ShieldCheck size={16} aria-hidden="true" />Synthetic · Dữ liệu diễn tập</span><h1 id="page-title">Một form cố định.<br /><span>Chủ động lịch thực hiện.</span></h1><p>Chọn số lượng và thời gian. Theo dõi từng bản ghi từ lúc lên lịch đến khi có kết quả xác nhận.</p></div>
          <div className="hero-note"><Database size={24} aria-hidden="true" /><div><strong>Dùng bộ dữ liệu đã chuẩn bị</strong><p>Không tạo câu trả lời mới. Bản ghi synthetic không phải phản hồi khảo sát thật.</p></div></div>
        </section>

        {data.readError && <div className="banner error" role="alert"><CircleAlert size={20} aria-hidden="true" /><div><strong>Không tải được trạng thái mới nhất</strong><p>{data.readError} {meta && "Thông tin đang hiển thị là lần tải trước."}</p><button type="button" className="button secondary" disabled={data.refreshing} onClick={() => void data.refresh()}>Thử tải lại</button></div></div>}
        {meta && !meta.enabled && <div className="banner warning" id="submission-state"><ShieldCheck size={21} aria-hidden="true" /><div><strong>Gửi form đang tắt — chỉ lưu kế hoạch</strong><p>{meta.disabledReason || "Máy chủ chưa cho phép gửi form."} Lô đã lưu chỉ có thể chạy sau khi máy chủ được cho phép gửi.</p></div></div>}
        {meta?.enabled && <div className="banner enabled" id="submission-state"><CircleAlert size={20} aria-hidden="true" /><p><strong>Máy chủ đã bật gửi form.</strong> Gửi ngay hoặc lên lịch sẽ tạo công việc gửi tới form cố định. Đây vẫn là dữ liệu diễn tập synthetic.</p></div>}

        <div className="workspace-grid">
          <section className="panel schedule-panel" aria-labelledby="request-title">
            <div className="section-heading"><div><span className="eyebrow">Tạo lô thực hiện</span><h2 id="request-title" ref={requestHeading} tabIndex={-1}>Thiết lập kế hoạch</h2></div><span className="card-icon"><CalendarClock size={24} aria-hidden="true" /></span></div>
            <form onSubmit={(event) => void submit(event)} noValidate aria-busy={busy === "create"}>
              {(errorsPresent || actionError || storageError) && <div className="error-summary" role="alert" tabIndex={-1} ref={errorSummary}><strong>Cần kiểm tra trước khi tiếp tục</strong>{actionError && <p>{actionError}</p>}{storageError && <p>{storageError}</p>}{errorsPresent && <ul>{Object.entries(errors).filter(([, message]) => message).map(([field, message]) => <li key={field}><a href={"#" + fieldIds[field as keyof ScheduleDraft]}>{fieldNames[field as keyof ScheduleDraft]}: {message}</a></li>)}</ul>}</div>}
              {pending && <div className="pending-request"><strong>Yêu cầu đang chờ xác nhận</strong><p>Thông số được giữ nguyên. Thử lại sẽ dùng cùng mã yêu cầu, không tạo lô thứ hai. Đừng mở tab mới để gửi lại.</p><code>{pending.payload.requestId}</code></div>}
              <fieldset disabled={locked} className="mode-fieldset"><legend>Cách thực hiện</legend><div className="mode-options">
                <label className={draft.mode === "scheduled" ? "mode-option selected" : "mode-option"}><input id="mode-scheduled" type="radio" name="mode" value="scheduled" checked={draft.mode === "scheduled"} onChange={() => { setDraft((current) => ({ ...current, mode: "scheduled", selection: "mixed" })); setErrors({}); }} /><CalendarClock size={18} aria-hidden="true" /><span>Theo khung giờ</span></label>
                <label className={draft.mode === "immediate" ? "mode-option selected" : "mode-option"}><input id="mode-immediate" type="radio" name="mode" value="immediate" checked={draft.mode === "immediate"} onChange={() => change("mode", "immediate")} /><Play size={17} aria-hidden="true" /><span>Gửi ngay</span></label>
              </div></fieldset>
              <div className="form-grid">
                <div className="field"><label htmlFor="timezone">Múi giờ <span aria-hidden="true">*</span></label><input id="timezone" list="timezones" autoComplete="off" required value={draft.timezone} disabled={locked} onChange={(event) => change("timezone", event.target.value)} onBlur={() => validateField("timezone")} aria-invalid={Boolean(errors.timezone)} aria-describedby={"timezone-hint" + (errors.timezone ? " timezone-error" : "")} /><datalist id="timezones">{commonZones.map((zone) => <option key={zone} value={zone} />)}</datalist><p className="helper" id="timezone-hint">Giờ bên dưới thuộc múi giờ này, không phải giờ của thiết bị.</p>{errors.timezone && <p className="field-error" id="timezone-error">{errors.timezone}</p>}</div>
                <div className="field"><label htmlFor="count">Số lượng chính xác <span aria-hidden="true">*</span></label><input id="count" type="number" inputMode="numeric" min={1} max={meta?.availableCount} step={1} required value={draft.count} disabled={locked} onChange={(event) => change("count", event.target.value)} onBlur={() => validateField("count")} aria-invalid={Boolean(errors.count)} aria-describedby={"count-hint" + (errors.count ? " count-error" : "")} /><p className="helper" id="count-hint">{meta ? meta.availableCount.toLocaleString("vi-VN") + " bản ghi có thể dùng." : "Đang kiểm tra bộ dữ liệu…"}</p>{errors.count && <p className="field-error" id="count-error">{errors.count}</p>}</div>
              </div>
              {draft.mode === "immediate" && <fieldset className="response-fieldset" disabled={locked}><legend>Loại câu trả lời</legend><div className="response-options">
                {(["mixed", "completing", "screened_out"] as const).map((selection) => <label className={draft.selection === selection ? "response-option selected" : "response-option"} key={selection}><input id={`selection-${selection}`} type="radio" name="selection" value={selection} checked={draft.selection === selection} onChange={() => change("selection", selection)} /><span>{selectionLabels[selection]}</span><small>{selection === "mixed" ? `${meta?.availableCount ?? "—"} còn lại · giữ tỷ lệ pool` : selection === "completing" ? `${meta?.availableCompletingCount ?? "—"} bản ghi valid` : `${meta?.availableScreenedOutCount ?? "—"} bản ghi invalid`}</small></label>)}
              </div><p className="helper">Hệ thống random record chưa dùng trong nhóm đã chọn. Mỗi record giữ nguyên toàn bộ câu trả lời để đi đúng nhánh của form.</p></fieldset>}
              {draft.mode === "scheduled" ? <fieldset className="window-fieldset" disabled={locked}><legend>Khung thời gian <span className="optional-note">Bắt buộc khi lên lịch</span></legend><div className="form-grid">
                {(["start", "end"] as const).map((key) => <div className="field" key={key}><label htmlFor={key}>{fieldNames[key]}</label><input id={key} type="datetime-local" step={60} required value={draft[key]} onChange={(event) => change(key, event.target.value)} onBlur={() => validateField(key)} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? key + "-error" : "window-hint"} />{errors[key] && <p className="field-error" id={key + "-error"}>{errors[key]}</p>}</div>)}
              </div><p className="helper" id="window-hint">Giờ thực hiện được chọn ngẫu nhiên trong khung đã chọn. Gửi Google Form có thể muộn hơn giờ dự kiến do thời gian xử lý, nhưng không gửi sau hạn kết thúc. Giờ bị trùng hoặc không tồn tại khi đổi giờ sẽ bị từ chối.</p></fieldset> : <div className="immediate-note"><Clock3 size={18} aria-hidden="true" /><p>Bản ghi được đưa vào hàng đợi ngay khi tạo lô và xử lý tuần tự. Mỗi bản ghi có thể hoàn tất toàn bộ form hoặc đóng sớm theo chính câu trả lời của bản ghi đó.</p></div>}
              <div className="plan-preview"><span>Tóm tắt kế hoạch</span><strong>{/^\d+$/.test(draft.count) ? Number(draft.count).toLocaleString("vi-VN") : "—"} bản ghi · {draft.mode === "immediate" ? `Gửi ngay · ${selectionLabels[draft.selection]}` : "Theo khung giờ"}</strong><p>{preview.payload?.startAt ? formatInstant(preview.payload.startAt, preview.payload.timezone) + " → " + formatInstant(preview.payload.endAt, preview.payload.timezone) : draft.mode === "immediate" ? "Bắt đầu ngay · Múi giờ lịch sử: " + draft.timezone : "Hoàn tất thông tin hợp lệ để xem khung giờ."}</p></div>
              <div className={draft.mode === "scheduled" && !pending ? "submit-actions split" : "submit-actions"}>
                {draft.mode === "scheduled" && !pending && <button className="button secondary submit-button immediate-shortcut" type="button" disabled={Boolean(busy || storageError || !meta || data.readError || meta.availableCount < 1)} aria-describedby="submission-state" onClick={() => void submit(undefined, "immediate")}><Play size={18} aria-hidden="true" />{meta?.enabled ? "Gửi ngay" : "Lưu lô chạy ngay"}</button>}
                <button className="button primary submit-button" type="submit" disabled={Boolean(busy || storageError || (!pending && (!meta || data.readError || meta.availableCount < 1)))} aria-describedby="submission-state">
                  {busy === "create" ? <LoaderCircle size={19} className="spin" aria-hidden="true" /> : pending ? <RefreshCw size={18} aria-hidden="true" /> : draft.mode === "immediate" ? <Play size={18} aria-hidden="true" /> : <CalendarClock size={19} aria-hidden="true" />}
                  {busy === "create" ? "Đang ghi nhận…" : pending ? "Thử lại cùng mã yêu cầu" : !meta?.enabled ? "Lưu kế hoạch" : draft.mode === "immediate" ? "Gửi ngay" : "Lên lịch thực hiện"}
                </button>
              </div>
              <p className="submit-helper">{!meta ? "Cần tải thông tin máy chủ trước khi tạo lô." : !meta.enabled ? "Chỉ tạo kế hoạch và giữ chỗ dữ liệu. Gửi form đang tắt." : "Chỉ bắt đầu nếu bạn được phép gửi dữ liệu diễn tập vào form này."}</p>
            </form>
          </section>

          <aside className="context-column">
            <section className="panel form-panel" aria-labelledby="fixed-form-title"><span className="eyebrow"><FileCheck2 size={16} aria-hidden="true" />Form cố định</span><h2 id="fixed-form-title">{meta?.formTitle || (data.loading ? "Đang tải form…" : "Chưa tải được form")}</h2><p className="helper">Đích gửi được cấu hình sẵn trên máy chủ, không thể thay đổi tại đây.</p>{meta?.formUrl && <p className="fixed-url">{meta.formUrl}</p>}<div className="synthetic-label"><ShieldCheck size={16} aria-hidden="true" />DỮ LIỆU SYNTHETIC · DIỄN TẬP</div><dl className="dataset-facts"><div><dt>Bộ dữ liệu</dt><dd>{meta?.datasetName || "—"}</dd></div><div><dt>Tổng bản ghi</dt><dd>{meta ? meta.totalCount.toLocaleString("vi-VN") : "—"}</dd></div><div><dt>Valid</dt><dd>{meta ? meta.completingCount.toLocaleString("vi-VN") : "—"}</dd></div><div><dt>Invalid</dt><dd>{meta ? meta.screenedOutCount.toLocaleString("vi-VN") : "—"}</dd></div><div><dt>Có thể dùng</dt><dd>{meta ? meta.availableCount.toLocaleString("vi-VN") : "—"}</dd></div></dl>{meta?.datasetDigest && <details className="digest"><summary>Dấu vân tay bộ dữ liệu</summary><code>{meta.datasetDigest}</code></details>}</section>
            <section className="guardrail-card" aria-labelledby="guardrail-title"><h2 id="guardrail-title">Rõ ràng ở từng bước</h2><ul><li><Check size={17} aria-hidden="true" /><span>Dùng đúng bản ghi đã chuẩn bị, không yêu cầu AI hay token.</span></li><li><Check size={17} aria-hidden="true" /><span>Lịch và kết quả được lưu trên máy chủ; có thể kiểm tra lại sau.</span></li><li><Check size={17} aria-hidden="true" /><span>Chỉ báo đã gửi khi có xác nhận. Kết quả chưa rõ không tự gửi lại.</span></li></ul></section>
          </aside>
        </div>

        {notice && <div className="banner success result-notice" role="status" tabIndex={-1} ref={noticeRef}><Check size={21} aria-hidden="true" /><p>{notice}</p></div>}
        <section className="panel history-panel" id="history" aria-labelledby="history-title" aria-busy={data.loading}>
          <div className="section-heading"><div><span className="eyebrow"><History size={15} aria-hidden="true" />Theo dõi thực hiện</span><h2 id="history-title">Lịch sử các lô</h2><p className="helper">{data.updatedAt ? "Cập nhật lúc " + formatInstant(data.updatedAt.toISOString(), "Asia/Ho_Chi_Minh") : "Đang tải lịch sử…"} · Tự cập nhật khi tab đang mở.</p></div><button type="button" className="button secondary" disabled={data.refreshing} onClick={() => void data.refresh()}><RefreshCw size={17} className={data.refreshing ? "spin" : ""} aria-hidden="true" />{data.refreshing ? "Đang tải…" : "Làm mới"}</button></div>
          {data.loading ? <div className="empty-state"><LoaderCircle size={27} className="spin" aria-hidden="true" /><strong>Đang tải các lô đã lưu</strong><p>Chỉ đọc trạng thái, không tạo công việc mới.</p></div> : data.batches.length === 0 ? <div className="empty-state"><CalendarClock size={30} aria-hidden="true" /><strong>{data.readError ? "Chưa thể tải lịch sử" : "Chưa có lô thực hiện"}</strong><p>{data.readError ? "Thử tải lại khi máy chủ kết nối." : "Kế hoạch đầu tiên sẽ xuất hiện ở đây sau khi lưu."}</p></div> : <div className="history-content">
            <ul className="batch-list">{data.batches.slice(0, historyLimit).map((batch) => <li key={batch.id}><button type="button" className={"batch-row " + (data.selectedId === batch.id ? "selected" : "")} onClick={() => data.select(batch.id)} aria-expanded={data.selectedId === batch.id} aria-controls="selected-batch"><span className="batch-row-icon"><CalendarClock size={20} aria-hidden="true" /></span><span className="batch-row-main"><strong>{batch.count} bản ghi <span>· {batch.mode === "immediate" ? "Gửi ngay" : "Theo khung giờ"}</span></strong><small>{formatInstant(batch.createdAt, batch.timezone)}</small><small className="batch-short-id">{batch.id}</small></span><span className="batch-row-state"><StatusBadge status={batchDisplayStatus(batch)} /><small>{batch.counts.succeeded + batch.counts.screened_out} / {batch.count} đã xác nhận gửi</small></span>{data.selectedId === batch.id ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}</button></li>)}</ul>
            {data.batches.length > historyLimit && <button type="button" className="button secondary show-more" onClick={() => setHistoryLimit((value) => value + 10)}>Xem thêm lô</button>}
            <div id="selected-batch">{data.selectedId && (data.detail ? <BatchDetail batch={data.detail} busy={busy} onAction={(action) => void act(action)} /> : <p className="loading-line">{data.readError ? "Không tải được chi tiết. Chọn Làm mới để thử lại." : "Đang tải chi tiết lô…"}</p>)}</div>
          </div>}
        </section>
        <footer>Dữ liệu diễn tập luôn được gắn nhãn synthetic. Lịch sử không thay thế việc đối chiếu kết quả tại nguồn nhận.</footer>
      </main>
    </div>
  );
}
