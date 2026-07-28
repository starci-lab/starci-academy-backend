# BƯỚC 11 — BRAINSTORM: MODAL · DRAWER · LAYOUT WRAPPER

> **CHƯA CHỐT, CHƯA CODE.** Thầy dặn "brainstorm thêm để chốt" — tài liệu này là kết quả quét
> thật + đề xuất, không phải quyết định. Đọc trực tiếp `src`, không suy đoán.

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

## 4. Layout wrapper — không phải tầng mới, nó LÀ SCREEN

10 file `layout.tsx` trong toàn app, **6 cái rỗng** (chỉ pass `{children}`), **4 cái có hình thật**:

| File | Dựng gì |
|---|---|
| `[locale]/layout.tsx` (gốc) | `InnerLayout` — nơi 26 overlay ở mục 2A mount |
| `learn/layout.tsx` | `LearnShell` + `ResizableRail` + `ContentMap` + `OnThisPage` + `MilestoneOutline` + `LeaderboardCategoryRail` + 3 gate (`EnrollGate`/`GithubLinkGate`/`PersonalProjectGatePreview`) + 2 trigger AI (`ContentAiFab`/`ContentAiSelectionAsk`) |
| `headhunting-companies/layout.tsx` | `LearnSidebar` |
| `personal-project/layout.tsx` | `PersonalProjectWorkspace` |
| `playground/[slug]/layout.tsx` | `PlaygroundSessionProvider` (context, không hình) |
| `profile/[username]/layout.tsx` | `PublicProfile` |
| `profile/settings/layout.tsx` | `SettingsLayout` |

**Phép thử canon không quan tâm "sống bao lâu"**, chỉ quan tâm "sở hữu cái gì": screen = gọi
block + frame, đưa dữ liệu có kiểu. `LearnShell` làm ĐÚNG việc đó — khác đúng MỘT điểm: nó có
một khe `{children}` để nhét screen con vào, thay vì cây block cố định.

⇒ **Đề xuất: không đẻ tầng thứ sáu.** Một layout có hình thật là **screen bình thường**, với
đúng MỘT ngoại lệ đã có tiền lệ (`Container` cũng nhận `children`): `children: ReactNode` là chỗ
duy nhất `ReactNode` hợp lệ ở tầng này, vì việc của nó là làm khung chứa trang con.

`ContentAiFab`/`ContentAiSelectionAsk` trong `learn/layout.tsx` không phải block nội dung —
chúng chỉ gọi `open()` cho `contentAiChat` (mục 2A). Đúng dạng trigger đã gặp ở `E2eResultButton`.

---

## 5. Việc chưa làm — chờ thầy chốt

1. **Overlay nào dựng trước?** Đề xuất bắt đầu bằng nhóm learn-domain (10 cái) vì đang dở màn
   `learn/`, để lại 15 cái toàn-app cho lượt riêng.
2. **`PremiumGateModal` vs `ContentPaywall`** — đọc kỹ để xác định trùng lặp thật hay hai tình
   huống khác nhau, TRƯỚC khi build bất kỳ overlay "premium" nào.
3. **`LearnShell` có dựng thành screen ngay không?** Nó là điều kiện để `ContentScreen` (và mọi
   screen `learn/` khác) đứng đúng trong ngữ cảnh thật — hiện các screen đang dựng standalone,
   chưa có khung `LearnShell` bọc ngoài.
4. **Tên gọi:** `overlays/` (đã có khung thư mục rỗng từ hôm tách app) hay tên khác? Và pattern B
   (mount cục bộ) có đứng chung thư mục `overlays/` với pattern A không, hay tách riêng?
