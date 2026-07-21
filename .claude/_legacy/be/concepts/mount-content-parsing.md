# Concept — Mount content parsing (`.mount/data/**/*.md` → entity)

> Parser 2-hàm cố định biến markdown course content thành entity graph, dùng bởi [[init-v2-and-seeders]].

- **Token phân tách**: mọi leaf (string cuối) bọc `<!-- @starci/seperator -->...giá trị...<!-- @starci/seperator -->`. `ExtractJsonFromMdService` (`init/seeders/shared/extracts/extract-json-from-md.service.ts`) cắt theo token này; heading (`#`/`##`/`###`) định nghĩa cây.
- **2 hàm public/service**: `parse(params)` cho 1 item (find path → extract per-locale vào `jsonMap` → merge qua `MergeJsonService` → render entity graph thẳng từ `merged`) và `parseMany(params)` chỉ loop gọi `parse`, skip + log khi lỗi (không throw giữa chừng). Mẫu chuẩn: `course.service.ts`, `content.service.ts`, `challenge.service.ts`.
- **Render thẳng từ `merged`, KHÔNG duyệt `jsonMap` thủ công** — `MergeJsonService` (`init/seeders/shared/merge/merge.service.ts`) đã gắn `translations[]` theo `translateFields` config (dot-path: `"title"` root scalar, `"prerequisites.text"` 1 cấp array, `"requirements.data.title"` 2 cấp nested — không cần syntax `[]`).
- **English đứng đầu** trong `jsons` input khi merge — ép `[Locale.En, ...rest]` (không dùng `Object.values(Locale)` thô, thứ tự không đảm bảo), vì spec assert `translations[0]` luôn En.
- Lá nested kiểu folder con (`bodies/<N>-<lang>/`, `submissions/<N>/`) → tách method private `parseBodies()`/`parseSubmissions()` scan folder rồi merge per-locale.
- Gặp `extract()` bị gọi **lần 2** trên field đã extract (string leaf lộ ra thay vì object) → lỗi ở MOUNT FILE (wrap seperator sai / heading depth sai), KHÔNG vá code parser.
- 2 định dạng song song: legacy V1 (rubric prose, `# body` full inline) vs V2 (`outcomeCriteria`/`approachCriteria` yes/no, body tách `bodies/<N>-<lang>/`) — seeder route theo marker có/không H1 `# approachCriteria`.

> Nguồn: `src/modules/init/seeders/shared/extracts/`, `src/modules/init/seeders/shared/merge/`, `src/modules/init/seeders/courses/`
