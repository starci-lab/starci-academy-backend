---
name: starci-fe-story-audit
description: >
  Audit RENDER của Storybook stories (`$FE_SOURCE/.storybook/stories/**`) để **rút + codify kinh nghiệm
  dựng UI** thành canon lean, rồi **chấm từng story** theo canon đó. Hai trục: **surface-in-surface** (phân
  lớp bề mặt lồng nhau — shadow→border→flat, radius bước vào) và **màu nổi/chìm** (phân cấp chú ý — đúng MỘT
  thứ nổi mỗi vùng; meta phải chìm, không lạm dụng chip/accent). Sinh ra: (1) canon MỚI ở `.claude/fe`
  (1 file `.claude/fe/principles.md` — §1 surface-in-surface, §2 color-prominence) làm THƯỚC, (2) report chấm story ở
  `$FE_SOURCE/.artifacts/audits/`. Mục đích cuối: thầy lấy thước này **audit full UI app thật** rồi áp web.
  Chạy human-in-loop, thầy chủ động gõ. Dùng khi thầy gõ `/starci-fe-story-audit` (toàn bộ) hoặc
  `/starci-fe-story-audit <họ>` (1 họ block, vd `cards`), "audit render story", "chấm surface / màu nổi chìm",
  "rút kinh nghiệm dựng UI thành canon". KHÔNG phải lane sửa story (đó là `_legacy` `starci-fe-story`); skill
  này ĐỌC story + GHI canon/report, không sửa story/component.
---

# /starci-fe-story-audit — chấm render story → codify canon nổi/chìm + surface-in-surface

> **Nền luôn-bật áp cho skill này:** [`discipline/verify-empirically.md`](../../discipline/verify-empirically.md) (màu nổi/chìm + phân lớp là VISUAL → phải **NHÌN** qua browser/screenshot, không chấm bằng đọc class) · `ground-in-source` (distill từ story THẬT + `.claude/_legacy/fe/foundations/{elevation,color}.md`, **đừng chế**) · `feedback-canon-multisession-fetch-before-write` (fetch trước khi ghi `.claude/fe`).

## Skill làm gì (và KHÔNG làm gì)

- **ĐỌC:** `$FE_SOURCE/.storybook/stories/**/*.tsx` (design SSOT storybook-driven) + canon cũ ở `.claude/_legacy/fe/foundations/{elevation,color}.md`, `principles/{visual-hierarchy,card,whitespace-over-dividers}.md` (distill, không bê nguyên).
- **GHI:** canon lean MỚI → backend `.claude/fe/` (SSOT) · report chấm → `$FE_SOURCE/.artifacts/audits/story-render-audit.md` (audit-state ở audited-source).
- **KHÔNG:** sửa story / component / preview.tsx. Story lệch canon → GHI vào report (để thầy quyết fix lane khác), không tự sửa.

`$FE_SOURCE` = repo FE chính (khai ở `.artifacts/config.json`; hiện `D:\Repositories\starci-academy`, branch mtp).

## Hai trục chấm (canon skill dựng ra + chấm theo)

### Trục 1 — Surface-in-surface (phân lớp bề mặt)
Bề mặt lồng bề mặt phải ĐỔI TÍN HIỆU mỗi lớp, không lặp:

| Lớp | Tín hiệu | Vì sao |
|---|---|---|
| Card ngoài cùng (nổi khỏi nền page) | `shadow-surface` | elevation thật, tách khỏi background |
| Surface LỒNG trong card | `border border-default`, **KHÔNG shadow** | shadow vô hình trên nền surface → phải dùng viền |
| Vùng phẳng trong cùng | flat / chỉ divider | hết bước để nổi |

