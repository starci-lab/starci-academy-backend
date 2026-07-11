export const meta = {
  name: 'ws-analyze',
  description: 'Phan tich m9 websocket (4 lesson) de DUNG PLAN: per-lesson doc 4-lang backend + flows + frontend ?lang + body, xac dinh DEMO_SUPPORTED_LANGS (lang nao BE du contract moi flow), vi pham .claude/docs rules, fix can lam. CHI BAO CAO (khong sua/khong build).',
  phases: [{ title: 'Analyze', detail: 'per-lesson: lang-support + audit violations + fixes', model: 'opus' }],
}

const W = '.repo/fullstack-mastery-module-9-websocket-realtime-communication'
const MNT = '.mount/data/courses/0-fullstack-mastery/modules/8-websocket-realtime-communication/contents'
const LESSONS = [
  { slug: '0-socketio-realtime-chat', contract: 'joinRoom (nickname+room), chatToServer/chatToClient broadcast theo room' },
  { slug: '1-socketio-security-jwt', contract: 'auth handshake bang JWT: valid token chat duoc, missing/tampered token bi reject' },
  { slug: '2-presence-and-typing-indicators', contract: 'presence broadcast (online list), typing indicator, multi-tab dem 1 lan' },
  { slug: '3-reconnection-and-missed-messages', contract: 'reconnect replay missed msg, last-seq survive refresh, replay cap 100' },
]

const RESULT = {
  type: 'object',
  properties: {
    lesson: { type: 'string' },
    demoSupportedLangs: { type: 'array', items: { type: 'string' } },   // de xuat lang du contract
    perLang: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          lang: { type: 'string' },           // typescript|java|csharp|go
          implementsContract: { type: 'boolean' },
          missing: { type: 'string' },         // thieu gi neu khong du
        },
        required: ['lang', 'implementsContract', 'missing'],
      },
    },
    auditViolations: { type: 'array', items: { type: 'string' } },  // bind 0.0.0.0, comment non-English, port CLI, cd-first, frontend chua co ?lang/error-page, body drift...
    flowsOk: { type: 'string' },                                    // 3 flow logic make-sense khong
    fixes: { type: 'array', items: { type: 'string' } },           // viec can lam (uu tien)
  },
  required: ['lesson', 'demoSupportedLangs', 'perLang', 'auditViolations', 'fixes'],
}

phase('Analyze')
const results = await parallel(LESSONS.map(function (L) {
  return function () {
    return agent(
      'PHAN TICH lesson websocket "' + L.slug + '" de dung plan (CHI BAO CAO, KHONG sua/build). cwd = repo root. VIET TIENG VIET CO DAU.\n' +
      'Demo contract lesson nay: ' + L.contract + '\n' +
      '1) Doc 4-lang backend: ' + W + '/' + L.slug + '/backend/{0-typescript,1-java,2-csharp,3-go}/** (gateway/handler/auth). Voi MOI lang: co implement DU contract tren khong? (vd Java STOMP co room+broadcast nhu TS Socket.IO? C# SignalR co? Go WS co?). Lang nao thieu -> ghi missing.\n' +
      '2) Doc flows: ' + W + '/' + L.slug + '/.playwright/scripts/*.spec.ts — 3 flow logic make-sense? spec co parametrize theo ?lang khong? testid khop frontend?\n' +
      '3) Doc frontend: ' + W + '/' + L.slug + '/frontend/src/** — da co ?lang router + DEMO_SUPPORTED_LANGS + UnsupportedLangPage chua (theo PLAN.md thay)? client stack per-lang co chua?\n' +
      '4) .claude/docs violations (rules/fullstack/coding.md): BE bind 127.0.0.1 chua (KHONG 0.0.0.0 -> firewall)? comment English-only? FE vite port pin (khong CLI -p)? cd-first? body .mount (' + MNT + '/' + L.slug + ') co drift voi source/spec?\n' +
      '5) Quyet dinh DEMO_SUPPORTED_LANGS de xuat (lang du contract; TS thay noi chay duoc) + fixes can lam (uu tien cao->thap).\n' +
      'TRA VE StructuredOutput {lesson, demoSupportedLangs, perLang:[{lang,implementsContract,missing}], auditViolations, flowsOk, fixes}.',
      { label: 'ws:' + L.slug, phase: 'Analyze', model: 'opus', schema: RESULT }
    )
  }
}))

return { lessons: results.filter(Boolean) }
