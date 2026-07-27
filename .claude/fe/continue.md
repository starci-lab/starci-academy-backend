# TIẾP TỤC — Storybook design-system (chốt 2026-07-27)

> Đọc file này TRƯỚC khi làm tiếp. Nó ghi **đang ở đâu · còn nợ gì · sáu câu hỏi kiến trúc chưa
> chốt**. Canon là `.claude/fe/principles.md`; lane audit là
> `.claude/skills/starci-fe-screen-audit/SKILL.md`.
>
> **Repo:** FE `D:\Repositories\starci-academy` · BE `D:\Repositories\starci-academy-backend`,
> cùng branch `mtp`. Code design-system nằm ở `starci-academy/.storybook`.

---

## 1. Đang ở đâu

Screen **`CourseContents`** đã đi hết bốn trục của lane audit, mọi con số đo trên DOM thật:

| Phép đo | Trước | Sau |
|---|---|---|
| `_legacy` trong closure | 1 | **0** |
| `showAnatomy` rò xuống con có story riêng | 23 | **0** |
| Thẻ bố cục gõ tay (screen/block/design) | 14 | **0** |
| `storyId` gãy câm (ngoài `_legacy`) | 9 | **0** |
| Part phát ra mà không vào được cây | 7 | **0** |
| Icon `< size-5` thiếu `weight` (§5.0a) | 2 | **0** |
| Seam header→thẻ | 0px (`gap` rơi im lặng) | **32px** |
| Tiếng Việt trong 90 file closure | 333 chuỗi | **0** |

Cây cuối:

```
Container                     layout
  Stack.V.Page   gap-8        layout   ← tách VÙNG
    CourseBrief               block    → Page.Header
    Stack.V      gap-6        layout   ← nhịp giữa block
      CourseTeamGate          block    → Feedback.Callout
      TrialConversionStrip    block    → SurfaceCard ⊃ Stack.V ⊃ (Stack.H · Stack.H.PriceRow)
      ContinueLearning        block    → ContinueCard (design)
      LearnNudges             block    → SurfaceCard.List
      KeepGoingPath           block    → SurfaceCard.List
```

`tsc --noEmit` + `eslint .storybook/**/*.tsx` xanh.

### Luật mới đã vào canon
- **§4a** — cấm đổi thang cỡ đã ghim của atom để chữa hình ở MỘT chỗ.
- **§11a.1** — `anatPart` truyền xuống, `showAnatomy` KHÔNG; node có `storyId` là CỬA.
- **§13z** — "bố cục qua khung" áp từ tầng layout trở lên; atom viết flex tay là ĐÚNG.
- **Screen = tier thứ 5** — `AnatomyTier` thêm `screen`; cả 5 tầng cùng hình thức (Deps + Code).
- **Block nhận ENTITY** — `module={{index,name}}`, không `moduleTitle="Chương 2 · …"`.

---

## 2. SÁU CÂU HỎI KIẾN TRÚC — chờ thầy chốt

Đây là phần **chưa xong** của framework. Xếp theo mức nghiêm trọng.

### #1 · Cây "Deps" thực chất là cây DOM (lỗi phân loại ở lõi)
Panel dựng cây bằng leo tổ tiên `data-anat-part`. Nhưng **"nằm trong" ≠ "phụ thuộc vào"**.
Bằng chứng: `KeyValue.List` khai đúng vẫn **không hiện** vì Popover render qua portal ra ngoài
host; `Popover.Trigger`/`Popover.Content` hiện thành **anh em** dù logic lồng nhau.

- **(a)** đổi tên tab thành `Anatomy` — trung thực với thứ nó thật sự làm.
- **(b)** deps lấy từ **import tĩnh** (kiểm được bằng máy), DOM chỉ dùng vẽ cấu trúc.

→ Nghiêng **(b)**. Càng để lâu càng đắt vì mọi story đang khai theo mô hình cũ.

### #2 · Ngoại lệ của §11a.1 không kiểm được bằng máy
"Cha dựng rồi đặt vào slot của con thì vẫn khai" dựa trên test *"AI dựng ra node này?"* — chỉ
trả lời được bằng đọc JSX. Không scanner nào bắt được ⇒ sẽ trôi. Tệ hơn: nếu `List.Meta` mai tự
render chip của nó, sẽ có **hai node cùng tên `Chip.Base`** và không ai biết cái nào của ai.

