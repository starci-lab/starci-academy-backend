# BƯỚC 11 — MODAL · DRAWER · LAYOUT WRAPPER ✅ CẤU TRÚC ĐÃ CHỐT

> Bắt đầu là brainstorm, thầy chốt cấu trúc ngay trong buổi:
>
> ```
> <app>/<pages | layouts | overlays/{modals,drawers}>
> ```
>
> §1–§5 dưới đây là phần khảo sát dẫn tới quyết định đó — giữ nguyên làm căn cứ. §7 là việc
> còn phải làm để cây khớp quyết định (namely: `screens/` → `pages/`, đang HOÃN vì workflow
> đang ghi).

---

## 1. Modal/Drawer KHÔNG rải rác — có một hệ thống thật, một cửa vào duy nhất

`src/components/drawers/DrawerContainer.tsx` + `src/components/modals/ModalContainer.tsx` mount
**26 overlay** (5 drawer + 21 modal) **một lần duy nhất** ở `InnerLayout.tsx` — gốc của toàn app,
bọc mọi route. Mở/đóng qua một Zustand store (`useOverlayStore`), key cố định (`OverlayKey`), gọi
được từ **bất kỳ đâu** bằng hook riêng (`useE2eResultOverlayState()`, `usePaymentOverlayState()`…).

Đây chính là câu hỏi để ngỏ từ hôm dựng `ContentScreen`: `E2eResultButton` chỉ gọi `open()` cho
một drawer không có nhà. Giờ có nhà — nó tên `overlays`, và nó **đã tồn tại thật trong `src`**,
không phải suy đoán.

---

## 2. Đo được BỐN hình dạng khác nhau, không phải một

### A. Global — mount một lần, gọi từ bất kỳ đâu (26: 21 modal + 5 drawer)

`AuthenticationModal · PaymentModal · ContentModal · LivestreamCalendarModal · LessonVideoModal ·
LanguageModal · FeedbackDetailsModal · CvPreviewModal · CvReviewLevelDetailsModal ·
GlobalSearchModal · LinkGithubModal · ShareModal · FoundationModal · HeadhunterModal ·
AiQuotaModal · PremiumGateModal · AdModal · ManagePinnedProjectsModal · FollowListModal ·
CookieConsentModal · MaintenanceModal` (21 modal) +
`SubmissionAttemptsDrawer · PersonalProjectTaskAttemptsDrawer · E2eResultDrawer ·
ContentAiChatDrawer · MiniCartDrawer` (5 drawer).

Đây mới đúng nghĩa **overlay tier**: sinh ra một lần, không thuộc về screen nào cả.

### B. Global-store nhưng mount CỤC BỘ (2: `avatarUpload` · `challenge`)

`AvatarUploadModal` dùng chung cơ chế store (`useAvatarUploadOverlayState`) nhưng **không** nằm
trong `ModalContainer` — nó mount ngay trong `features/profile/EditProfile/`, vì chỉ MỘT màn cần
tới nó. `challenge` (trong `Challenge/ChallengePage`) cùng dạng. Tiết kiệm mount cost cho cái
không ai gọi từ nơi khác — vẫn là "overlay" về HÌNH, chỉ khác về NƠI ĐẶT.

### C. Không phải modal/drawer — là menu neo (1: `accountMenu`)

`useAccountMenuOverlayState` chỉ dùng trong `Navbar/AccountMenuDropdown`. Không che nền, không
giữa màn hình — nó là `Popover`/`Menu` neo vào avatar. Atom `PopoverBase`/`MenuBase` **đã có**
trong kho — đây không phải overlay tier, nó là atom.

### D. Screen sở hữu hoàn toàn, không qua store (≥2: `SubmissionResultHistoryDrawer` ·
`PersonalProjectTaskResultHistoryDrawer`)

Đọc code: `isOpen: boolean` là **prop thường**, không phải `useOverlayHandle`. Về hành vi nó là
một **block bình thường** — chỉ tình cờ vẽ ra hình drawer. Không thuộc overlay tier; nó thuộc
`blocks/` của screen sở hữu nó.

> **Luật rút ra:** *"trông giống modal"* không phải phép thử. Phép thử là *"ai mở nó, và từ
> đâu"*. Bốn câu trả lời khác nhau ⇒ bốn chỗ đứng khác nhau, dù cả bốn đều vẽ ra một lớp phủ.

---

## 3. Đề xuất: `overlays` = loại A + B, tách theo domain khi build

