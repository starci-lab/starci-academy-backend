<!-- starci-workflow: v2 -->

# Brief — ESLint contract/branch enforcement cho `starci-academy-fe`

> **ACTIVE IMPLEMENTATION — 2026-08-17.** Phiên tạo brief này vẫn đang triển khai toàn bộ boundary
> bên dưới. Phiên khác đọc file để biết context và **không chỉnh chồng** các path trong hai bảng
> `Trust/canon/package candidates` và `Frontend candidates` cho tới khi workflow có Apply result hoặc
> ghi rõ đã dừng. Brief là concurrency handoff, không phải lệnh dừng phiên hiện tại.

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `C:\Repositories\ac\starci-academy-backend` |
| Source | `C:\Repositories\ac\starci-academy-backend` |
| Project | `starci-academy-fe` — user-declared |
| Frontend | `C:\Repositories\starci-academy-fe` |
| Backend | `C:\Repositories\ac\starci-academy-backend` |
| Trust | `C:\Repositories\ac\starci-academy-backend\.claude` |
| Skills | `C:\Repositories\ac\starci-academy-backend\.claude\skills` |
| App | `starci-academy-fe` |
| Repo / branch | Trust `C:\Repositories\ac\starci-academy-backend\.claude` / `main`; Frontend `C:\Repositories\starci-academy-fe` / `main`; workflow owner `C:\Repositories\ac\starci-academy-backend` / `mtp` |
| Purpose | Reservation/brief để phiên khác biết implementation đang diễn ra và tránh conflict; phiên hiện tại trực tiếp bỏ tier `shell`, bắt structural UI đi qua contract, siết comment/style ownership, phát hành `@starci/eslint-canon-fe@1.0.2` và migrate frontend sang package. |
| Workflow root | `C:\Repositories\ac\starci-academy-backend\.workflows` |
| Workflow | `C:\Repositories\ac\starci-academy-backend\.workflows\upgrade\starci-academy-fe\eslint-contract-branch-enforcement.md` |
| Language | `vi` |
| Phase | `apply — active; registry security gate open` |
| Touching | Phiên hiện tại đang ghi các path đã liệt kê. Phiên khác chỉ dùng brief để né conflict, không tiếp quản hoặc chỉnh chồng boundary. |

### DIRECT REQUIREMENT

Yêu cầu trực tiếp của founder trong phiên 2026-08-17:

1. Không giữ quan hệ hay tier `Shell -> Branch`; bỏ `shell` và đưa mechanics hợp lệ về `branch`.
2. UI structural ownership phải có contract để contract là context chuẩn cho LLM; càng build UI thì
   graph contract + code evidence càng chắc, không dựa vào hierarchy cố định.
3. Bổ sung ESLint tổng thể và siết chặt code comment.
4. Enforce ownership/style của `branches`, `leaves`, `blocks` và các tier còn lại; không để CSS door
   hoặc prop laundering tạo đường lách.
5. Dùng package thật `@starci/eslint-canon-fe`, nâng từ `1.0.1` lên đúng version founder yêu cầu:
   `1.0.2`, rồi cài vào `starci-academy-fe` thay plugin vendored.

`@starci/lint-fe` không tồn tại trên npm tại thời điểm audit (`npm view` trả `E404`), nên brief này
khóa package identity về package public đang tồn tại: `@starci/eslint-canon-fe`.

### BASELINE EVIDENCE

