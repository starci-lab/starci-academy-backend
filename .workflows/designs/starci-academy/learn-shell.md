# learn-shell

The spine the eleven learn modes hang off. The reader inside it is its own task -
[`learn-content-page.md`](learn-content-page.md) - and this one settles the frame around it.

## plan

| | |
|---|---|
| Doing | The learn spine: which modes exist, how they group, what a locked one looks like, what collapses |
| Repo / branch | `starci-academy-fe` @ `main` |
| Touching | `.artifacts/design-plan/learn-shell/` |
| Not touching | all production source; `starci-academy` is read-only evidence |
| Produces | three directions at `127.0.0.1:8088` |

**Chose** direction A — three named groups, as legacy has them. Chosen by the user with no reason
stated; it is also the parity-first option, which is the one a migration is supposed to offer and
the one that risks least.

Read at `starci-academy@9a19342`, not assumed:

| Evidence | What it settled |
|---|---|
| `useSidebarNavItems` | The rows and their groups: **path** (Học phần, Dự án cá nhân), **practice** (Ôn tập, Phỏng vấn thử, Nền tảng, Playground → Docker/Kubernetes/RAG), **track** (Sơ đồ tư duy, Bảng xếp hạng, Hỏi đáp) |
| `LearnShellLayout` | The geometry: an icon rail that collapses in place and persists its own width, then the route's own left rail, then the content column at `p-6`, then the route's right rail. Below `lg` all of it folds into a bottom tab bar |
| `learn/` route segments | Eleven surfaces, and which of them go full-bleed during a live assessment (quiz, mock interview, playground session, mind map) |

| Took | Because |
|---|---|
| Group names stay Vietnamese, legacy's own: Lộ trình / Ôn & luyện / Theo dõi | The reader already knows them, and renaming a group a returning learner navigates by is a change nobody asked for |
| A locked mode stays VISIBLE with a lock rather than hidden | A learner who cannot yet open the capstone still needs to know the course has one — hiding it makes the course look smaller than it is, to exactly the reader who has not paid yet |
| Resume is a card at the top of the spine, not a row inside it | It is the one thing that answers "where was I", and a row would put it in a list of places rather than above them |
| Playground's three exercises nest under it rather than standing as peers | They are one surface with three entrances; three top-level rows would read as three modes |
| A row's trailing slot holds one fact — due-card count, or rank — never an action | It reads as part of the label sentence, and a control there gets pressed by somebody who meant to read it |

| Open | Settled by |
|---|---|
| What the spine does below `lg` | Preview, with the states rather than in the abstract. Legacy's answer is a bottom tab bar, and the reader's own mobile answer folds into it |

## review

| | |
|---|---|
| Doing | Build spine A from the real components, contracts and tokens, and render every state it can be in |
| Repo / branch | `starci-academy-fe` @ `main` |
| Touching | `.artifacts/design-plan/learn-shell/candidate/` |
| Not touching | all production source |
| Produces | five states at `127.0.0.1:8090` |

| Owner | State | Rendered? |
|---|---|---|
| LearnSpine | enrolled, everything open | yes — `screens/spine-enrolled.png` |
| LearnSpine | trial viewer, two modes gated | yes — `screens/spine-trial.png` |
| LearnSpine | enrolled, nothing started (no resume) | yes — `screens/spine-fresh.png` |
| LearnSpine | course still arriving | yes — `screens/spine-pending.png` |
| LearnShellLayout | below the rail breakpoint | measured, not photographed — see below |
| LearnShellLayout | a live assessment taking the whole screen | no — legacy drops the rails for quiz, mock interview, playground session and mind map. Those are `learn-mode-surfaces`, and the frame's part of it is one boolean nobody can judge without a surface to hide |

**The phone state is verified by measurement rather than by an image.** Headless Chrome lays the page
out at a wider viewport than `--window-size` gives it and then crops, so its capture shows two tabs.
Measured in a real browser at 375px: `Khoá học` 16→103, `Mục lục` 147→225, `Trang này` 269→359, bar
375 wide, `scrollWidth` 375 — three tabs, no overflow. The image in `screens/spine-phone.png` is the
headless one and is not evidence.

**Backend:** nothing proposed. Every row is a route the product already has; the two facts a row can
carry — due-card count and rank — are already served by `useQueryMyLeagueSwr` and the flashcard
queries, and neither is wired here because the spine takes them as data.

