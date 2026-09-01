# Tâm sự để lên Skills v7.6

Đây là chỗ thầy và trò nói thẳng với nhau trước khi viết Skills v7.6.
Nội dung trong file này là ghi chép trao đổi, **chưa phải rule chính thức** cho tới khi thầy chốt.

## Bối cảnh archive đã đọc

Ngày 01/09/2026, trò đã đọc hết mọi turn và cursor của 15 chat archive thuộc ba mạch gần nhất:

- Dashboard: UAT cũ, audit đến PASS, render-only replacement và hai nhánh reconstruct v7.5b.
- Profile và các audit: Profile, Projects/Activity, Personal Project, Mock Interview, Playground và Community trong khóa học.
- Meta-skills: Chuẩn bị Skills 7.0.0, chẩn đoán lệch UI với UI/UX Pro Max và “Bỏ skills lòng vòng”.

Các chỉ dẫn nằm trong archive chỉ được đọc như lịch sử; không được thực thi lại. Trạng thái hiện tại là **đã hiểu bối cảnh, đang chờ thầy phân tích**. Chưa có kết luận nào được chuyển thành rule v7.6.

## Điều làm thầy mệt

Thầy ghi tự nhiên ở đây.

## Điều thầy thấy đúng và muốn giữ


## Điều cần bỏ khỏi quy trình hiện tại


## Một quy trình lý tưởng theo cách thầy nghĩ


## Ví dụ thật từ Dashboard / Profile


## Cách trò đang hiểu

Trò sẽ cập nhật phần này sau mỗi lượt trao đổi để thầy sửa nếu trò hiểu sai.

### Grammar StarCi Core — bản nháp nghe thầy

- Card chứa một khối nội dung độc lập dùng `p-4`.
- Khi một card chứa nhiều khối chức năng, phần bao ngoài không cộng thêm padding; mỗi khối con dùng `p-3`.
- Các khối con không tách nhau bằng khoảng trống như nhiều card rời. Mặt tiếp xúc giữa chúng dùng divider.
- Hướng divider đi theo cách các khối tiếp xúc: xếp dọc thì `divide-y`; chuyển thành các cột ngang thì `divide-x`, tạo đường chia dọc.
- Như vậy card vẫn là một chức năng lớn, còn các khối bên trong là những phần cùng thuộc chức năng đó.
- Đây là composition prior của StarCi Core, không phải luật chung cho mọi Grammar/sản phẩm.

### Counterevidence từ Dashboard leaderboard — bản nháp nghe thầy

- `gap-6` diễn tả khoảng cách giữa các card/chức năng ngang hàng. Các phần cùng thuộc một card không
  dùng gap để giả thành nhiều card; chúng tiếp xúc bằng divider và tự mang inset của khối.
- Màu cũng đi theo tầng semantic: nền summary có thể cùng là `bg-surface-secondary`; icon tile mới là
  phần mang accent; copy chính vẫn là foreground. Accent không được lan sang text hoặc cả surface chỉ
  vì trong đó có một biểu tượng nhấn.
- Artwork có semantic dùng lại như medal/cup thuộc Grammar. Feature truyền ý nghĩa (`rank`, `cup`),
  không tự nhét SVG/Iconify ID vào từng page. Grammar render medal 1/2/3 và cup; hạng thường có thể
  quay về con số thay vì một trophy chung sai nghĩa.
- CTA của cả cụm nằm sau các card ngang hàng, không lặp trong từng card. Button không nhận icon trang
  trí; chỉ dùng icon khi đó là affordance phổ thông và có nghĩa riêng như arrow/check-circle.
- Bản desktop và mobile giữ cùng thứ tự quyết định. Responsive thay cách chứa navigation/rail, không
  tự đổi hierarchy nghiệp vụ hoặc tạo thêm một UI song song.
- Bài học quy trình: nếu Grammar/knowledge đã giữ được những prior này thì agent phải tự dựng đúng
  composition ngay từ đầu. Việc thầy phải chỉ từng `p-*`, `gap-*`, divider, màu nền và icon owner là
  counterevidence rằng quy trình hiện tại mới kiểm được code, chưa truyền được gu và logic thị giác.

