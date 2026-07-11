export const meta = {
  name: 'env-fix-modules',
  description: 'Quyết định env mention cho khớp purpose+code: KHÔNG cần env→bỏ mention; CẦN→mention đúng + ship config committed. Haiku check (purpose/env/code) -> Sonnet quyết. args.modules=[{slug,repo}]',
  phases: [
    { title: 'Check', detail: 'haiku: purpose vs env-mention vs code-reads-env', model: 'haiku' },
    { title: 'Decide', detail: 'sonnet: bỏ mention nếu không cần / fix+ship nếu cần', model: 'sonnet' },
  ],
}
function asObj(a){ if(!a) return {}; if(typeof a==='object') return a; if(typeof a==='string'){const s=a.trim(); if(s.startsWith('{')){try{return JSON.parse(s)}catch(e){}} if(s.startsWith('[')){try{return {modules:JSON.parse(s)}}catch(e){}}} return {} }
const ARGS = asObj(args)
const MODULES = ARGS.modules || []  // [{slug, repo}]
if (!MODULES.length) throw new Error('args.modules required: [{slug, repo}]')
const ROOT = 'C:/Repositories/ac/starci-academy-backend'

const DECIDE = [
  'QUYẾT ĐỊNH env mention — RULE THỐNG NHẤT (chốt với thầy): **chỉ mention KHI học viên BẮT BUỘC phải tự điền giá trị mới chạy được**.',
  'TEST quyết định: lesson có chạy được OUT-OF-BOX nhờ DEFAULT committed (kể cả code đọc env nhưng có fallback/default cho PORT/DB host) không?',
  '  • CÓ (chạy ngay, học viên không cần đụng env) → **XÓA HẲN mọi note về `.env`/"file env"/"ship config"/"không cần tạo .env"** khỏi body (vi+en). KHÔNG mention gì — kể cả disclosure. (PORT/DB plumbing có default = KHÔNG mention. Đừng THÊM mention cho lang nào dù code đọc env.)',
  '  • KHÔNG (phải tự điền secret/cloud thật mới chạy đúng, vd OAuth Google thật, payment key) → MỚI mention: trỏ `.env.local` (hoặc file lang dùng) để học viên điền, ship `.env.example` mẫu (placeholder, KHÔNG secret). Repo committed chỉ default non-secret.',
  'NGOẠI LỆ QUAN TRỌNG — lesson mà TOPIC chính LÀ env/config: nếu flow của bài YÊU CẦU học viên TỰ set env/profile để quan sát hành vi (vd `2-multi-environment-configuration`: set NODE_ENV/profile=production để thấy config đổi) → **GIỮ + NHẤN MẠNH mention env** dù chạy out-of-box. Env là chủ đề + thao tác của bài, KHÔNG được xóa.',
  'LƯU Ý: OAuth có MOCK_GOOGLE=true default → chạy out-of-box ở chế độ mock → theo rule là KHÔNG cần mention để CHẠY; nhưng vì là bài DẠY OAuth + có path "nối Google thật", mention NGẮN về `.env.local` cho creds thật là HỢP LỆ (học viên muốn thật phải điền).',
  '',
  'CODE-LEVEL (áp CẢ 4 lang, KHÔNG hard-code):',
  '  • Config (port / DB host / secret-demo) PHẢI đọc từ ENV CÓ DEFAULT, KHÔNG hard-code literal trong source. Lang nào hard-code (vd Go `jwtSecret := "..."` / `r.Run(":3000")`, hoặc port literal) → đổi sang đọc env với fallback default (Go `os.Getenv("X")` + default; tương tự TS process.env||default, Java ${VAR:default}, C# config/env).',
  '  • SHIP file env/config COMMITTED mặc định để chạy out-of-box: TS `.env` (+ Go `.env` nếu dùng godotenv) chứa default NON-SECRET; Java `application.properties|yml`, C# `appsettings.json` có default. (.env committed: gỡ ignore plain `.env` nếu cần, GIỮ `.env.local`/`.env*.local`/`.oauth.env` gitignored.)',
  '  • Mục tiêu: code env-driven + ship default → chạy ngay KHÔNG cần học viên đụng env → BODY SILENT (nhánh mention ở trên). Đổi code repo → commit+push (xác nhận KHÔNG secret).',
  '- vi/en mirror. TUYỆT ĐỐI không commit secret (.oauth.env/.env.local). Re-gate sau sửa.',
].join('\n')

phase('Check')
const checks = await parallel(MODULES.map(function (M) {
  return function () {
    const MODDIR = '.mount/data/courses/0-fullstack-mastery/modules/' + M.slug
    return agent(
      'CHECK (Haiku) env-fit cho module ' + M.slug + '. cwd=' + ROOT + '. Cho TỪNG lesson × lang:\n' +
      '1) PURPOSE 1 dòng (đọc đầu body).\n' +
      '2) Body có mention `.env`/"file env"/appsettings/application.properties không? (trích câu).\n' +
      '3) CODE lang đó (.repo/' + M.repo + '/<lesson>/backend/<lang>) CÓ đọc env/config không? grep process.env/ConfigService/@Value/IConfiguration/_config/os.Getenv/godotenv/registerAs.\n' +
      'TRẢ VỀ bảng: lesson | lang | có-mention-env? | code-đọc-env? | → nghi cần-bỏ-mention hay cần-ship.',
      { label: 'check:' + M.slug, phase: 'Check', model: 'haiku' }
    )
  }
}))

phase('Decide')
const fixes = await parallel(MODULES.map(function (M, i) {
  return function () {
    const MODDIR = '.mount/data/courses/0-fullstack-mastery/modules/' + M.slug
    return agent(
      'QUYẾT + SỬA (Sonnet) env mention module ' + M.slug + '. cwd=' + ROOT + '. Repo: .repo/' + M.repo + '.\n' +
      'Check từ Haiku: ' + JSON.stringify(checks[i]) + '\n\n' + DECIDE + '\n\n' +
      'LÀM 3 việc: (a) CODE 4 lang env-driven — grep hard-code (Go jwtSecret/port literal, port literal mọi lang) → đổi đọc env CÓ default; (b) SHIP file env/config committed default non-secret (out-of-box); (c) BODY mention theo nhánh (out-of-box→silent; topic-env L2 M0→giữ; secret thật→.env.local). Sửa body (' + MODDIR + '/contents/*/bodies/*/*.md vi/en mirror). Re-gate `powershell -NoProfile -File .claude/docs/check-lesson.ps1 -Path "' + MODDIR + '"` = 0 fail.\n' +
      'Repo đổi → `git -C .repo/' + M.repo + ' status` xác nhận KHÔNG secret → add (force .env nếu cần) → commit "fix(env): mention env only when needed + ship committed config" + Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com> → push. Chỉ body → không push.\n' +
      'TRẢ VỀ: lesson/lang nào BỎ mention, lesson/lang nào GIỮ+ship (file gì), repo commit/push (hash), gate.',
      { label: 'decide:' + M.slug, phase: 'Decide', model: 'sonnet' }
    )
  }
}))
return { modules: MODULES, checks: checks, decisions: fixes }
