
const CHUNK = (args && typeof args.chunk === 'number') ? args.chunk : 0
const TOTAL = (args && typeof args.total === 'number') ? args.total : 10
const units = U.map(([type, rel]) => ({ type, dir: BASE + rel }))
              .filter((_, i) => i % TOTAL === CHUNK)
log(`Chunk ${CHUNK}/${TOTAL}: ${units.length} unit.`)

const RULE = [
  'BAN LA AUDITOR TIENG VIET cho content khoa hoc dev. Chuan = audit-vietnamese.md.',
  'CHI sua prose tieng Viet NGOAI code-fence (title/description/heading/body/criteria). TUYET DOI KHONG dung:',
  'code trong fence ```, cau truc file, sortIndex/orderIndex/score/frontmatter keys, link, anh.',
  '',
  'LUAT A - KHONG dich ep technical term (loi NANG nhat). GIU TIENG ANH cac term:',
  'App Layout, Routing, Scaffold, Typed Config, Provider, Middleware, Hook, State, Wrapper, Listener,',
  'Boundary, Server/Client Component, Endpoint, Payload, Token, Cache, Migration, ORM, Entity, Hash,',
  'Transaction, Seed, Idempotency, Webhook, Saga, Outbox, DLQ, CDC, Rate limit, Distributed lock, RBAC,',
  'JWT, gRPC, WebSocket, Structured logging, Design System, Status Page, Health Endpoint, Hydration,',
  'Suspense, Streaming, Debounce, Throttle, Polling.',
  'Bang SAI->DUNG (sua het, giu dinh dang **bold** neu von co):',
  '  vo app / vo frontend / vo layout / tang vo / lop vo -> App Layout (hoac layout)',
  '  Config Co Kieu / cau hinh co kieu -> Typed Config',
  '  trinh nghe / bo lang nghe -> Listener',
  '  moc noi / diem moc -> Hook',
  '  lop boc / trinh bao -> Wrapper',
  '  gian giao / khung suon -> Scaffold',
  '  phan mem trung gian -> Middleware',
  '  nha cung cap (context React/DI) -> Provider',
  '  diem cuoi -> Endpoint',
  '  ma thong bao -> Token',
  '  tai trong -> Payload',
  '  bo nho dem -> Cache',
  '  diem hoi tu loi -> noi xu ly loi tap trung (dien giai, KHONG calque)',
  '  khoa phan tan -> Distributed lock',
  '  hang doi thu chet -> DLQ',
  'GIU TIENG VIET (dung Anh-hoa): Xac thuc, Phan quyen, Danh muc, Gio hang, Don hang, Phan trang, San pham,',
  'Bien the, Mat khau, Dang ky, Dang nhap, Kien truc, Nen tang, Bat dong bo, Thanh toan, Tim kiem, Bao mat,',
  'Hieu nang, Trien khai, Lich su, Cua hang, Ton kho, Khoi dong, Truy vet.',
  'Tu hoi moi term: "nguoi Viet lam dev doc co hieu/tu nhien ngay khong?" - phai doan => giu tieng Anh.',
  '',
  'LUAT B - tieng Viet sach:',
  '- LUON CO DAU (telex/khong dau nhu "khoi dong","cau hinh" => SAI, them dau).',
  '- Em-dash (U+2014) trong prose; giu -- cho CLI flag/URL/code token.',
  '- KHONG calque word-by-word; cau doc xuoi, bo "mot cach"/"viec ma" thua, khong Google-Translate-ese.',
  '- vi <-> en dong bo: dung CUNG term tieng Anh canonical o ca 2 file.',
].join('\n')

const REVIEW_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    dir: { type: 'string' },
    filesAudited: { type: 'number' },
    termFixes: { type: 'number' },
    accentFixes: { type: 'number' },
    calqueCandidates: {
      type: 'array',
      items: { type: 'object', additionalProperties: false,
        properties: { file: { type: 'string' }, quote: { type: 'string' } },
        required: ['file', 'quote'] },
    },
    notes: { type: 'string' },
  },
  required: ['dir', 'filesAudited', 'termFixes', 'accentFixes', 'calqueCandidates'],
}
const REWRITE_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: { dir: { type: 'string' }, rewrites: { type: 'number' }, files: { type: 'array', items: { type: 'string' } } },
  required: ['dir', 'rewrites'],
}

function scopeNote(u) {
  if (u.type === 'lesson')
    return 'Day la 1 LESSON. Audit MOI vi.md tai va DUOI thu muc nay (de quy): vi.md goc, bodies/<lang>/vi.md, challenges/<slug>/vi.md, va challenges/<slug>/submissions/<id>/vi.md. Mo en.md canh moi vi.md CHI de dong bo term canonical (sua en.md neu term lech).'
  return 'Day la 1 ' + u.type.toUpperCase() + '. CHI audit vi.md NAM TRUC TIEP trong thu muc nay (KHONG de quy vao contents/). Dong bo term voi en.md canh no.'
}

const results = await pipeline(
  units,
  (u) =>
    agent(
      RULE + '\n\nThu muc unit: ' + u.dir + '\n' + scopeNote(u) + '\n\n' +
        'QUY TRINH: (1) dung Glob liet ke dung cac vi.md trong scope tren. (2) Doc tung file. ' +
        '(3) Ap LUAT A (tra bang) + LUAT B.dau/em-dash NGAY bang Edit (sua truc tiep, giu dinh dang, ' +
        'KHONG dung code/structure/sortIndex/score). (4) Voi cau calque/lung cung (LUAT B.calque) thi ' +
        'KHONG tu sua - ghi vao calqueCandidates (file + nguyen van cau). (5) Tra JSON dung schema. ' +
        'Dem chinh xac termFixes/accentFixes theo so cho da Edit.',
      { label: 'review:' + u.type + ':' + u.dir.split('/').pop(), phase: 'Review', model: 'haiku', schema: REVIEW_SCHEMA }
    ),
  (rev, u) => {
    if (!rev || !rev.calqueCandidates || rev.calqueCandidates.length === 0)
      return { dir: u.dir, rewrites: 0, review: rev || null }
    const list = rev.calqueCandidates.map((c, i) => (i + 1) + '. [' + c.file + '] "' + c.quote + '"').join('\n')
    return agent(
      RULE + '\n\nViet lai cac cau tieng Viet calque/lung cung sau cho TU NHIEN, doc xuoi, ' +
        'giu technical term tieng Anh, KHONG doi nghia, KHONG dung code/structure. ' +
        'Dung Read xem ngu canh roi Edit tung cau tai dung file:\n' + list + '\n\n' +
        'Tra JSON: dir="' + u.dir + '", rewrites=so cau da sua, files=danh sach file da dung.',
      { label: 'rewrite:' + u.dir.split('/').pop(), phase: 'Rewrite', model: 'sonnet', schema: REWRITE_SCHEMA }
    ).then((rw) => ({ ...rw, review: rev }))
  }
)

const ok = results.filter(Boolean)
const termFixes = ok.reduce((s, r) => s + ((r.review && r.review.termFixes) || 0), 0)
const accentFixes = ok.reduce((s, r) => s + ((r.review && r.review.accentFixes) || 0), 0)
const rewrites = ok.reduce((s, r) => s + (r.rewrites || 0), 0)
log('Chunk ' + CHUNK + ' xong: ' + ok.length + '/' + units.length + ' unit | termFixes=' + termFixes + ' accentFixes=' + accentFixes + ' rewrites=' + rewrites)
return { chunk: CHUNK, units: units.length, done: ok.length, termFixes, accentFixes, rewrites }