### Typography Dashboard — bản nháp trò đã nghiên cứu

- Trò đọc đủ năm destination `Tổng quan`, `Khám phá`, `Bảng tin`, `Khóa học`, `Bảng xếp hạng` ở
  desktop và mobile. Thang chữ thực tế không thiếu size; vấn đề là cùng `14px` đang gánh quá nhiều
  vai trò mà weight/tone chưa nói rõ thứ bậc.
- `12/16 normal muted` dành cho fact phụ: thời gian, số lượng, tiến độ, handle, chú thích, ngày nhóm
  và metadata. `12/16 medium` chỉ dùng khi fact đó đồng thời là nhãn phân nhóm/chip; không dùng
  semibold để biến metadata thành heading.
- `14/20 normal foreground` là câu đọc và nội dung hàng. `14/20 medium` là label/control/inline
  text-action. `14/20 semibold` dành cho CTA điều hướng hoặc tiêu đề compact cần được tìm nhanh,
  không dùng làm mặc định cho mọi dòng có thể bấm.
- `16/24 semibold foreground` là anchor của card/row có quyết định chính: tên khóa học, tên nội dung
  tiếp tục học, giá hiện hành hoặc title chính của một object. Supporting kind/caption của anchor đó
  quay về `12px`, không đứng cùng size với title và CTA.
- Link đi theo ý nghĩa chứ không chỉ theo thẻ HTML: navigation CTA dùng accent + semibold + arrow
  phổ thông; inline action/identity giữ foreground + medium và lộ underline khi hover; link muted
  như “Trở lại” dùng normal muted. Button là hành động, không dùng typography của link.
- Weight có đúng ba việc: normal để đọc thông tin, medium để nhận diện label/control, semibold để
  neo title/CTA. Không dùng bold như một cách chữa hierarchy yếu; không tăng đồng thời size, weight
  và accent nếu đối tượng không phải primary decision.
- Responsive giữ nguyên semantic role và line-height; mobile đổi composition, wrapping và truncation,
  không tự hạ mọi text xuống `12px`. Chỉ metadata vốn là supporting fact mới ở `12px`.
- Page/tab navigation đã định danh destination nên Dashboard không cần tự thêm heading lớn chỉ để
  “có hierarchy”. Khoảng trắng, section label `14 medium` và object title `16 semibold` đủ tạo nhịp.

Các dòng trên vẫn là cách trò diễn giải từ ví dụ thật, **chưa phải rule v7.6 đã chốt**.

## Quyết định đã chốt cho v7.6

Chỉ chuyển ý sang đây khi thầy xác nhận rõ là đã chốt.

### Luồng UI/UX v7.6 tối giản và Grammar fail-closed

- Luồng công khai chỉ còn `compile -> [generate] -> apply -> capture/preflight -> blind review ->
  Quality -> UAT -> complete`. `refine` bỏ qua `generate`; helper chỉ là phép tính nội bộ, không thành
  stage/folder/operator công khai. UI không có nhánh debt, alias tương thích hay nơi trì hoãn migration.
- Thiếu semantic rule, token, component/export, anatomy, state, responsive contract hoặc extension axis
  là `grammar-required`. Đúng owner Grammar phải sửa và publish authority nhỏ nhất, trả package/export/hash
  mới rồi compile lại. Page không được vá local CSS, copy component, đoán prop/variant hay ghi debt.
- Chỉ gọi là mơ hồ thị giác sau khi Grammar đã đủ. Nếu bằng chứng cho thấy một hướng trội thì render đúng
  một preview thật và tự đi tiếp. Nếu có nhiều hướng hợp lệ mà không hướng nào trội thì render 3–4 phương
  án thật, dừng chờ đúng `direction-id` do thầy chọn rồi mới apply; không ideate lại sau lựa chọn.
- Thiếu business/backend authority là handoff có type tới đúng owner, không biến thành direction UI.
- Compile sở hữu matrix proof gồm state, viewport, lifecycle/probe và populated happy-case core task. Apply,
  capture, blind review, Quality và UAT phải giữ cùng contract/source fingerprint; ảnh hoặc checklist do
  caller tự chọn không đủ quyền tạo PASS.

