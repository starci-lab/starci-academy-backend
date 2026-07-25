// ============================================================================
// Classify every checklist checkpoint: dimension + critical.
//
// Cost shape (deliberate):
//  - TEN questions per agent, not one -> ~99 calls instead of 985.
//  - The batch file holds ONLY checkpoint text. Checkpoints are self-contained
//    declarative statements, so classifying them needs neither prompt nor givenCode —
//    which is what makes the input small.
//  - Output is one enum + one boolean per checkpoint. The agent never rewrites text.
//  - scoreBand is NOT asked for: a model splitting numbers that must total exactly 100
//    gets it wrong often enough to need validation and retries. apply-checkpoints.js
//    computes it deterministically instead, so the invariant holds by construction.
//
// Agents read their own batch file, so args stay empty and a resume needs no payload.
// Result: [{ batchIndex, questions: [{ folder, checkpoints: [{dimension, critical}] }] }]
// ============================================================================
export const meta = {
  name: 'mount-classify-checkpoints',
  description: 'Classify checklist checkpoints (dimension + critical), 10 questions per agent',
  phases: [{ title: 'Classify', detail: 'Sonnet labels each checkpoint from its text alone' }],
}

const DIR = 'C:\\Repositories\\ac\\starci-academy-backend\\.artifacts\\interview-audit\\mount-scripts\\_chk_batches\\'

const SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          folder: { type: 'string' },
          checkpoints: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                dimension: { type: 'string', enum: ['technical', 'problemSolving', 'communication', 'testing'] },
                critical: { type: 'boolean' },
              },
              required: ['dimension', 'critical'],
              additionalProperties: false,
            },
          },
        },
        required: ['folder', 'checkpoints'],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
}

const RULES = `Moi checkpoint la 1 y ma cau tra loi hoan chinh phai the hien. Voi TUNG checkpoint, quyet dinh 2 thu:

1) "dimension" - checkpoint nay do TRUC nao (chon DUNG 1):
   - technical      : kien thuc/co che ky thuat (API, co che framework, dac tinh he thong, bug that su nam o dau).
   - problemSolving : cach LAP LUAN va suy ra (chan doan, danh doi, uu tien theo muc do anh huong, de xuat huong sua).
   - communication  : cach TRINH BAY/dan dat (phan biet must-fix vs style, giai thich VI SAO, dat dung tam van de).
   - testing        : kiem chung (viet test gi, tai hien loi ra sao, do luong truoc/sau, regression).

2) "critical" - true khi THIEU y nay thi cau tra loi coi nhu HONG (bo sot bug goc, lo lot du lieu, mat du lieu,
   hieu sai ban chat van de). false khi day chi la y lam cau tra loi day du hon (chi tiet bo sung, cach sua thay the,
   luu y phu). Moi cau thuong co 1-3 y critical, KHONG phai y nao cung critical.

QUAN TRONG:
- Tra ve DUNG so luong checkpoint cho moi cau, DUNG THU TU nhu trong file. Khong them, khong bot, khong sap xep lai.
- Giu nguyen "folder" y het trong file.
- Truong "dimensionsSeen" trong file la cac tag da co san o rubric cua chinh cau do - dung lam GOI Y cho nhat quan,
  nhung van doc ky text checkpoint de quyet dinh (no khong phai dap an).`

// All 99 batch indices are embedded so a resume needs no args payload; pass an explicit
// list (e.g. [0]) to pilot a single batch before committing to the full run.
const ALL = Array.from({ length: 99 }, (_unused, i) => i)
const parsed = typeof args === 'string' ? JSON.parse(args) : args
const A = Array.isArray(parsed) && parsed.length > 0 ? parsed : ALL

const results = await parallel(A.map((batchIndex) => async () => {
  const r = await agent(
    `Doc file JSON ${DIR}batch_${batchIndex}.json - no chua {"questions":[{"folder","dimensionsSeen","checkpoints":[<text>...]}]}.\n\n${RULES}\n\nTra JSON {"questions":[{"folder":"...","checkpoints":[{"dimension":"...","critical":true|false}, ...]}, ...]} cho TAT CA cau trong file.`,
    { model: 'sonnet', schema: SCHEMA, phase: 'Classify', label: `chk-batch#${batchIndex}` },
  )
  return { batchIndex, questions: r.questions }
}))

return results.filter(Boolean)