| Claim | Evidence | Result |
|---|---|---|
| Package public hiện tại | `npm view @starci/eslint-canon-fe name version dist-tags --json` | `latest = 1.0.1` |
| Package tên ngắn không tồn tại | `npm view @starci/lint-fe name version dist-tags --json` | `E404` |
| Canon FE package đủ file publish | `node .claude/scripts/verify-lint-packages.mjs` | `@starci/eslint-canon-fe@1.0.1`: 59 rules / 16 laws / 22 files, publishable |
| Effective adoption hiện tại | `node .claude/scripts/audit-fe-lint-adoption.mjs --target C:\Repositories\starci-academy-fe --probe ...\AccountMenu\component.tsx` | `ok: true`; không missing/non-error; inline config bị từ chối |
| Frontend mirror đã drift | `node .claude/scripts/sync-fe-lint.mjs --target C:\Repositories\starci-academy-fe` | 1 finding: `plugins/eslint-canon/` drift khỏi Trust |
| FE lint trực tiếp | `npx eslint .` tại frontend | Đỏ đúng 2 lỗi `no-structural-arrangement-in-leaf`: `CurriculumModuleRow`, `PricingPhaseDisclosure` |
| Canon twin tests | `npm test --prefix .claude/sources/fe` | 88 pass / 1 fail; `icon.test.mjs` còn trỏ path đã xóa `fe/canon/patterns/icon.md` |
| Repo twin tests với glob thật | `node --test "plugins/eslint-canon/*.test.mjs"` | 87 pass / 1 fail cùng stale icon path |
| Script repo hiện tại không chạy twin tests | `package.json` | `test:rules` glob `plugins/eslint/*.test.mjs`, trong khi thư mục thật là `plugins/eslint-canon/` |
| Canon gate checkout-dependent | `package.json` | `gate:canon` trỏ `../starci-academy-backend/.claude/...`; checkout thật nằm dưới `ac/` |
| Comment baseline | Scan 852 file `src/**/*.{ts,tsx,js,jsx}` | 118 file không có `/**`; phần lớn là tests/routes, nên định nghĩa comment phải được Review khóa trước khi rollout |
| Shell baseline | `src/components/shells/**` | 4 owners: `RouteShell`, `ModalShell`, `DrawerShell`, `DropdownShell`; 7 source files kể cả twin tests |
| Current rule surface | import `sources/fe/index.mjs` và đếm `default.rules` | 59 rules; `shell` vẫn được miễn trong `no-children-slot`, vendor boundary và file-layout vocabulary |

### CURRENT ESCAPE HATCHES

| Gap | Evidence | Required closure |
|---|---|---|
| `shells/` là tier miễn contract/children | `CHILDREN_SHELLS` có `ModalShell`, `DrawerShell`, `DropdownShell`, `RouteShell`; vendor rule whitelist `src/components/shells/` | Xóa tier/path exemption; mechanics branch nhận typed contract/render hoặc typed closed slots; không có arbitrary `children` trong component tiers. |
| Vendor mechanics bị gắn với tên shell | `vendor-boundary.mjs` dùng `SHELL_DIR`, `SHELL_FILE`, `FRAMEWORK_SHELL`; test/message đều nói shell | Đổi sang closed named mechanics branches; chỉ đúng owner được import vendor compound primitives. |
| Route conversion tồn tại chỉ để biến `children` thành `ComponentType` | `RouteShell` + bốn route layouts | Xóa `RouteShell`; Review chọn serializable route-surface contract hoặc explicit route-boundary node, rồi typecheck + runtime proof. Không dời nguyên exception sang `branches/`. |
| Export JSDoc chưa phủ mọi declaration | `comments.mjs` chỉ kiểm variable/interface/function/type alias và chỉ lấy declarator đầu | Bắt class/enum/default/multi-declarator; quyết định riêng file header và test exemption. |
| Hai leaf đang tự arrange structure | Direct lint findings | Reclassify/move structure sang composite/branch + contract; leaf còn lại chỉ giữ atomic/vendor glue. |
| Bảy rule repo-only chưa về canon | `CONTINUE.md` debt 4.2; search canon không có tên rule | Đưa về canon: `no-per-part-classname-prop`, `no-public-classname-prop`, `no-public-frame-css-props`, `no-css-door-type-laundering`, `source-tier-marker-matches-folder`, `contract-children-are-typed`, `no-parallel-skeleton`. |
| Canon tests đọc path cũ | `icon.test.mjs` ENOENT | Đổi anchor sang `fe/gates/patterns/icon/INDEX.md`; thêm test để docs relocation không tạo gate đỏ giả. |
| Vendored plugin và package tạo hai answers | Frontend imports `./plugins/eslint-canon/index.mjs` | Cài package, import package trong `eslint.config.mjs`, xóa mirror + `gate:canon`; verify chỉ còn một rule source. |

