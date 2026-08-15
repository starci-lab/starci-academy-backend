<!-- starci-workflow: v2 -->

# shell-account-language-menus

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Database | PostgreSQL cho user identity; Redis cho managed session/sign-out. |
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 85f4e6663dfdea68bb56eec4956cc681641afe35; D:\Repositories\starci-academy-backend / mtp @ 1dc850af005710a0186f1cf2b4c89238eb44e432 |
| Purpose | Chọn product composition cho signed-in avatar dropdown và language dropdown của global ShellNav trước khi sửa production source. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\shell-account-language-menus.md |
| Language | vi |
| Phase | plan |
| Touching | Workflow file này và D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\shell-account-language-menus\r1\ בלבד; không sửa production source. |

### BINDING EVIDENCE

| Evidence | Finding |
|---|---|
| Current `ShellNav/component.tsx` | Signed-in branch render `IconButton(account)` tĩnh, không có dropdown; language dùng `IconButton` gọi `toggleLocale` trực tiếp. |
| Current `AccountMenu` + `DropdownShell` | Guest dropdown đã có đúng owner split; shell hiện chỉ biểu diễn icon/label items, chưa có signed-in identity summary hoặc single-select indicator. |
| Current `queryMe` + `useQueryMeSwr` | FE đã lấy được `id`, `username`, `email`, `displayName`, `avatar`; không cần backend identity field mới. |
| Backend session capability | GraphQL có `signOut`; current FE chưa nối mutation này vào global account menu. |
| Legacy `Navbar/LanguageDropdown` | Language là standalone HeroUI dropdown, selectionMode single và active locale có `Dropdown.ItemIndicator`. |
| Legacy `AccountMenuDropdown` | Guest dùng account glyph; signed-in trigger dùng avatar/badge; popover có user summary, Dashboard/Profile/CV/Settings và Sign out. |
| Canon | `DropdownShell` sở hữu mechanics; account/language meaning thuộc block; layout tự resolve session, identity và locale. |

### CONTRACT AND OWNER INVENTORY

| Owner | Classification | Reason |
|---|---|---|
| `double-navbar` | REUSE | Shell topology, sticky behavior và single divider không đổi. |
| `inline-tool-row` | REUSE | Search, utility controls và account vẫn chung một centred row. |
| `desktop-navbar-tools` | EXTEND | Slot `locale` hiện khóa ở `icon-button`; direction nào cũng cần language-menu block/dropdown. |
| `DropdownShell` | EXTEND | Cần typed active selection/item indicator; parity account còn cần identity summary trước menu items. |
| `AccountMenu` | EXTEND | Thêm signed-in state, avatar identity, destinations và sign-out action; guest behavior giữ nguyên. |
| `LanguageMenu` | NEW | Đây là domain block global locale choice; không phải icon leaf và không được để `ShellNav` tự viết vendor anatomy. |
| `Avatar`, `Icon`, `Text` | REUSE | Existing leaves đủ render trigger và identity copy. |
| `queryMe`, `useQueryMeSwr` | REUSE | Existing contract đã có đủ display fields. |
| FE `signOut` mutation/hook | NEW | Backend operation tồn tại nhưng FE chưa có owner để gọi và clear session token/cache. |

### DIRECTIONS

| Direction | Product decision | Desktop | Mobile | Trade-off |
|---|---|---|---|---|
| `legacy-parity` | Khôi phục đúng mental model legacy: language và account là hai dropdown độc lập; trigger ưu tiên icon/avatar. | Language icon mở single-select có check; avatar + badge mở identity summary, destinations và Sign out. | Identity summary nằm đầu drawer; language là một row có current value. | Parity cao, navbar gọn; current locale và display name chỉ thấy sau khi mở menu. |
| `explicit-identity` | Giữ hai owner độc lập nhưng đưa current state lên trigger. | Locale pill `VI`; account pill avatar + display name; popover ưu tiên hai quick destinations. | Header hiện avatar + `VI`; drawer ghi rõ current locale/account. | Trạng thái rõ hơn nhưng tốn chiều ngang và collapse sớm hơn. |

### ACCEPTANCE STATES

| State | Required behavior |
|---|---|
| Guest | Generic account glyph vẫn mở guest summary + Sign in/Sign up; không giả avatar. |
| Signed in pending | Trigger không nhảy layout; identity owner có skeleton/fallback phù hợp. |
| Signed in ready | Avatar lấy `queryMe.avatar`, fallback từ identity; account dropdown có user summary và actions. |
| Language open | Active locale có indicator; chọn locale khác giữ path và đổi locale một lần. |
| Language unchanged | Chọn locale hiện tại không reload/navigation vô ích. |
| Sign out | Gọi backend `signOut`, clear local session token và identity cache, rồi shell trở về guest state. |
| Responsive | Desktop giữ search + utilities; mobile chuyển account/language disclosure vào drawer mà không nhân đôi state owner. |
| Accessibility | Hai trigger có accessible label; menu dùng keyboard/focus mechanics của `DropdownShell`; destructive action có danger treatment. |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `shell-account-language-menus-r1` | http://127.0.0.1:8085/ | D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\shell-account-language-menus\r1\index.html | `2a6b043d0ff176e69db60057a683a7f0387d60f8027e684fce40d701ba737769` | đang chờ |

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\shell-account-language-menus\r1`  
PID: `62148`  
Port: `8085`

| Direction | Tab | Status |
|---|---|---|
| `legacy-parity` | `A · Legacy parity` | đang chờ |
| `explicit-identity` | `B · Explicit identity` | đang chờ |

Browser proof: cả hai tab đổi client-side trên cùng URL; mỗi lần chỉ một panel visible; viewport 390×844 hiện mobile state và ẩn desktop popover panel.

### OUTPUTS

| Concept | Result |
|---|---|
| Design brief | Hai direction khả thi cho account/language controls đã authenticated, có parity-first direction. |
| Data feasibility | Existing `me` và backend `signOut` đủ phục vụ cả hai direction; không cần backend schema mới. |
| Ownership | Account và language là hai blocks trên `DropdownShell`; `ShellNav` chỉ compose và resolve chrome domain. |
| Responsive contract | Một owner cho mỗi state, desktop trigger và mobile drawer chỉ là hai projections. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/shell-account-language-menus.md` | added — Plan evidence, directions, ownership inventory và acceptance states. |
| `.workflows/.previews/designs/starci-academy/shell-account-language-menus/r1/index.html` | added — một disposable tabbed preview có desktop/mobile states. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn direction để chuyển Design Review | `A · Legacy parity` (khuyến nghị vì yêu cầu gốc là khôi phục behavior legacy); hoặc `B · Explicit identity` nếu muốn current locale/name luôn visible. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE worktree đang có nhiều concurrent edits | Review/Apply phải freeze exact files và không được baseline/ghi đè khi các thay đổi khác chưa được bảo toàn. |
| `DropdownShell` hiện chưa hỗ trợ identity summary và selected indicator | Design Review phải chốt exact public prop delta; Apply không được tự invent shape. |
| Preview dùng dữ liệu minh họa, không phải live account | Chỉ chứng minh composition/disclosure; runtime auth và mutation cần production proof ở Apply. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Account icon tĩnh sau đăng nhập | Avatar trigger mở account dropdown | Không biểu hiện signed-in identity và mất toàn bộ legacy account journeys. |
| Language icon toggle trực tiếp vi/en | Dropdown single-select có active indicator | Toggle ẩn current choice, không mở rộng được khi có locale thứ ba và lệch legacy behavior. |
| Gộp language/theme vào account menu | Giữ language là global utility độc lập | Legacy đã tách language để đổi ngôn ngữ là first-class action; account menu chỉ sở hữu account meaning. |

