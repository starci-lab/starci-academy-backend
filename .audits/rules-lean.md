# StarCi FS — Rules Lean (cheat-sheet)

Bản tinh gọn để audit nhanh. Chi tiết TỰ-ĐỦ trong `.audits`: `rules/fullstack/{contents,challenges}.md`, `rules/coding-problems.md` (LeetCode bank — Judge0-AC 5 lang). KHÔNG ref file ngoài.

## References (gold modules) — đọc TRƯỚC khi audit
- `.audits/references.md` = registry module/lesson **đã PASS**, dùng làm GOLD theo từng **variant** (FE-Vite / BE-4lang / BE+Playwright). Đọc mục cùng variant trước khi bắt tay → bắt chước format chuẩn, đỡ lặp lỗi cũ.
- **Sau khi module mới hội tụ PASS:** runner tự **append** 1 block vào `references.md` (variant + lesson gold + bài học). Append-only, KHÔNG sửa block cũ.

## Nơi ghi artifact audit
- `research.md` · `decision.md` · `claude_submitted.md` · `.code/` · `.e2e/` ghi **THẲNG vào mount** `.../modules/<slot>/contents/<lesson>/` (cạnh `audited.md`), **tiếng Việt**. KHÔNG để ở cây `.audits/` riêng.

## Tiếng Việt CHUẨN (gate bắt — chuẩn `data/rules/audit-vietnamese.md`)
- **Đủ dấu:** MỌI tiếng Việt — `vi.md` (body + challenge) + artifact (`research/decision/claude_submitted`) + `references.md` — PHẢI đủ dấu. CẤM không dấu (`khong`/`duoc`/`phai`/`kiem thu`/`ban chat`…). Code-fence comment English-only (không xét dấu trong code).
- **KHÔNG dịch ép technical term (§A — lỗi nặng nhất):** giữ tiếng Anh, nhúng vào câu Việt. Bảng SAI→ĐÚNG (gate FAIL `Dịch ép thuật ngữ`):
  `vỏ app`/`vỏ layout`/`tầng vỏ`→**App Layout** · `config/cấu hình có kiểu`→**Typed Config** · `trình nghe`/`bộ lắng nghe`→**Listener** · `móc nối`→**Hook** · `lớp bọc`/`trình bao bọc`→**Wrapper** · `giàn giáo`/`khung sườn`→**Scaffold** · `phần mềm trung gian`→**Middleware** · `mã thông báo`→**Token** · `bộ nhớ đệm`→**Cache** · `khoá/khóa phân tán`→**Distributed lock** · `hàng đợi thư chết`→**DLQ** · `điểm hội tụ lỗi`→nơi xử lý lỗi tập trung.
- **GIỮ tiếng Việt theo ngữ cảnh (đừng Anh-hoá ép):** `nhà cung cấp`=vendor/dịch vụ · `điểm cuối`=final score · `tải trọng`=load · `dưới lớp vỏ`=under the hood · term nghiệp vụ (Xác thực/Phân quyền/Giỏ hàng/Đơn hàng…).
- **KHÔNG calque word-by-word:** dịch theo nghĩa, đọc xuôi; bỏ "một cách"/"việc mà" thừa.
- Gate `check-lesson.ps1`: FAIL `Vietnamese KHÔNG DẤU` (0 dấu / token không-dấu lọt) + FAIL `Dịch ép thuật ngữ` (trúng blacklist §A.2; term tự nhiên đã loại nên không false-positive).

## E2E port (4-lang)
- **TÌM PORT RẢNH TRƯỚC RỒI ASSIGN** (không khởi động port mặc định rồi xử lý va chạm): `$used=(Get-NetTCPConnection -State Listen).LocalPort` → lấy 4 port trống trong 3000..3100 (hoặc random 1000-9999) → assign ts/java/net/go qua `PORT`/config, chỉ đổi base URL. **KHÔNG fail/skip e2e vì port.** Ghi port thực tế vào `.e2e/`.

## Bố cục V2
- ROOT `vi.md/en.md` = metadata; `# body`/`# codeExplaining`/`# codeImplementations` **rỗng** (2 sep). Body thật ở `bodies/<N>-<lang>/{vi,en}.md`.
- bodies order: `0-typescript → 1-java → 2-csharp → 3-go` (BE 4-lang) hoặc `0-agnostic` (FE/infra).
- Separator literal `<!-- @starci/seperator -->` (typo "seperator" CỐ Ý). Block rỗng vẫn 2 sep, không `[]`. Không sep trong code fence.
- ROOT H1 order: title · description · body · codeExplaining · codeImplementations · databases(opt) · references · minutesRead · isPremium · verified.