26 overlay dạng A/B không đều nhau về miền:

| Học/khoá (learn-domain, ưu tiên nếu làm trước) | Toàn app (không riêng learn) |
|---|---|
| `ContentModal` · `LessonVideoModal` · `FoundationModal` · `HeadhunterModal` · `PremiumGateModal` · `AiQuotaModal` · `E2eResultDrawer` · `ContentAiChatDrawer` · `SubmissionAttemptsDrawer` · `PersonalProjectTaskAttemptsDrawer` | `AuthenticationModal` · `PaymentModal` · `LivestreamCalendarModal` · `LanguageModal` · `FeedbackDetailsModal` · `CvPreviewModal` · `CvReviewLevelDetailsModal` · `GlobalSearchModal` · `LinkGithubModal` · `ShareModal` · `AdModal` · `ManagePinnedProjectsModal` · `FollowListModal` · `CookieConsentModal` · `MaintenanceModal` · `MiniCartDrawer` |

⚠️ **Nghi trùng lặp đã thấy trước khi build:** `PremiumGateModal` (global) và `ContentPaywall`
(block vừa dựng trong `ContentScreen`) đều trả lời "chưa mua thì sao" — một cái là overlay che
toàn màn, một cái nằm phẳng trong thẻ đọc. Có thể là hai tình huống thật khác nhau (chặn cứng
ngay lối vào vs. mời mua giữa lúc đọc), có thể là một khái niệm bị vẽ hai lần. **Cần đọc kỹ cả
hai trước khi build cái nào tên "premium gate" mới** — đúng bài học `ContentTabBar`/`Toolbar`.

---

## 4. Layout wrapper — ~~không phải tầng mới, nó LÀ SCREEN~~ SAI, đã sửa

> ⚠️ **Kết luận đầu của trò sai — thầy bắt đúng.** Trò xếp `InnerLayout`/`LearnShell` vào tầng
> `screen` vì nó GIỐNG screen về HÌNH (gọi block + frame, có khe `children`). Nhưng phép thử của
> `screen` không phải hình dạng — là **NGỮ NGHĨA**: *"người dùng tới TRANG NÀY để làm gì"*.
> Navbar không đổi khi người dùng chuyển trang; chức năng của nó (search, giỏ hàng, tài khoản)
> không phải lý do người dùng vào bất kỳ route cụ thể nào. Nó là cái BỌC QUANH mọi screen, không
> phải một screen. Nhét sai chỗ vì bám hình, bỏ qua nghĩa — đúng loại lỗi `ContentTabBar` đã mắc
> (bám atom trần vì tiện, bỏ qua composite đã có sẵn), chỉ khác nằm ở tầng phân loại.

**Thầy chốt: tách hai phần — `pages` và `layouts`.** Đúng khớp quy ước có sẵn của chính
Next.js trong `src/app`: `page.tsx` = nội dung một route (đã là tầng `screen`, KHÔNG đổi gì) ·
`layout.tsx` = khung bọc quanh N route con (tầng MỚI, tên `layout`).

### Phép thử phân biệt

| | `screen` (pages) | `layout` (layouts) |
|---|---|---|
| Trả lời câu gì | "người dùng tới TRANG NÀY làm gì" | "cái gì BỌC QUANH mọi trang trong PHẠM VI này" |
| Sống bao lâu | Unmount khi rời route | Mount khi vào phạm vi, sống qua nhiều route con |
| Có khe `children`? | Không | CÓ — bắt buộc, đây là chỗ duy nhất `ReactNode` hợp lệ trên tầng frame |
| Chức năng của nó | Chức năng CỦA route đó | Chức năng CHUNG cho mọi route con (nav, search, overlay-mount) |

Luật cấu trúc giống `screen`: chỉ gọi `block` + `frame`, không gọi thẳng atom/composite. Khác
đúng một điểm: BẮT BUỘC có prop `children: ReactNode`.

### 10 file `layout.tsx` trong toàn app — 6 rỗng (chỉ pass `{children}`), 4 có hình thật