### OWED

| Owed | Cleared by |
|---|---|
| Chọn một preview tab | User chọn `A` hoặc `B`. |
| Challenge và freeze component/props delta | Chạy `starci-fe-design-review` sau khi direction được chọn. |

## plan r2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Database | PostgreSQL cho user identity; Redis cho managed session/sign-out. |
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 85f4e6663dfdea68bb56eec4956cc681641afe35; D:\Repositories\starci-academy-backend / mtp @ 1dc850af005710a0186f1cf2b4c89238eb44e432 |
| Purpose | Ghi lựa chọn legacy parity và khóa ListBox anatomy trước Design Review. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\shell-account-language-menus.md |
| Language | vi |
| Phase | plan |
| Touching | Workflow file này và D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\shell-account-language-menus\r1\ בלבד; không sửa production source. |

Selected direction: `legacy-parity`.

Selection reason: user yêu cầu “legacy” và “render y chang legacy, kiểu ListBox”.

### SELECTED ANATOMY

| Region | Locked behavior |
|---|---|
| Account trigger | Guest dùng account glyph; signed-in dùng legacy avatar trigger và optional badge. |
| Account popover header | Static user summary với avatar, display name và email/handle; không phải ListBox option. |
| Account primary section | ListBox rows: Dashboard, Profile, CV, Settings; icon + label theo legacy order. |
| Account destructive section | Divider rồi ListBox row Sign out với danger treatment. |
| Language trigger | Standalone language glyph, không gộp vào account. |
| Language popover | Single-select ListBox; active locale có item indicator/check; chọn locale giữ current path. |
| Theme | Vẫn là navbar utility độc lập, không lặp trong account popover. |
| Mobile | Cùng identity/locale owner được project vào drawer; không tạo state hoặc fetch owner thứ hai. |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `shell-account-language-menus-r1` | http://127.0.0.1:8085/ | D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\shell-account-language-menus\r1\index.html | `a3dc4c2cd9e6382739be39d8d5b37ee0c69f5f829af829d1fef48a0a5e1bd14c` | đã chốt |

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\shell-account-language-menus\r1`  
PID: `62148`  
Port: `8085`

| Direction | Tab | Status |
|---|---|---|
| `legacy-parity` | `A · Legacy parity` | đã chọn |
| `explicit-identity` | `B · Explicit identity` | đã từ chối |

Browser proof sau chỉnh preview: tab A selected; parity panel có 3 ListBox sections, 7 options; language ListBox có đúng một active locale indicator.

### OUTPUTS

| Concept | Result |
|---|---|
| Selected direction | `legacy-parity` là direction duy nhất chuyển sang Review. |
| Account disclosure | Static identity summary đứng trước legacy ListBox destinations và destructive Sign out section. |
| Language disclosure | Standalone single-select ListBox có active indicator, không còn direct two-locale toggle. |
| Fidelity target | Review phải freeze anatomy y như legacy; không sáng tạo lại trigger, row grouping hoặc owner split. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/shell-account-language-menus.md` | modified — appended selected direction, exact ListBox anatomy và rejection. |
| `.workflows/.previews/designs/starci-academy/shell-account-language-menus/r1/index.html` | modified — marked A selected, B rejected và encoded legacy ListBox roles/active indicator. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Direction đã được user chọn; chuyển sang `starci-fe-design-review`. |

### WARNINGS

| Warning | Impact |
|---|---|
| Preview ListBox chỉ là disposable HTML evidence | HeroUI anatomy, focus và selection mechanics phải được chứng minh trong production Apply. |
| FE worktree vẫn có concurrent changes | Review phải khóa exact file/prop boundary trước khi baseline commit hoặc source write. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `B · Explicit identity` | `A · Legacy parity` | User chốt “legacy” và yêu cầu render y chang legacy kiểu ListBox. |
| Locale/display-name pill trigger | Legacy icon/avatar trigger | Không được sáng tạo lại trigger sau khi parity reference đã binding. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge exact production boundary và public prop migrations | `starci-fe-design-review` đọc Plan r2 và freeze `COMPONENT DELTA` + `PROPS DELTA`. |

## review r1

Candidate revision: `legacy-listbox-r1`.

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe / main @ bdc816bdb32693b9d6d8287da0ffaa421327806f; D:\Repositories\starci-academy-backend / mtp @ 1dc850af005710a0186f1cf2b4c89238eb44e432 |
| Purpose | Khóa production tree và public APIs cho avatar account dropdown cùng language ListBox theo legacy parity. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\shell-account-language-menus.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow file này; không sửa HTML preview hoặc production source. |

### REVIEW FINDINGS

