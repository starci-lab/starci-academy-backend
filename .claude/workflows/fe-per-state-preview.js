// ============================================================================
// FE per-state preview refactor (PILOT) — add per-state story exports to each block,
// imitating the idiomatic Storybook shape (Carbon-style) while KEEPING the AllVariants
// gallery StarCi already has as the human-review overview.
//
// Per block: Opus decides the real state set + whether the block is flat-prop or
// composition; Sonnet edits the existing story file to add one export per state
// (args-driven with argTypes for flat-prop blocks; a render specimen for composition
// blocks), preserving AllVariants. Agents write the FE files directly (absolute paths);
// review is git-diff + tsc + eyeballing Storybook after.
//
// PILOT ONLY — 6 diverse blocks. Fan out to the rest after the shape is confirmed.
// ============================================================================
export const meta = {
  name: 'fe-per-state-preview',
  description: 'PILOT: add per-state story previews (loading/empty/data/error/…) to 6 blocks, keep AllVariants',
  phases: [
    { title: 'Brief', detail: 'Opus decides the real states + flat-vs-composition per block' },
    { title: 'Code', detail: 'Sonnet edits the story file: per-state exports + argTypes, keeps AllVariants' },
  ],
}

const FE = 'C:\\Repositories\\starci-academy\\'

const SPEC = {
  type: 'object',
  properties: {
    kind: { type: 'string', enum: ['flat', 'composition'] },
    states: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          why: { type: 'string' },
        },
        required: ['name', 'why'],
        additionalProperties: false,
      },
    },
    argsNote: { type: 'string' },
  },
  required: ['kind', 'states', 'argsNote'],
  additionalProperties: false,
}

const DONE = {
  type: 'object',
  properties: {
    block: { type: 'string' },
    kind: { type: 'string' },
    statesAdded: { type: 'array', items: { type: 'string' } },
    keptAllVariants: { type: 'boolean' },
    note: { type: 'string' },
  },
  required: ['block', 'kind', 'statesAdded', 'keptAllVariants', 'note'],
  additionalProperties: false,
}

const A = typeof args === 'string' ? JSON.parse(args) : args

const results = await pipeline(A,
  async (b) => {
    const spec = await agent(
      `Doc 2 file (duong dan tuyet doi):\n` +
      `- Component: ${FE}${b.comp}\n- Story hien tai: ${FE}${b.story}\n\n` +
      `Nhiem vu: quyet dinh bo PREVIEW PER-STATE cho block "${b.name}", bat chuoc Storybook chuan (moi state 1 story rieng) NHUNG van giu gallery AllVariants.\n\n` +
      `1) "kind":\n` +
      `   - "flat" neu props chi la string/bool/enum (size/tone/disabled…), KHONG nhan children la cay JSX → co the dung args/argTypes (Controls song).\n` +
      `   - "composition" neu block nhan children/JSX la thanh phan (vd row con, node) → args khong drive duoc, phai render specimen tay.\n` +
      `2) "states": CHON tu tu vung {loading, empty, data-1, data-N (overflow), error, + ngu nghia rieng cua block (selected/disabled/read-only/bordered/variant…)}. CHI lay state THAT SU co that voi block nay — mot chip tinh KHONG co loading/empty/error. Moi state kem "why" 1 dong.\n` +
      `3) "argsNote": neu flat, ghi ngan props chinh + gia tri mau cho tung state; neu composition, ghi "render specimen".\n` +
      `Tra JSON theo schema.`,
      { model: 'opus', schema: SPEC, phase: 'Brief', label: `brief:${b.name}` },
    )
    return { b, spec }
  },
  async (prev) => {
    const { b, spec } = prev
    const done = await agent(
      `Sua FILE STORY (duong dan tuyet doi): ${FE}${b.story}\n` +
      `Component de tham chieu prop: ${FE}${b.comp}\n\n` +
      `Ban brief: kind=${spec.kind}. Cac state can them: ${spec.states.map((s) => `${s.name} (${s.why})`).join(' · ')}. argsNote: ${spec.argsNote}\n\n` +
      `Nhiem vu — EDIT file story (dung Read roi Edit/Write), GIU NGUYEN export AllVariants dang co, THEM moi state 1 export rieng:\n` +
      `- kind=flat: them "argTypes" vao meta cho cac prop chinh; moi export per-state dung "args: {...}" (de Controls song). Vd: export const Loading: Story = { args: { loading: true } }.\n` +
      `- kind=composition: moi export per-state la "render: () => (<Block .../>)" mo phong dung state do (vd Empty = list rong, DataN = nhieu row tran). KHONG ep args.\n` +
      `- Ten export = ten state viet hoa CamelCase (Loading, Empty, DataSingle, DataOverflow, Error, Selected…).\n` +
      `- Giu import + convention story-kit hien co. KHONG xoa gallery, KHONG doi title.\n` +
      `- Sau khi sua: dam bao file van la TypeScript hop le (khong dut cu phap).\n` +
      `Xong tra JSON {block, kind, statesAdded[], keptAllVariants, note}.`,
      { model: 'sonnet', schema: DONE, phase: 'Code', label: `code:${b.name}` },
    )
    return done
  },
)

return results.filter(Boolean)
