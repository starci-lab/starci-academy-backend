# MÔI TRƯỜNG — repo · cổng · máy · bẫy

> Ô thứ tư của canon. Ba ô kia trả lời *đúng/sai* (`principles/`), *làm việc thế nào*
> (`discipline/`), *thứ tự* (skill). Ô này trả lời **chạy ở đâu, bằng lệnh gì, máy này hay
> gãy chỗ nào** — thứ không thuộc trục thiết kế nào cả.
>
> Dựng 2026-07-29 vì nó **chưa từng có nhà**: bốn skill mỗi cái tự chép một bản, và cả bốn
> bản đều ghi sai đường dẫn repo suốt nhiều phiên. Một dữ kiện không có nhà là một dữ kiện
> sẽ được chép lại ở mọi nơi cần nó, rồi lệch.

---

## 1. Repo

| | Đường dẫn |
|---|---|
| **FE (design-system)** | `D:/Repositories/starci-academy` — cây làm việc ở `.storybook/` |
| **Canon (repo này)** | `D:/Repositories/starci-academy-backend/.claude/fe/` |
| Branch | `mtp` — **cả hai repo** |

⚠️ **`C:/Repositories/starci-academy` là đường dẫn CHẾT.** Trên máy này nó chỉ còn `.git`,
không có source. Mọi tài liệu cũ trỏ `C:` đều lạc hậu; đo lại 2026-07-29.

Cả hai repo có **nhiều phiên cùng ghi**. Trước khi ghi canon: `git fetch origin mtp` rồi
`git log HEAD..origin/mtp --oneline`. Chi tiết ở [`discipline/multi-session-git.md`](../discipline/multi-session-git.md).

---

## 2. Mười cổng SỐNG

Chạy từ repo FE. Phải xanh hết trước khi báo xong — không bỏ cổng nào vì "tưởng không liên quan".

```bash
node scripts/check-no-namespace.mjs && node scripts/check-story-ids.mjs && node scripts/check-seams.mjs && node scripts/check-inline-types.mjs && node scripts/check-padding.mjs && node scripts/check-one-instance-per-state.mjs && node scripts/check-member-as-state.mjs && node scripts/check-orphan-parts.mjs && node scripts/check-passthrough-block.mjs && node scripts/check-deps-coverage.mjs
```

| Cổng | Giữ luật gì |
|---|---|
| `check-seams` | bố cục gõ tay từ tầng frame lên · `gap` phải vào khung tự sở hữu nhịp · off-scale |
| `check-padding` | padding lệch thang · margin của con |
| `check-story-ids` | `storyId` trỏ story thật — sai thì **gãy câm**, không lỗi build |
| `check-inline-types` | hình dữ liệu không tên trong prop/generic/param |
| `check-one-instance-per-state` | một state một instance; mảng `.map` chứa CHUỖI ⇒ union dump phải tách |
| `check-no-namespace` | cấm `Object.assign` / `export const X = { … }` gom biến thể |
| `check-member-as-state` | state phải là ĐIỀU KIỆN DỮ LIỆU, không phải tên member |
| `check-orphan-parts` | có `data-anat-part` mà không khai trong cây |
| `check-passthrough-block` | block bọc đúng một con mà không thêm quyết định hay câu chữ |
| `check-deps-coverage` | component compose cái khác mà Deps tab không khai |

Kèm: `npx tsc --noEmit` sạch · `npx eslint .storybook` 0 error.

### Cổng thứ 11 đang CHẾT — đừng chạy, đừng sửa cho xanh

`check-story-coverage.mjs` so `src/components/blocks` với `.storybook/stories/blocks`, tức đòi
**bản vẽ phải soi gương công trình** — đúng cái [`rules/0-boundary.md`](rules/0-boundary.md) đã
bãi bỏ. Đo 2026-07-29: thiếu 162/162, luôn đỏ nên không mang tin gì. Xử nó (sửa phạm vi hay xoá)
phải hỏi thầy, không quyết trong một lượt dựng màn.

### Cổng cũng nói dối được

