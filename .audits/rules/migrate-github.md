# Migrate GitHub — tách 1-repo/module → 1-repo/content · đúc kết

> Bản **TỰ-ĐỦ** cho pipeline `migrate-github`: tách mỗi MODULE repo thành nhiều CONTENT repo, set private/public theo `isPremium`, pivot link trong body. **KHÔNG e2e** — chỉ chép source gốc nguyên xi + xác nhận giống-y-như-trước. Quy trình chung → `../pipeline.md`.

---

## 0. Vì sao (nguyên tắc gốc)

- GitHub phân quyền **theo nguyên repo, mức team** — không gate được 1 phần trong repo. ⇒ **biên repo = biên phân quyền**. Content premium phải là repo RIÊNG (private) thì mới khoá độc lập được.
- Hiện trạng: 1 module = 1 repo (`StarCi-Academy/fullstack-mastery-module-<N>-<slug>`), mỗi content là 1 thư mục con. Cả module chung 1 quyền ⇒ không tách premium được. → tách mỗi content thành 1 repo.
- Sau này 1 bài đổi premium ↔ free: **chỉ đổi visibility repo** (private↔public) + team grant, KHÔNG cần tách lại. Xem §4.

---

## 1. Naming repo (CHỐT)

```
fs-<moduleNum>-<moduleSlug>-<contentNum>-<contentSlug>
```

| Token | Lấy từ | Index | Ví dụ |
|---|---|---|---|
| `fs` | prefix khóa Fullstack (cố định) | — | `fs` |
| `<moduleNum>` | **kế thừa số của module repo cũ** = folderIndex **+1** (off-by-one đã biết) | **1-based** | folder `0-…` → `1` |
| `<moduleSlug>` | slug module **đã làm sạch framework** (vd `nestjs-core`→`framework-core`) | — | `framework-core-and-request-lifecycle` |
| `<contentNum>` | index folder content, GIỮ NGUYÊN | **0-based** | folder `0-…` → `0` |
| `<contentSlug>` | slug folder content | — | `frameworks-in-backend` |

- Ví dụ chuẩn: `fs-1-framework-core-and-request-lifecycle-0-frameworks-in-backend`.
- **Trần GitHub 100 ký tự.** Trước khi tạo, đo độ dài; bài nào > 100 → cảnh báo, rút `<moduleSlug>`/`<contentSlug>` (bỏ stop-word `and`/`the`) cho tới khi lọt, ghi vào test-doc.
- Org: `StarCi-Academy`. Branch: `main`.

---

## 2. Nguyên tắc EDIT (content side)

**Chỉ sửa 3 thứ. Ngoài ra KHÔNG đụng.**

### 2a. Slug module (1 lần/module)
- Đổi slug mang framework cụ thể → khái niệm chung: `nestjs-core` → `framework-core` (chốt). Rename folder `modules/<old>` → `modules/<new>`; đổi `.repo/fullstack-mastery-module-<N>-<old>` tương ứng; cập nhật `# displayId`/slug trong seed nếu có.
- `# title`/`# description` module: nếu đã agnostic thì GIỮ. NestJS nhắc trong description như **ví dụ minh hoạ** → giữ (đúng pedagogy). Chỉ bỏ framework khỏi **slug định danh**.

### 2b. Repo reference trong body (mỗi content)
- Vị trí: **chỉ** `bodies/<lang>/{vi,en}.md` (4 lang × 2 locale = tối đa 8 file/content). Là chỗ DUY NHẤT trỏ tới repo module cũ.
- 2 dòng cần pivot:
  - **Source line**: trỏ repo cũ + `tree/main/<thư-mục-content>` → trỏ **repo content mới (root)**, **bỏ hẳn** mệnh đề `— thư mục bài học [...](.../tree/main/<dir-content-trong-repo-cũ>)` vì repo mới CHÍNH LÀ content (nằm root).
  - **`git clone` line**: đổi URL `.git` sang repo mới.
  - **Sub-link nội bộ (FE/agnostic)**: bài FE thường có thêm `frontend nằm trong [\`frontend\`](.../tree/main/frontend)`, `.playwright/scripts`, `.docker`… Các sub-link này TRỎ VÀO CẤU TRÚC repo (frontend/, .playwright/ là folder con của content) → chỉ cần **đổi URL sang repo MỚI** (giữ link, KHÔNG xoá — chúng vẫn đúng vì repo mới có các folder con đó ở root). Tiêu chí stale = **chỉ** còn ref tới repo CŨ (`fullstack-mastery-module-<N>`); sub-link `/tree/main/<folder>` trỏ repo MỚI là HỢP LỆ.
