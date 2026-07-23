---
name: starci-fe-primitives-audit
description: >
  FULL-SCAN audit sức khỏe TOÀN BỘ primitives Storybook của app FE chính (`$FE_SOURCE`, branch mtp) theo
  canon "ButtonGroup" — 10 chiều: §6 granularity (prop-vs-component mới) · props-roles · size · isSkeleton ·
  responsive · §4 ownership · §5 icon · anatomy per-leaf · cluster→group · spacing — CỘNG fixture-standard
  (`C-fixture`: ProfileCard) CỘNG **chiều CÂY** (thầy chốt 2026-07-23): `C-compose` (nhánh cắt = raw HeroUI/hand-roll
  vòng qua port → drift, "đổi 1 = đổi hết") · `C-generic` (§6a.1 năng lực ở atom, cluster generic) · `C-tier` (§6c) ·
  `C-skeleton-separate` (§6b) · `C-font` (§9 Typography prop). Chạy WORKFLOW fan-out
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
4. **isSkeleton (MUST — §8)** — MỌI primitive hiển-thị (chip/card/button/row/meter…) PHẢI có prop `isSkeleton` tự render skeleton **MIRROR đúng hình** (không để consumer dựng Skeleton rời). Loading = render component thật + skeleton bên trong. Thiếu isSkeleton = GAP high. (Bài học 2026-07-23: 9 Chip primitive từng thiếu sạch → đã thêm.)
5. **Responsive** — xử lý bề rộng hẹp.
6. **§4 Ownership** — primitive TỰ ép sizing/style nội bộ; consumer truyền children TRẦN.
7. **§5 Icon** — icon-size theo TEXT-size (xs→4·sm→5·base→6); **caret/chevron điều hướng = `size-3` phosphor `CaretRightIcon` muted**; interaction: **CHỈ arrow trượt** hover (`translate-x-1`), **caret KHÔNG trượt**; icon lib mặc định phosphor (gravity đã bỏ).
8. **Anatomy per-leaf** — anatomy mỗi leaf chỉ kể part leaf đó (nếu dùng `blockShell`).
9. **Cluster→group** — cụm ≥2 element đồng-vai → 1 GROUP primitive.
10. **Spacing** — thang `0·2·3·6·8`; card padding `p-3`.
> ⛔ KHÔNG chấm "thiếu nCn test" — coverage = **test-runner smoke + Chromatic**, không phải play cross-product (over-engineer, đã bỏ).

## Fixture chuẩn — mock-content = ProfileCard (STRICT · thầy siết 2026-07-23)
⛔ **BẮT BUỘC (MUST):** MỌI ô **"content" / children** của primitive (slot/children/prop nhận NODE TỰ DO — `AsyncContent` content, `GroupPressableCard` `item.content`, `HighlightCard` card được bọc, `SurfaceCard`/`PressableCard`/`SurfaceAccordionCard` children, bất cứ chỗ nào "đây là nội dung nào đó") **PHẢI** đổ mock = **ProfileCard** (Card + **avatar + title + description**). **CẤM** text trần / lorem / filler tự chế / card ad-hoc khác. Story demo content bằng thứ khác ProfileCard = GAP (fix ngay).

- **ProfileCard KHÔNG phải component để showcase.** Nó là *hình dạng mock-data chuẩn* để lấp "content", để mọi story đọc nhất quán và test đúng shape nội dung thật (avatar + tiêu đề + mô tả — thứ hầu hết content thật có).
- **Hình dạng chuẩn (neo `AsyncContent.stories.tsx`):** `Card > CardContent(flex-row items-center gap-3, KHÔNG p-3 vì Card đã có)` → `Avatar size-10 shrink-0` + cột `title text-sm font-medium` · `description text-xs text-muted truncate`.
- **Áp mọi state + skeleton**: mọi story có ô content-với-children đổ ProfileCard; **skeleton (isSkeleton) MIRROR đúng pattern ProfileCard** — `Skeleton.Avatar md` + `Skeleton.Typography body-sm 1/3` (title) + `body-xs 2/3` (desc). Neo: `AsyncContent`, `GroupPressableCard` (thầy chốt 2026-07-22: "skeleton cũng theo pattern ProfileCard").
- ⛔ **RANH GIỚI — ProfileCard là HÌNH DẠNG mock-content, KHÔNG phải component/story để showcase.** Dùng nó INLINE làm content của mọi story (không đẻ 1 story tên "ProfileCards" riêng để trưng), và mirror nó trong skeleton. Nếu ô content ĐÃ nằm trong 1 card (vd `GroupPressableCard` item = PressableCard) thì bỏ Card ngoài, chỉ giữ row avatar+title+desc (tránh card-in-card).