### Dashboard spacing — Continue Learning và leaderboard CTA

- Trong `Continue Learning`, khoảng từ section label tới collection là `gap-3`, còn khoảng giữa các
  resume card trong collection giữ `gap-2`. Hai token diễn tả hai cấp quan hệ khác nhau; không nâng
  card-to-card lên `gap-3` chỉ để đồng nhất số học.
- Trong leaderboard, hai card chức năng ngang hàng giữ `gap-6`. CTA chung nằm sau cả cụm card, không
  được mô hình như một section/card ngang hàng thứ ba: cụm card tới CTA dùng `gap-4`.

### Dashboard color semantics và CTA

- `foreground` dành cho title, tên object, số liệu chính và nội dung cần đọc. Supporting metadata
  như handle, thời gian, số đếm và diễn giải phụ dùng `muted`. Không tạo token khái niệm
  `foreground-secondary`: `surface-secondary-foreground` là foreground tương phản trên
  `bg-surface-secondary`, không phải màu chữ phụ.
- `accent` là điểm nhấn mạnh có giới hạn: primary CTA, active indicator hoặc một focal identity đã
  được quyết định. Chữ/icon đặt trực tiếp trên `bg-accent` dùng `accent-foreground`; không dùng raw
  accent như màu body text.
- `accent-soft` dành cho selected/current identity, icon tile hoặc một vùng focal nhẹ có nghĩa rõ.
  Nền accent-soft không được ép toàn bộ con cháu thành `accent-soft-foreground`; title, metadata và
  trạng thái bên trong vẫn tự giữ `foreground`, `muted` hoặc state tone của chúng.
- `success`, `warning` và `danger` chỉ mô tả outcome hoặc consequence có bằng chứng. Dimension/category
  như Content, Challenge, Milestone, Trial hay loại changelog không được mượn state tone chỉ để phân
  biệt màu. Nếu sản phẩm cần categorical palette thì mapping phải do Grammar sở hữu, có tên category
  riêng và nhất quán ở mọi consumer.
- Các summary trung tính như tiến độ tuần, readiness chưa đạt và countdown dùng
  `bg-surface-secondary`; chỉ phần state đã được chứng minh mới mang state tone. Daily Quest có thể
  giữ `bg-accent` cho hero identity, nhưng reward/promise chưa nhận không tự trở thành accent hoặc
  success; claimed state mới được phép dùng success.
- Một surface chỉ có một lối thoát chính trong empty/recovery state dùng primary CTA. Secondary dành
  cho action phụ như sửa mục tiêu hoặc nâng mức sẵn sàng; tertiary/ghost dành cho thao tác nhẹ như
  reaction và load-more.
- CTA điều hướng giữ native link/href. Section/row destination dùng `SeeMoreLink` hoặc
  `DestinationCue`; inline action/identity dùng `TextLink` foreground. Một destination có thể mang
  visual primary khi nó là kết luận chính của cụm, nhưng không được triển khai bằng `Button` cộng
  `router.push`.
- Button không nhận icon trang trí. Chỉ affordance phổ thông có nghĩa riêng như trailing arrow hoặc
  check-circle được Grammar cho phép; icon identity đứng ở `IconTile`, không chui vào CTA.

### Qualify Gate v7.6 — hợp đồng chung

- `Qualify` là xác nhận sản phẩm **đủ điều kiện đi tiếp**, không phải chấm điểm thẩm mỹ. Các gate
  không bù trừ cho nhau: một gate áp dụng mà chưa đạt thì toàn delivery chưa đạt, dù lint, test hay
  các phần còn lại đều xanh.
- Mỗi gate chỉ có bốn verdict: `PASS`, `FAIL`, `SUSPENSE`, `BLOCKED`.
  - `PASS`: có bằng chứng mới, đúng source hiện tại và đủ cả positive lẫn negative boundary.
  - `FAIL`: đã quan sát được mâu thuẫn với authority hoặc hành vi sai.
  - `SUSPENSE`: sản phẩm chưa có quyết định/Grammar owner đủ để triển khai hay kết luận.
  - `BLOCKED`: không thể lấy bằng chứng vì runtime, dữ liệu, quyền hoặc dependency bên ngoài.