- Radius: **surface-card nested GIỮ `rounded-3xl`** (đừng hạ 2xl vì nested); CHỈ media/field nested mới bước xuống (`2xl`/`xl`/`full`). Luật đầy đủ ở `.claude/fe/principles.md` §1b — skill KHÔNG lặp, canon đổi thì theo.
- ✅ neo THẬT: `CrossListCard bordered rounded-3xl` trong `CourseCard` (value-props) · cover `rounded-2xl` (media) trong card `rounded-3xl`.
- ❌ bắt lỗi: surface lồng vẫn xài `shadow` (vô hình ở dark) · hộp vừa border vừa shadow (double-fill) · hạ surface-card nested xuống 2xl · 2 bordered kề nhau dọc.
- **SSOT:** `.claude/fe/principles.md` §1 (skill chấm THEO checklist §"Đo được" của nó).

### Trục 2 — Màu nổi / chìm (phân cấp chú ý)
Mỗi vùng nhìn chỉ được có **ĐÚNG MỘT thứ nổi**. Lạm dụng nổi = không còn gì nổi.

| | Nổi (prominent) | Chìm (recessive) |
|---|---|---|
| Dùng cho | accent · primary CTA · status semantic · bold title · elevated surface | muted text · meta-count · secondary surface · border · divider · eyebrow |
| Nguyên tắc | TIẾT KIỆM — 1 thứ/vùng | mặc định cho mọi thứ phụ trợ |

- ✅ neo THẬT: enrollment count = **muted text + icon** (chìm) — KHÔNG chip (bài học 2026-07-22: "482 học viên render text muted oki mà lạm dụng chip chi").
- ❌ bắt lỗi: chip/accent cho mọi meta (số, tag, count) → loãng · 2+ thứ tranh nổi 1 vùng · muted-lẽ-ra-nổi (CTA chính bị chìm) hoặc nổi-lẽ-ra-chìm.

## Quy trình (human-in-loop)

1. **Scope** — `args` rỗng = toàn bộ; `args=<họ>` (vd `cards`, `feed`) = 1 họ block. Liệt kê story trong scope (`curl :6006/index.json` hoặc glob `*.stories.tsx`) — biết con số.
2. **Distill canon** (nếu chưa có / cần refresh) — đọc `.claude/_legacy/fe/foundations/{elevation,color}.md` + `principles/visual-hierarchy.md` + neo thật trong story → cập nhật **lean** các §section trong 1 file `.claude/fe/principles.md` (§1 surface-in-surface · §2 color-prominence) theo 2 bảng trên. `git fetch` trước khi ghi. Ngắn, mỗi rule 1 ✅ + 1 ❌ neo file thật.
3. **Chấm** — mỗi story mở qua browser (Storybook :6006), **NHÌN** render (screenshot vùng), chấm 2 trục: `PASS` / `WARN` / `FAIL` + 1 câu lý do neo class/vùng. VISUAL không chấm bằng đọc code (verify-empirically). Block-level nổi/chìm + surface layering NHÌN được ở Storybook; nhưng "mượt cả màn" (composition) là điểm mù Storybook → ghi rõ "cần verify ở app thật".
4. **Report** — `$FE_SOURCE/.artifacts/audits/story-render-audit.md`: bảng story × 2 trục + danh sách FAIL/WARN (để thầy quyết fix). Tổng kết pattern lặp (vd "5 block lạm dụng chip meta").
5. **Bàn giao** — báo thầy: canon đã dựng ở đâu, report ở đâu, top vi phạm. Thầy dùng canon làm **thước audit full UI app thật** (lớp composition — verify browser trên app, không Storybook) rồi áp web.

## Model
Enumerate/scan story = main-loop (rẻ). **Chấm nổi/chìm là phán đoán tinh tế** → Opus opt-in (`args.opus:true`) cho vòng chấm khi cần chắc; distill canon = Opus (viết luật). Không fan-out workflow trừ khi scope rất rộng — human-in-loop cần thầy soi mắt từng screenshot.

## Ràng
- KHÔNG chế canon không có neo story thật (rule mơ hồ = không tra lại được).
- KHÔNG tự sửa story/component — lệch thì ghi report, thầy quyết lane fix.
- Canon ghi backend `.claude/fe` (SSOT); report ghi FE `.artifacts` (audit-state ở audited-source — memory `audit-state-lives-in-audited-source`).
- Storybook chỉ là BÀN CÂN block; "mượt cả màn" phải verify ở app thật (verify-empirically §điểm-mù).
