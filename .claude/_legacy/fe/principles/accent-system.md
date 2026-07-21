# Concept — Hệ thống ACCENT: 4 vai · mỗi element 1 KÊNH · "đang chọn" (tonal) ≠ "trạng thái" (icon)

> Heuristic màu (họ `concepts/*`). Bộ luật ĐẦY ĐỦ về dùng accent (hồng StarCi) — **gom + nâng** luật "accent = gia vị, không tô nền khối" (đã hợp nhất `highlight-accent-as-detail-not-block-fill` vào đây 2026-07-07) + [[elements/color]] §2 (active = tonal) + [[elements/button]] (CTA solid) + [[hover-style-matches-clickable-nature]]. Rút từ vụ thầy chỉ (2026-06-30): cùng nghĩa "đang chọn/current" mà lúc full-text-accent (sidebar), lúc icon-accent + chữ foreground (body path), lúc text-accent (TOC) → lộn xộn. Research: [Material 3 — đừng dùng accent cho status](https://m3.material.io/styles/color/roles) · [ux4sight — accent sparingly](https://ux4sight.com/blog/ux-training-how-to-optimize-the-use-of-accent-colors).

## Nguyên tắc gốc (STRICT)
- **Accent = TÍN HIỆU, KHÔNG trang trí.** 1 màn chỉ **vài điểm** accent (60-30-10). Accent CHỈ cho **4 vai** dưới; mọi chỗ khác → KHÔNG accent.
- **Mỗi element CHỈ 1 KÊNH accent** (nền HOẶC chữ HOẶC icon HOẶC border — không gộp 3). Chọn kênh theo bảng §3.
- **Accent KHÔNG dùng cho STATUS** (done/locked/error). Status → **semantic** (success xanh / muted / danger). Accent để dành cho "đang chọn · đi tiếp · của tôi · CTA".

## 1. Bốn vai được dùng accent
| Vai | Ví dụ |
|---|---|
| **CTA chính** | "Tiếp tục học", "Đăng ký" (1 primary/màn — [[elements/button]]) |
| **Đang chọn** (selected view) | nav/tab/sidebar item đang mở · category đang lọc |
| **Brand** | logo · 1 từ hero |
| **Của tôi / value nhấn** | "hạng của tôi", "XP của tôi" trong list |

## 2. Discriminator chính ⭐ (STRICT) — giải vụ "lộn xộn"
**"ĐANG CHỌN" (tôi click, đây là view/filter đang mở) ≠ "TRẠNG THÁI" (done/current/locked của nội dung).** Hai thứ render KHÁC nhau:
- **ĐANG CHỌN** (persistent selection: nav row, tab, sidebar, category, radio-card) → **tonal**: `bg-accent/10` + **label & icon CÙNG accent**.
- **TRẠNG THÁI** (transient state trong 1 list tiến trình: bài đang học, bước hiện tại) → **chỉ ICON mang màu**, text **foreground**, **KHÔNG tint nền row**. (current = accent icon · done = success xanh · todo/locked = muted.)
- **Hỏi nhanh:** element này là *view tôi vừa CHỌN để mở* (→ tonal) hay *trạng thái của 1 item trong danh sách* (→ icon-only)? Tô tint cho status = nó giả dạng "selected" = lộn xộn.
- **Vì sao:** tint + icon + chữ đều accent trên 1 status-row làm mắt đọc "đã chọn nav"; trong khi cùng list còn done/todo dùng màu khác → 1 list 2 ngôn ngữ. Status để icon gánh màu (current=accent là điểm "đi tiếp" duy nhất), nền trong suốt → list sạch, accent đúng 1 điểm.

## 3. Bảng 6 KÊNH canonical (mỗi element 1 kênh)
| Element / state | Accent ở ĐÂU | CẤM |
|---|---|---|
| **CTA chính** | **solid** `bg-accent` + chữ/icon trắng (`--accent-foreground`) | tint, text-accent |
| **Nav/tab/sidebar ĐANG CHỌN** | `bg-accent/10` + **label & icon CÙNG accent** (tonal) | chỉ-icon, chỉ-text |
| **Text-list active** (TOC, breadcrumb current, milestone index) | **`text-accent`** thôi | tint, icon |
| **Status "current"** trong list tiến trình | **icon accent thôi** · text foreground · **KHÔNG tint** | tô nền row |
| **Progress / meter** | fill `bg-accent` (track `bg-default`) | text accent |
| **Card/row "của tôi"** trong list | `ring-accent`/`border-accent` + **1 chi tiết nhỏ** (value/chip accent) · nền `bg-surface` | tô `bg-accent/10..15` cả khối lớn |

## 4. STATUS = semantic, KHÔNG accent (STRICT)
- **done/hoàn thành = `text-success` (XANH)** + `CheckCircleIcon`, KHÔNG accent. (Ref [[elements/icon]] §2.)
- **locked/todo/chưa tới = `text-muted`** (+ Lock/Circle), KHÔNG accent.
- **error/disable = `text-danger`/`WarningCircleIcon`** (phân biệt disable vs lock — [[disable-vs-lock-and-perrow-autosave]]).
- Accent CHỈ cho **"current/đi-tiếp"** trong status-list (điểm resume), như 1 icon duy nhất.

## 5. Anti-pattern (CẤM)
- **ACCENT-FLOOD:** `bg-accent/5../15` lên **khối/section/card/thumbnail/bệ LỚN**. Accent là chi tiết NHỎ (icon/chip/value/border), KHÔNG phải nền vùng. Nền khối → `bg-surface`/`bg-default`. (Khối bounded NHỎ được-chọn — 1 chip, 1 radio-card — tint `/10` OK; vẫn mảng nhỏ.)
- **3-KÊNH cho 1 nghĩa:** ring + text + tint cùng lúc cho "của tôi" = dư. Chọn 1 (ring + 1 value accent).
- **STATUS-TINT:** tô `bg-accent/10` lên row trạng thái (current/in-progress) → giả "selected". Status = icon-only.
- **ACCENT-FOR-DONE:** dùng accent cho "đã xong" (phải success xanh).
- **DECORATIVE-ACCENT:** tô accent cho label/icon tĩnh không-tương-tác chỉ để "cho đẹp".
- **HOVER solid-accent** cho row thường (hover = `bg-default`/`/10`, không `bg-accent` đặc — trừ pager-active vốn solid). Ref [[hover-style-matches-clickable-nature]].

## 6. Impl (class)
- CTA: `Button variant="primary"` (solid, [[elements/button]]). · Selected nav: `bg-accent/10` + `text-accent` (label+icon). · Inline active: `text-accent`. · Status current: `<Icon className="text-accent"/>` + text foreground, row nền trong suốt. · Progress: `bg-accent` fill trên `bg-default`. · Mine: `ring-2 ring-accent`/`border-accent` + value `text-accent`, nền `bg-surface`.
- Ring opacity 1 thang (đừng `/25 /30 /35 /50` loạn): selected = `ring-accent` · current = tint `/10` + icon (phân biệt selected vs current bằng KÊNH, không bằng opacity).

## Liên quan
- [[elements/color]] §2 (tonal active) · [[elements/button]] (CTA solid) · [[hover-style-matches-clickable-nature]] (hover theo bản chất) · [[elements/icon]] §2 (done=CheckCircle success) · [[disable-vs-lock-and-perrow-autosave]] (disable vs lock icon).

## Áp đầu (2026-06-30) — audit 181 file + fix list
Phần lớn ĐÚNG sẵn (exemplar: `ContentMapRow`, `SidebarNavItem`, `OnThisPage`, `LeaderboardCategoryRail`, `FlashcardStudyRail`, `FlexWrapCardRadio`). Vi phạm gom 3 nhóm (chờ apply `/starci-fe-layout-apply`):
- **A. Status-tint (vụ screenshot):** `CourseContents` L322 + `PersonalProjectDashboard` L279 — bỏ `bg-accent/10` trên row current ("Đi tiếp lộ trình"), giữ play-icon accent + chữ foreground. → sidebar (selected tonal) ≠ body (status icon-only), hết lộn xộn.
- **B. Accent-flood:** `FoundationItemThumbnail` L37 + `FoundationCategoryThumbnail` L39 (`bg-accent/10` nền card → `bg-default`) · `UpcomingLivestreamCard` L116 (`bg-accent/5` → bỏ) · `TrackLadder` L47 (`bg-accent/5` → chỉ `border-accent/40`) · `LeaderboardPodium` L75 (bệ `bg-accent/15` → bỏ fill).
- **C. Leaderboard "của tôi" 3 kiểu → 1:** chuẩn `ring-accent` avatar + XP value accent, KHÔNG fill lớn. Sửa `LeaderboardPodium`/`LeaderboardChampion` cho khớp `LeaderboardTable`.
- **D. Thấp:** `MindMap` ring-opacity loạn (canvas) · `StreakStrip` L97 `bg-accent/80` (ô heatmap meter — giữ) · `FlashcardDeckList` L226 (pager-active solid — giữ, false-positive).
