# Draft — Chọn 1-trong-N "lần thử/run/version": DẢI CHIP flex-wrap (≤6 hết · >6 = 5 mới nhất + "+N" pill → Drawer card-list + pagination) + AI grading-model attribution = text "chấm bởi <model>" (sparkle accent size-5) + tier chip (2026-06-28)

- File/§ đích khi `/merge`: `concepts/` (selector/history) + [[elements/card]] (SurfaceListCard) + [[elements/chip]] (model chip) + [[when-drawer]] + [[list-pager-left-align-and-hover]] + [[master-detail-rail-as-filter-and-mobile-chips]] (họ "chọn item") + [[elements/icon]].
- Bối cảnh: `SubmissionResult` "Các lần thử". Qua nhiều vòng: ListBox rail → chip strip → dropdown → **Drawer card-list + pagination**; + thầy muốn hiện **model đã chấm**.

## Quy tắc 1 (STRICT) — selector "chọn 1-trong-N lần thử/run/version" = DẢI CHIP + "+N" overflow pill
- **LUÔN render DẢI CHIP (`flex flex-wrap gap-2`, KHÔNG `overflow-x-auto`)** — chip xuống hàng khi chật, KHÔNG cuộn ngang (cuộn ngang giấu mất chip, khó quét). Mỗi chip = verdict icon + "Lần thử N" + điểm, selected = `border-accent bg-accent/10`. Hover = fill (select-here — [[hover-style-matches-clickable-nature]]). KHÔNG thay cả dải bằng 1 Button trigger (thầy bác 2026-06-28: *"render 5 cái gần nhất, cái thứ 6 ghi button +N"*).
- **ADAPT theo số lượng (đính chính bản trước "≤6 chip / >6 Button"):**
  - **≤ `ATTEMPT_CHIPS_MAX` (=6) → render HẾT** (tối đa 6 chip). Đủ ít để bày trọn.
  - **> 6 → render `ATTEMPT_CHIPS_VISIBLE` (=5) control MỚI NHẤT + 1 "+N" overflow** (N = tổng − 5) → bấm "+N" **mở DRAWER** đầy đủ ([[when-drawer]]). "+N" = node `trailing` (action, ngoài radio group). (Vd 8 lần thử → 5 control + "+3".)
  - Pattern "show N rồi +overflow" = facepile/tag-overflow chuẩn (Slack reactions, GitHub avatars "+5").
- **Dùng block `FlexWrapButtonRadio` (mỗi option = `<Button>` thật) / `FlexWrapCardRadio` (RadioGroup + div card)** — [[elements/card]] §3f — KHÔNG hand-roll `<button aria-pressed>`. Wrap, màu selected cấu hình (`color="accent"`), `trailing` = "+N" `<Button>`. Mỗi control `content` = verdict icon + "Lần thử N" + điểm (score `opacity-70`). `SubmissionResult` dùng `FlexWrapButtonRadio insideCard={false}` (standalone → option card-styled: `bg-surface`+border, selected `bg-accent/10`+`border-accent`). `insideCard={true}` cho native primary/tertiary khi đã nằm trong card.
- **Drawer list = `SurfaceListCard` (card-list, surface-in-surface → BORDER) + `SurfaceListCardItem` interactive** (`onPress` → select + đóng), mỗi item GIÀU: "Lần thử N" + verdict chip + điểm + **model + tier** + time (Figma-version-history style). + **`Pagination`** căn TRÁI (HeroUI `Pagination`, hover/cursor — [[list-pager-left-align-and-hover]]) trong `Drawer.Footer` (ghim đáy, ngoài ScrollShadow), client-side slice (~6/trang), ẩn khi ≤1 trang, reset trang khi mở. Placement: `right` desktop / `bottom` mobile.
- **Selector CÓ `<Label>` "Các lần thử" (nhãn nhóm control)** — block HeroUI `<Label>` đặt trên dải nút, bọc `<div className="flex flex-col gap-2"><Label/>{selector}</div>` ([[elements/label]] §1b: nhãn nhóm control = `<Label>`, KHÔNG text-muted tay). (Đính chính bản trước "bỏ label" — thầy chốt 2026-06-28 thêm lại Label.)
- **Ngưỡng = 2 const** (`ATTEMPT_CHIPS_MAX = 6` · `ATTEMPT_CHIPS_VISIBLE = 5`) dễ chỉnh. Same data nuôi cả chip strip lẫn drawer.