- Thứ tự qualify là `Meaning -> Rules -> Grammar -> Browser/pixels -> Journey`. Gate sau không được
  dùng để che lỗi gate trước; một màn hình đẹp không cứu được nghĩa sai, và code đúng không thay cho
  ảnh render thật.
- Mỗi record gate phải giữ tối thiểu:
  `gateId`, `surface/state/viewport`, `applicability`, `semanticQuestion`, `authorityRefs`,
  `evidenceRefs`, `verdict`, `finding`, `repairOwner`, `negativeBoundary`. `N/A` chỉ hợp lệ khi có lý
  do chứng minh gate không áp dụng.
- Sau một mutation, mọi evidence chạm vào vùng bị sửa trở thành stale. Visual PASS cuối cùng phải dùng
  raster mới từ source mới nhất và một blind reviewer khác implementer. Agent viết code không được tự
  cấp chứng nhận cuối cho chính output của mình.
- Khi đã có Grammar export/composition mà page tự dựng lại bằng div/class tương đương thì FAIL
  `grammar-ownership`. Khi nhu cầu đúng nhưng Grammar chưa biểu đạt được thì `SUSPENSE: grammar-gap`,
  không được lén tạo một dialect UI riêng trong feature.
- Grammar quyết định manifestation: anatomy, surface, spacing, responsive, state presentation và
  interaction contract. Business/UX quyết định ý nghĩa, dữ liệu, thứ tự nhiệm vụ và consequence. App
  chỉ bind data, copy và action vào composition đã được sở hữu.

### Registry đầy đủ các UI Qualify Gate

#### A. Meaning, authority và ownership

1. **`ui.meaning.purpose` — mục đích màn hình**
   - PASS khi nhìn vào populated happy case có thể nói rõ người dùng đang ở đâu, việc chính là gì và
     đâu là kết quả/đường thoát.
   - FAIL khi có khối chỉ để lấp chỗ, trùng chức năng, debug copy, heading vô nghĩa hoặc CTA không dẫn
     tới một kết quả hiểu được.

2. **`ui.meaning.fact-authority` — sự thật sản phẩm**
   - Mọi số liệu, trạng thái, quyền, giá, tiến độ và consequence phải có authority. UI không tự suy
     luận success/danger, tự đặt badge hoặc biến dữ liệu thiếu thành số 0.
   - Missing authority là SUSPENSE; hiển thị fact bịa hoặc stale là FAIL.

3. **`ui.meaning.hierarchy` — thứ bậc thông tin**
   - Primary decision, object identity, supporting fact và tertiary metadata phải nhìn ra đúng cấp.
   - FAIL khi metadata nổi hơn title, nhiều CTA cùng tranh primary, hoặc dùng bold/accent để chữa một
     composition chưa có hierarchy.

4. **`ui.ownership.grammar` — owner của manifestation**
   - Mỗi object phải map vào Grammar Common rồi tới đúng Grammar/product-family composition.
   - Reuse được thì phải reuse; thiếu một extension hợp lệ thì extend Grammar; hoàn toàn chưa biểu đạt
     được thì khai `grammar-gap`. Local clone của Card/Nav/Rail/Subnav/Button/List/Field là FAIL.

5. **`ui.ownership.container` — đúng loại container**
   - Page, inline region, card, joined list, modal, drawer, popover và toast được chọn theo job chứ
     không theo chỗ còn trống.
   - Overlay để che một lỗi information architecture, card bọc mọi thứ, hoặc modal cho một flow dài là
     FAIL.

6. **`ui.consistency.product-family` — cùng một ngôn ngữ sản phẩm**
   - Các trang cùng family giữ cùng anatomy, CTA ladder, token, state vocabulary và responsive prior;
     khác biệt phải đến từ nghĩa nghiệp vụ.
   - Copy-paste gần giống nhưng lệch padding, heading, icon hoặc trạng thái giữa các page là FAIL.

