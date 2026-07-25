// ============================================================================
// Rewrite exampleResults for the 228 mis-generated questions — trial run of 50.
//
// The old ones answered a prompt/givenCode that had been fabricated at the question root,
// so they respond to a question the learner never sees.
//
// Cost shape (the same three levers that made the classifier cheap):
//  - The batch file carries ONLY checkpoint text and which ones each level must cover.
//    Checkpoints are self-contained statements of what a complete answer establishes, so
//    an answer covering [0,2,5] is just those three spoken aloud — the question prompt,
//    the given code and the ideal answer are all unnecessary input.
//  - FIVE questions per agent, so the instructions are paid for once per five.
//  - ~100 words per answer: this is illustrative data, not an essay.
//
// Coverage is decided in build_example_inputs.py, never by the model, and the SCORE is
// computed from the covered checkpoints' bands. The score and the text therefore cannot
// disagree — the old pipeline scored the prose after the fact and produced nulls and
// non-monotonic ladders.
//
// Result: [{ batchIndex, questions: [{ folder, answers: [<5 strings, level 1..5>] }] }]
// ============================================================================
export const meta = {
  name: 'mount-write-examples',
  description: 'Rewrite exampleResults from the authored checkpoints, 5 questions per agent',
  phases: [{ title: 'Write', detail: 'Sonnet writes 5 leveled answers per question' }],
}

const DIR = 'C:\\Repositories\\ac\\starci-academy-backend\\.artifacts\\interview-audit\\mount-scripts\\_example_batches\\'

const SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          folder: { type: 'string' },
          answers: {
            type: 'array',
            items: { type: 'string' },
            minItems: 5,
            maxItems: 5,
          },
        },
        required: ['folder', 'answers'],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
}

const RULES = `Moi cau hoi co danh sach "checkpoints" (cac y ma mot cau tra loi day du phai neu) va "coverage"
= 5 bo chi so, ung voi 5 MUC tra loi cua ung vien (muc 1 gioi nhat -> muc 5 kem nhat).

Nhiem vu: voi MOI cau hoi, viet DUNG 5 cau tra loi. Cau tra loi thu k phai neu DUNG cac checkpoint co chi so
trong coverage[k] - khong hon, khong kem.

QUY TAC:
- Chi dien dat lai cac checkpoint duoc chi dinh thanh LOI NOI tu nhien cua ung vien trong phong van
  ("So van de o day la...", "Em se sua bang cach..."). KHONG liet ke dau dong, KHONG danh so.
- TUYET DOI khong dua vao y thuoc checkpoint NGOAI coverage[k] - diem duoc tinh tu dung cac chi so do,
  neu them y khac thi text va diem lech nhau.
- Muc thap dan phai NGHE TU NHIEN chu khong phai muc cao bi cat cut: muc 4-5 giong nguoi hieu so sai,
  tu tin sai, hoac chi cham vao be noi. coverage rong = tra loi lac de / hieu sai hoan toan.
- MOI cau tra loi KHOANG 100 TU (ngan gon - day la du lieu minh hoa).
- Viet bang TIENG ANH (exampleResults la English o ca en.md lan vi.md).
- Giu "folder" y het trong file, tra du 5 phan tu theo thu tu muc 1..5.`

// 46 batch indices (228 questions, five per batch) embedded so a resume needs no args.
const ALL = Array.from({ length: 46 }, (_unused, i) => i)
const parsed = typeof args === 'string' ? JSON.parse(args) : args
const A = Array.isArray(parsed) && parsed.length > 0 ? parsed : ALL

const results = await parallel(A.map((batchIndex) => async () => {
  const r = await agent(
    `Doc file JSON ${DIR}batch_${batchIndex}.json - chua {"questions":[{"folder","checkpoints":[...],"coverage":[[...],...5 bo]}]}.\n\n${RULES}\n\nTra JSON {"questions":[{"folder":"...","answers":["<muc 1>","<muc 2>","<muc 3>","<muc 4>","<muc 5>"]}, ...]} cho TAT CA cau trong file.`,
    { model: 'sonnet', schema: SCHEMA, phase: 'Write', label: `ex-batch#${batchIndex}` },
  )
  return { batchIndex, questions: r.questions }
}))

return results.filter(Boolean)
