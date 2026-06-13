export const meta = {
  name: 'flashcards2-fs',
  description: 'Write 2 new Fullstack flashcard decks into .gitrefs/data: email-sms-and-otp, file-upload-and-storage',
  phases: [{ title: 'Write decks' }],
}

const SPEC = `You are writing an interview-prep flashcard deck for StarCi Academy Fullstack Mastery. Output is markdown files seeded into a DB. Match this EXACT format and depth. Do NOT read-then-overwrite, modify, or delete any existing file outside your target deck folder.

IMPORTANT: write files under .gitrefs/data (the real content git source), NOT .mount (which is a detachable cache).

FILE FORMAT (every separator is the literal line  <!-- @starci/seperator -->  alone on its own line)

Deck meta en.md:
# title
<!-- @starci/seperator -->
THE TITLE
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
one to two sentence description
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
medium
<!-- @starci/seperator -->
# moduleRefs
## 0
<!-- @starci/seperator -->
module-display-id-one
<!-- @starci/seperator -->

Deck meta vi.md: identical structure, Vietnamese title and description, SAME difficulty and SAME moduleRefs.

Card en.md (one folder per card: cards/0-card/en.md ... cards/7-card/en.md):
# question
<!-- @starci/seperator -->
the scenario-driven interview question
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
one of: junior | middle | senior | staff
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Tag1
## 1
<!-- @starci/seperator -->
Tag2
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — three to six substantial sentences
:::

:::muted
**Trade-off** — three to six substantial sentences
:::

:::muted
**Pitfall & Failure mode** — three to six substantial sentences
:::
<!-- @starci/seperator -->

Card vi.md: identical structure; question and answer in Vietnamese WITH full diacritics; level and tags IDENTICAL to en.md (keep the English tag strings); the three bold labels in vi.md are exactly: **Giải pháp**, **Trade-off**, **Cạm bẫy & Failure-mode**.

QUALITY BAR: questions must be concrete and scenario-driven (a symptom, a trade-off, a design choice) — never a bare "What is X?". Each of the three answer blocks must be genuinely substantial and technically correct. Vietnamese must be natural and fully accented; do not force-translate technical terms (keep OTP, presigned URL, multipart, deliverability, CDN, etc.).`

function buildPrompt(deck) {
  return `${SPEC}

## TARGET
Create NEW deck folder (relative to repo root): ${deck.path}
- Deck title (en): "${deck.titleEn}"
- Deck title (vi): "${deck.titleVi}"
- difficulty: medium
- moduleRefs (use these exact displayIds, in this order): ${deck.refs.join(', ')}
Write the deck meta en.md and vi.md, then 8 cards in cards/0-card ... cards/7-card (each en.md + vi.md).

## THE 8 TOPICS (one card each; vary level across junior/middle/senior/staff, roughly 1 junior, 2-3 middle, 3-4 senior, 1 staff)
${deck.topics}

## VALIDATE BEFORE FINISHING (run this bash and fix anything reported)
bash -c 'd="${deck.path}"; for f in "$d"/cards/*/en.md "$d"/cards/*/vi.md; do n=$(grep -cE "^# (question|level|tags|answer)$" "$f"); [ "$n" -ne 4 ] && echo "BAD $f ($n/4)"; done; echo "files: $(find "$d" -type f | wc -l) (expect 18)"'
Fix any BAD file or a count != 18. Report final file count and level distribution.`
}

const decks = [
  {
    label: 'fs24-email-otp',
    path: '.gitrefs/data/courses/0-fullstack-mastery/flashcard-decks/24-email-sms-and-otp',
    titleEn: 'Email, SMS & OTP',
    titleVi: 'Email, SMS & OTP',
    refs: ['email-sms-otp'],
    topics: `0. Templating and i18n for notifications — one template, many locales, without code duplication. (junior)
1. Transactional email deliverability — providers, SPF/DKIM/DMARC, and why your mail lands in spam. (middle)
2. OTP design — TOTP vs a random code, expiry, single-use, and hashing the code at rest. (senior)
3. Rate limiting and abuse — preventing OTP/email bombing, enumeration, and brute force. (senior)
4. Async delivery via a queue — never block the request on a third-party send, with retries. (middle)
5. Idempotency and delivery status — dedup sends and consume provider webhooks for bounces/failures. (middle)
6. Privacy and PII — never logging codes/phone numbers and storing recipient data safely. (middle)
7. Designing a notification service (email/SMS/push) at scale — multi-provider fallback, throttling, and observability. (staff)`,
  },
  {
    label: 'fs25-file-upload',
    path: '.gitrefs/data/courses/0-fullstack-mastery/flashcard-decks/25-file-upload-and-storage',
    titleEn: 'File Upload & Storage',
    titleVi: 'Upload File & Lưu Trữ',
    refs: ['file-upload-and-storage'],
    topics: `0. Storage choice — object storage vs database blobs vs local filesystem, and why object storage usually wins. (junior)
1. Presigned URLs — uploading and downloading directly to object storage instead of proxying bytes through your server. (senior)
2. Validating uploads — type/size limits, content sniffing, antivirus, and never trusting the client-declared type. (senior)
3. Large and resumable uploads — multipart/chunked uploads and resuming after a dropped connection. (middle)
4. Serving files — CDN in front of storage, signed URLs for private files, and cache headers. (middle)
5. Image processing — transform on upload vs on-the-fly, thumbnails, and caching derivatives. (middle)
6. Metadata, content-hash dedup, and lifecycle cleanup of orphaned/abandoned uploads. (middle)
7. Designing an end-to-end upload + storage + delivery pipeline at scale. (staff)`,
  },
]

phase('Write decks')
const results = await parallel(decks.map((d) => () => agent(buildPrompt(d), { label: d.label, phase: 'Write decks' })))
return results