**Audit lens (`C-fixture`, STRICT):** (1) primitive có content-slot/children mà story demo bằng **bất cứ thứ gì KHÁC ProfileCard** (text trần / lorem / SectionCard ad-hoc / mock tự chế) → GAP `C-fixture` (**high** — MUST): "đổi mock sang ProfileCard chuẩn". (2) `isSkeleton` không mirror pattern ProfileCard (còn dot+vạch generic) → GAP med: "skeleton mirror avatar+title+desc". Bỏ qua CHỈ khi slot nhận shape CỐ ĐỊNH (không phải content tự do) hoặc primitive display-tĩnh.

## Chiều CÂY — compose xuống atom · tier · generic · font (⭐ thầy chốt 2026-07-23)
> **Gốc:** design-system là 1 CÂY phụ thuộc — mọi primitive lần xuống **ATOM leaf-most**, gốc đổi thì cả cây đổi ("đổi 1 = đổi hết"). **Nhánh cắt** = raw HeroUI/hand-roll vòng qua port → không nhận thay đổi atom → drift. Cây **ĐỆ QUY**: áp CẢ primitive→primitive (primitive cũng cấm tự vẽ lại cái primitive dưới đã sở hữu). Thước: canon `§4` · `§6a.1` · `§6c` · `§9`.

- **[C-compose] (high — CỐT LÕI):** primitive dùng **raw `@heroui/react` atom** (`<Button>`/`<Chip>`/`<Avatar>`/`<Input>`/`<Spinner>`) HAY **hand-roll markup** trong khi đã có PORT sở hữu hình đó (`Button`·`ButtonGroup`·`StatusChip`·`DotChip`·`UserAvatar`·`IconTile`·`ListRow`·`MetaRow`·`FieldShell`·`Skeleton.*`·`PressableCard`) = **NHÁNH CẮT** → GAP high "compose port thay raw/hand-roll". Gồm cả **hand-rolled skeleton** (animate-pulse / div xám / vạch tay) thay `Skeleton.*`. NGOẠI LỆ **borderline** (ghi, không ép): port opinions không khớp — +N count avatar · segmented HeroUI ButtonGroup (`.Separator`) · video transport controls · Button-cần-`href` (port chưa có). Neo: deep-scan 2026-07-23 (49 cut: Button 23 · StatusChip 12 · FieldShell 5…).
- **[C-generic] §6a.1 (high):** primitive "không phục vụ được" 1 call-site → hỏi 3 câu THEO THỨ TỰ: (1) năng lực thiếu có phải của **ATOM dưới** → thêm PROP cho atom (danger/pending/disabled → Button), **đừng nhồi lên cluster**; (2) primitive **opinionated quá tên/tier** → làm **GENERIC** đúng bản chất (ButtonGroup = `actions[]` agnostic, GIỮ tên), **đừng thêm ngữ nghĩa** (rename→ActionBar là SAI); (3) chỉ vai KHÁC HẲN mới đẻ mới. Compose theo TẦNG (ConfirmDialog→ButtonGroup→Button), không tự vẽ lại.
- **[C-skeleton-separate] §6b/§8 (high):** component `*Skeleton` RIÊNG (vd `CourseCardSkeleton`) = vi phạm → skeleton phải là prop `isSkeleton` trên chính card. GAP: "gộp/xoá component skeleton riêng, dùng isSkeleton".
- **[C-tier] §6c (retitle):** primitive = structure/**agnostic** (slot trơ children/rows) · block = **content-role** (value/title/cover/action map data). Card áp vai nội dung mà để `Primitives/*` → GAP "retitle Block/*". (Feedback=primitive · Code=block · ReadinessChecklist→block.)
- **[C-font] §9 (med):** chữ đi qua **Typography atom** + prop. GAP: `color="default"`/`text-foreground` trên Typography (THỪA — foreground = mặc định, bỏ) · `text-muted` className thay `color="muted"` · `font-medium` className thay `weight="medium"` · token SAI `text-muted-foreground`→muted, `text-default`→bỏ. className `text-*`/`font-*` **chỉ OK** trên element KHÔNG phải Typography (ép icon `[&_svg]`, element thô).

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