| File | Dựng gì | Phạm vi |
|---|---|---|
| `[locale]/layout.tsx` (gốc) → `InnerLayout` | `Navbar` (8 block con) + `Footer` có điều kiện + mount 26 overlay (mục 2A) + `ContentAiChatRail` | **TOÀN APP** — layout gốc duy nhất |
| `learn/layout.tsx` → `LearnShell` | `ResizableRail` (vỏ) chứa `ContentMap`/`OnThisPage`/`MilestoneOutline`/`LeaderboardCategoryRail` + 3 gate (`EnrollGate`/`GithubLinkGate`/`PersonalProjectGatePreview`) + 2 trigger AI | mọi route `/learn/**` |
| `headhunting-companies/layout.tsx` | `LearnSidebar` | route `headhunting-companies/**` |
| `profile/settings/layout.tsx` → `SettingsLayout` | (chưa đọc kỹ — cần xác nhận có phải vỏ+rail không) | `profile/settings/**` |

**Chưa xếp được, cần đọc riêng trước khi xây:** `personal-project/layout.tsx`
(`PersonalProjectWorkspace`) và `profile/[username]/layout.tsx` (`PublicProfile`) — cả hai
`page.tsx` tương ứng RỖNG (stub trống, đã ghi ở bước 10 khảo sát learn), nên rất có thể toàn bộ
nội dung thật đang nằm Ở LAYOUT thay vì ở page — tức đây có thể là **screen bị đặt nhầm chỗ**
(dùng `layout.tsx` làm nơi chứa nội dung vì route không có sub-route nào khác), không phải layout
thật theo nghĩa "bọc N route con". Phải đọc `PersonalProjectWorkspace`/`PublicProfile` xem chúng
có khe `children` thật không — có thì là layout, không thì đó là SCREEN, chỉ đặt sai file.

`ContentAiFab`/`ContentAiSelectionAsk` trong `learn/layout.tsx` không phải block nội dung —
chúng chỉ gọi `open()` cho `contentAiChat` (mục 2A). Đúng dạng trigger đã gặp ở `E2eResultButton`.

### Quy ước thư mục đề xuất

Khớp cây đã tách theo app (`blocks · screens · overlays`), thêm `layouts` làm nhóm thứ tư:

```
components/starci/
  blocks/ · screens/ · layouts/ · overlays/
```

`screens/` giữ nguyên tên (không đổi thành `pages/` — tránh đổi tên giữa lúc workflow `learn/`
đang ghi vào đó); "pages" chỉ là cách GỌI khi nói chuyện, khớp thuật ngữ Next.js, không phải tên
thư mục.

---

## 5. Navbar/Sidebar — soi kỹ ra đúng hai hình dạng, không phải một khối

Đọc `InnerLayout.tsx` (nơi mount `Navbar`) và họ sidebar/rail thì thấy đây **không phải một câu
hỏi**, mà là hai câu hỏi khác hẳn nhau — đúng kiểu "trông giống nhau, chỗ đứng khác nhau" đã gặp
ở mục 2.

### 5a. Navbar — DUY NHẤT, gắn cứng vào screen NGOÀI CÙNG

`InnerLayout.tsx` (bọc TOÀN app, không rẽ theo route) mount đúng **một** `Navbar`, luôn hiện,
`sticky top-0`. Theo khung ở mục 4 (layout = screen có khe `children`), `InnerLayout` CHÍNH LÀ
screen ngoài cùng nhất — "AppShellScreen" — và `Navbar` là một **block** của nó, y hệt cách
`ContentHeader` là block của `ContentScreen`.

`Navbar` tự nó lại ghép từ **8 block con**: `Logo` · `NavLinks` · `SearchButton` ·
`LanguageDropdown` · `DarkLightModeSwitch` · `CartButton` · `NotificationBell` ·
`AccountMenuDropdown`. Và nó mang theo MỘT drawer riêng (menu mobile) — `isDrawerOpen` là
`useState` cục bộ, **không** qua overlay store ⇒ đúng dạng D ở mục 2, không phải overlay tier.

⚠️ **Rác đã thấy khi quét, không sửa vội:** `components/blocks/layout/shell/Navbar/` là bản
**không ai import** — trùng tên với bản thật (`features/navbar/Navbar`), có vẻ là bản cũ bỏ sót.
Ghi lại để dọn sau, không phải việc của brainstorm này.

Một cơ chế đáng chú ý thêm: `useNavbarBottomLayerStore` cho một TRANG đẩy thêm một lớp (vd tab
profile) vào NGAY DƯỚI navbar dùng chung. Đây là hướng NGƯỢC với khe `children` — screen CON
đóng góp NGƯỢC LÊN cho screen NGOÀI. Ghi nhận, chưa cần xếp tầng ngay.