- Model **Sonnet** rewrite (wording mỗi bài/lang khác nhau → không sed cứng). Giữ nguyên văn phong, chỉ thay URL + bỏ mệnh đề subdir.

### 2c. CẤM đụng (no-touch)
- Code trong fence; lệnh cài dep dạng `github.com/gin-gonic/...`, `github.com/google/uuid` (đó là dependency thật, KHÔNG phải repo bài).
- Prose nội dung, challenges, separators `<!-- @starci/seperator -->`, thứ tự H1, `# isPremium`.

### 2d. Vị trí file (CHỐT)
- **Content (edit ở đây)**: `.gitrefs/data/` = git repo canonical (= `StarCi-Academy/data`). Sửa body tại `.gitrefs/data/courses/<course>/modules/<module>/contents/<content>/bodies/<lang>/{vi,en}.md`, commit + push tại `.gitrefs/data`. **KHÔNG** edit ở `.contexts/` (snapshot materialize, bị ghi đè) hay `.mount/data` (không phải nguồn FS).
- **Source code (copy từ đây)**: `.repo/fullstack-mastery-module-<N>-<oldslug>/<contentDir>/` — mỗi `.repo/*` là git repo độc lập của bài. Đây là nguồn chép nguyên xi sang repo content mới (§3).

---

## 3. ĐỔI GITHUB (repo side) — chép source GỐC, không build lại

Mỗi content:
1. **Tạo repo** `fs-…` trong org. `private = content.isPremium` (true→private, false→public).
2. **Chép source nguyên xi**: nội dung thư mục con `<contentDir>/` trong module repo cũ → **root** repo mới. Y hệt, không sửa code, không e2e, không build. (subdir → root: copy files, `git init`, commit "init from <module-repo>/<contentDir>", push `main`.)
3. Premium (private) → grant team khóa quyền **Read** (xem luồng resolve/revoke-github). Public → ai cũng clone.

- Module repo CŨ: GIỮ cho tới khi cả module migrate xong + verify; archive/xoá sau (1 bước riêng, KHÔNG tự xoá trong pilot).
- Idempotent: repo đã tồn tại → skip tạo, chỉ reconcile visibility.

---

## 4. Đổi premium sau này (1 thao tác)

`isPremium` flip ⇒ **đổi visibility repo tương ứng**, không tách lại:
- false→true: repo `private` + grant team Read.
- true→false: repo `public` (team grant thừa, kệ).
Đồng bộ `# isPremium` trong content ↔ visibility repo là INVARIANT phải giữ.

---

## 5. TEST / DOCS (KHÔNG e2e)

Test = **xác nhận source mới giống y gốc** + link sạch. Cụ thể, ghi 1 file `migrate.md` cạnh module:

| Check | Cách | Pass khi |
|---|---|---|
| Source giống gốc | `diff -r <old-repo>/<contentDir> <new-repo>/` (bỏ `.git`) | rỗng (identical) |
| Visibility đúng | đọc repo trên org | private ⇔ isPremium=true |
| Link sạch | grep `module-<N>-<oldslug>` / `nestjs-core` trong `bodies/**` đã edit | 0 hit |
| Repo mới resolve | URL Source + clone trong body trỏ repo TỒN TẠI | mở được (public) / 403-cần-team (private) |
| Tên ≤ 100 | đo len mỗi repo name | true |

- `migrate.md` liệt kê: bảng N content → repo name → visibility → diff-status → link-rewrite count. Đây là proof, thay cho e2e.

---

## 6. Phạm vi pilot

- Chạy **fullstack m0** (`framework-core-and-request-lifecycle`, 5 content) trước. Thầy duyệt → batch các module còn lại.
- Per module: §2a (rename slug 1 lần) → loop 5 content [§3 tạo+chép repo ∥ §2b pivot body] → §5 viết `migrate.md`.
