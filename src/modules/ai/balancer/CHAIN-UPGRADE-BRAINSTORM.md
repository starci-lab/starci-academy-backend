# AI fallback chain — nâng cấp dùng dữ liệu ping/latency (brainstorm 2026-06-30)

> Picker giờ hiện latency thật (`198ms`) + up/down (`Ngừng`) per-model. Câu hỏi: chain AI (auto-lane fallback) tận dụng dữ liệu này nâng cấp được gì?

## Hiện trạng — 2 lớp health TÁCH RỜI
| Lớp | Service | Đo gì | Feed vào đâu |
|---|---|---|---|
| Per-KEY ping (reactive) | `AiPingCacheService` | success/cooldown/disabled per **key** (từ call THẬT) | **eligibility** balancer (`countEligibleKeys`) |
| Per-MODEL probe (proactive) | `AiModelLatencyCacheService` | `{ok, latencyMs, checkedAt, errorMessage}` per **model** (1-token định kỳ) | **CHỈ UI/status** — *"never feeds balancer key eligibility"* |

`runAuto` (`use-api.service.ts`): order **TĨNH** = category-chain (floor→ceiling) → `weight` DESC. Eligibility = key-cooldown. → **thử cả model probe đã biết down** ("Ngừng") = phí 1 attempt + latency + 1 chu kỳ cooldown trước khi nhảy model kế. Order **bỏ qua latency thật** (model chậm weight cao vẫn thử trước model nhanh).

## Cơ hội cốt lõi
**Probe đang biết trước up/down + latency của mọi model nhưng chain phớt lờ.** Bắc cầu probe → chain (dạng tín hiệu CỐ VẤN, không thay key-cooldown authoritative).

## Phase 1 — bắc cầu probe → chain (RẺ · rủi ro thấp · ĐỀ XUẤT)
- **A. Skip/deprioritize model "Ngừng" CHỦ ĐỘNG.** Trước khi thử 1 model, đọc probe `ok`+`checkedAt`: nếu **tươi** & `ok=false` → đẩy xuống cuối chain (KHÔNG loại cứng → vẫn fallback nếu cả tier down). Hết phí attempt trên model biết-down.
- **B. Order theo LATENCY trong tier.** Trong 1 category, sort healthy models theo `latencyMs` ASC (nhanh trước) thay vì chỉ `weight`. `weight` làm tiebreak. (qwen7b 198ms trước qwen-32b 1103ms.)
- **C. Nghiêng theo TASK.** Chat (tương tác, latency quan trọng) → latency-first. Grading (batch) → quality/`weight`-first (latency rẻ). Gắn với `supportedTasks` filter (BE pending) — **lọc task → rồi mới order**.
- **Guard:** freshness window cho probe (stale → bỏ qua, về order tĩnh); **chỉ cố vấn** (advisory), không hard-exclude; key-cooldown vẫn là nguồn-sự-thật eligibility.

## Phase 2 — chấm điểm động
- **D. Composite score** per model = `f(tierRank, 1/latency, okRate, −credit)`, trọng số theo task (giống OpenRouter `cost_quality_tradeoff` dial). Order chain theo score thay vì weight tĩnh.
- **E. Circuit breaker per-MODEL** (không chỉ per-key): probe-driven open → half-open (1 request thật test) → close. Gộp proactive probe + reactive failures.

## Phase 3 — nâng cao
- **F. EWMA từ traffic THẬT.** Probe là 1-token synthetic; request thật có latency/success thật (đã bắt ở `invokeWithCache`). Nuôi rolling p50/p95 + success-rate per model → order chính xác hơn probe. Probe lấp lúc không có traffic.
- **G. Hedged request** cho first-token latency-critical: bắn top-2 song song, lấy cái phản hồi trước, huỷ còn lại. Cắt tail latency. TỐN 2× → gate (premium / khi p95 cao). Cân nhắc, dễ thành vanity.

## ✅ ĐÃ ÁP DỤNG Phase 1 (mtp 2026-06-30)
- `runAuto` nhận `task`; **hard-filter** catalog theo `supportedTasks` + **`orderByHealthAndLatency`** (đọc `AiModelLatencyCacheService`): deprioritize fresh-"down" trong tier, chat → fastest-first, advisory (freshness 5′, stale/unprobed giữ order tĩnh, không loại cứng). Macro category order giữ nguyên.
- `task` derive từ `AiCeilSurface` trong `AiInvokeService.run` (chatbot→chatting · grading/interview→grading) + explicit CV-review (grading) + ai-lab (chatting). Premium lane KHÔNG đổi. Spec pass.

## Đề xuất (gốc)
**Làm Phase 1** (probe → chain advisory: down-skip + latency-order + task-tilt). Tái dùng data sẵn có, rủi ro thấp (soft + fallback), thắng ngay: hết phí attempt trên model "Ngừng" + chat chọn model nhanh nhất. Phase 2/3 để sau khi đo được lợi ích.

## Đụng gì khi apply
- `runAuto`/`runPremium` (`use-api.service.ts`): inject `AiModelLatencyCacheService`, dùng snapshot để **sort + deprioritize** trong vòng lặp `models` (sau filter category/task).
- Cần `task` (gắn với supportedTasks BE-filter pending) để nghiêng latency vs quality.
- Freshness: so `checkedAt` với 1 ngưỡng (vd 2× cycleIntervalMs).
- KHÔNG đổi nghĩa key-cooldown; probe chỉ thêm tầng sort/skip mềm.
- Ref: OpenRouter Auto Router (cost_quality_tradeoff, Pareto shortlist theo score).