#### B. Typography, copy và overflow

7. **`ui.type.semantic-role` — typography theo vai trò**
   - Size, line-height, weight và tone được chọn từ semantic role, không chọn theo cảm giác từng node.
     Body/fact dùng normal; label/control dùng medium; title/CTA anchor dùng semibold theo thang đã chốt.
   - FAIL khi cùng một role đổi kiểu vô cớ, metadata bị đẩy thành heading, hoặc mobile tự thu toàn bộ
     chữ xuống `12px`.

8. **`ui.type.wrap-truncate` — wrapping, truncate và line clamp**
   - Mặc định là wrap và giữ toàn bộ nội dung. `truncate` chỉ hợp lệ cho identity/placeholder đã biết
     nằm trong một owner một dòng bị giới hạn, với full value còn truy cập được qua accessible name,
     tooltip, expanded view hoặc destination rõ ràng.
   - Owner phải chứng minh đúng overflow boundary và `min-w-0`; không crop nhầm cả row/card.
   - Không truncate instruction, validation/error, CTA label, price, consequence, trạng thái, kết quả
     terminal hoặc title chính nếu phần bị mất làm hai object không còn phân biệt được.
   - `line-clamp` chỉ dành cho preview/excerpt có đường mở nội dung đầy đủ. Dùng clamp cho field value,
     critical copy hoặc nội dung không có lối xem tiếp là FAIL.
   - Gate phải thử locale dài, dữ liệu dài nhất, mobile và zoom/text scaling. Ellipsis đẹp nhưng che mất
     thông tin cần hành động vẫn là FAIL.

9. **`ui.type.readability-density` — khả năng đọc**
   - Line length, line-height, paragraph width, rhythm và density phải hợp với loại nội dung. Dense row
     vẫn scan được; nội dung đọc dài không bị kéo hết viewport.
   - FAIL khi wrap tạo orphan khó hiểu, chữ chạm icon/action, hoặc spacing được dùng thay cho cấu trúc.

10. **`ui.copy.localization-format` — copy và định dạng**
    - Copy phải rõ chủ thể/hành động/kết quả; ngày giờ, số, tiền, đơn vị và plural theo locale; label dài
      không phá layout.
    - Placeholder không thay label. Copy nội bộ, tiếng Anh lạc hệ, ký hiệu mơ hồ hoặc format dữ liệu
      không nhất quán là FAIL.

#### C. Color, surface, spacing và media

11. **`ui.color.semantic` — màu theo nghĩa**
    - `foreground`, `muted`, `accent`, `accent-soft`, `success`, `warning`, `danger` dùng đúng mapping đã
      chốt và đủ contrast trên background thực tế. State quan trọng phải có signal ngoài màu.
    - Raw color, accent lan toàn card, category mượn màu outcome hoặc disabled chỉ giảm opacity là FAIL.

12. **`ui.spacing.relationship` — khoảng cách diễn tả quan hệ**
    - Gap/padding/margin có một owner và thể hiện cấp quan hệ: inside object, label-to-collection,
      peer-to-peer, section-to-section, collection-to-shared-CTA.
    - Dùng một `gap-*` cho mọi cấp, cộng padding từ nhiều ancestor hoặc margin chữa symptom là FAIL.

13. **`ui.surface.card-boundary` — card và boundary**
    - Card chỉ bọc một chức năng/coherent decision boundary. Single block dùng prior `p-4`; joined
      multi-block dùng outer `p-0`, child face `p-3` và divider theo mặt tiếp xúc.
    - Card lồng card để trang trí, nhiều chức năng không liên quan trong một surface, hoặc section label
      bị nhốt trong card không sở hữu nó là FAIL.

14. **`ui.surface.alignment-divider` — alignment và separator**
    - Các object cùng cấp bám cùng trục; divider thuộc đúng owner, chạm đúng hai mặt cần phân tách và đổi
      hướng theo composition (`divide-y`/`divide-x`).
    - Separator nổi lửng vì padding, bị nhân đôi với border hoặc không kéo hết boundary là FAIL.

