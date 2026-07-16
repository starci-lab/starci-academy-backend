---
name: starci-doc-audit
description: >
  Audit the StarCi KNOWLEDGE-BASE docs under `.claude/fe/` and `.claude/be/` for HEALTH — dead `[[wikilinks]]`,
  mis-categorized files (a rule in the wrong shelf), staleness vs the REAL source (claims about blocks/entities/fields/
  tokens that no longer exist), duplication / merge candidates, coverage gaps (source with no doc), and INDEX / README /
  BACKLOG count-and-status drift. Runs a deterministic grep GATE + fan-out SONNET semantic readers grounded in real
  source → OPUS synthesizes a ranked findings report. Report-only by default; fixes on approval (safe move/delete
  first, content-rewrite only when confirmed — tránh hallucination). Trigger when the user types `/starci-doc-audit
  [path]`, or asks to "audit tài liệu / soi rules-concepts / check knowledge base / dọn docs".
---

# /starci-doc-audit — Soi sức khoẻ knowledge-base (`.claude/fe` + `.claude/be`)

Tự động hoá đúng cái đã làm TAY lúc dọn `fe/` (link chết · mis-shelve · stale · trùng · gap · index-drift). **Grounded
vào source THẬT** — "stale" phải verify grep, không đoán. Mặc định **report-only**.

## Phạm vi
`.claude/fe/{foundations,layouts,components,patterns,principles,features,prototypes,proposals}` + `.claude/be/{rules,concepts}` + README/INDEX/BACKLOG mỗi kệ. (Arg = giới hạn 1 kệ/đường dẫn.)

## 6 trục audit
1. **Link chết** — mọi `[[name]]` KHÔNG có file `name.md` trong cây. (deterministic)
2. **Mis-shelve** — file nằm sai kệ (rule engineering ở `principles`, component-rule ở `patterns`, product-axiom ở design…). (semantic)
3. **Stale vs source** — doc nhắc block/entity/field/token/route **không còn** trong source thật (`starci-academy` FE / `starci-academy-backend` BE). (grep source)
4. **Trùng / gộp** — ≥2 file cùng nội dung → merge candidate. (semantic)
5. **Coverage gap** — block/module/entity trong source **chưa có** doc. (semantic + grep)
6. **Index drift** — count trong INDEX/README ≠ số file thật; BACKLOG status sai (proposal ✅ mà code chưa build; PENDING mà đã build). (deterministic + semantic)

## Quy trình
1. **GATE deterministic (grep/script):** trích mọi `[[wikilink]]` → check file tồn tại; đếm file/kệ vs con số trong INDEX/README; grep path-ref (`../x.md`, `shelf/y`) chết. Ra danh sách cứng TRƯỚC (rẻ, chắc).
2. **Fan-out SONNET readers (per kệ):** mỗi agent đọc doc kệ mình + **đối chiếu source thật** → mis-shelve / stale / trùng / gap. **Neo vào file:line source**; không chắc → đánh "cần verify", không phán.
3. **OPUS synthesize:** gộp + dedupe finding, rank theo severity, đề xuất fix (dời / gộp / rewrite / xoá) + file:line. **Report-only.**

## Output
Report gọn theo 6 trục, mỗi finding: `kệ/file:line` · loại · mô tả · fix đề xuất. (Format y như lần dọn `fe/` tay.)

## Fix (chỉ khi thầy duyệt — tránh hallucination)
- **An toàn trước:** dời file sai kệ · xoá link chết/redirect · gộp file trùng-verbatim · sửa count INDEX/BACKLOG.
- **Rewrite/split** (chẻ nội dung, gộp cần synthesize) → per-item, chép nguyên chữ + verify, đừng bulk-mangle.
- Ghi lại thao tác trong README/INDEX của kệ.

## Liên quan
- Nạp vật liệu: `.claude/fe/README.md` · `.claude/be/README.md`. Dùng sau mỗi đợt thêm doc nhiều, hoặc khi nghi drift.