### 5b. Sidebar/Rail — KHÔNG có "cái sidebar", chỉ có VỎ dùng chung + 11 NỘI DUNG khác nhau

Quét ra 11 thứ tên có "Sidebar"/"Rail": `LearnSidebar` · `ResizableRail` · `OutlineRail` ·
`ArchitectureRail` · `CoursePricingRail` · `ContentAiChatRail` · `FlashcardStudyRail` ·
`LeaderboardCategoryRail` · `MindMapRail` · `ResumeRail` · `PracticeRail`.

Đọc hai cái được dùng lại nhiều nhất thì lộ ra khuôn:

- **`CollapsibleSidebar`** (`blocks/navigation/`) — nhận `title` + `children` + `storageKey`,
  tự lo mở/thu/animate/nhớ trạng thái. **Không biết nội dung là gì.**
- **`ResizableRail`** (`blocks/layout/`) — nhận `children` + `storageKey` + biên độ rộng, tự lo
  kéo-giãn/nhớ độ rộng. **Cũng không biết nội dung.**

Hai cái này đúng nghĩa **composite/frame** (§13c cũ) — vỏ chung, không biết miền. 11 cái còn lại
(`LearnSidebar`, `MindMapRail`, `ArchitectureRail`, `PracticeRail`, `CoursePricingRail`…) là NỘI
DUNG nhét vào một trong hai vỏ đó — đúng nghĩa **block**, mỗi cái thuộc về ĐÚNG MỘT screen/section
mà nó phục vụ, giống cách `learn/layout.tsx` nhét `MilestoneOutline`/`ContentMap`/`OnThisPage`
vào khe của `ResizableRail`.

⇒ **Không có "sidebar tier".** Chỉ có: 1-2 vỏ dùng chung ở tầng composite/frame, và N block nội
dung — mỗi block chỉ dựng lúc screen sở hữu nó được dựng, không dựng "cả họ sidebar" một lượt.

---

## 6. Ba câu còn treo (không chặn việc dựng `pages`)

1. **Overlay nào dựng trước?** Đề xuất bắt đầu bằng nhóm learn-domain (10 cái) vì đang dở màn
   `learn/`, để lại 15 cái toàn-app cho lượt riêng.
2. **`PremiumGateModal` vs `ContentPaywall`** — đọc kỹ để xác định trùng lặp thật hay hai tình
   huống khác nhau, TRƯỚC khi build bất kỳ overlay "premium" nào.
3. **`personal-project/layout.tsx`/`profile/[username]/layout.tsx`** — `page.tsx` tương ứng
   RỖNG, nghi là screen bị đặt nhầm vào file layout (§4). Đọc `PersonalProjectWorkspace`/
   `PublicProfile` xem có khe `children` thật không trước khi xếp tầng.

---

## 7. ✅ ĐÃ CHỐT — việc phải làm để cây khớp quyết định

Thầy chốt cấu trúc `<app>/<pages|layouts|overlays/{modals,drawers}>` (2026-07-28) ngay trong
buổi bàn. Đã làm được NGAY (an toàn, không đụng chỗ đang ghi):

- [x] `components/<app>/layouts/` + `stories/<app>/layouts/` — 3 app.
- [x] `components/<app>/overlays/{modals,drawers}/` + `stories/…` — 3 app (trước đó `overlays/`
      là một thư mục phẳng, giờ tách đúng theo cách `src` tự tách thật).
- [x] `components/README.md` cập nhật bảng cây + luật `layouts`/`overlays` con.

**HOÃN có chủ đích — 1 việc:**

- [ ] `screens/` → `pages/` (đổi tên + `git mv` + remap 100+ `storyId` + sửa `title:`/import).
  Lý do hoãn: lúc chốt, workflow `build-all-learn-screens` đang **ghi trực tiếp** vào
  `.storybook/components/starci/screens/**`. Đổi tên thư mục khi agent đang mở file để ghi là
  mất việc — cùng loại rủi ro `feedback-parallel-agents-shared-worktree-race` đã ghi vào memory.
  **Việc ĐẦU TIÊN sau khi workflow báo xong**: `git mv screens pages` cho cả `components/` và
  `stories/` của cả 3 app, chạy lại `restoryid-moved.mjs` kiểu, sửa `@sb-components/*/screens/`
  → `.../pages/`, `title: "…/Screens/…"` → `"…/Pages/…"`, rồi chạy đủ cổng trước khi commit.