### PROPOSED ENFORCEMENT CONTRACT

| Area | Rule to hold |
|---|---|
| Tier closure | Không có `src/components/shells/`; source tier marker phải khớp folder; unknown/helper tier đỏ. |
| Branch | Structural host/arrangement chỉ qua contract; không public `className`, `style`, frame CSS props, arbitrary children hoặc ReactNode laundering. Mechanics branch phải là closed named owner và giữ typed content boundary. |
| Leaf | Chỉ một atomic/vendor primitive và glue nội tại; không nested structural hosts, không arrangement, không caller-controlled style door. |
| Composite | Closed data/actions; arrangement của chính nó đi qua contract; không arbitrary component/ReactNode slot. |
| Block | Connected/pure split giữ nguyên; pure block không tự viết structural style, không public CSS door; state chọn contract tree chứ không chọn parallel skeleton component. |
| Layout / overlay / page | Domain ownership được giữ nhưng structure vẫn đi qua contract; không shell exemption, không children hole ngoài framework route signature. |
| Contract | Contract key tồn tại, children typed, không duplicate/dead key, không raw host/class/marker; contract reason mang semantic context cho LLM. |
| Comments | Mọi public export production có role JSDoc. Non-obvious boundary/exception có comment `why`; không ép comment lại signature hay mọi dòng. Review phải quyết định có bắt file-level JSDoc và có exempt test/route mounting file hay không. |
| Lint policy | Mọi canonical rule ở `error`; `noInlineConfig`; không repo override hạ severity; package là source duy nhất. |

### ACTIVE CHANGE BOUNDARY — OTHER SESSIONS MUST AVOID

#### Trust/canon/package candidates

| Path | Candidate action |
|---|---|
| `.claude/sources/fe/package.json` | Bump `1.0.1 -> 1.0.2`; không đổi package name. |
| `.claude/sources/fe/comments.{mjs,test.mjs}` | Siết JSDoc coverage theo Review. |
| `.claude/sources/fe/file-layout.{mjs,test.mjs}` | Cấm shell tier; remove `shells` khỏi vocabulary. |
| `.claude/sources/fe/props-and-slots.{mjs,test.mjs}` | Xóa shell children exemptions; đóng CSS/ReactNode/children doors. |
| `.claude/sources/fe/contract.{mjs,test.mjs}`, `contracts.ts`, `props.ts` | Enforce contract children/types/tier markers và route-boundary shape đã duyệt. |
| `.claude/sources/fe/vendor-boundary.{mjs,test.mjs}` | Chuyển closed vendor ownership từ shells sang named mechanics branches. |
| `.claude/sources/fe/file-layout.mjs`, `contract.mjs`, `loading.mjs` hoặc law owner được Review chọn | Port bảy repo-only rules về đúng law, không gom vào một catch-all file. |
| `.claude/sources/fe/icon.test.mjs` | Sửa stale canon path. |
| `.claude/sources/fe/index.{mjs,test.mjs}`, README | Gather rules, lock declaration/ship count, document package adoption. |
| `.claude/fe/gates/{patterns,lints}/**` và `.claude/INDEX.md` | Sửa canon/audit/example/changelog cho no-shell + strict contracts; exact modules phải được Review freeze, không bulk rewrite toàn shelf. |

#### Frontend candidates