| Finding | Review verdict |
|---|---|
| Current signed-in `ShellNav` thay `AccountMenu` bằng static account `IconButton` | Sai owner và mất journeys; một `AccountMenu` block phải tồn tại ở cả guest và signed-in states. |
| Current language control gọi direct `toggleLocale` | Thay bằng `LanguageMenu` block trên `DropdownShell`, `selectionMode="single"`, active item có indicator. |
| `DropdownShell` hiện chỉ có trigger + sections | Mở rộng mechanics bằng static header projection, controlled single selection, item indicator và semantic danger item; không đưa account/language copy vào shell. |
| Current FE có `queryMe` đủ avatar/name/email | `AccountMenu` connected half tự fetch; `ShellNav` không nhận hoặc chuyền fetched identity. |
| Backend `signOut` yêu cầu refresh cookie + CSRF header | FE cần exact mutation/hook mới; chỉ clear in-memory token và viewer caches sau success. |
| Legacy có Dashboard/Profile/CV/Settings | Dashboard, Profile và CV có destination hiện hữu; `profile/settings/edit` chưa có route trong FE mới. Không được tạo link chết trong Apply. |
| Plan r2 nhắc mobile drawer | Current ShellNav không có mobile drawer/account-language projection. Đây là net-new shell topology ngoài request desktop parity và phải tách thành Design Plan khác. |
| Legacy trigger có badge `5` | Current API không có notification/account badge count; không được fabricate số. Signed-in trigger chỉ dùng avatar. |

### OWNER STATES

| Owner | State | Meaning |
|---|---|---|
| `AccountMenu` | `guest` | Generic account glyph; static guest prompt; ListBox Sign in/Sign up. |
| `AccountMenu` | `signedIn` + identity pending | Avatar giữ cùng trigger footprint ở resting state; static identity header shimmer/fallback; destination ListBox vẫn ổn định. |
| `AccountMenu` | `signedIn` + identity ready | Avatar trigger; static avatar/name/email header; Dashboard/Profile/CV ListBox; destructive Sign out section. |
| `AccountMenu` | sign-out pending | Sign out row disabled/pending; không clear token trước backend success. |
| `LanguageMenu` | settled | Standalone locale trigger; single-select ListBox gồm `en` và `vi`; đúng một active indicator. |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | localized root layout | REUSE | `D:\Repositories\starci-academy-fe\src\app\[lang]\layout.tsx` | same | Next localized route tree | `nav-over-body-page` | Navbar mounting/topology không đổi. |
| layout | `ShellNav` connected | MODIFY | `D:\Repositories\starci-academy-fe\src\components\layouts\ShellNav\index.tsx` | same | localized root layout | `double-navbar` | Bỏ direct locale toggle/copy plumbing; giữ auth overlay owner và shell navigation state. |
| layout | `_ShellNav` pure | MODIFY | `D:\Repositories\starci-academy-fe\src\components\layouts\ShellNav\component.tsx` | same | `ShellNav`; `component.test.tsx` | `double-navbar` → `desktop-navbar-tools` / `inline-tool-row` | Compose `LanguageMenu` và luôn compose `AccountMenu`; không còn static signed-in account icon. |
| overlay | `SignInOverlay` | REUSE | `D:\Repositories\starci-academy-fe\src\components\overlays\auth\SignInOverlay\index.tsx` | same | `ShellNav` | existing auth overlay | Guest actions vẫn mở đúng overlay/tab hiện tại. |
| overlay | `CartDrawer` | REUSE | `D:\Repositories\starci-academy-fe\src\components\overlays\commerce\CartDrawer\index.tsx` | same | `ShellNav` | existing cart drawer | Không thay chrome khác. |
| block | `AccountMenu` connected | MODIFY | `D:\Repositories\starci-academy-fe\src\components\blocks\auth\AccountMenu\index.tsx` | same | `_ShellNav` | `account-menu` leaf projection | Tự resolve copy, viewer, destinations và sign-out; chỉ nhận auth-overlay callbacks. |
| block | `_AccountMenu` pure | MODIFY | `D:\Repositories\starci-academy-fe\src\components\blocks\auth\AccountMenu\component.tsx` | same | `AccountMenu`; block tests | `account-menu-identity-header` + `DropdownShell` ListBox | Render exact legacy guest/signed-in states without request/router logic. |
| block | `LanguageMenu` connected | ADD | None | `D:\Repositories\starci-academy-fe\src\components\blocks\locale\LanguageMenu\index.tsx` | `_ShellNav` | `language-menu` leaf projection | Own locale labels/current path and select behavior. |
| block | `_LanguageMenu` pure | ADD | None | `D:\Repositories\starci-academy-fe\src\components\blocks\locale\LanguageMenu\component.tsx` | `LanguageMenu`; block tests | `DropdownShell` ListBox | Render standalone single-select language menu independent of account. |
| shell | `DropdownShell` | MODIFY | `D:\Repositories\starci-academy-fe\src\components\shells\DropdownShell\index.tsx` | same | `AccountMenu`, `LanguageMenu` | HeroUI `Dropdown` mechanics | Admit static header, selected item indicator and danger item without domain knowledge. |
| branch | `Tree` | REUSE | `D:\Repositories\starci-academy-fe\src\components\branches\Tree\index.tsx` | same | `_ShellNav`, `_AccountMenu` | typed contracts | Existing contract renderer đủ cho identity header arrangement. |
| leaf | `Avatar` | REUSE | `D:\Repositories\starci-academy-fe\src\components\leaves\Avatar\index.tsx` | same | `_AccountMenu` | `avatar` | Existing remote image + deterministic fallback + loading shape đủ dùng. |
| leaf | `Icon` | MODIFY | `D:\Repositories\starci-academy-fe\src\components\leaves\Icon\index.tsx` | same | Dropdown menu rows | `icon` | Thêm semantic meanings `profile`, `cv`, `settings`, `signOut`; map sang Heroicons theo canon. |
| leaf | `IconButton` | REUSE | `D:\Repositories\starci-academy-fe\src\components\leaves\IconButton\index.tsx` | same | notification/cart controls | `icon-button` | Những utility controls còn lại không đổi. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `ShellNavData` | `localeLabel`, `guestMessage`, `signInLabel`, `signUpLabel`, `accountLabel` | REMOVE | Five translated strings resolved by layout | None; each block resolves its own copy | `ShellNav/index.tsx`; `_ShellNav` tests | `rg` must show no removed field in `ShellNavData` or `_ShellNav` producers. |
| `ShellNavData` | remaining route/theme/search/cart/notification data + `isSignedIn` | KEEP | Existing fields | Same | `ShellNav/index.tsx`; `_ShellNav` tests | Typecheck and existing navigation tests. |
| `ShellNavActions` | `toggleLocale` | REMOVE | Direct vi/en toggle callback | None | `ShellNav/index.tsx`; `_ShellNav` | `rg "toggleLocale" src/components/layouts/ShellNav` returns none. |
| `ShellNavActions` | `openSignIn`, `openSignUp` | KEEP | Auth overlay callbacks | Same; forwarded to connected `AccountMenu` only | `ShellNav/index.tsx` → `_ShellNav` → `AccountMenu` | Guest menu test opens each overlay mode. |
| connected `AccountMenu` | `props` | REMOVE | Caller supplies labels/copy | No data prop | `_ShellNav` only | Block resolves translations/query itself per BLOCK-4. |
| connected `AccountMenu` | `on.signIn`, `on.signUp` | KEEP | Auth callbacks | Same semantics | `_ShellNav` | Existing guest flow remains covered. |
| `_AccountMenu` | `state` | ADD | No state union | `"guest" | "signedIn"` | `AccountMenu/index.tsx` | Tests render both states; no boolean auth combinations. |
| `_AccountMenu` | `props` | RETYPE | Guest-only labels | Discriminated guest data or signed-in identity/destination/sign-out data, including identity/sign-out pending flags | `AccountMenu/index.tsx` | Exhaustive state tests and TypeScript. |
| `_AccountMenu` | `on` | RETYPE | `signIn`, `signUp` | Guest auth actions or signed-in `navigate(id)` + `signOut()` actions | `AccountMenu/index.tsx` | Each ListBox id emits one exact action. |
| `DropdownShellItemData` | `tone` | ADD | None | optional `"default" | "danger"` | `_AccountMenu` sign-out item | Danger test asserts semantic class/treatment only on sign-out. |
| `DropdownShellItemData` | `showsIndicator` | ADD | None | optional boolean | `_LanguageMenu` locale items | Active locale test finds item indicator in both options with one selected. |
| `DropdownShellData` | `selectionMode`, `selectedId` | ADD | Action menu only | optional controlled single selection | `_LanguageMenu` | HeroUI menu receives `selectionMode="single"` and one selected key. |
| `DropdownShellProps` | `header` | ADD | Trigger only as ReactNode | optional static ReactNode rendered before menu | `_AccountMenu` | Header is outside menu/listbox and therefore not focusable as an option. |
| `DropdownShellActions` | `action` | KEEP | item-id callback | Same for action and selected locale rows | `AccountMenu`, `LanguageMenu` | Existing AccountMenu call site migrated; no extra handler channel needed. |
| connected `LanguageMenu` | component input | ADD | None | `Record<string, never>` / no caller data | `_ShellNav` | Locale/copy/router resolved internally. |
| `_LanguageMenu` | `props` | ADD | None | `{ label, selectedLocale, options }` | `LanguageMenu/index.tsx` | Two locale fixtures and selected-key test. |
| `_LanguageMenu` | `on.select` | ADD | None | `(locale) => void` | `LanguageMenu/index.tsx` | Current locale produces no navigation; other locale preserves pathname. |
| `IconName` | semantic values | ADD | No profile/CV/settings/sign-out meanings | `profile`, `cv`, `settings`, `signOut` | `_AccountMenu` | Canon icon table and Icon tests contain all four mappings. |
| `queryMe` / `useQueryMeSwr` | identity contract | KEEP | `id`, `username`, `email`, `displayName`, `avatar` | Same | connected `AccountMenu` | No backend or query shape change. |

