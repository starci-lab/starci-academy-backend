# Proposal — Nâng tầm M5: Form Mastery (RHF + Zod)

> **Trạng thái:** DRAFT, chờ duyệt. Module: FS slot 5 `5-form-mastery-rhf-zod`.
> **Model:** FE single-track `# lang = agnostic` (Next.js + React + TS; FE renderer ẩn tab). 4 tier easy→insane (FE giữ hard/insane để KHÔNG nông).

## Vì sao nâng tầm (rationale gốc)
M5 cũ = 4 lesson thuần client, thiên "ráp library RHF" → **nông nhất nhóm FE**. Forms có trần độ-sâu thấp NẾU chỉ dạy API. Nâng tầm bằng 3 đòn bẩy:
1. **Dạy CƠ CHẾ ở §2.2.1**, không dừng ở "API dùng sao": uncontrolled & re-render cost · Zod schema = single source of truth · async race/cancellation.
2. **Thêm góc FULLSTACK** (điểm đắt nhất): 1 Zod schema dùng CHUNG client+server, Server Action validate, map lỗi server về field → forms thành showcase type-safe end-to-end, không phải UI client.
3. **Bỏ challenge "build-exercise"** (excel-grid) → thay bằng challenge concept-sâu (server reconciliation, optimistic concurrency).

**Cấu trúc:** 4 → **5 lesson** (thêm L4 e2e type-safe). Renumber + update module overview + memory.

---

## L0 — Nền tảng form: uncontrolled + schema là nguồn sự thật
**Nội dung:** RHF `register` (uncontrolled, ref-based) · `zodResolver` · Zod `infer` → TS type → form values type-safe · validation mode (onSubmit/onBlur/onChange).
**§2.2.1 (cơ chế):** vì sao uncontrolled KHÔNG re-render mỗi keystroke (subscribe model) vs controlled; Zod schema = 1 nguồn sinh cả TS type LẪN runtime check; resolver pipeline.
**Demo:** signup form → submit valid (values typed) / invalid (lỗi per field) · đo re-render controlled vs uncontrolled.
| Tier | Challenge | Mục đích |
|------|-----------|----------|
| easy | typed signup form (RHF+zodResolver), lỗi per field | Nắm uncontrolled + schema→type |
| medium | nested object + array schema + custom message + validation mode | Schema phức tạp + timing UX |
| hard | cross-field (password-confirm, date-range) + dirty/touched | Cross-field + form state |
| insane | **schema-driven form** (render field TỪ Zod introspection) | Schema-as-SSoT đến cùng: 1 schema → UI+validation+type |

## L1 — Async validation: debounce, cancellation, race
**Nội dung:** async validate (username available?) · debounce · hủy request cũ · loading/error UX.
**§2.2.1:** **race condition** (response cũ đè response mới) · cancellation (AbortController) · debounce vs throttle.
**Demo:** username field → debounced check → available/taken; gõ nhanh → chỉ lần cuối thắng.
| Tier | Challenge | Mục đích |
|------|-----------|----------|
| easy | debounced async username check | Async + debounce cơ bản |
| medium | multi-field dependent async + cancel | Phụ thuộc field + hủy |
| hard | race-proof (AbortController + stale guard) khi gõ nhanh | Diệt race thật |
| insane | server-reconciled async (client zod + server check, merge lỗi, no flicker) | Đồng bộ client↔server validation |

## L2 — Wizard nhiều bước: state, persistence, partial validation
**Nội dung:** FormProvider · partial schema per step (`schema.pick`) · persist/resume · back/forward.
**§2.2.1:** state qua nhiều step (1 RHF context vs per-step) · partial Zod · persistence (localStorage/URL) · discriminated steps.
**Demo:** 3-step wizard, validate từng step, refresh → resume, back giữ data.
| Tier | Challenge | Mục đích |
|------|-----------|----------|
| easy | 2-step wizard + validate per step | Partial validation |
| medium | persist + resume (localStorage) + progress | State persistence |
| hard | persistence + rollback (undo step) + conditional skip | Flow state nâng cao |
| insane | dynamic conditional steps từ schema + branching | Wizard như state-machine |

## L3 — Dynamic fields: useFieldArray, perf, nested arrays
**Nội dung:** `useFieldArray` (add/remove/move) · nested arrays · validate per item · perf nhiều dòng.
**§2.2.1:** field-array internal (key stability, re-render scope) · nested validation path · perf (input trong array → re-render; virtualization).
**Demo:** invoice line-items (add/remove/reorder) + validate từng dòng + total.
| Tier | Challenge | Mục đích |
|------|-----------|----------|
| easy | dynamic field array (add/remove) | useFieldArray cơ bản |
| medium | nested field arrays (group) + per-item validation | Nested path |
| hard | large array (100s dòng) + virtualization + minimal re-render | Perf form lớn |
| insane | virtualized editable grid: cell-validation + keyboard nav + undo | Perf+a11y depth (KHÔNG phải "build excel" — nhấn cơ chế re-render/ảo hoá) |

## L4 — (MỚI) Form type-safe END-TO-END: Zod chung, Server Action, error mapping
**Nội dung:** 1 Zod schema dùng CHUNG client+server · Next Server Action validate bằng đúng schema · map ZodError server → `setError` per field · optimistic + revalidate · progressive enhancement (chạy cả khi no-JS).
**§2.2.1 (đắt nhất):** schema = **contract qua ranh giới network** (không drift) · server là source of truth, client mirror · error shape mapping · vì sao type-safe e2e quan trọng cho fullstack.
**Demo:** form → server action → invalid (server zod) → lỗi map về field; valid → optimistic + revalidate; chỉ ra client+server import CÙNG file schema.
| Tier | Challenge | Mục đích |
|------|-----------|----------|
| easy | server action + shared zod schema (happy path) | Schema chung 1 nguồn |
| medium | server validation error → map về RHF field (setError) | Reconcile lỗi server↔client |
| hard | optimistic + server action + rollback khi server lỗi (no flicker) | Optimistic concurrency |
| insane | full type-safe CRUD form: shared schema + optimistic + error-merge + progressive enhancement | Forms = showcase fullstack type-safety |

---

## Mục đích tổng (vì sao thiết kế vậy)
- **L0→L3 giữ topic cũ nhưng đào sâu §2.2.1** → cùng chủ đề nhưng hết "nông" (dạy cơ chế, không API-usage).
- **L4 là đòn nâng tầm chính** → kéo forms từ "client UI" lên "**fullstack type-safety**" (schema chung, server action, error mapping) — đúng tinh thần khóa FULL, nối M5↔M12(server actions)↔M1(dtos/validation).
- **Hard/insane tập trung concept** (race, optimistic, schema-driven, e2e) thay vì build-exercise → FE đủ sâu mà không cố nhét.
- **Single-track `agnostic`** vì forms là React/TS, không có 4-lang.

## Sau khi duyệt
Migrate M5 V2: reframe root (5 lesson) → bodies/0-agnostic (5 lesson, §2.2.1 deep) → challenges 4 tier + submissions → E2E TS (Next dev, Playwright/curl server-action) → audited + code-context.md + gate. Update module overview + memory.