| Path | Candidate action |
|---|---|
| `package.json`, `package-lock.json` | Install exact `@starci/eslint-canon-fe@1.0.2`; remove `gate:canon`; fix/remove dead `test:rules` based on package test ownership. |
| `eslint.config.mjs` | Import package, không import local mirror; retain strict effective config and repo-owned globs only. |
| `plugins/eslint-canon/**` | Delete generated/vendored rule copy after package parity is proved. |
| `src/components/shells/**` | Delete tier. `RouteShell` is removed, not mechanically moved. Modal/Drawer/Dropdown behavior becomes reviewed named branch owners. |
| `src/components/branches/**` | Add/modify named mechanics branches with typed contract content and twin tests. Exact names require Review. |
| `src/app/[lang]/**/layout.tsx` và connected layouts receiving `surface` | Remove RouteShell call sites; adopt the reviewed serializable route-boundary contract. |
| Overlay/block call sites importing Modal/Drawer/Dropdown shell | Migrate imports and APIs; preserve vendor mechanics and visible behavior. |
| `src/components/leaves/{CurriculumModuleRow,PricingPhaseDisclosure}/**` | Move structural ownership out of leaf; update imports/tests/contracts. |
| `src/components/contracts/{index.ts,props.ts}` | Add only identities/types required by approved branch/route migration. |

### IMPLEMENTATION SEQUENCE FOR THIS SESSION

1. Run `starci-fe-upgrade-review` over this brief and freeze:
   exact rule names, comment coverage, mechanics branch names, route boundary type, canon doc paths and
   Trust write boundary.
2. Apply Trust changes and twin tests first. Require declaration count = shipped count and all FE package
   tests green before packaging.
3. Run `node .claude/scripts/verify-lint-packages.mjs` and `npm pack --dry-run` in
   `.claude/sources/fe`.
4. Security gate: revoke the npm token named as exposed in `.claude/CONTINUE.md`; authenticate with a
   replacement session; use `npm whoami` without printing token material.
5. Publish only with explicit external-state approval:
   `npm publish --access public`, then prove
   `npm view @starci/eslint-canon-fe@1.0.2 version`.
6. Open a linked `starci-fe-lint-sync-plan/review/apply` for frontend migration. Record clean baseline
   commit/HEAD before production writes.
7. Install exact version, remove vendored plugin, migrate components, and repair every strict finding
   without disable/warn/override.
8. Run acceptance proof below and append Review/Apply to this workflow or the linked lint workflow as
   appropriate. Do not claim complete while publish or runtime proof is owed.

### ACCEPTANCE PROOF

| Gate | Command / evidence | Pass condition |
|---|---|---|
| Canon FE twins | `npm test --prefix .claude/sources/fe` | 0 fail; no stale path |
| Package completeness | `node .claude/scripts/verify-lint-packages.mjs` | every imported rule published; declaration count = shipped count |
| Tarball | `npm pack --dry-run` | only intended source/docs included; no token/artifact/test drift |
| Registry | `npm view @starci/eslint-canon-fe@1.0.2 version` | exact `1.0.2` exists after authorized publish |
| Dependency | inspect frontend package + lock | exact `@starci/eslint-canon-fe@1.0.2`; no local/file/absolute checkout dependency |
| Effective config | `audit-fe-lint-adoption.mjs` with real production probe | `ok: true`, all rules `error`, inline config refused |
| No second source | search config/tree | no `plugins/eslint-canon/**`, no `gate:canon`, no trust sync import |
| Tier closure | search + new rule fixtures | no `src/components/shells`, no `shape: "shell"`, future shell fixture fails |
| Contract/style closure | new twin tests + FE lint | raw structure/style/children/CSS-door fixtures fail in branch/block/layout/overlay/page; valid atomic leaf passes |
| Comments | twin tests + FE lint | approved production export/header policy strict; tests/routes follow reviewed exemption policy |
| Frontend lint | `npm run lint` | 0 error / 0 warning from strict config |
| Type safety | `npm run typecheck` | exit 0 |
| Tests | `npm test` | exit 0 |
| Rule tests | corrected package-owned/repo command | executes a non-zero number of tests and exits 0 |
| Build | `npm run build` | exit 0 |
| Runtime | affected modal/drawer/dropdown/routes | UI, keyboard/focus/dismissal, Network, Console and terminals show no unexplained regression |

