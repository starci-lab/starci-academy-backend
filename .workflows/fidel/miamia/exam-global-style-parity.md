<!-- starci-workflow: v2 -->

# MiaMia exam global style parity

## start

Session id: `miamia-exam-global-style-parity-20260815-r1`

Session status: open

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | D:\Repositories\miamia-fe @ `codex/miamia-thi-thu` (`5cf9f72`) |
| Purpose | Khôi phục visual parity giữa approved preview C r2 và production `/vi/exam` |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\exam-global-style-parity.md |
| Language | vi |
| Phase | start |
| Touching | Workflow này; production boundary chỉ khóa sau khi inventory CSS/import owners |

### BINDING EVIDENCE

| Identity | Value |
|---|---|
| Production route | `http://localhost:3070/vi/exam` |
| Reference | Approved direction C r2 tại single preview `http://127.0.0.1:8081/` |
| Viewport | Mobile-height desktop browser pane trong ảnh thầy gửi |
| Locale | `vi` |
| Expected | MiaMia neo-brutalist surfaces: dark outlines, offset shadows, strong surface hierarchy và component states như preview |
| Actual | Pale flat cards/buttons, thin pink borders, thiếu dark outline/shadow và hierarchy preview |
| FE baseline | `5cf9f72`; preserve toàn bộ worktree đang dở |

### OUTPUTS

| Concept | Result |
|---|---|
| Active correction | Đang khóa owner của missing MiaMia global visual tokens/import trước production patch |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\exam-global-style-parity.md` | added — session, binding preview và measured mismatch |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Approved preview C r2 và feedback hiện tại đã đủ binding evidence để điều tra/sửa bounded mismatch |

### WARNINGS

| Warning | Impact |
|---|---|
| FE worktree có nhiều thay đổi đang dở | Phải preserve và chỉ sửa exact CSS/import/component owners gây mismatch |
| Preview là proposal HTML | Chỉ port tokens/states khả thi qua StarCi patterns; không copy detached preview code vào production |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Giữ UI flat hiện tại | Khôi phục global visual system của preview C | Thầy hỏi rõ vì sao production không giống preview |

### OWED

| Owed | Cleared by |
|---|---|
| CSS/import owner inventory | So sánh preview tokens với production globals và layout imports |
| Visual proof | Before/after production capture tại cùng route/viewport |

## feedback r1

Session id: `miamia-exam-global-style-parity-20260815-r1`

Session status: open

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | D:\Repositories\miamia-fe @ `codex/miamia-thi-thu` (`5cf9f72`) |
| Purpose | Port approved Sticker Study visual skin vào global owner và chứng minh responsive production parity |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\exam-global-style-parity.md |
| Language | vi |
| Phase | feedback |
| Touching | `D:\Repositories\miamia-fe\src\app\globals.css`; workflow này |

### ROOT CAUSE

| Evidence | Result |
|---|---|
| Global import | `src/app/[lang]/layout.tsx` đã import `../globals.css`; không có missing import |
| Existing card override | `.card { border: none !important; }` chủ động xóa outline; vendor shadow mềm thay offset shadow |
| Approved Review r4 | Apply cũ khóa “chỉ semantic token values”, nên cấu trúc visual của preview không được port |
| Live computed style trước | Card/button border `0`; button shadow `none`; heading/card weights chỉ `500` |
| Feedback của thầy | Bác kết quả flat và yêu cầu global visual language giống preview |

### CORRECTION

| Owner | Before | After |
|---|---|---|
| Sticker geometry | Không có | Global outline cùng offset shadow `2/3/4px` |
| Card | Không border, vendor soft shadow | 2px dark outline, 20px radius, 3px offset shadow |
| Button | Pill, không border/shadow, weight 500 | Sticker 14px radius, outline/shadow, weight 800, hover/press motion |
| Input | Borderless wrapper | Outlined white field với offset shadow |
| Tabs/chips | Vendor flat/soft | Outlined pill family, selected raised sticker, strong badge weight |
| Premium band | Pink flat hairline | Yellow outlined banner với offset shadow |
| Typography | H1/H3 nhẹ và nhỏ | H1 28px/900; exam card title 16px/800 |
| Navigation | Flat active state | Desktop/mobile active item là pink outlined sticker |

### PROOF

| Gate | Result |
|---|---|
| Live route | PASS — `http://localhost:3070/vi/exam` render dữ liệu thật sau hot reload |
| Computed CSS | PASS — card/button/input/premium band có dark outline và `3px 3px` offset shadow |
| Desktop `1440×900` | PASS — sidebar hiện, footbar ẩn, 2 cards render, không horizontal overflow |
| Mobile `390×844` | PASS — sidebar ẩn, footbar hiện, 2 cards render, không horizontal overflow |
| Lint | PASS — canonical lint sync + ESLint exit `0` |
| CSS compile | PASS — Next production compile hoàn tất trước TypeScript gate |
| Typecheck | BLOCKED lịch sử — contract registry/worktree hiện suy ra nhiều slots thành `never`; CSS không tham gia type graph |
| Build | BLOCKED cùng root cause — Next dừng ở `plugins/type-tests/surface-list.tsx`, sau khi CSS compile xanh |
| Diff hygiene | PASS — `git diff --check -- src/app/globals.css` |

### OUTPUTS

| Concept | Result |
|---|---|
| MiaMia global skin | Production dùng lại StarCi component patterns nhưng toàn app nhận đúng Sticker Study outline, shadow, press và hierarchy từ một global owner |
| Exam parity | Kho đề hiện gần approved preview C về surfaces, cards, buttons, fields, tabs và responsive navigation |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\miamia-fe\src\app\globals.css` | modified — thêm global Sticker Study tokens và reusable vendor/semantic-node overrides |
| `D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\exam-global-style-parity.md` | modified — append root cause, exact CSS delta và responsive proof |

### NEED APPROVALS

| Question | Options |
|---|---|
| Visual acceptance | Thầy review production `/vi/exam`; nếu đúng thì báo duyệt để chạy Fidelity End, nếu chưa thì feedback tiếp trong session này |

### WARNINGS

| Warning | Impact |
|---|---|
| Global skin áp dụng mọi shared card/button/input/tab/chip | Đúng chủ đích “global.css giống preview”, nhưng các route Profile/Học cần related-bug scan ở Fidelity End |
| Typecheck/build đang đỏ do contract registry worktree ngoài CSS boundary | Không được tuyên bố full gate xanh hoặc sửa lẫn contract source trong session visual này |
| Prettier check của nguyên file đang đỏ | File baseline chưa theo formatter; CSS syntax vẫn được Next compile và diff không có whitespace error |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Apply cũ chỉ đổi semantic colors và giữ vendor flat geometry | Global Sticker Study geometry trong `globals.css` | “sao UI MiaMia là thế… sao không có global.css giống như preview” |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | Feedback trực tiếp của thầy trên production route |
| Related route scan | `starci-fe-fidelity-end` sau acceptance |
| Contract type/build debt | Capability/audit riêng cho current registry drift; ngoài global-style boundary |