### SUPPORTING PRODUCTION BOUNDARY

| Kind | Exact paths |
|---|---|
| Contract | `D:\Repositories\starci-academy-fe\src\components\contracts\index.ts` (`desktop-navbar-tools.locale` admits `language-menu`; add account identity header contracts). |
| Icon canon | `D:\Repositories\starci-academy-backend\.claude\fe\canon\patterns\icon.md`. |
| Copy | `D:\Repositories\starci-academy-fe\src\messages\en.json`; `D:\Repositories\starci-academy-fe\src\messages\vi.json`. |
| Sign-out transport | `D:\Repositories\starci-academy-fe\src\modules\api\graphql\mutations\mutation-sign-out.ts`; accompanying `mutation-sign-out.test.ts`. |
| Sign-out hook | `D:\Repositories\starci-academy-fe\src\hooks\swr\useMutateSignOutSwr.ts`; accompanying `useMutateSignOutSwr.test.ts`; `D:\Repositories\starci-academy-fe\src\hooks\index.ts`. |
| Component tests | `ShellNav/component.test.tsx`; `AccountMenu/component.test.tsx`; `LanguageMenu/component.test.tsx`; `DropdownShell/index.test.tsx`; connected AccountMenu/LanguageMenu tests only if behavior cannot be proved at the pure + hook boundaries. |

### ACCEPTANCE EVIDENCE

