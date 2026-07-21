# INDEX — Features (catalog VÍ DỤ THẬT: canon áp vào feature nào)

> `features/` KHÔNG phải lớp design-canon (foundations/layouts/components/patterns/principles) — nó là **catalog
> worked-example**: mỗi feature THẬT của app áp canon ra sao qua 4 lens **Job · Shell(→layouts) · CTA · Links · Psychology**.
> Grounded 1-1 với `src/components/features/*`. Dùng khi: dựng/sửa 1 feature → mở doc của nó xem shell + CTA + phễu +
> hiệu ứng đang dùng; hoặc học pattern từ feature anh em.
>
> ⚠️ **GROUNDED THEO NGỮ NGHĨA (STRICT):** Links · CTA · Psychology của mỗi feature CHỈ khẳng định khi **data THẬT nối**
> (FK trong DB entities / content-nesting trong `.mount`). **CẤM bịa cross-link/phễu giữa feature KHÔNG liên quan** —
> vd `challenge` (con của lesson) ≠ `personal-project task` (milestone riêng): đừng nhồi link/CTA giữa chúng. Kiểm
> `.mount/data/` + `src/modules/databases/postgresql/**/entities` TRƯỚC khi ghi 1 link. Không có quan hệ thật → ghi
> "độc lập", ĐỪNG ép phễu. Phễu-về-khóa chỉ đặt ở chỗ **thật sự** dẫn tới học (vd điểm yếu → module dạy nó), không rải khắp.

## Học / luyện (learn)
| Feature | Job → Shell | Nguồn |
|---|---|---|
| [[challenge]] | giải đề tập trung → [[solving-surface-fullbleed-no-course-rails]] ⚠️ | `features/learn/Challenge` |
| [[mock-interview]] | phỏng vấn thử → [[full-bleed-work-surface]] ⚠️ | `features/learn/MockInterview` |
| [[flashcards]] | ôn thẻ SRS → [[master-detail-rail]] | `features/learn/Flashcards` |
| [[personal-project]] | capstone nhiều chặng → [[dashboard-hub]]/home | `features/learn/PersonalProject` |
| [[lesson-reader]] | đọc bài phân cấp → [[docs-three-pane-reader]] | `features/learn/LessonReader` |
| [[leaderboard]] | xếp hạng XP → [[master-detail-rail]] | `features/learn/Leaderboard` |
| [[mind-map]] | bản đồ khóa → [[fullbleed-canvas-no-chrome-and-orient-zoom]] | `features/learn/MindMap` |
| [[content-ai-chat]] | trợ giảng AI (FAB+selection-ask) → overlay/in-panel | `features/learn/ContentAiChat` |
| [[course-qa]] | hỏi đáp khóa | `features/learn/CourseQa` |
| [[foundations]] | tài nguyên nền tảng | `features/learn/Foundations` |

## Bán hàng / tiền (commerce)
| [[course-catalog]] | duyệt khóa → [[catalog-grid]] · [[course-detail]] marketing-first 2-col · [[cart-view]] → [[centered-form-setup]] · [[membership]] ⚠️ phễu mỏng |

## Hồ sơ / identity
| [[cv]] editor CV → editor-shell · [[public-profile]] → [[dashboard-hub]] · [[user-streak]] ⚠️ hardcode 0 (dup chết của StreakStrip) |

## Hub / xã hội
| [[dashboard]] ⭐ showcase tâm lý (Hook + goal-gradient + social-proof) → [[dashboard-hub]] · [[community-feed]] feed-column ⚠️ signed-out no-CTA |

## Nghề nghiệp · luyện code · landing
| [[jobs]] → [[catalog-grid]] · [[headhunting]] · [[practice-problem]] ⚠️ telemetry no-disclosure · [[landing]] ⭐ social-proof/authority ⚠️ StatStrip fallback 99 |

## ⚠️ Issue layout/CTA/phễu (agent bắt khi grounding — cần audit)
- **mock-interview** — 4 pha nhồi 1 cột hẹp, workspace ẩn toggle → fix theo [[full-bleed-work-surface]] (ca demo đầu).
- **challenge** — giữ rail khóa, nghịch [[solving-surface-fullbleed-no-course-rails]] → audit như mock-interview.
- **flashcards** — docstring nói rail nhưng JSX render inline → reconcile.
- **user-streak** — `current/longest` hardcode `0`, strip tĩnh, không wire SWR (bản dup chết) → xóa/wire.
- **membership** — perk tĩnh, 0 proof/preview/scarcity → phễu yếu nhất, cần social-proof + preview ([[persuasion-psychology]]).
- **community-feed (chat signed-out)** — text câm không nút → thêm CTA ([[call-to-action]]).
- **landing StatStrip** — `FALLBACK_STATS=99` khi lỗi → thổi số khi thật <99, nghịch `fair-monetization-axiom` → gate honest.
- **practice-problem** — log paste/keystroke/tab-blur chống gian lận không disclosure → cân nhắc minh bạch.

## Cách dùng
- Dựng/sửa feature X → mở `features/X.md` xem shell + CTA + links + psych đang áp; thiếu chỗ nào → tra lớp canon tương ứng.
- Feature mới → tạo `features/<name>.md` cùng format (Job · Shell · CTA · Links · Psychology · Ghi chú), neo `src/components/features/`.
