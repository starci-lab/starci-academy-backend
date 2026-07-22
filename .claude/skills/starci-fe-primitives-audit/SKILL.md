---
name: starci-fe-primitives-audit
description: >
  FULL-SCAN audit sức khỏe TOÀN BỘ primitives Storybook của app FE chính (`$FE_SOURCE`, branch mtp) theo
  canon "ButtonGroup" — 10 chiều: §6 granularity (prop-vs-component mới) · props-roles · size · isSkeleton ·
  responsive · §4 ownership · §5 icon · anatomy per-leaf · cluster→group · spacing. Chạy WORKFLOW fan-out
  (mỗi primitive 1 agent Sonnet chấm **PORT-only** → Opus synth) → report RANKED + đề xuất BATCH theo GAP
  (không theo primitive) ghi `$FE_SOURCE/.artifacts/audits/`. **Report-only, KHÔNG sửa code.** Lane NẶNG (nhiều
  agent, nền) — chỉ chạy khi thầy chủ động gọi. Trigger khi thầy gõ `/starci-fe-primitives-audit [family|scope]`,
  hoặc "audit primitives", "soi sức khỏe primitive toàn app", "quét primitive theo canon ButtonGroup".
---

# /starci-fe-primitives-audit — quét toàn bộ primitives theo canon → batch-by-gap

Vai: **AUDIT (report-only)**. Ra BẢN ĐỒ gap + đề xuất **batch để sửa hàng loạt** (fix là lane khác: `-story-fix-block-*` / codemod).

> **MODEL:** fan-out audit = **Sonnet** (rẻ, nhiều agent) · synth = **Opus**.
> **Nền:** [`verify-empirically`](../../discipline/verify-empirically.md) · `ground-in-source`.

## 🛡️ Chống hallucination (LUÔN)
- ⭐ **PORT-ONLY** — chỉ chấm `.storybook/stories/blocks/**` (port). **Nếu port đã compose ĐÚNG mà `src` còn hand-roll → đó là NỢ-SYNC, KHÔNG phải gap.** (Bài học 2026-07-22: audit từng nhầm src-drift thành port-gap ở LanguageChip/ProgrammingLanguageTabs/SegmentBar — port đã đúng, chỉ src lag.)
- **Đọc file THẬT** (port `.tsx` + story) trước khi chấm; neo `file:line`.
- **BỎ check KHÔNG áp dụng** — Logo/Media/Brand tĩnh không cần size/skeleton/icon → đừng flag bừa.
- Màu/phân-lớp/icon-size là VISUAL → NHÌN/ĐO khi cần, đừng chỉ đọc class.

## Canon 10 chiều (thước = `.claude/fe/principles.md` §1–6 + ButtonGroup template)
1. **§6 Granularity** — component này có nên là 1 PROP của foundational (`Button`…) thay vì component riêng?
2. **Props-roles** — vai qua slot/prop CÓ TÊN; shape khác → prop `variant`/`scenario` tường minh (không "emerge").
3. **Size** — có prop `size` nếu kích thước biến thiên.
4. **isSkeleton** — tự render skeleton mirror qua prop (không để consumer dựng Skeleton rời).
5. **Responsive** — xử lý bề rộng hẹp.
6. **§4 Ownership** — primitive TỰ ép sizing/style nội bộ; consumer truyền children TRẦN.
7. **§5 Icon** — icon-size theo TEXT-size (xs→4·sm→5·base→6) + interaction special-case (arrow slide…).
8. **Anatomy per-leaf** — anatomy mỗi leaf chỉ kể part leaf đó (nếu dùng `blockShell`).
9. **Cluster→group** — cụm ≥2 element đồng-vai → 1 GROUP primitive.
10. **Spacing** — thang `0·2·3·6·8`; card padding `p-3`.
> ⛔ KHÔNG chấm "thiếu nCn test" — coverage = **test-runner smoke + Chromatic**, không phải play cross-product (over-engineer, đã bỏ).

## Các bước — chạy tuần tự, MỞ file bước để lấy chi tiết
1. **S1 — Ground** → [`s1-ground.md`](s1-ground.md) · đọc principles §1–6 + ButtonGroup template.
2. **S2 — Enumerate** → [`s2-enumerate.md`](s2-enumerate.md) · liệt kê primitives (`Primitives/*`).
3. **S3 — Audit fan-out** → [`s3-audit-workflow.md`](s3-audit-workflow.md) · workflow mỗi primitive 1 agent, PORT-only.
4. **S4 — Synthesize** → [`s4-synthesize.md`](s4-synthesize.md) · Opus xếp hạng + batch-by-gap.
5. **S5 — Output** → [`s5-output.md`](s5-output.md) · ghi report `.artifacts/audits/` + đề xuất batch.

## Ràng
- **Report-only** — KHÔNG sửa code, KHÔNG ghi `.claude`. Chỉ ghi `.artifacts/audits/`.
- **PORT-only** (bỏ src-drift). Bỏ check không áp dụng. Không chấm nCn.
- Liên quan: `.claude/fe/principles.md` (thước) · `starci-fe-story-fix-block-{plan,apply}` (apply từng batch).