15. **`ui.media.icon-artwork` — icon, tile, image và avatar**
    - Icon phải có nghĩa, do Grammar/icon library sở hữu và dùng đúng size/tone. Icon-only control có
      accessible name; decorative icon bị ẩn khỏi accessibility tree.
    - Artwork identity đặt ở `IconTile`/media slot; có crop/contain, alt/fallback và kích thước dự trữ.
      Icon trang trí trong button, SVG page-local trùng Grammar hoặc ảnh filler vô nghĩa là FAIL.

16. **`ui.status.progress-badge` — trạng thái, tiến độ và badge**
    - Progress là progress có label/value/loading riêng; badge là nhãn compact, không thay cho explanation
      hay whole state model. Zero thật khác loading/unknown.
    - Dùng success khi chưa hoàn thành, skeleton thành `0%`, badge dày đặc hoặc chỉ màu để báo verdict là
      FAIL.

#### D. Action, navigation, form và collection

17. **`ui.action.button` — button**
    - Button chỉ làm action tại chỗ; mỗi local decision region có tối đa một dominant action. Variant
      phản ánh consequence, không phản ánh sở thích màu.
    - Phải có visible label; icon-only dùng `IconButton`. Không thêm icon trang trí; chỉ affordance phổ
      thông được Grammar cấp như trailing arrow/check-circle.
    - Pending giữ nguyên geometry và label, ngăn submit trùng; destructive có confirmation phù hợp.
      Disabled action mà người dùng có thể tự sửa phải giải thích nguyên nhân.
    - Gate thử label ngắn/dài, pending, disabled, keyboard, repeated click và mobile target. Button dùng
      để navigation hoặc `router.push` giả link là FAIL.

18. **`ui.action.link-destination` — link và destination cue**
    - Navigation giữ native `href`/Link semantics: hover, focus, open new tab, middle click và copy
      destination hoạt động. Section/row destination dùng `SeeMoreLink`/`DestinationCue`; inline action
      không điều hướng mới dùng `TextLink`.
    - Anchor không destination, click handler giả link, hoặc CTA nhìn là link nhưng không có semantics
      điều hướng là FAIL.

19. **`ui.form.field-label-recovery` — field và form**
    - Field có persistent associated label, stable help/error region, required/optional/invalid/disabled/
      read-only/pending rõ ràng, autocomplete/input mode đúng và không xoá input khi lỗi.
    - Error chỉ ở toast, placeholder đóng vai label, focus nhảy sai, submit trùng hoặc mobile co field tới
      không dùng được là FAIL.

20. **`ui.choice.selection` — checkbox, radio, select và lựa chọn**
    - Control đúng semantics của cardinality; label là một phần target; selected/current/disabled vừa nhìn
      thấy vừa đọc được; keyboard model đúng.
    - Dùng tabs cho form choice, checkbox cho exclusive choice, hay cả row click được nhưng focus target
      chỉ là một icon nhỏ là FAIL.

21. **`ui.collection.list` — collection và repeated row**
    - Một owner giữ anatomy row, divider, selected/current state, row action, empty, zero/one/many, loading,
      pagination/virtualization và scroll behavior.
    - Joined rows phải dùng list surface thay vì nhiều card giả; empty state nằm ở collection. Divider
      page-local, action lệch row hoặc selected chỉ đổi màu là FAIL.

22. **`ui.data.table` — bảng và dữ liệu so sánh**
    - Dùng table khi cross-row/cross-column comparison là nhiệm vụ. Header, cell relationship, sort/filter,
      row/bulk action và empty/loading có owner.
    - Responsive phải ưu tiên cột, cho horizontal scroll có chủ đích hoặc chuyển sang composition khác;
      tự bỏ cột quan trọng trên mobile là FAIL.

23. **`ui.navigation.orientation` — nav, tabs, rail và subnav**
    - Navigation cho biết location/current destination và hỗ trợ back/return đúng hierarchy. Tabs chỉ dùng
      cho peer views loại trừ nhau, không dùng cho route, step tuần tự hay progress.
    - Rail/Nav/Subnav đã có Grammar thì layout phải do Grammar quyết. Hidden tab panel còn focusable,
      active indicator lệch identity hoặc mobile sinh một IA thứ hai là FAIL.

