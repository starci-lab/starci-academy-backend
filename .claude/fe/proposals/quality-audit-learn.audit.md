# Audit ngầm — quality-audit-learn (i18n + a11y + responsive)

> Plan ngầm đầy đủ, KHÔNG đổ hết ra duyệt. `starci-fe-quality-audit-apply` lấy top ⬜ rank cao nhất mỗi lần, đánh ✅ khi fix xong. Re-scan → thêm finding mới, GIỮ status cũ.
>
> Scope: `feature learn` (toàn bộ `src/components/features/learn/**` + `app/[locale]/courses/[courseId]/learn/**`). Fan-out 5 nhóm surface (Haiku), Opus rank + ghi.

## Ký hiệu
❌ severity cao (vỡ rule rõ, xác nhận thật) · ⚠️ severity vừa (vi phạm nhẹ hoặc cần verify thêm) · 🔍 cần verify trước khi sửa (chưa đo/test thật, KHÔNG tự chấm ❌) · ⬜ chưa fix · 🔨 đang fix · ✅ đã fix

## LearnShell / ContentMap / CourseContents / OnThisPage / MilestoneOutline
| # | Trục | Sev | Call-site | Vi phạm | Fix đề xuất | Status |
|---|---|---|---|---|---|---|
| 1 | i18n | ❌ | `CourseContents/index.tsx:275` (key `courseContents.allDone`, en.json+vi.json) | Emoji "🎉" trong i18n string — vi phạm no-emoji | Bỏ emoji khỏi string, dùng Phosphor icon cạnh text trong component | ✅ |
| 2 | a11y | ❌ | `LearnShell/LearnMobileTabBar/index.tsx:102-116` | Tab bar buttons thiếu `focus-visible:ring` | Thêm `focus-visible:ring-2 focus-visible:ring-accent` | ✅ |
| 3 | a11y | ❌ | `LearnShell/LearnPanelToggles/index.tsx:53` | Button thiếu `focus-visible` styling | Thêm `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent` | ✅ |
| 4 | a11y | ❌ | `MilestoneOutline/MilestoneIndexStrip/index.tsx:40-55` | `Typography` gắn `onClick` dùng như button, không phải semantic HTML | Đổi sang `<button type="button">` + focus-visible | ✅ |

