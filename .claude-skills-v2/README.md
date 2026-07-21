# Skills v2 — nền phân tích để viết tiếp

> Đây là HẠT GIỐNG, chưa phải skill hoàn chỉnh. Rút từ một phiên làm việc dài (2026-07-21): FE feedback loop + playground + content-ai + đại tu Storybook. Mục tiêu v2: **mã hoá KỶ LUẬT làm việc** (domain-agnostic), không phải copy 20 skill starci-* cũ.
>
> Thầy đổi máy mở file này ra là viết tiếp được: phần 1-4 là phân tích đã chốt, phần 5 là việc còn phải làm.

---

## 1. Câu gốc

Gần như mọi lần làm TỐT phiên này quy về một câu: **đừng tin lời kể — của người khác, của chính mình, hay của công cụ — khi có thể ĐO được.** Mỗi lần suýt hỏng đều vì rời khỏi câu đó (đoán thay vì hỏi, tin đọc thay vì chạy, sửa cái đang đúng).

## 2. Tám kỷ luật (kèm bằng chứng thật)

1. **Verify bằng ĐO, không bằng đọc.** Terminal "gõ không được" → dựng `elementFromPoint` repro chứng minh input đúng cấu trúc → gốc là thiếu agent, không phải code. Overlap mục lục → đo `getBoundingClientRect` → `container-type` không tạo containing-block cho `fixed`. i18n → gate snapshot placeholder/ICU/mirror chạy trước+sau. *"Build xanh ≠ chạy đúng."*
2. **Tự phản biện trước khi ship — trả lời được "thầy sẽ chỉ chỗ nào tiếp".** Đổi nhãn chip xong, grep lại → bắt `runRetrievalSkill` vẫn gửi nhãn cũ. Tự bắt trailing-newline, tự đính chính số thổi phồng (45→18).
3. **Chẩn đoán trước khi sửa — tìm ĐÚNG tầng.** Terminal: code đúng, cấu trúc đúng → bug ở HẠ TẦNG (agent nối prod thay vì local). Không thrash component đang test-đúng.
4. **Ground vào source SỐNG, không phải memory/worktree cũ.** Tự bắt "worktree tôi lệch, suýt báo nhầm BE thiếu" → check repo chính.
5. **Gate cho thay đổi hàng loạt.** i18n gate + regex test 10 case trước `--write` + dry-run. Không sweep mù.
6. **Hỏi khi là ngã rẽ THẬT của thầy; tự quyết khi verify/default được.** Hỏi: parked-vs-close, "bỏ bước" nghĩa gì, lib icon. Tự làm: fix register.handler.
7. **Git đa-session: giả định luôn có người ghi song song.** fetch-before-write, union-merge BACKLOG (sử ký), rebase-rồi-push, KHÔNG force, cảnh báo `add -A` cuốn việc session khác.
8. **Báo cáo trung thực — tách verified/assumed/chưa-verify; nhận sai nhanh.** "RUNTIME CHƯA VERIFY", "em đã sai".

## 3. Quyết định thiết kế gốc — tách hai loại

Skill = "gọi cho một LOẠI việc". Nhưng 8 kỷ luật chia hai loại khác bản chất → đổi hình dạng cả bộ:

| Loại | Là gì | Gồm |
|---|---|---|
| **Playbook gọi được** | quy trình cho 1 loại task, `/invoke` khi làm | verify-empirically · diagnose-before-fix · safe-bulk-edit · multi-session-git |
| **Nguyên tắc luôn-bật** | không ai gõ `/self-critique` — phải NGẤM, không gọi | self-critique · honest-report · ground-in-source · ask-vs-default |

Ép cả 8 thành skill gọi-được thì 4 cái luôn-bật **không bao giờ được gọi** → vô dụng. Nên:
- **4 skill playbook** (SKILL.md, có trigger rõ)
- **1 file nền `working-discipline.md`** gom 4 cái luôn-bật (để ngấm + skill khác ref, không gọi)

## 4. VÌ SAO skill v1 vẫn để lọt (tự chế component · story lag · layout không mượt)

Chẩn đoán quan trọng nhất — v2 phải giải cái này, không thì chỉ là prose đẹp hơn:

**Câu gốc: skill v1 DẶN, nhưng không CHẶN và không ĐO.** Rule sống dạng câu chữ trong file trăm dòng → tuân thủ *khi tiện*; vòng kiểm luôn chạy qua mắt thầy → lỗi hệ thống lặp lại. (Bằng chứng: memory `feedback-self-critique` — lỗi CourseCard "sửa <1s SAU khi thầy chỉ — thiếu tự soát, không thiếu kiến thức" = biết rule mà vẫn phạm = dấu vân tay prose-không-gate.)

| Lỗi | v1 làm | v2 phải làm |
|---|---|---|
| Tự chế component | câu "đừng hand-roll" | **lint rule/gate** bắt pattern `<div>` giống card/button + registry đầy đủ + bước "chọn block" bắt buộc |
| Story lag | reminder sau khi xong | **sync ATOMIC**: diff đụng block mà không đụng story → gate chặn |
| Layout không mượt | canon token đúng | **định nghĩa "mượt" thành checklist đo được** + verify mắt-máy (drive browser) trong vòng |

**Điểm mù cấu trúc:** Storybook chỉ cân được BLOCK (atom cô lập), không cân được SURFACE (composition — nhịp, phân cấp, data thật). "Mượt" nằm ở composition → dù Storybook đồng bộ 100% vẫn không đảm bảo mượt. → cần **source-of-trust thứ 2 cho surface = app chạy thật, verify qua browser**. Ba-lớp-sync (canon·story·component) đang bỏ trống lớp bố-cục-cả-màn.

**Storybook là BÀN CÂN, không phải chân lý.** chân lý = canon `.claude/fe`; story = UI-ref (chỗ nhìn thấy component có khớp canon); reality = app ship. Story chỉ đáng tin ĐẾN MỨC được ép sync.

## 4b. Case study đã làm — "gate over prose" áp cho Storybook

Bằng chứng sống cho hướng v2 (đã dựng + push mtp phiên này):
- **`.storybook/story-kit.tsx`** — helper `Gallery/Variant/VariantRow`: mọi gallery render giống hệt (diệt div-tự-chế lộn xộn). "All variant in 1 story" = `render → <Gallery> → map <Variant label hint>`.
- **`scripts/check-story-coverage.mjs`** (`npm run check:stories`) — GATE block↔story mirror (allowlist primitive). Coverage 50% → **162/162**.
- 2 workflow fan-out (60 author + 97 convert) đưa MỌI block story về cùng shape (1 `AllVariants` gallery, giữ export riêng chỉ cho interactive/full-bleed).
- Bài học vận hành: workflow auto-gen VẪN cần gate — tsc bắt được "typing sai/rớt prop required", KHÔNG bắt "rớt state" (phải spot-check đếm) và KHÔNG bắt "render đẹp" (phải mắt người). Prompt sai 1 chỗ = lỗi hệ thống cả 60 (đã dính `satisfies Meta` sai convention → fix cơ học).

## 5. VIỆC CÒN LẠI — viết tiếp từ đây

- [ ] Viết `working-discipline.md` (nền, 4 nguyên tắc luôn-bật §3).
- [ ] Viết 4 SKILL.md playbook: `verify-empirically`, `diagnose-before-fix`, `safe-bulk-edit`, `multi-session-git`. Mỗi cái: trigger rõ · quy trình · ví dụ THẬT (neo file/route phiên này) · self-verify built-in.
- [ ] Chốt với thầy: v2 đặt cược GATE-máy (skill mỏng) hay SKILL-agent (verify nhét vào flow)? — câu này quyết skill hay gate là xương sống.
- [ ] Chuyển "mượt" thành checklist đo được + skill drive-browser verify surface (lớp ba-lớp-sync đang trống).
- [ ] Cân nhắc thêm skill `analyze-before-code` (viết analysis + chờ duyệt trước mọi edit — memory `feedback-analyze-and-approve`).
- [ ] Nâng `check:stories` từ script → husky gate (warn→error) khi các session khác không còn tạo block mid-work.

## Nguồn (memory feedback đã có, tái dùng khi viết)
`feedback-self-critique-before-presenting` · `feedback-analyze-and-approve-before-editing` · `feedback-canon-multisession-fetch-before-write` · `feedback-no-destructive-git-in-background-agents` · `feedback-parallel-agents-shared-worktree-race` · `model-allocation-3tier` · `feedback-skip-storybook-browser-verify`.