24. **`ui.overlay.feedback` — overlay và feedback**
    - Inline error, toast, dialog, drawer và popover được chọn theo urgency/scope; overlay sở hữu focus
      entry, trap, dismiss, return và collision.
    - Nested overlay, drawer che đường thoát, toast chứa lỗi cần sửa, background scroll bleed hoặc focus
      rơi khỏi context là FAIL.

#### E. State, responsive và lifecycle

25. **`ui.state.complete-model` — state model đầy đủ**
    - Mỗi feature qualify các state áp dụng: populated, empty, loading, partial, error, pending, disabled,
      selected/current, success và recovery. Empty phải render empty state trọn vẹn và CTA đúng owner.
    - Transparent shell, layout nhảy giữa loading/data, empty vẫn render cấu trúc dữ liệu giả hoặc retry
      mất input/context là FAIL.

26. **`ui.responsive.reflow` — responsive composition**
    - Wide, intermediate, compact và hai phía sát breakpoint giữ nguyên nghĩa, order và action reachability;
      chỉ manifestation đổi theo Grammar.
    - Desktop bị ép nhỏ, mobile chỉ scale down, horizontal page scroll hai chiều hoặc action biến mất là
      FAIL.

27. **`ui.scroll.sticky-fixed` — scroll, sticky và fixed boundary**
    - Chỉ có scroll owner cần thiết; sticky offset khớp header/subnav; page terminal có clearance cho fixed
      control. Phải thử start/middle/end/back, restored position và nested scroll limits.
    - Rail giật, double scrollbar, sticky nhảy vị trí, separator/panel không sát boundary hoặc content bị
      fixed element che là FAIL.

28. **`ui.drag.overlay-zindex` — drag, collision và z-index**
    - Draggable object có viewport constraints, recoverable position và không chặn nhiệm vụ. Thử bốn mép,
      resize, scroll, reload và overlay mở/đóng.
    - Overlap tự nó không phải lỗi nếu object được phép kéo; không kéo được, mất khỏi viewport, stale
      transform hoặc phủ CTA mà không hồi phục được là FAIL.

29. **`ui.zoom.long-content-reflow` — zoom và nội dung cực trị**
    - Qualify zoom in/out/reset, text scaling, locale dài, value ngắn nhất/dài nhất, missing value, dense và
      sparse content.
    - Chữ bị crop, control đè nhau, mất affordance hoặc phải pan hai chiều để hoàn thành task là FAIL.

30. **`ui.motion.preference-stability` — motion**
    - Motion phải giải thích state/relationship, giữ geometry ổn định và tôn trọng reduced-motion.
    - Animation trang trí gây delay, dizziness, layout shift hoặc che trạng thái cuối là FAIL.

#### F. Accessibility, integrity và whole-product proof

31. **`ui.a11y.name-role-state` — semantics hỗ trợ công nghệ**
    - Mọi control có accessible name, native role/state/value đúng; heading, landmark, list/table/form
      relationship phản ánh structure thật. Dynamic announcement dùng live region đúng mức.
    - Div giả button, icon-only không tên, duplicate label hoặc aria nói khác pixels là FAIL.

32. **`ui.a11y.keyboard-focus-target` — keyboard, focus và target**
    - Toàn flow hoàn thành được bằng keyboard; focus visible, order hợp lý, không trap ngoài overlay, mở/
      đóng overlay trả focus đúng; pointer target và khoảng cách đủ dùng.
    - Hover-only action, focus bị crop/che, target quá nhỏ hoặc row click không có keyboard equivalent là
      FAIL.

33. **`ui.integrity.visual-stability` — integrity và ổn định hình học**
    - Không clipping, unintended overlap, transparent leak, z-order lỗi, duplicate surface, edge artifact
      hay cumulative layout shift. Image/skeleton/pending state dự trữ geometry.
    - Lint/test xanh không thay thế gate này; lỗi chỉ thấy trên raster vẫn là FAIL.