Cổng ghim regex theo **cú pháp cũ** thì đổi từ vựng làm nó đi câm mà vẫn báo xanh. Neo:
`gap-into-frame` ghim `gap=\{(\d+)\}`, ngày thang đổi sang chữ thì nó xanh trong khi không kiểm gì.
Đổi từ vựng một prop ⇒ soi lại mọi cổng nhắc tên prop đó, và mỗi cổng chỉ tin sau **negative
control**: cắm lỗi giả, thấy đỏ, gỡ ra.

⚠️ Đang nợ một ca thật: `check-deps-coverage.mjs` còn ghim `TIERS = [… "designs", "screens" …]`
— hai tên đã chết — và **thiếu hẳn** `layouts`/`overlays`/`pages`. Component ở ba tầng đó không
khai Deps thì cổng im lặng bỏ qua.

---

## 3. Storybook

```bash
npm run storybook        # cổng 6006
```

Hoặc `preview_start` tên `storybook` (đã cấu hình trong `.claude/launch.json` cùng
`principles` cổng 8083 và `decompose-proto` cổng 8081).

**Restart sau khi THÊM/XOÁ/ĐỔI TÊN file story** — watcher Windows kẹt, sửa nội dung thì HMR chạy
nhưng thêm story mới thì index không cập nhật. `preview_stop` → `preview_start`, xác nhận bằng:

```bash
curl -s http://localhost:6006/index.json
```

Cổng 6006 bị chiếm thì **kill rồi chạy lại**, đừng né sang cổng khác (thầy chốt 2026-07-29):
tìm PID bằng `Get-NetTCPConnection -LocalPort 6006`, xác minh là `node.exe`, `Stop-Process -Force`.

**`storyId` phải TRA `index.json`, cấm đoán theo title.** Id thật có tên thư mục lặp
(`frames-cluster-cluster-base--gaps`), và kebab không như trực giác (`Link.SeeMore` →
`link-seemore`, không phải `link-see-more`).

---

## 4. Bốn bẫy của máy này

| Bẫy | Triệu chứng | Xử |
|---|---|---|
| **Storybook không boot** | native `.node` của `oxc-resolver` bị Smart App Control chặn | `npm install @oxc-resolver/binding-wasm32-wasi@11.24.2 --no-save --force --ignore-scripts`. 🚫 ĐỪNG set `NAPI_RS_FORCE_WASI=true` — nó global, kéo `@swc/core` sang WASI và vỡ. `npm ci` xoá binding này, cài lại khi cần |
| **HMR ôi trên tab CŨ** | kill + restart server rồi mà tab vẫn báo lỗi khớp code TRƯỚC khi sửa; lỗi trỏ `*.hot-update.js` | **mở tab MỚI**, đừng navigate lại tab cũ — chunk cache theo tên file vẫn được phục vụ. Nặng thì xoá `node_modules/.cache/storybook` |
| **Browser pane không hiện** | `screenshot` timeout *"pane is not displayed"*; `getBoundingClientRect` trả 0 cho MỌI phần tử, trông y hệt bug render | kiểm `document.hidden` + `window.innerWidth` TRƯỚC khi tin bất kỳ số đo bất thường nào. `resize_window` vẫn ép được kích thước thật dù screenshot gãy |
| **Codemod regex mù ngữ cảnh** | cùng một chuỗi sống ở BA chỗ trong một file — JSX attribute (thay được) · chuỗi prose (để yên) · JSX bên trong một chuỗi (phải escape) | chạy `--dry` trước, xong đọc `tsc` **rồi đọc DIFF**. Đã cắn hai vòng liên tiếp (`gap` rồi `padding`) |

---

## 5. Đừng lái browser để soi mắt

Ở bước verify: **đo DOM thì được** (`getComputedStyle`, `getBoundingClientRect`), nhưng đừng
lái Storybook qua Browser pane để nhìn — chậm và hay treo. Báo thầy tự xem; `preview_logs` đủ
để xác nhận build không lỗi.

Và số đo mới là bằng chứng, không phải con mắt: lỗi tầng layout **không làm vỡ `tsc`** — class
Tailwind sai tên thì im lặng không sinh CSS. Neo 2026-07-29: `Container` có bug `@container`
đặt cùng chỗ với padding nên breakpoint **không bao giờ fire**, mà `tsc` + cả 10 cổng + eslint
đều xanh.