### OUTPUTS

| Concept | Result |
|---|---|
| Strict FE ESLint `1.0.2` handoff | Evidence-backed Plan khóa mục tiêu no-shell, contract-first structure, comment policy, tier style ownership, package release và frontend migration. |
| Package identity | Giữ `@starci/eslint-canon-fe`; không tạo hoặc alias package `@starci/lint-fe`. |
| Current quality debt | Hai leaf structural violations, one mirrored-plugin drift, one stale icon test path, dead rule-test glob và checkout-dependent gate đã được đo cụ thể. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy-fe/eslint-contract-branch-enforcement.md` | added — brief bàn giao và concurrency reservation cho implementation đang active. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Comment coverage chính xác cho `1.0.2` | Recommended: mọi public production export có role JSDoc + file-level role doc cho production owner files; tests và route mounting-only files không bắt file header. Alternative: mọi `src` file kể cả tests/routes bắt header. |
| Tên branch thay bốn shell | Recommended: xóa `RouteShell`; giữ product-neutral mechanics names nhưng đổi suffix sang `Branch` (`ModalBranch`, `DrawerBranch`, `DropdownBranch`). Alternative: giữ tên `*Shell` dù đặt dưới branches — không khuyến nghị vì vocabulary vẫn nói shell. |
| Route boundary | Recommended: route truyền serializable `ReactNode` vào connected layout và layout đóng nó ngay tại named contract/typed projection; không tạo branch chỉ để lách `children`. Alternative: thêm branded serializable contract-node type sau runtime spike. |
| Publish npm `1.0.2` | Chỉ publish sau khi token cũ đã revoke, replacement auth được xác nhận và user cho phép external publish. Nếu chưa có quyền, dừng sau `npm pack --dry-run`. |
| Patch version | Founder yêu cầu `1.0.2`; giữ đúng yêu cầu. Warning: thêm/cứng rule có thể được consumer xem là behavior change phù hợp minor `1.1.0`, nhưng không tự đổi version. |

### WARNINGS

| Warning | Impact |
|---|---|
| `.claude/CONTINUE.md` nói npm token từng xuất hiện trong chat. | Không publish bằng session/token chưa được xác nhận đã thay; supply-chain risk cao hơn nợ code. |
| No-shell touches runtime focus/backdrop/dropdown and Next route serialization. | Static lint/typecheck không đủ; cần live flow proof cho modal, drawer, dropdown và nested route layouts. |
| `1.0.2` adds stricter behavior. | Existing external consumers may start failing lint on patch upgrade; release notes must state migration. |
| 118 files lack any JSDoc but many are tests/routes. | Enforcing file header without reviewed scope creates mass boilerplate rather than useful context. |
| Canon source currently has seven repo-only rules missing. | Publishing only no-shell changes would still ship a package weaker than the live repository policy. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Fixed hierarchy `Shell -> Branch` | Contract graph follows real ownership/composition; `shell` tier is removed. | Founder corrected the hierarchy assumption explicitly. |
| Install `@starci/lint-fe` | Upgrade/install `@starci/eslint-canon-fe@1.0.2`. | Registry returns `E404`; existing public package is the canonical identity. |
| Move `RouteShell` unchanged into `branches/` | Remove it and settle a real route-boundary contract. | Mechanical move keeps the same untyped `children` escape hatch under a different folder. |
| Add comments to every line/signature | Role JSDoc + comment non-obvious `why`. | Repeating code creates noise and weakens LLM context quality. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact Review revision and Trust write boundary | Run `starci-fe-upgrade-review`, resolve all `NEED APPROVALS`, append `Approved revision: <id>`. |
| Canon/rule implementation | Approved upgrade Apply with twin tests and package completeness proof. |
| Safe npm release | Revoke exposed token, authenticate replacement, explicit publish approval, publish and `npm view` proof. |
| Frontend migration | Linked lint-sync Plan/Review/Apply installing exact package and removing vendored plugin. |
| Full static/runtime proof | All commands and live flows in `ACCEPTANCE PROOF` pass with evidence. |

## Review — 2026-08-17

Founder clarified that this document is only a concurrency brief: the current session owns and
continues the implementation, while other sessions must avoid the active boundary. The reviewed
decisions are therefore:

| Decision | Reviewed result |
|---|---|
| Tier model | Remove `shell` entirely. There is no fixed `Shell -> Branch` hierarchy. |
| Mechanics owners | Rename the real mechanics owners to `ModalBranch`, `DrawerBranch` and `DropdownBranch`; remove `RouteShell` instead of disguising it as a branch. |
| Route content | Route layouts receive `ReactNode`, then close it immediately inside a named contract projection owned by the connected/pure layout boundary. |
| Contract grammar | Every contract entry declares typed child ownership; a slot may name one or more approved owner identities when the real UI is a closed union. |
| Style ownership | Public `className`, per-part class props, frame CSS props and CSS-door type laundering are forbidden outside their owning atomic implementation. |
| Comments | Public production exports require role JSDoc. Comments explain ownership/why; they do not narrate obvious code. |
| Package | Keep the canonical identity and exact requested version: `@starci/eslint-canon-fe@1.0.2`. |
| Release | Publishing remains blocked until the founder confirms the exposed npm token was revoked and current auth is its replacement. |

## Apply — 2026-08-17 (ACTIVE; REGISTRY GATE OPEN)

### Implemented

- Canon package bumped to `1.0.2`; it publishes 66 strict rules gathered from 16 laws.
- Added no-shell/source-tier enforcement, typed contract-child enforcement, public CSS-door closure,
  stronger export JSDoc coverage and branch-owned vendor mechanics.
- Removed `src/components/shells/RouteShell`; migrated modal, drawer and dropdown mechanics into named
  branches with typed `contract`/`render` projections.
- Refactored the two structural leaf violations into composites; added a typed native
  `DisclosureBranch`, atomic `DisclosureIndicator` and the required curriculum/pricing contract keys.
- Route layouts now close passed surfaces at their named contract projections. Overlay markers use
  `shape: "overlay"`; source markers agree with their owning tiers.
- Updated production public GraphQL enum exports with role JSDoc. No lint disable, warning rollout or
  local override was introduced.

### Evidence

| Gate | Result |
|---|---|
| Canon twins | `npm test` in `.claude/sources/fe`: 99/99 passed. |
| Package completeness | `verify-lint-packages.mjs`: 66 rules / 16 laws / 22 published files. |
| Tarball | `npm pack --dry-run`: `@starci/eslint-canon-fe@1.0.2`, 22 intended files, about 74.4 kB. |
| Frontend strict lint | `npx eslint .`: passed with 0 errors and 0 warnings. |
| Affected frontend tests | 12 files / 30 tests passed, covering branches, refactored composites, overlays, layouts and affected course pages. |
| Full frontend suite | 186/200 files passed. Remaining baseline failures are outside this boundary: Next navigation resolver fixtures, hooks barrel expectation, connected intent fixture drift, dashboard/ResizeObserver fixtures, Apollo link count and query-course expectation drift. |
| Build/type | Next compilation succeeds, then stale `.next/dev/types/validator.ts` route typing fails; direct typecheck also sees stale generated route imports. This generated baseline blocker is recorded, not hidden. |
| Registry identity | `npm whoami` returns `starciteacher`; `npm view @starci/eslint-canon-fe@1.0.2` still returns `E404`, so no release is being claimed. |

### Open release/install step

Do not publish while the token-rotation confirmation is absent. After the founder explicitly confirms
the exposed token was revoked and current npm auth is the replacement, this same session will publish
`1.0.2`, verify it from the registry, install it as an exact dev dependency in the frontend, remove the
vendored `plugins/eslint-canon` second source and rerun the effective-config/lint gates. Until then this
Apply remains active and its file boundary remains reserved.