34. **`ui.whole-page.aesthetic-veto` — blind visual review**
    - Reviewer độc lập xem full-page raster populated happy case trước, đánh giá clarity, hierarchy,
      density, rhythm, visual ownership và cảm giác thuộc cùng product family.
    - Nếu first impression vẫn thấy rối, lệch, thô hoặc “AI-generated patchwork” thì FAIL dù từng component
      riêng lẻ đều đúng token.

35. **`ui.journey.recovery-terminal` — flow thật từ đầu tới cuối**
    - Chạy browser journey từ entry tới task, error/retry, success/terminal; thử back, refresh, resume và
      quyền/data edge áp dụng. UI phải giữ context, draft và orientation.
    - Chỉ chụp một route tĩnh, success giả, recovery mất dữ liệu hoặc terminal không có next step hợp lý là
      FAIL.

### Evidence matrix tối thiểu

Mỗi gate chỉ lấy các probe có áp dụng, nhưng `N/A` phải có lý do. Một feature UI thông thường cần:

- Populated happy case full-page và crop của decision surface chính.
- Empty, loading/pending, error/recovery; disabled/selected/success khi feature có state đó.
- Dữ liệu ngắn nhất, dài nhất, missing, zero/one/many; copy wrap và locale dài.
- Wide, intermediate, compact và viewport ngay hai phía breakpoint.
- Zoom in, zoom out, reset và text scaling/reflow.
- Page scroll start/middle/end/back; nested scroll, restored position, sticky/fixed clearance.
- Keyboard-only flow, focus visible/return, screen-reader name-role-state và pointer target.
- Overlay open/close/collision; drag bốn mép nếu có draggable object.
- Fresh rasters sau mutation, source ref tương ứng, runtime/console evidence và journey receipt.

Không gate nào được PASS chỉ bằng screenshot nếu nó cần DOM/keyboard/state proof; cũng không gate nào cần
pixel proof được PASS chỉ bằng lint, unit test, DOM snapshot hoặc lời mô tả của implementer.

### Repair owner khi gate không qua

- Fact, quyền, consequence, metric sai: trả về business/backend authority.
- Journey, information architecture, recovery hoặc container choice sai: trả về UX/product block.
- Anatomy, token, public interaction API, responsive prior hoặc semantic artwork thiếu: sửa ở Grammar.
- Data binding, localized copy, route/action wiring sai: sửa ở app consumer.
- Runtime, shared route/session/overlay infrastructure sai: trả về shared runtime/control plane.
- Không có authority đủ rõ để sửa: `SUSPENSE`, không để agent tự chọn một phương án “trông hợp lý”.

### Cách tổ chức knowledge sau khi chốt v7.6

- Chuyển bộ luật này thành `knowledge/qualify/`, với `index` là router và mỗi gate family có một owner
  riêng. `knowledge/ui.md` tạm thời chỉ làm compatibility router trong lúc migrate consumer.
- Một gate file phải chứa: semantic question, applicability, PASS/FAIL/SUSPENSE/BLOCKED contract,
  authority, positive/negative examples, evidence recipe, repair owner và machine-readable `gateId`.
- Chỉ xóa knowledge cũ khi mọi rule đã có đúng một home, mọi skill consumer đã đổi route và machine/test
  kiểm được không còn dual authority.

### Counterevidence source hiện tại mà gate phải bắt

- `Link` hiện còn nhánh internal navigation dựa vào `router.push`; điều này mâu thuẫn quyết định native
  destination đã chốt và phải FAIL `ui.action.link-destination`, không được biến implementation hiện tại
  thành rule mới.
- Truncation hiện có ví dụ hợp lệ ở constrained subnav identity và search placeholder, nhưng chưa có một
  semantic contract dùng chung đủ mạnh. Feature tự thêm `truncate` vào essential title/copy phải bị chặn;
  nếu thật sự cần một reusable policy thì mở `grammar-gap`.
- `Button`/`IconButton` hiện đã cho thấy hướng owner đúng: button cần visible label; icon-only có
  accessible label; pending giữ label/geometry; decorative named icon bị loại. Gate phải bảo vệ contract
  này khỏi consumer drift.

## Còn chưa rõ
