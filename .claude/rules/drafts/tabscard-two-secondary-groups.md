# Draft — Toolbar 2 nhóm tab = block `TabsCard`, cả 2 secondary, không primary (2026-06-19)

- File/§ đích khi `/merge`: `starci-ui.rules` (catalog block) + element tabs/navigation.
- Bối cảnh: reader bài học cần "tab Nội dung/Thử thách" TRÁI + "switcher ngôn ngữ TS/Java/C#/Go" PHẢI trên **cùng 1 hàng**.
  Trước đó lai 2 kiểu (tab secondary + pill) trông như 2 tầng / 2 phong cách.

## Luật (STRICT)
- **Một hàng toolbar có 2 nhóm tab → dùng block `TabsCard` (`blocks/navigation/TabsCard`)**, KHÔNG tự ghép Tabs/pill lẻ trong feature.
  - API: `<TabsCard leftTabs={group} rightTabs={group?} />`, mỗi `group` = **data JSON**
    `{ items: [{key,label,icon?,isDisabled?,muted?}], selectedKey, ariaLabel, onSelectionChange }`.
  - Feature CHỈ truyền data + `onSelectionChange` (đọc store/dispatch ở feature), block owns toàn bộ style.
- **Cả 2 nhóm đều secondary (underline), KHÔNG primary.** Hai bên cùng "da" → đọc như 1 tầng nav, không cái nào loud hơn.
  Block bake sẵn `data-[selected]:border-b-2 border-accent text-accent` (vì `.extended-tabs` global chỉ bỏ baseline, KHÔNG tự gạch chân).
- **Khoảng cách 2 nhóm = `justify-between` + `gap-3`** (rhythm 3 chuẩn, CẤM `gap-1.5`). Icon+label trong 1 tab = `gap-2`.
- **Tách vai đúng semantic** (ref tabs-vs-segmented): nhóm TRÁI = đổi nội dung; nhóm PHẢI (ngôn ngữ) = cùng nội dung đổi cách trình bày.
  Dù về data đều là "tab group", trình bày gộp 1 toolbar thay vì 2 tầng (tránh "multiple tab levels").
- **Chrome riêng của trang (full-width `border-b` + cap `max-w-3xl`) nằm ở WRAPPER feature** (vd `ContentTabBar`), KHÔNG nhồi vào `TabsCard`
  → block tái dùng được ở context khác. `.extended-tabs` cố tình không có baseline để wrapper sở hữu divider edge-to-edge.
- Ref bố cục: GitHub file header / shadcn preview (tab trái + control phải 1 bar); switcher ngôn ngữ: Stripe/Mintlify (global + persistent).