| Took | Because |
|---|---|
| Groups carry no divider between them | The group name already separates the runs. Legacy needed a rule because its labels were smaller than its rows; these are not |
| A locked row ends in the WORD, not a glyph | The icon set has a closed lock, but its meaning there is `password`. One name for two meanings costs the day a password field changes glyph and every locked row is silently relabelled. Adding a `locked` meaning belongs to the icon leaf — recorded as owed |
| The resume card drops its own count | `Tiếp tục · 1/153` above a progress row that also prints `1/153` says the same number twice; the row owns it |
| The third tab is `Trang này` | `Trên trang` does not fit three tabs at 375px, and the shorter name says the same thing |
| The rail is ABSENT below `md`, not narrower | A rail that shrinks to icons on a phone spends width on chrome that a bottom bar gives back to the reading |
| Group names never rest | They come from the route, so they are true before the course arrives. The first build rested them, which claimed the frame did not yet know what it was |

**Approved:** direction A as rendered, after the group-name fix — the user's "ok" to
"approve spine A as shown, or fix `spine-pending` first?" was taken as the second, and the fix landed
before this line was written.

**Owed:** a `locked` meaning in the icon leaf; the full-bleed assessment state; a real screenshot of
the phone state from something that lays out at the width it is given.


| Rejected | Instead | Why |
|---|---|---|
| A lock GLYPH on a locked row, as the plan had said | the word, until the icon leaf gains a `locked` meaning | The set's lock is named `password`; one name for two meanings means a password field's glyph change silently relabels every locked row |

## apply

Open — the phase printed its boundary and is waiting on the answer.

| Rejected | Instead | Why |
|---|---|---|
| The confirm printed as an aligned `CHOOSE`/`CONFIRM` block | the same two questions as tables | *"sao không render cái bảng luôn mà render cái gì khó hiểu vậy"* — the block only lines up in a monospace box, and a real command runs past its edge |

| Wrote | Note |
|---|---|
| `src/components/contracts/index.ts` | six entries MERGED into the current table, never over it — another session had added a whole family since Preview |
| `src/components/blocks/learn/LearnSpine/component.tsx` | new |
| `src/components/layouts/LearnShellLayout/component.tsx` | new, pure |
| `src/components/layouts/LearnShellLayout/index.tsx` | new, connected — resolves navigation only |
| `src/messages/vi.json`, `src/messages/en.json` | `learn.shell`: three group names, nine rows, three tabs, one lock word |

| Green | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npx eslint <every path above>` | 0 errors |
| `npm run build` | exit 0 |

| Extended | What it means |
|---|---|
| The contract table had moved under the run | Apply MERGES entries now rather than writing the reviewed table over the target. Copying would have deleted `coding-practice-page`, `judge-console` and `domain-mastery-grid` — a whole parallel session's work |

| Rejected | Instead | Why |
|---|---|---|
| Mounting the frame by passing a component from the route layout | `RouteShell`, a fourth shell |  A server component cannot hand a client one a FUNCTION. It fails as a server exception with a digest and no line number, which is what the running page returned |
| Mounting it by taking `children` on the connected layout | `RouteShell`, so the exemption follows one named component rather than a folder |  `starci-fe/no-children-slot` refuses it, and the rule is right about every tier it was written for |
| Renaming the prop to `surface: ReactNode` to get past that rule | nothing — refused by this run | It would pass the rule and keep the problem, which is the definition of gaming a gate |

| Owed | Cleared by |
|---|---|

| A `locked` meaning in the icon leaf | `$starci-fe-fidelity-plan` |
| The full-bleed assessment state | `learn-mode-surfaces`, a later task |
| A real screenshot of the phone state | a capture tool that lays out at the width it is given |

| Wrote, second pass — the mount | Note |
|---|---|
| `src/components/shells/RouteShell/index.tsx` | the fourth shell: converts the framework's children into a component and arranges nothing |
| `src/app/[lang]/courses/[displayId]/learn/layout.tsx` | mounts the frame around every learn surface |
| `.claude/fe/canon/uxui/layers/shell.md` | SHELL-1 admits four; SHELL-6 says what the fourth may do |
| `.claude/sources/fe/props-and-slots.mjs` | `RouteShell` added to the children exemption, with its twin test |
| `.claude/sources/fe/vendor-boundary.mjs` | the SECOND shell list, which still named two, brought in line — and exempted from needing a vendor import |

| Green, second pass | Result |
|---|---|
| canon gate | 165 pass, 0 fail |
| `npx tsc --noEmit` | clean |
| `npx eslint <every path>` | 0 errors |
| `npm run build` | exit 0 |
| the real page at 1280px | frame present, spine `flex` at 288px, 9 rows, bottom bar `none` |
| the real page at 375px | spine `none`, bottom bar present with its three tabs |