| Proof | Exact acceptance |
|---|---|
| Focused tests | `npx vitest run src/components/layouts/ShellNav/component.test.tsx src/components/blocks/auth/AccountMenu/component.test.tsx src/components/blocks/locale/LanguageMenu/component.test.tsx src/components/shells/DropdownShell/index.test.tsx src/modules/api/graphql/mutations/mutation-sign-out.test.ts src/hooks/swr/useMutateSignOutSwr.test.ts` passes. |
| Type + lint | `npm run typecheck`; focused ESLint over every changed FE TS/TSX file; `npm run gate:canon` pass. |
| Contract proof | `_ShellNav` has one `LanguageMenu`, one `AccountMenu`; signed-in state has no static account `IconButton`; header is outside `role=menu/listbox`; active locale count is exactly one. |
| Runtime guest | Generic account trigger opens guest prompt + Sign in/Sign up ListBox and both launch correct auth mode. |
| Runtime signed-in | Real localhost session shows avatar trigger; popover header renders actual displayName/username + email; Dashboard/Profile/CV and danger Sign out rows match legacy order/grouping. |
| Runtime locale | From `/vi/courses/fullstack-mastery`, language menu marks Vietnamese; choosing English reaches `/en/courses/fullstack-mastery`; selecting active locale is a no-op. |
| Runtime sign-out | Sign out calls backend with credentials + CSRF, then clears session token/viewer cache only on success and shell returns to guest account trigger. |

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate revision | `legacy-listbox-r1` freezes legacy avatar/account and standalone language ListBoxes without new trigger concepts. |
| Ownership | `AccountMenu` and `LanguageMenu` own domain/copy; `DropdownShell` owns only HeroUI mechanics; `ShellNav` only composes chrome. |
| Data integrity | Avatar/name/email reuse `queryMe`; badge count is omitted because no real field exists. |
| Scope correction | Mobile drawer is separated from this desktop parity change; no hidden topology expansion. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/shell-account-language-menus.md` | modified — appended Review r1 candidate, exact component/props delta, production boundary and proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Legacy có `Settings` nhưng FE mới chưa có route | **Không render Settings trong change này (khuyến nghị)**: tránh link chết, giữ Dashboard/Profile/CV + Sign out; hoặc mở rộng thành một Design Plan riêng để tạo Settings route trước. |
| Plan r2 có mobile drawer nhưng current shell chưa có owner | **Tách mobile drawer sang Design Plan riêng (khuyến nghị)**: Apply parity đúng desktop/global controls hiện có; hoặc quay lại Plan để thiết kế mobile shell topology trước. |
| Phê duyệt revision | Approve `legacy-listbox-r1` với hai mặc định trên; sau đó chạy `starci-fe-design-apply`. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE worktree có concurrent course-detail edits và artifacts | Apply phải baseline toàn current target state, rồi chỉ thay exact approved boundary; không được ghi đè unrelated work. |
| Current backend sign-out đòi CSRF + cookie credentials | Mutation chỉ dùng bearer sẽ fail; runtime proof phải kiểm tra request headers/cookies. |
| Existing `ProfileHero` đã trỏ tới route settings không tồn tại | Đây là related bug ngoài boundary, không phải bằng chứng để thêm một link chết nữa. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Static signed-in account icon | Avatar-triggered `AccountMenu` | User yêu cầu legacy dropdown và static icon mất identity/journeys. |
| Direct two-locale toggle | Single-select language ListBox | User yêu cầu render y chang legacy kiểu ListBox. |
| Fabricated legacy badge `5` | Không badge cho tới khi API có count thật | Current FE/backend evidence không có badge count. |
| Mobile drawer implementation trong cùng Apply | Tách Design Plan | Current source không có mobile disclosure owner; thêm nó sẽ vượt parity boundary đã xem. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of `legacy-listbox-r1` | User approve Review r1 và hai mặc định trong `NEED APPROVALS`. |
| Production implementation and live proof | `starci-fe-design-apply` sau approval. |

## review r2

Approved revision: `legacy-listbox-r1`.

Approval evidence: user trả lời `approve r1`; đồng ý không render Settings khi route chưa tồn tại và tách mobile drawer sang Design Plan riêng.

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe / main @ bdc816bdb32693b9d6d8287da0ffaa421327806f; D:\Repositories\starci-academy-backend / mtp @ 1dc850af005710a0186f1cf2b4c89238eb44e432 |
| Purpose | Phê duyệt exact source/API boundary cho legacy account và language ListBox trước Apply. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\shell-account-language-menus.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow file này; không sửa production source. |

### OWNER STATES

| Owner | Approved states |
|---|---|
| `AccountMenu` | `guest`; `signedIn` identity pending; `signedIn` identity ready; sign-out pending. |
| `LanguageMenu` | Settled single-select `en`/`vi`; active locale no-op, other locale preserves pathname. |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | localized root layout | REUSE | `D:\Repositories\starci-academy-fe\src\app\[lang]\layout.tsx` | same | localized route tree | `nav-over-body-page` | Mount/topology không đổi. |
| layout | `ShellNav` connected | MODIFY | `D:\Repositories\starci-academy-fe\src\components\layouts\ShellNav\index.tsx` | same | localized root layout | `double-navbar` | Bỏ direct locale plumbing; giữ auth overlay/navigation state. |
| layout | `_ShellNav` pure | MODIFY | `D:\Repositories\starci-academy-fe\src\components\layouts\ShellNav\component.tsx` | same | `ShellNav`, tests | `desktop-navbar-tools`, `inline-tool-row` | Compose `LanguageMenu` và `AccountMenu`. |
| overlay | `SignInOverlay` | REUSE | `D:\Repositories\starci-academy-fe\src\components\overlays\auth\SignInOverlay\index.tsx` | same | `ShellNav` | existing | Guest auth actions giữ nguyên. |
| overlay | `CartDrawer` | REUSE | `D:\Repositories\starci-academy-fe\src\components\overlays\commerce\CartDrawer\index.tsx` | same | `ShellNav` | existing | Không đổi cart chrome. |
| block | `AccountMenu` connected | MODIFY | `D:\Repositories\starci-academy-fe\src\components\blocks\auth\AccountMenu\index.tsx` | same | `_ShellNav` | `account-menu` | Tự resolve copy/viewer/routes/sign-out. |
| block | `_AccountMenu` pure | MODIFY | `D:\Repositories\starci-academy-fe\src\components\blocks\auth\AccountMenu\component.tsx` | same | connected twin, tests | account identity + `DropdownShell` | Exact guest/signed-in legacy rendering. |
| block | `LanguageMenu` connected | ADD | None | `D:\Repositories\starci-academy-fe\src\components\blocks\locale\LanguageMenu\index.tsx` | `_ShellNav` | `language-menu` | Own locale/copy/path. |
| block | `_LanguageMenu` pure | ADD | None | `D:\Repositories\starci-academy-fe\src\components\blocks\locale\LanguageMenu\component.tsx` | connected twin, tests | `DropdownShell` | Exact single-select ListBox. |
| shell | `DropdownShell` | MODIFY | `D:\Repositories\starci-academy-fe\src\components\shells\DropdownShell\index.tsx` | same | AccountMenu, LanguageMenu | HeroUI Dropdown | Static header, selection, indicator, danger mechanics. |
| branch | `Tree` | REUSE | `D:\Repositories\starci-academy-fe\src\components\branches\Tree\index.tsx` | same | `_ShellNav`, `_AccountMenu` | typed contracts | Existing renderer đủ. |
| leaf | `Avatar` | REUSE | `D:\Repositories\starci-academy-fe\src\components\leaves\Avatar\index.tsx` | same | `_AccountMenu` | `avatar` | Existing image/fallback/loading behavior. |
| leaf | `Icon` | MODIFY | `D:\Repositories\starci-academy-fe\src\components\leaves\Icon\index.tsx` | same | account rows | `icon` | Add `profile`, `cv`, `settings`, `signOut` semantic map; Settings icon remains vocabulary although row is deferred. |
| leaf | `IconButton` | REUSE | `D:\Repositories\starci-academy-fe\src\components\leaves\IconButton\index.tsx` | same | cart/notification | `icon-button` | Other utilities unchanged. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `ShellNav` connected | component input | KEEP | No public props | Same | localized root layout | Existing mount compiles. |
| `_ShellNav` pure | `ShellNavProps` | RETYPE | Includes account/language copy and `toggleLocale` action | Removes block-owned copy and direct locale action; keeps auth callbacks | `ShellNav/index.tsx`, component tests | Typecheck plus stale-field `rg`. |
| `AccountMenu` connected | component API | RETYPE | Full presentational `props` + auth actions | No data props; auth-overlay callbacks only | `_ShellNav` | BLOCK-4 ownership and typecheck. |
| `_AccountMenu` pure | component API | RETYPE | Guest-only `AccountMenuProps` | Discriminated guest/signed-in view props and actions | connected twin, pure tests | Exhaustive state tests. |
| `LanguageMenu` connected | component API | ADD | None | No caller data | `_ShellNav` | Connected block test/typecheck. |
| `_LanguageMenu` pure | component API | ADD | None | `{ props: locale data; on.select }` | connected twin, pure tests | Locale state/action tests. |
| `DropdownShell` | `DropdownShellProps` | RETYPE | Trigger + action sections | Adds optional static header, controlled single selection, indicator and danger item semantics | AccountMenu, LanguageMenu | Both consumers compile and focused tests pass. |
| `Icon` | `IconName` | RETYPE | Existing semantic union | Adds `profile`, `cv`, `settings`, `signOut` | AccountMenu | Canon map and Icon tests. |
| `ShellNavData` | account/language copy fields | REMOVE | `localeLabel`, `guestMessage`, `signInLabel`, `signUpLabel`, `accountLabel` | None | `ShellNav/index.tsx`, `_ShellNav` tests | `rg` proves no stale fields. |
| `ShellNavData` | remaining chrome fields | KEEP | Existing | Same | `ShellNav/index.tsx` | Typecheck/tests. |
| `ShellNavActions` | `toggleLocale` | REMOVE | direct toggle | None | `ShellNav` twins | `rg` proves removal. |
| `ShellNavActions` | `openSignIn`, `openSignUp` | KEEP | callbacks | Same, forwarded to AccountMenu | ShellNav twins | Guest flow test. |
| connected `AccountMenu` | `props` | REMOVE | caller-provided copy | None | `_ShellNav` | BLOCK-4 ownership. |
| connected `AccountMenu` | auth actions | KEEP | `signIn`, `signUp` | Same | `_ShellNav` | Existing behavior. |
| `_AccountMenu` | `state` | ADD | None | `guest | signedIn` | connected twin | Exhaustive tests. |
| `_AccountMenu` | `props`, `on` | RETYPE | guest-only data/actions | discriminated guest or signed-in identity/destinations/sign-out | connected twin | State/action tests. |
| `DropdownShellItemData` | `tone`, `showsIndicator` | ADD | None | semantic danger/indicator options | menu blocks | Focused tests. |
| `DropdownShellData` | `selectionMode`, `selectedId` | ADD | action-only | controlled single select | LanguageMenu | One selected-key proof. |
| `DropdownShellProps` | `header` | ADD | trigger only | optional static ReactNode before ListBox | AccountMenu | Header is not menuitem. |
| `DropdownShellActions` | `action` | KEEP | item callback | Same | both menu blocks | Action tests. |
| connected `LanguageMenu` | component input | ADD | None | no caller data | `_ShellNav` | Own connected state. |
| `_LanguageMenu` | `props`, `on.select` | ADD | None | label/options/selected locale + select callback | connected twin | Locale tests. |
| `IconName` | semantic values | ADD | missing account destinations | `profile`, `cv`, `settings`, `signOut` | AccountMenu | Canon + Icon tests. |
| `queryMe`, `useQueryMeSwr` | identity contract | KEEP | current fields | Same | AccountMenu | No transport/schema edit. |

### SUPPORTING PRODUCTION BOUNDARY

| Kind | Exact boundary |
|---|---|
| Contract | `starci-academy-fe/src/components/contracts/index.ts`. |
| Icon canon | `starci-academy-backend/.claude/fe/canon/patterns/icon.md`. |
| Copy | `starci-academy-fe/src/messages/en.json`; `src/messages/vi.json`. |
| Sign-out | `src/modules/api/graphql/mutations/mutation-sign-out.ts` + test; `src/hooks/swr/useMutateSignOutSwr.ts` + test; `src/hooks/index.ts`. |
| Component proof | ShellNav, AccountMenu, LanguageMenu, DropdownShell focused tests named in Review r1. |

### ACCEPTANCE EVIDENCE

| Proof | Approved acceptance |
|---|---|
| Automated | Focused Vitest command from Review r1; `npm run typecheck`; focused ESLint; `npm run gate:canon`; FE and BE repository lint. |
| Runtime guest | Guest header and Sign in/Sign up ListBox launch correct auth tabs. |
| Runtime signed-in | Real avatar, static identity summary, Dashboard/Profile/CV and danger Sign out. No Settings row and no fabricated badge. |
| Runtime locale | Exactly one indicator; `/vi/...` to `/en/...` preserves course path; active locale no-op. |
| Runtime sign-out | Credentialed CSRF request succeeds, then token/cache clear and guest trigger returns. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `legacy-listbox-r1`. |
| Account menu | Legacy avatar + static identity + ListBox destinations + danger Sign out. |
| Language menu | Legacy standalone single-select ListBox. |
| Approved exclusions | Settings route and mobile drawer deferred; badge count not fabricated. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/shell-account-language-menus.md` | modified — appended approved Review r2. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Exact revision and boundary approved. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE worktree carries unrelated edits | Apply baseline must preserve them and tracked diff must isolate this design. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Settings link without route | Deferred Settings Design Plan | User approved r1 default. |
| Mobile drawer in this Apply | Separate Design Plan | User approved r1 default. |
| Static account icon/direct locale toggle/fabricated badge | Legacy avatar/ListBoxes/no badge | Binding legacy parity and data integrity. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply approved source boundary | `starci-fe-design-apply` for `legacy-listbox-r1`. |