## Heading body (strict — VI / EN)
```
## 1. Lời mở đầu / Opening
## 2. Các khái niệm cốt lõi / Core concepts
### 2.1. Thực hành / Hands-on
#### 2.1.1. Chuẩn bị source code và môi trường / Prepare the source code and environment
#### 2.1.2. Kiến trúc / thành phần / Architecture / components
#### 2.1.3. Giải thích code và bản chất / Code walkthrough and essence   (2.1.3.1/2/3)
#### 2.1.4. Chuẩn bị & khởi chạy / Setup & run   (2.1.4.1 Điều kiện cần trước · 2.1.4.2 Khởi động)
#### 2.1.5. Kiểm thử / Testing   (FE/WS: "Kiểm thử (Playwright)") — 3-5 Luồng 2.1.5.x
#### 2.1.6. Dọn tài nguyên / Cleanup
#### 2.1.7. Đọc thêm / Further reading
### 2.2. Lý thuyết / Theory  → 2.2.1 Bản chất + 2.2.2 Các trường hợp biên (edge cases)  ← ĐÚNG 2 MỤC
## 3. Tổng kết / Wrap-up  → ### 3.1. Các câu hỏi dễ bị phỏng vấn  (3-4 câu)
```
- Heading KHÔNG có dấu `.` cuối phần chữ. Code-walkthrough sub dùng `##### 2.1.3.1` (KHÔNG `(a)(b)`).

## Wording / format (CẤM sai)
- **Bridge §1 + flow-list §2.1.5 = bullet list**, CẤM inline `**(1)** ...; **(2)**`.
- **Step/Requirement sub = callout `:::muted`**, CẤM heading `### 1./2./3.`.
- Interview block: `- **Câu hỏi N: ...?**` → `  - Ý interviewer muốn nghe:` → `  - Trả lời mẫu (ngắn):` (EN: Question/What interviewers want to hear/Sample answer (concise)).
- Flow conclusion `*Kết luận: ...*` (italic). Mermaid caption `*Hình N: ...*`.
- Em-dash `—` trong prose; giữ `--` trong code/CLI/URL/separator.
- **Code-fence comment = English-only** (cả vi.md lẫn en.md). Tiếng Việt prose LUÔN đủ dấu.
- KHÔNG dịch ép thuật ngữ. Mermaid verify bằng `mmdc`, không bằng mắt.
- Startup: `docker compose -f .docker/compose.yaml up -d` + `nest start --watch` (no `npx`). Blockquote `.env`/ConfigModule TRƯỚC bash.
- codeExplaining snippet = diff=0 với `.repo/<repo>/<lesson>/src`.

## Loại bài (quyết định)
- Thuần BE, API đơn giản → **backend** (curl/PowerShell flows).
- BE trọng tâm + cần FE demo (websocket/file-upload) → **backend + Playwright** (docs KHÔNG mô tả UX/UI; chỉ element/div = DOM tối thiểu để test; học viên tự dựng UI sau).
- Thuần FE → **frontend Vite** (lesson-ui.rules): `Local` khớp testid spec / `Sandbox` trực quan (không 100% đúng). Single-client → Sandbox = Local.
- **MẶC ĐỊNH FE = Vite (React) + Sandbox, KHÔNG Next.js** (repo cũ Next → migrate). **Chỉ dùng Next khi CONTEXT ĐẦU VÀO (`args.guidance`) chỉ rõ** (vd dạy RSC/app-router). Guidance = chỉ-dẫn-riêng-module truyền lúc chạy runner, ưu tiên tuyệt đối, override mặc định.

## Lesson-ui (FE Vite sandbox)
- `App = Label + Description + {isSandbox ? <Sandbox/> : <Local/>}` (`?sandbox` query). HeroUI v3 (onPress/variant/Chip soft/Tabs selector-only, KHÔNG Tabs.Panel). Inline SVG, **CẤM @gravity-ui** (timeout Sandpack). Spacing h-6/h-3. Repo `.repo/.../frontend` = Vite (Sandpack KHÔNG chạy Next). Gold: `module-9-websocket`. **Migrate Next→Vite phải SẠCH:** xoá `next.config.*`/`next-env.d.ts`/`app/` cũ/`postcss` next + dep `next`, rồi verify `vite build` + Playwright. KHÔNG để nửa-Next-nửa-Vite.

## Challenge V2
- H1: title · description · requirements · steps · outputs · prerequisites · difficulty · score · verified. **KHÔNG** `# references`/`# submissions` inline.
- requirements/steps/outputs/prerequisites = item-major: `## N → ### langs → #### M → ##### lang(+title/body/score/text)`. body sub = `:::muted` (KHÔNG `### N.`).
- `# score = 100` mọi challenge (difficulty chỉ là tag). FE agnostic → lang bucket = `agnostic`.
- `submissions/<N>/en.md`: `# type/title/description/score(100)` + `# outcomeCriterias` (Σ`### score`=**30**) + `# approachCriterias` (Σ=**70**, ≥1 `critical:true`=40). Criteria English-only; `vi.md` chỉ type/title/description.
- Criteria mỗi item nêu **Kiểm gì / Bằng chứng quan sát / Fail nếu** — proof cơ chế thật, không chung chung.
- §9.7 gotcha: KHÔNG bọc sep ngay sau heading có children; children sâu hơn parent ≥1 cấp; sep mỗi section CHẴN.
- Premium: 1-2 lesson cuối module `isPremium=true`. Hard/insane: slot≥4 giữ theo merit; per-lesson ghi verdict audited.

## Gate nhanh
`./.audits/check-lesson.ps1 -Path <module-dir>` → exit=#fail. Bắt: leak · inline-bullet · fence · theory=2 · 2.1.7 · challenge score/verified/ref-sub/`###N`/Σ30+70/critical/parity.