## Quy tắc 2 (STRICT) — AI GRADING-MODEL ATTRIBUTION: hiện model ĐÃ CHẤM + tier (text + chip, KHÔNG 2 chip)
- **Trang kết quả chấm AI PHẢI hiện model THẬT đã chấm** (tin cậy: ai chấm bài này) = **"chấm bởi `<model>`" = TEXT THUẦN** (sparkle accent + chữ sans) + **`AiCategoryChip`** (tier Miễn phí/Tiết kiệm/…) **= chip BÊN CẠNH**. Per-attempt.
- **KHÔNG bọc "chấm bởi `<model>`" trong `<Chip>`** → đặt cạnh `AiCategoryChip` sẽ thành **chip-cạnh-chip = vi phạm** ([[elements/chip]] §3). Quy tắc: phần MÔ TẢ (model name) = text; phần PHÂN LOẠI (tier) = 1 chip. **KHÔNG `font-mono`** cho model name (chữ sans — [[elements/chip]] §4).
- **Sparkle icon = `text-accent` + `size-5`** (thầy chốt 2026-06-28), đặt trước text "chấm bởi `<model>`". Sparkle = "AI" motif (đồng bộ ContentAiFab sparkle).
- **Block dùng chung `GradingByline`** (`blocks/grading/GradingByline`) export `ModelByline` (text sparkle + AiCategoryChip) + `VerdictIcon` → cả PAGE (`SubmissionResult`) lẫn DRAWER dùng 1 nguồn ([[single-source-render]]). Drawer KHÔNG import từ feature; cả 2 import từ block.
- **Data:** model thật = `attempt.servedModel` / `servedProvider` (BE denormalize lên attempt lúc grade-complete — KHÔNG có sẵn trong GraphQL trước đó; selectedModel của user = null khi Auto nên KHÔNG đủ). Tier suy từ catalog `aiModels.gradableModels` (map model→category). Null servedModel (attempt cũ) → ẩn byline.

## Block/primitive map
| Phần | Dùng |
|---|---|
| Trigger | HeroUI `Button` ([[button-variant-secondary-pairs-primary-else-tertiary]]) |
| Drawer | block trong `components/drawers/<Name>Drawer` (HeroUI `Drawer` right/bottom) — [[when-drawer]] + §quy ước drawer-folder |
| Drawer list | `SurfaceListCard` + `SurfaceListCardItem` onPress — [[elements/card]] §3c · border [[surface-in-surface-inner-has-border]] |
| Pagination | HeroUI `Pagination` căn trái + hover — [[list-pager-left-align-and-hover]] |
| Model byline / tier | block `GradingByline` (`ModelByline` text sparkle + `AiCategoryChip` chip) — [[elements/chip]] §3 (text + chip, không 2 chip) |

## Quy ước DRAWER = component riêng trong `components/drawers/<Name>Drawer/` (STRICT) — CHỐT 2026-06-28
- **Drawer KHÔNG inline trong feature page → tách thành component riêng trong `src/components/drawers/<Name>Drawer/index.tsx`** (folder convention: 1 component = 1 folder index.tsx; sub-parts nest trong). Precedent: `SubmissionAttemptsDrawer`, `E2eResultDrawer`, `ContentAiChatDrawer`, `PersonalProjectTaskAttemptsDrawer`, `UserCvSubmissionAttemptsDrawer` (+ `DrawerContainer.tsx` gom các drawer state-driven global).
- **2 kiểu drawer:** (a) **state-driven global** (zustand overlay + redux, tự đọc state) → render qua `DrawerContainer` ở root; (b) **presentational props-driven** (page sở hữu open + selection, truyền props) → render ngay trong page nhưng vẫn SỐNG trong `components/drawers/`. `SubmissionResultHistoryDrawer` = kiểu (b): props `{isOpen,onOpenChange,attempts,selectedAttemptId,maxScore,passThreshold,modelCategoryMap,onSelect}`, tự sở hữu pagination (reset page khi open). Page chỉ giữ `historyOpen`.
- **Da chuẩn drawer** (copy `SubmissionAttemptsDrawer`): `Drawer > Drawer.Backdrop(isOpen,onOpenChange) > Drawer.Content(placement right/bottom) > Drawer.Dialog(p-0) > [div p-3: CloseTrigger + Header/Heading] + Drawer.Body + (Drawer.Footer cho pager)`.
- **ScrollShadow PHẢI `h-full`, KHÔNG `max-h-full` (gotcha):** body cuộn = `<Drawer.Body><ScrollShadow hideScrollBar className="h-full p-4">…list…</ScrollShadow></Drawer.Body>`. `Drawer.Dialog` là flex-col, `Drawer.Body` = flex-1 (có chiều cao) → `h-full` cho ScrollShadow đúng bằng body → list tràn → **shadow fade hiện**. `max-h-full` + content ngắn → box co theo content (< max) → KHÔNG có vùng cuộn → KHÔNG shadow (bug đã dính). **Pager KHÔNG nằm trong ScrollShadow** → đặt `Drawer.Footer className="border-t"` (ghim đáy, list cuộn riêng). Ref [[sticky-rail-overflow-wrap-scrollshadow]].

## ĐÃ ÁP DỤNG 2026-06-28 (FE)
- `SubmissionResult`: selector adaptive (chip strip ≤6 / Button+Drawer >6); drawer **tách ra `components/drawers/SubmissionResultHistoryDrawer/`** (props-driven, tự pagination 6/trang) = `SurfaceListCard`+`SurfaceListCardItem`+`Pagination`; bỏ `<Label>` "Các lần thử".
- Block **`blocks/grading/GradingByline`** (`ModelByline` + `VerdictIcon`) dùng chung page + drawer. `ModelByline` = sparkle accent size-5 + **text thuần** "chấm bởi `<model>`" (sans, KHÔNG mono, KHÔNG chip) + `AiCategoryChip` cạnh bên (text + chip, không 2 chip — [[elements/chip]] §3/§4).
- BE: `served_model`/`served_provider` cột + migration trên `UserChallengeSubmissionAttemptEntity` (set lúc grade-complete). tsc/eslint sạch.
- Nợ: "số vấn đề"/finding-count per-attempt trong drawer (cần BE `feedbackCount` denormalize — pha 2).