### #3 · Panel gom node THEO TÊN — lỗi gốc, đang vá triệu chứng
`Stack.V.Page`, `Stack.V.Price`, `Stack.H.PriceRow` **không phải tên component** — là id bịa ra
để né va chạm. Panel nên gom theo **định danh phần tử**, không theo chuỗi tên.

### #4 · Ba cơ chế then chốt KHÔNG có gì cưỡng chế ⚠️ rẻ nhất, làm trước
| Cơ chế | Hiện trạng | Hỏng thì |
|---|---|---|
| `storyId` đúng | script trong scratchpad | link **gãy câm**, không lỗi build |
| atom không import khung (§13z) | chạy tay một lần | vòng lặp tier, không ai biết |
| `anatPart ?? (showAnatomy ? "X" : …)` | chép tay mỗi component | quên là khung **vô hình** |

Cả ba nên thành **eslint rule / test**. Cái thứ ba còn **lặp chuỗi tên ở hai nơi** (component và
story) — sai một chữ là câm.

### #5 · §4a và ca `baseline` là hai tiền lệ ngược nhau, canon chưa nói rõ
Đã **từ chối** hạ cỡ `Chip.Base` nhưng lại **thêm** `baseline` vào `LayoutAlign`. Phân biệt đúng
là *thêm giá trị vào union (additive, compiler bắt khai đủ)* vs *đổi giá trị đã ghim (mọi
call-site đổi hình)* — cần viết thành một câu trong §4a.

### #6 · `ContinueLearning` là block CHỈ để định dạng chuỗi
Nó không sở hữu chức năng nào — nhận số, ghép câu, chuyển xuống design. Nếu **mọi** design đều
cần một block bọc như vậy thì tầng block thành lớp bảo trì rỗng.

Câu hỏi thật: **prop của `ContinueCard` sai từ đầu?** Design nhận `meta: string[]` thì nó *buộc*
ai đó phải ghép chuỗi. Nếu design không có prop cám dỗ như vậy, có khi không cần block bọc.

---

## 3. Nợ kỹ thuật (không chặn, làm khi rảnh)

- **16 file ngoài closure còn tiếng Việt** — `Table` · `Form` · `ModalShell` · `Disclosure` ·
  `Section` · `ResizableRail` · `ChipButtonList`… (135 chuỗi). Chạy lại workflow
  `storybook-full-english`, chỉ đổi danh sách file.
- **`_legacy`** — 5 link Deps gãy + **378 leaf thiếu `code`**. 4 file story đã lỡ dịch sang tiếng
  Anh trước khi thầy bảo dừng, **chưa revert**.
- **`Container.gap` vô hiệu im lặng** khi không dùng slot `header`/`footer`. Sửa cho nó luôn
  `flex flex-col` sẽ đổi layout của MỌI consumer (§4a) ⇒ cần thầy quyết. Cách nhẹ: **bỏ hẳn prop
  `gap`** để không ai bị lừa.
- **`CourseBrief` nhận 5 scalar rời của cùng một thực thể** (`title`/`description`/`moduleCount`/
  `hours`/`learnerCount`). Gom thành `course={{…}}` theo tinh thần "truyền entity"? — chờ chốt.
- **Ranh giới tiếng Việt/Anh không kiểm được bằng máy**: copy sản phẩm (`"Tiếp tục"`,
  `"Chi tiết giá"`) bị trích trong prose tiếng Anh, scanner không phân biệt nổi. Nếu copy sản
  phẩm sống trong `demo-data.ts` riêng thì scanner mới sạch.

---

## 4. Cách làm tiếp

```bash
# 1. Storybook
cd D:/Repositories/starci-academy && npm run storybook   # :6006
```

- Audit một screen khác → `/starci-fe-screen-audit <Screen>`.
- **Đừng tin đọc mắt.** Mọi phát biểu "đã sạch" phải từ scanner hoặc số đo DOM.
  Bảng **8 bẫy đo đạc** (HMR ôi · console buffer · grep sót key có nháy · `[^}]*?` gãy vì `}` ·
  quét thiếu `_shared.tsx` · đếm cả comment · grep locale · portal) nằm cuối file SKILL.
- Scanner dùng lại được đang ở scratchpad phiên này; **nên đưa vào repo** (xem #4).