## apply

Applied revision: `legacy-listbox-r1`.

Baseline commit: `1392cdcd15cde00b1662f7e1d449ae908789e2b2`.

Tracked diff: `1392cdcd15cde00b1662f7e1d449ae908789e2b2..worktree`.

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 1392cdcd15cde00b1662f7e1d449ae908789e2b2; D:\Repositories\starci-academy-backend / mtp @ 1dc850af005710a0186f1cf2b4c89238eb44e432 |
| Purpose | Apply approved `legacy-listbox-r1` directly in final FE source and prove runtime parity. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\shell-account-language-menus.md |
| Language | vi |
| Phase | apply |
| Touching | Approved Review r2 boundary: ShellNav twins/tests; AccountMenu twins/tests; new LanguageMenu twins/tests; DropdownShell/test; Icon/test; contracts index; en/vi messages; sign-out mutation/hook/tests and hooks index; canonical icon map; workflow file. |

### BASELINE

| Repository | Commit | Included | Excluded |
|---|---|---|---|
| Frontend | `1392cdcd15cde00b1662f7e1d449ae908789e2b2` | Current tracked/untracked source state before menu edits | Generated `.artifacts/**` screenshots and preview artifacts. |

### OUTPUTS

| Concept | Result |
|---|---|
| Apply start | Clean source baseline recorded before approved design writes. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/shell-account-language-menus.md` | modified — recorded Apply context and FE baseline. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Approved Review r2 authorizes the exact boundary. |

### WARNINGS

| Warning | Impact |
|---|---|
| Generated FE `.artifacts/**` remain untracked | Deliberately excluded from baseline and design diff. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | Apply has not received implementation feedback yet. |

### OWED

| Owed | Cleared by |
|---|---|
| Implement and prove `legacy-listbox-r1` | Complete approved source diff, gates and live-flow proof. |

## apply r2

Applied revision: `legacy-listbox-r1`.

Baseline commit: `1392cdcd15cde00b1662f7e1d449ae908789e2b2`.

Tracked diff: `1392cdcd15cde00b1662f7e1d449ae908789e2b2..worktree`.

Apply status: implementation đã hoàn thành trong approved source boundary; phase chưa được đóng vì hai repository-owned lint gates còn đỏ ngoài production delta này và live Sign out chưa được thao tác trên session đang đăng nhập.

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe / main @ baseline `1392cdcd15cde00b1662f7e1d449ae908789e2b2`; D:\Repositories\starci-academy-backend / mtp @ `1dc850af005710a0186f1cf2b4c89238eb44e432` |
| Purpose | Reconcile and prove the approved legacy avatar account ListBox and standalone language ListBox implementation. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\shell-account-language-menus.md |
| Language | vi |
| Phase | apply |
| Touching | Review r2 boundary only: ShellNav twins/tests; AccountMenu twins/tests; LanguageMenu twins/tests; DropdownShell/test; Icon vocabulary/docs; contracts index; en/vi messages; sign-out mutation/hook/tests and hooks index; workflow file. |

### COMPONENT AND PROPS RECONCILIATION

| Approved row | Diff proof | Verdict |
|---|---|---|
| `ShellNav` connected + pure MODIFY | Direct locale plumbing removed; `_ShellNav` composes exactly one `LanguageMenu` and one `AccountMenu`; signed-in static account `IconButton` removed. | implemented |
| `AccountMenu` connected + pure MODIFY | Connected owner resolves viewer/copy/routes/sign-out; pure owner has exhaustive `guest | signedIn` API, avatar trigger, static identity header, Dashboard/Profile/CV and danger Sign out. | implemented |
| `LanguageMenu` connected + pure ADD | New owner resolves locale and current pathname; pure menu exposes controlled `en`/`vi` single selection. | implemented |
| `DropdownShell` MODIFY | Added optional static header, `selectionMode`, `selectedId`, item indicator and danger tone without account/language copy. | implemented |
| `Icon` MODIFY | Added approved account destination/action semantic meanings and documentation. | implemented |
| sign-out transport/hook ADD | Added `signOut` mutation and SWR owner; local token/viewer cache clear only after backend success. | implemented |
| account identity contract | Reused existing `profile-avatar-name-handle-disclosure-row` and made disclosure optional instead of adding duplicate `account-menu-identity-header`; render semantics remain the approved static header. | reconciled: same owner/render, avoids duplicate contract and current registry type ceiling |
| Settings, badge, mobile drawer | No source implementation. | correctly excluded by Review r2 |

### AUTOMATED PROOF

| Proof | Command | Result |
|---|---|---|
| Focused behavior | `npx vitest run src/components/layouts/ShellNav/component.test.tsx src/components/blocks/auth/AccountMenu/component.test.tsx src/components/blocks/locale/LanguageMenu/component.test.tsx src/components/shells/DropdownShell/index.test.tsx src/modules/api/graphql/mutations/mutation-sign-out.test.ts src/hooks/swr/useMutateSignOutSwr.test.ts` | exit 0; 6 files, 12 tests passed |
| Typecheck | `npm run typecheck` | exit 0 |
| Canon sync/gate | `npm run gate:canon` | exit 0 |
| Production build | `npm run build` | exit 0; Next production build and route generation passed |
| Changed production lint | `npx eslint` over all changed production TS/TSX owners | exit 0 |
| Stale ShellNav API search | `rg -n "toggleLocale|localeLabel|guestMessage|signInLabel|signUpLabel|accountLabel" src/components/layouts/ShellNav` | exit 1 with empty output; no stale field/action remains |

### CROSS-REPOSITORY LINT PROOF

| Repository | Working directory | Exact command | Exit code | Verdict |
|---|---|---|---:|---|
| Frontend | `D:\Repositories\starci-academy-fe` | `npm run lint` | 1 | failed: repository traversal reports generated `.artifacts/**`, mirrored `plugins/eslint-canon/**`, and one `vendor-boundary` false-positive that classifies `DropdownShell/index.test.tsx` as a production shell; changed production source lint passes |
| Backend | `D:\Repositories\starci-academy-backend` | `npm run lint:check` | 1 | failed: 104 pre-existing/concurrent errors in course-review specs, CV evidence work and unrelated e2e files; no approved backend production enabler was required or changed |

### LIVE FLOW PROOF

| State | Route / fixture | UI | Network / Console / terminal | Verdict |
|---|---|---|---|---|
| Signed-in account | `http://localhost:3000/vi/courses/fullstack-mastery`; StarCi authorized test learner | Avatar trigger opens static actual name/email header outside menu items; exact Dashboard/Profile/CV/Sign out ListBox order; Sign out uses danger treatment. | FE `:3000`, API `:3001`, Keycloak `:8081` all healthy; open/close added no new Console warning. | pass |
| Language active locale | same Vietnamese route | Vietnamese `menuitemradio` has `aria-checked=true`; English false; selecting active Vietnamese is a no-op. | URL remained identical. | pass |
| Language switch | Vietnamese course route to English | Same-path locale replacement. | reached `http://localhost:3000/en/courses/fullstack-mastery`. | pass |
| Sign out | signed-in account menu | Mutation/hook and pending ownership covered by focused tests. | Live click not executed because it destroys the current authenticated browser session and requires action-time confirmation. | owed |

### OUTPUTS

| Concept | Result |
|---|---|
| Legacy account ListBox | Authenticated shell now uses the real avatar as trigger, a non-action identity header, existing Dashboard/Profile/CV destinations and danger Sign out. |
| Legacy language ListBox | Language is a standalone single-select menu with exactly one active indicator and same-path locale switching. |
| Ownership | Blocks own product meaning/copy, `DropdownShell` owns HeroUI mechanics, and `ShellNav` only composes chrome. |
| Integrity | No fake Settings route, notification badge or mobile topology was introduced. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/layouts/ShellNav/index.tsx` | modified — removed direct locale/copy ownership. |
| `src/components/layouts/ShellNav/component.tsx` | modified — composes account and language blocks. |
| `src/components/layouts/ShellNav/component.test.tsx` | modified — proves one block of each type and no static signed-in account icon. |
| `src/components/blocks/auth/AccountMenu/index.tsx` | modified — connected viewer/routes/sign-out owner. |
| `src/components/blocks/auth/AccountMenu/component.tsx` | modified — guest/signed-in legacy ListBox rendering. |
| `src/components/blocks/auth/AccountMenu/component.test.tsx` | added — guest/signed-in state and action proof. |
| `src/components/blocks/locale/LanguageMenu/index.tsx` | added — connected locale/path owner. |
| `src/components/blocks/locale/LanguageMenu/component.tsx` | added — pure single-select ListBox. |
| `src/components/blocks/locale/LanguageMenu/component.test.tsx` | added — selection/action proof. |
| `src/components/shells/DropdownShell/index.tsx` | modified — header, controlled selection, indicator and danger mechanics. |
| `src/components/shells/DropdownShell/index.test.tsx` | added — header/menu role and selection mechanics proof. |
| `src/components/contracts/index.ts` | modified — language menu slot and optional static identity disclosure. |
| `src/components/leaves/Icon/index.tsx` | modified — account destination/action semantics. |
| `src/components/leaves/Icon/icon.md` | modified — semantic icon documentation. |
| `src/messages/en.json` | modified — account and language menu copy. |
| `src/messages/vi.json` | modified — account and language menu copy. |
| `src/modules/api/graphql/mutations/mutation-sign-out.ts` | added — sign-out transport. |
| `src/modules/api/graphql/mutations/mutation-sign-out.test.ts` | added — transport proof. |
| `src/hooks/swr/useMutateSignOutSwr.ts` | added — sign-out mutation state owner. |
| `src/hooks/swr/useMutateSignOutSwr.test.ts` | added — success/failure cache ownership proof. |
| `src/hooks/index.ts` | modified — exports sign-out hook. |
| `.workflows/designs/starci-academy/shell-account-language-menus.md` | modified — Apply implementation, reconciliation and proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Live Sign out proof will end the current authorized test session | Confirm immediately before the click; otherwise retain the session and keep the connected/unit proof only. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE full lint includes generated artifacts and mirrored canon sources outside this design boundary | Repository lint cannot pass without a separate lint-sync/audit decision; expanding this Apply would violate Review r2. |
| `starci-fe/vendor-boundary` applies shell ownership logic to `DropdownShell/index.test.tsx` | Focused test lint has one false positive although the test passes and changed production source lint is clean. |
| Backend worktree contains extensive concurrent CV/course-review edits | The 104 backend lint errors are not attributable to this FE design and must not be overwritten here. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Import a vendor primitive into `DropdownShell/index.test.tsx` only to satisfy `vendor-boundary` | Route the file-classification defect to FE lint sync. | A fake import would suppress the symptom and violate the rule's intended ownership evidence. |
| Add a duplicate `account-menu-identity-header` contract after registry inference collapsed | Reuse the existing profile identity row with optional disclosure. | Same approved render semantics with no duplicate shape or global `never` regression. |

### OWED

| Owed | Cleared by |
|---|---|
| FE repository lint pass | `starci-fe-lint-sync-plan` measures generated/mirrored path handling and the shell-test false positive, then Review/Apply repairs the canonical rule boundary. |
| Backend repository lint pass | `starci-be-audit-plan` inventories the current 104 errors and routes an approved zero-error repair. |
| Live Sign out proof | Action-time user confirmation, then click Sign out and inspect UI, Network, Console and both terminals in the same window. |
| Close this Apply phase | Both rows in `CROSS-REPOSITORY LINT PROOF` pass and live Sign out is proved; until then this Apply record remains open. |
