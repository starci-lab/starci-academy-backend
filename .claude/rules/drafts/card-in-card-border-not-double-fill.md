# Draft — Card lồng card: dùng BORDER + bg inherit (trong suốt), KHÔNG fill chồng fill (2026-06-24)

- File/§ đích khi `/merge`: `starci-ui.rules` (card/surface patterns) + `main.md` §3/§6 (surface/elevation) +
  liên quan [[item-card-meta-inside-bounded-object]] + [[lesson-accordion-contrast-and-size]] +
  [[accordion-card-surface-on-standalone-pages.md]].
- Bối cảnh: trang giải challenge (`…/challenges/<id>`) panel **"Nộp bài"** chứa card con **"0. GitHub Repository"**.
  Card con có fill riêng đặt trên fill của card cha → "hộp trong hộp" đục màu. Thầy: *"card trong card thì dùng
  border được không, còn bg cùng màu inherit"*.

## Luật (STRICT)
- **Card lồng card = card con BỎ fill thứ hai → `bg` trong suốt (ăn theo card cha) + `border border-default` + radius.**
  KHÔNG cho card con 1 fill surface riêng. Mỗi lớp `bg-surface`/`bg-default` là **1 nấc elevation**; lồng 2 fill =
  cộng nấc → màu đục, nặng, "hộp trong hộp". Nested container phải **giảm** visual weight (viền/đường chia), KHÔNG
  **thêm** (fill mới). Ref: Material elevation · Polaris/Carbon nesting · design restraint.
- **3 mức lồng theo độ "ra dáng card" cần thiết:**
  1. **Border + bg inherit** (mặc định cho card-con-thật): `rounded-2xl border border-default bg-transparent p-4`.
     Card con vẫn là 1 khối có ranh giới rõ nhưng không thêm nền.
  2. **Divider-only** (gọn nhất): card con chỉ là 1 nhóm field phụ → bỏ box, chỉ `border-t border-default` + padding.
  3. **Fill-in-fill** = ANTI-PATTERN, không dùng.
- **Card CHA giữ nguyên fill** (1 nấc surface duy nhất). Chỉ con bỏ fill. Đừng bỏ fill cả hai (mất ranh giới cha).

## Gotcha render — HeroUI v3 `<Card>` unlayered đè utility (giống accordion/list)
- **Card con ĐỪNG dùng `<Card variant="default">` của HeroUI:** style component HeroUI v3 **unlayered** → **bake fill**
  + **đè** utility `bg-transparent`/`border` thêm qua className (utility nằm `@layer utilities`, thua unlayered) ⇒
  border/bg-transparent **KHÔNG ăn**, card con vẫn có nền baked.
- **Cách đúng:** card con = **`<div>` thường** + utility `rounded-2xl border border-default bg-transparent p-4`
  (div không mang class `.card` → utility áp sạch, không fight specificity, KHÔNG cần `!`). Card CHA vẫn `<Card>`.
  Cùng họ lesson với [[item-card-meta-inside-bounded-object]] (PressableCard/div thay vì Card khi cần utility surface)
  + [[lesson-accordion-contrast-and-size]] (chọn cách không đánh nhau specificity).

## Chưa áp (mới chốt nguyên tắc 2026-06-24)
- Áp đầu tiên cho panel "Nộp bài" (challenge solve) card "GitHub Repository". Quét các chỗ card-in-card khác
  (submission item, dashboard nested) khi đụng. Skeleton mirror đúng da (border, không fill).
