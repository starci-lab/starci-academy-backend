# Element — Avatar / User identity

> Element doc cho họ "mặt người dùng": primitive `reuseable/UserAvatar` + 3 block dựng trên nó
> (`AvatarGroup`, `AvatarUploadButton`, `UserCell`). 1 nguồn fallback dùng chung ([[single-source-render]]).

## `UserAvatar` (`reuseable/UserAvatar`) — primitive gốc, MỌI nơi hiện avatar user dùng cái này
- **Resilient fallback chain (3 tầng), advance khi LOAD FAIL (không chỉ khi thiếu URL):** (1) ảnh đã upload
  (`avatar`) → (2) ảnh generate DiceBear seed theo `seed` (ưu tiên email) hoặc `username` → (3) 2 chữ đầu
  username viết hoa. URL upload cũ/hỏng vẫn rơi xuống ảnh generate (không kẹt ở icon vỡ) vì chain advance theo
  `onLoadingStatusChange==="error"`, không chỉ theo "URL rỗng".
- **Cùng `seed` → cùng mặt ở MỌI nơi trong app** (deterministic). Luôn truyền `seed` (email) khi có; đừng để mỗi
  chỗ tự suy seed khác nhau (2 avatar khác mặt cho cùng 1 user).
- `size`: `sm` | `md` | `lg` (HeroUI Avatar preset).

## `AvatarGroup` (`blocks/identity/AvatarGroup`) — nhiều avatar chồng lên nhau
- Row `-space-x-2` + `ring-2 ring-background` mỗi avatar (tách khỏi nền chồng lấp). `max` (default 5) cắt số
  hiện, phần dư → chip `+N` (dùng `total` khi tổng thật lớn hơn `users.length` đã fetch).
- Dùng cho "N người theo dõi/N người tham gia" — KHÔNG dùng khi cần hiện TÊN từng người (đó là `UserCell` xếp
  danh sách dọc).

## `AvatarUploadButton` (`blocks/identity/AvatarUploadButton`) — trigger đổi avatar
- Nút icon-only tròn (`size-20`), avatar hiện trong khung + overlay đen mờ `CameraIcon` khi hover/focus (tín
  hiệu "ảnh này sửa được"). Props-only — `onPress` mở picker; block KHÔNG tự upload/crop.
- KHÔNG dùng khi avatar chỉ ĐỌC (không sửa được) — dùng thẳng `UserAvatar`.

## `UserCell` (`blocks/identity/UserCell`) — 1 dòng người dùng (avatar + tên + handle + trailing)
- Dùng cho: follower list, comment author, leaderboard row, search result — bất cứ đâu cần 1 dòng "đây là ai".
- `trailing` (follow button/chip/timestamp) pin `ml-auto shrink-0`; cột tên `min-w-0 truncate` (không vỡ layout
  ở sidebar/mobile hẹp).
- **Pure presentational — KHÔNG tự clickable.** Cần cả dòng bấm được → bọc `<a>`/`<button>` ở call-site.
  Cần avatar KHÔNG kèm tên → dùng thẳng `UserAvatar`, đừng lách `UserCell` không `handle`.

> Block: `reuseable/UserAvatar` (primitive) · `blocks/identity/{AvatarGroup,AvatarUploadButton,UserCell}`

## Ring seniority/rank quanh avatar (`ProfileMenuCard` · `ProfileRankAvatar`) — CHỐT 2026-07-17
- **Ring MỎNG `ring-2`** (2px), **KHÔNG** padding-halo (`p-*` + `bg` màu) — halo dày đọc như 1 khối, không phải viền. Màu ring set qua **inline `--tw-ring-color`** (màu động theo rank nên không dùng class tĩnh): `style={{ "--tw-ring-color": ringColor } as React.CSSProperties}`.
- **Màu ring = hue rank THẬT**: junior=đồng `#B06A2C` · middle=bạc `#AEB8C4` · senior=vàng `#F0B429`. **beginner/unranked** có rank-hue là xám `#8C95A1` ≈ neutral → **DÙNG token `--border`** thay cho hex xám đó (theme-clean, tự đổi light/dark; hardcode xám chỉ trùng màu divider mà không theo theme). Tức: `const ringColor = info.ring && info.rank !== "beginner" ? info.ring : "var(--border)"`.
- Ca thật: dashboard `ProfileMenuCard` — thầy: *"ring xám, để mỏng size-2 màu border"*. `p-1 halo + bg-default` → `ring-2` + ring color rank-hue/`--border`. ⚠️ `ProfileRankAvatar` vẫn hiện xám hardcode cho beginner — candidate đồng bộ (chưa đụng, ngoài câu feedback).

## Liên quan
- [[single-source-render]] (1 fallback chain dùng chung) · [[hover-style-matches-clickable-nature]] (identity
  row hover = opacity cả cụm, không underline riêng chữ) · `sidebar` (leading avatar trong nav row → `IconTile`
  không phải `UserAvatar` — 2 primitive khác vai, xem `icon.md` §4).