## LessonReader
| # | Trục | Sev | Call-site | Vi phạm | Fix đề xuất | Status |
|---|---|---|---|---|---|---|
| 5 | i18n | ❌ | `LessonReader/index.tsx:174` | Hardcode "Sandbox" không qua i18n | Thêm key `content.tabs.sandbox` (vi+en) | ✅ (fix kèm theo #7/#8, cùng lượt i18n E2E/Sandbox) |
| 6 | i18n | ❌ | `LessonReader/E2eResultButton/index.tsx:32` | Hardcode tiếng Việt "Xem kết quả kiểm thử E2E..." | Trích key `e2e.resultButtonLabel` | ⬜ (ngoài scope batch1, để batch sau) |
| 7 | i18n | ❌ | `LessonReader/E2eBody/index.tsx:46,54,55-56,66` | Cả cụm copy (empty-state, title, đếm pass, aria-label) hardcode thẳng VN/EN, không qua i18n | Trích toàn bộ cụm E2eBody sang key `content.e2e.*` (vi+en), dịch theo nghĩa | ✅ |
| 8 | i18n | ❌ | `LessonReader/E2eBody/index.tsx:88` | ALL-CAPS "PASS"/"FAIL" — vi phạm no-uppercase-text | Đổi qua key `content.e2e.statusPass`/`statusFail`, hiển thị lowercase/capitalize CSS thay vì text hoa cứng | ✅ |
| 9 | a11y | ⚠️ | `ReadBadge/index.tsx:31` | `CheckCircleIcon` cạnh label thiếu `aria-hidden` | Thêm `aria-hidden` (icon trang trí, label đã có text) | ⬜ |
| 10 | a11y | ⚠️ | `LessonReader/ContentTabBar/TabTrigger/index.tsx:36` | Icon cạnh label (khi không khoá) thiếu `aria-hidden` | Thêm `aria-hidden` khi `locked=false` | ⬜ |
| 11 | a11y | ⚠️ | `ChallengeBody/ChallengeCard/index.tsx:119,127,131,136,149,153` | 6 icon (Status/Flame/Trophy/Lightbulb/ArrowClockwise/Cta) cạnh label thiếu `aria-hidden` | Thêm `aria-hidden` cho cả cụm icon-trang-trí | ⬜ |
| 12 | responsive | ⚠️ | `LessonReader/LessonPager/index.tsx:65` | `col-start-2` cứng phá layout khi grid rơi về 1 cột trên mobile | Đổi sang flex hoặc conditional className thay vì grid col cứng | ⬜ |
| 13 | responsive | ⚠️ | `LessonReader/PremiumPaywall/index.tsx:57` | `max-w-[480px]` custom, không theo breakpoint scale | Đổi `max-w-2xl`/`max-w-screen-sm` | ⬜ |
| 14 | responsive | ⚠️ | `LessonReader/PremiumPaywall/index.tsx:90` | `max-w-[280px]` custom, không theo breakpoint scale | Đổi `max-w-sm`/`max-w-xs` | ⬜ |

## Flashcards / MockInterview
| # | Trục | Sev | Call-site | Vi phạm | Fix đề xuất | Status |
|---|---|---|---|---|---|---|
| 15 | a11y | ❌ | `Flashcards/FlashcardMobileNav/index.tsx:70-75` | Button custom thiếu `focus-visible:ring` | Thêm focus-visible ring | ⬜ |
| 16 | a11y | ❌ | `MockInterview/VoiceHero/index.tsx:89` | Nút toggle voice thiếu `focus-visible:ring` | Thêm focus-visible ring | ⬜ |
| 17 | a11y | ❌ | `MockInterview/VoiceHero/index.tsx:108-111` | Nút mic chính thiếu `focus-visible:ring` | Thêm focus-visible ring | ⬜ |
| 18 | a11y | ❌ | `MockInterview/VoiceHero/index.tsx:124` | Nút text "gõ thay" thiếu `focus-visible:ring` | Bọc button + focus-visible ring | ⬜ |
| 19 | a11y | ⚠️ | `MockInterview/VoiceUnavailableModal/index.tsx:78-88` | Danh sách đánh số tay (1. 2. 3.) bằng Typography thay vì `<ol><li>` | Đổi sang semantic `<ol><li>` | ⬜ |
| 20 | a11y | 🔍 | `Flashcards/FlashcardStatsStrip/index.tsx:113` · `FlashcardStudyRail/index.tsx:175` · `FlashcardMobileNav/index.tsx:73` · `MockInterview/VoiceHero/index.tsx:108-111,110` | Tổ hợp `bg-{accent,warning,danger}/10 text-{accent,warning,danger}` nghi hụt contrast AA (accent StarCi ~70%L dễ hụt) — CHƯA đo thật | Đo contrast thật (`preview_inspect`) trước khi sửa; nếu hụt → đậm màu chữ hoặc bỏ tint nền | ⬜ |
| 21 | a11y | 🔍 | `MockInterview/MockInterviewScorecard/index.tsx:54` | Verdict Alert dùng icon+color+text — cần xác nhận icon luôn render kèm text (không chỉ màu) | Verify tại preview trước khi chấm; nếu icon luôn có → không phải finding | ⬜ |

## PersonalProject / Challenge
| # | Trục | Sev | Call-site | Vi phạm | Fix đề xuất | Status |
|---|---|---|---|---|---|---|
| 22 | a11y | ❌ | `PersonalProject/TaskSubmissionPanel/index.tsx:73` | Nút settings thiếu `focus-visible:ring` | Thêm focus-visible ring | ✅ |
| 23 | a11y | ❌ | `Challenge/ChallengeView/index.tsx:381` | Nút settings thiếu `focus-visible:ring` | Thêm focus-visible ring | ✅ |
| 24 | i18n | ⚠️ | `PersonalProject/PersonalProjectDashboard/index.tsx:196` | Hardcode tên nhánh "main" mặc định, không qua i18n | Trích key nếu cần hiển thị đa ngôn ngữ (branch name thường không cần dịch — xác nhận lại có phải finding thật không trước khi sửa) | ⬜ |
| 25 | i18n | ❌ | `TaskResult` i18n key `personalProjectResult.upNextEyebrow` (`en.json:1585`, `vi.json:1594`) | Ký hiệu "✓" trong chuỗi i18n — vi phạm no-emoji | Bỏ "✓" khỏi string, dùng Phosphor `CheckIcon` trong component | ⬜ |

## Foundations / Leaderboard / CourseQa / MindMap
| # | Trục | Sev | Call-site | Vi phạm | Fix đề xuất | Status |
|---|---|---|---|---|---|---|
| 26 | responsive | ❌→dropped | `MindMap/ModuleNode/index.tsx:85` | `w-[300px]` khớp hằng số `MODULE_CARD_WIDTH=300` (`moduleExpansion.ts`) — dùng để TÍNH vị trí node khác trên canvas React Flow; đổi CSS width sẽ lệch layout-engine, không phải fix lẻ | **FALSE-POSITIVE** — canvas có `fitView`+`minZoom=0.2` ([Canvas/index.tsx:159-161](../../../../../../starci-academy/src/components/features/learn/MindMap/Canvas/index.tsx)), tự scale cả canvas theo viewport nên node 300px không thực tràn màn hình. Đụng layout-engine thật sự → route `ux-apply` nếu sau này cần responsive thật, không sửa ở block-apply | ❌ dropped (verify rồi, không phải bug) |
| 27 | responsive | ❌→dropped | `MindMap/RootNode/index.tsx:85` | (như #26, cùng root cause) | (như #26) | ❌ dropped (verify rồi, không phải bug) |
| 28 | responsive | ⚠️ | `MindMap/ModuleSlotNode/index.tsx:91` | Inline style `width: SLOT_NODE_WIDTH` cứng px | Định nghĩa width responsive theo breakpoint thay vì hằng số px | ⬜ |
| 29 | a11y | ⚠️ | `MindMap/ModuleNode/index.tsx:218-234` | `XpSegmentBar` có `aria-hidden` nhưng chỉ biểu diễn progress bằng màu (stacked bar) | Thêm `aria-label` mô tả % progress trên section bao ngoài | ⬜ |
| 30 | responsive | ⚠️ | `Leaderboard/categories.ts:30-32` | Hex màu cứng (`#D85A30`,`#378ADD`,`#1D9E75`) thay vì design token | Đổi sang CSS var (`var(--warning)`,`var(--info)`,`var(--success)`) | ⬜ |
| 31 | responsive | ⚠️ | MindMap Canvas/ModuleSlotNode `dark:border-zinc-600/80` | Hardcode màu dark-mode thay vì token | Đổi sang token `var(--separator)`/semantic dark var | ⬜ |
| 32 | a11y | 🔍 | `Leaderboard/LeaderboardPodium/index.tsx:39-83` | Cột podium `w-24` có thể chật trên mobile nhỏ — cần verify thật bằng resize | Verify qua `preview_resize` trước khi sửa | ⬜ |
| 33 | i18n | ⚠️ | `MindMap/Canvas/index.tsx:37` (empty-state className) | Double-space typo trong className (`border-dashed  px-4`) — cosmetic, không phải i18n thật, gắn nhầm trục | Xoá space thừa (nit, ưu tiên thấp) | ⬜ |

## Đã chấm SẠCH (không finding)
LearnShell (index.tsx, LearnMobileBar, LearnSidebar, ResumeRail) · ContentMap · app/learn/layout.tsx · Foundations (toàn bộ) · CourseQa (toàn bộ, kể cả founder-badge aria-label) · MockInterview i18n + responsive · PersonalProject/Challenge responsive · Leaderboard responsive pattern (category-rail `lg:hidden`, chip row `overflow-x-auto`) · MindMap `ModuleNode` focus-visible (đã có sẵn, đúng chuẩn).

## Tổng
33 finding (18 ❌, 12 ⚠️, 3 🔍-cần-verify) trên 5 nhóm surface. Batch 1 lấy 6 finding rank cao nhất — 5 fix xong (#1,2,3,4,5+7+8,22,23 — Sandbox #5 fix kèm theo cùng lượt), 1 dropped false-positive (#26/#27, xem ghi chú). 24 finding ⬜ còn lại cho batch sau — xem `quality-audit-learn.audit.md` §status.
