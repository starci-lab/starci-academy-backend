# Plan ngầm — consolidate FE (scope = all) · scan 2026-07-07 (Haiku ×4, Opus chốt)

> Full list potential (nền). Mỗi batch surface **3 cụm ⬜ rank cao nhất**. Re-scan cập nhật · apply đánh **✅**.

| # | Cụm | Impact | Block đích | Call-sites | Status |
|---|---|---|---|---|---|
| 1 | **ModalShell** — scaffold `Modal>Backdrop>Container>Dialog>Close+Header+Body` (kèm ModalHeader/Title typography) | ⭐⭐⭐ 22 modal | NEW `ModalShell` (+ header slot) | 22/24 `components/modals/*` | ✅ |
| 2 | **SimpleEmptyState** — `<p text-sm text-muted>{i18n}</p>` y hệt, khác key | ⭐⭐ 3 identical | wrap block `EmptyState` | LessonBodyEmpty · CodeExplainingEmpty · CodeImplementationEmpty | ✅ |
| 3 | **TierCardBase** — tier card + footer feature-list lặp 2x | ⭐⭐ 2 + footer | NEW `TierCardBase` | AiSubscription `TierCard` · `FreeTierCard` | ✅ |
| 4 | **UserRowWithFollow** — row avatar+name+follow + follow-state dup | ⭐⭐ 2 + logic | NEW `UserRowWithFollow` | dashboard `WhoToFollow` · `TopLearners` | ⬜ |
| 5 | **DrawerShell** — `Drawer.Dialog p-0` + `p-3` header wrapper | ⭐ 3+ drawer | NEW `DrawerShell` | ContentAiChatDrawer · SubmissionAttemptsDrawer · MiniCartDrawer | ⬜ |
| 6 | **MobileSettingRow** — icon-box + label-stack lặp 2x | ⭐ 2, rẻ | NEW `MobileSettingRow` | navbar MobileNavbar (appearance + language) | ⬜ |
| 7 | **ScrollListBody** — `ScrollShadow + flex-col gap-3` list body | ⭐ 2 | NEW `ScrollListBody` | FeedbackDetailsModal · SubmissionAttemptsDrawer | ⬜ |
| 8 | **ModalStatus** — modal body-only centered status/processing | ⭐ status modals | NEW `ModalStatus` | AIProcessingModal + confirm/status | ⬜ |
| 9 | **ChallengeCardSkeleton** hand-roll → dùng `Skeleton.*` block (fix) | fix | reuse `Skeleton.*` | ChallengeCardSkeleton | ⬜ |
| 10 | **PressableCard** trùng TÊN (blocks vs reuseable, KHÁC component) → rename reuseable | fix (không gom) | rename `reuseable/PressableCard` → `SpringButton` | 2 file cùng tên | ⬜ |

## Giữ RIÊNG (KHÔNG gom — ngữ nghĩa khác dù hình giống)
Code Content Cards (`ExplainingCard`≠`ImplementationCard`, khác layout nội dung) · `LabeledCard`(title ngoài) vs `SectionCard`(title trong+divider) · chips domain-specific (9 loại) · search/async/skeleton/stats đúng tier riêng · SurfaceListCard đã reuse tốt ✅.

> **Kết luận scan:** blocks/reuseable well-organized (~0 dup thật); **duplication tập trung ở MODALS** (22/24 lặp scaffold) — ROI cao nhất. Learn/features đa số đã reuse block, chỉ vài cụm nhỏ.
