# S3 — Audit fan-out (1 workflow, PORT-only)

1 workflow · `parallel` mỗi primitive 1 agent **Sonnet** chấm 10 chiều canon → schema gaps structured. Synth ở S4.

## Ràng cho MỖI agent (nhồi vào prompt)
- **PORT-ONLY:** đọc `.storybook/stories/blocks/**/<Name>/<Name>.tsx` (port) + `*.stories.tsx`. **NẾU port đã compose đúng mà `src` hand-roll → NỢ-SYNC, KHÔNG flag.** Fallback đọc `src` CHỈ khi không có port.
- **Bỏ check không áp dụng** (Logo/Media tĩnh → bỏ size/skeleton/icon). Chỉ liệt kê GAP thực.
- Neo `file:line`. severity: high (sai lõi: hand-roll thay compose, anatomy union, consumer set size, nên-là-prop mà tách component) · med (thiếu size/isSkeleton) · low (spacing lệch 1 nấc).

## CANON (embed vào prompt agent)
```
[G §6] Component này nên là 1 PROP của foundational (Button…) thay vì riêng? (fold-into-prop)
[C-props] Vai qua slot/prop CÓ TÊN; shape khác → variant/scenario tường minh (không emerge).
[C-chip-no-icon] (STRICT §2) Chip = TEXT-ONLY, KHÔNG leading glyph/logo icon (kể cả brand logo Vimeo/YouTube). Chip có prop/render `icon`/logo = GAP high (gỡ, dùng chữ). NGOẠI LỆ: dot color-indicator (DotChip family) — tín hiệu màu size-3, không phải icon.
[C-size] Có prop `size` nếu kích thước biến thiên (button/chip/avatar…). Display tĩnh → N/A.
[C-skeleton] (MUST §8) MỌI primitive hiển-thị PHẢI có prop `isSkeleton` tự render skeleton MIRROR đúng hình (chip→Skeleton.Chip/dot+bar/N-chip; card→frame+content skeleton). THIẾU isSkeleton = GAP high (không chỉ med). Không để consumer dựng Skeleton rời.
[C-responsive] Xử lý bề rộng hẹp (stack/wrap/@app-sm). Áp cho layout ngang.
[§4-own] Tự ép sizing/style nội bộ (`[&_svg]:size-*`); consumer truyền children TRẦN.
[§5-icon] Icon-size theo TEXT-size (xs→4·sm→5·base→6). CARET/CHEVRON điều hướng = size-3 CỐ ĐỊNH + phosphor CaretRightIcon + muted. Interaction: CHỈ arrow (→) trượt hover (translate-x-1); CARET KHÔNG trượt (caret có translate-x = GAP). Icon lib mặc định @phosphor-icons/react (gravity đã bỏ, quá đậm). Rotate/refresh spin; chevron mở/đóng rotate-180.
[C-anatomy] Anatomy MỖI leaf chỉ kể part leaf đó (nếu blockShell). Loaded KHÔNG kể Skeleton/Error.
[C-cluster] Cụm ≥2 element đồng-vai → 1 GROUP primitive (ButtonGroup…), không itemize rời.
[C-spacing] gap/padding thang `0·2·3·6·8`; card `p-3`; cấm ngoài thang (1/1.5/4/5/7/9).
[C-fixture] Story demo ô "content" (slot/children nhận NODE tự do) phải đổ mock = ProfileCard (Card + avatar + title + description), neo AsyncContent.stories.tsx; text trần/lorem/ad-hoc = GAP med. Bỏ qua nếu slot nhận shape CỐ ĐỊNH hoặc primitive display-tĩnh.
[C-fixture-skeleton] isSkeleton của primitive phải MIRROR pattern ProfileCard: Skeleton.Avatar md + Skeleton.Typography body-sm 1/3 + body-xs 2/3 (khớp content avatar+title+desc). Còn dot+vạch generic = GAP med. ProfileCard là HÌNH DẠNG mock-content dùng inline, KHÔNG đẻ story "ProfileCards" riêng để trưng.
[C-press] (§7 STRICT) CARD/TILE bấm được phải compose PressableCard HAY adopt contract (native button/a + active:scale-[0.97] + transition-[scale] + NO hover:bg-* + disabled-inert + ripple). GAP high nếu: <div cursor-pointer> (còn hỏng a11y), card bọc <a>/<button> TRẦN thiếu scale, hover:bg-* trên card. ROW (list-row/nav-section: SurfaceListCardItem/NestedCardSection/ListRow) ≠ card → KHÔNG flag thiếu scale; row chỉ cần native button/a (a11y) + hover-affordance OK.
[C-compose] (§4/§6a — CỐT LÕI, high) CÂY phụ thuộc: primitive dùng raw @heroui atom (<Button>/<Chip>/<Avatar>/<Input>/<Spinner>) HAY hand-roll markup trong khi đã có PORT sở hữu hình đó (Button·ButtonGroup·StatusChip·DotChip·UserAvatar·IconTile·ListRow·MetaRow·FieldShell·Skeleton.*·PressableCard) = NHÁNH CẮT → GAP high "compose port". Gồm hand-rolled skeleton (animate-pulse/div xám) thay Skeleton.*. Đệ quy: primitive→primitive cũng chấm. Borderline (ghi, không ép): +N avatar · segmented HeroUI ButtonGroup(.Separator) · video controls · Button-cần-href.
[C-generic] (§6a.1, high) primitive không phục vụ 1 call-site → 3 câu: (1) năng lực thiếu của ATOM dưới → prop cho atom (danger/pending→Button), đừng nhồi cluster; (2) opinionated quá tên/tier → làm GENERIC (actions[] agnostic, GIỮ tên), đừng thêm semantic (rename→ActionBar SAI); (3) chỉ vai khác hẳn mới đẻ mới. Compose theo TẦNG, không tự vẽ lại.
[C-skeleton-separate] (§6b/§8, high) component *Skeleton RIÊNG (CourseCardSkeleton…) = vi phạm → skeleton phải là prop isSkeleton trên chính card. GAP: gộp/xoá.
[C-tier] (§6c, retitle) primitive = structure/agnostic (slot trơ) · block = content-role (value/title/cover/action). Card áp vai nội dung để Primitives/* = GAP retitle Block/*.
[C-font] (§9, med) chữ qua Typography atom + prop. GAP: color="default"/text-foreground trên Typography (thừa, foreground=mặc định) · text-muted className thay color="muted" · font-medium className thay weight="medium" · token sai text-muted-foreground/text-default. className text-*/font-* chỉ OK trên element KHÔNG phải Typography.
```
> ⛔ KHÔNG chấm "thiếu nCn test".

## Script (neo bản đã chạy `audit-primitives-buttongroup-canon`)
```js
const prims = Array.isArray(args) ? args : JSON.parse(args)
const SCHEMA = { type:'object', properties:{ primitive:{type:'string'},
  gaps:{type:'array', items:{type:'object', properties:{check:{type:'string'}, severity:{type:'string',enum:['high','med','low']}, note:{type:'string'}}, required:['check','severity','note']}},
  summary:{type:'string'} }, required:['primitive','gaps','summary'] }
const results = await parallel(prims.map(p => () => agent(
  `Audit PORT-only primitive "${p}" (component=${p.split('/')[1]}) theo CANON… neo file:line, bỏ check N/A.`,
  { label:`audit:${p}`, phase:'Audit', schema:SCHEMA, model:'sonnet', effort:'medium' })))
```
`parallel` cap 16 concurrent — 99 primitive chạy ~7 batch, ổn. Model Sonnet (rẻ ×N).
