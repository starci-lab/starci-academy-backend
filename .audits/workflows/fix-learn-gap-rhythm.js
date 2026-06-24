export const meta = {
  name: 'fix-learn-gap-rhythm',
  description: 'Nan gap rhythm toan /learn (FE): h-* spacer thu cong -> flex gap; gap-4 off-scale -> gap-3/6; PageHeader = tier rieng gap-10, content cluster gap-6 (khong gop). Per-group Sonnet song song + verify tsc/eslint. Report-only (khong push).',
  phases: [{ title: 'Fix' }, { title: 'Verify' }],
}

const FE = 'D:/Repositories/starci-academy'
const L = FE + '/src/components/features/learn'

const RULE = [
  'THANG GAP (STRICT): 0/2/3/6/8 + header->content = 10. CAM gap-4/5/7/9. CAM `<div className="h-N" />` spacer thu cong.',
  'h-* spacer -> XOA, boc parent `flex flex-col gap-N`: gap-2 (cum con sat) / gap-3 (trong 1 block) / gap-6 (section<->section) / gap-10 (PageHeader header -> content).',
  'PageHeader LUON la TIER rieng: gap-10 ben duoi no; content (continue/list/section) goi trong cluster `flex flex-col gap-6`. KHONG gop PageHeader chung wrapper voi block dau (loi da sua o CourseContents).',
  'gap-4 -> gap-3 (trong block) hoac gap-6 (giua section), tuy ngu canh.',
  'Skeleton PHAI mirror gap cua loaded (doi h-* skeleton sang gap giong layout that).',
  'CHI sua spacing (gap/h-*/flex-col wrapper). KHONG doi logic/data/text/component. Giu className placement khac.',
].join('\n')

const GROUPS = [
  { k: 'lesson-reader-shell', files: [L + '/LessonReader/index.tsx', L + '/LessonReader/ContentHeaderSkeleton/index.tsx'], note: 'LessonReader/index.tsx co h-3 (dong ~310/321/331) giua cac block header lesson -> boc flex-col gap-3 (trong header) / gap-6 (section) / gap-10 (neu la header->content), xoa h-3. ContentHeaderSkeleton h-3 mirror.' },
  { k: 'content-body', files: [L + '/LessonReader/ContentBody/ContentBodyV2/index.tsx', L + '/LessonReader/ContentBodySkeleton/index.tsx'], note: 'ContentBodyV2 h-6 (~L100) giua tab-bar/header va body -> gap-6. ContentBodySkeleton h-2/h-3 mirror sang gap.' },
  { k: 'lesson-body', files: [L + '/LessonReader/LessonBody/index.tsx'], note: 'h-6 (~L29) -> section gap-6.' },
  { k: 'challenge-body', files: [L + '/LessonReader/ChallengeBody/index.tsx', L + '/LessonReader/ChallengeBody/ChallengeCardSkeleton/index.tsx'], note: 'ChallengeBody h-6 (~L78) -> gap-6. ChallengeCardSkeleton h-2/h-3 -> gap mirror.' },
  { k: 'challenge-view', files: [L + '/Challenge/ChallengeView/index.tsx', L + '/Challenge/ChallengeView/ChallengeViewSkeleton/index.tsx'], note: 'ChallengeView gap-4 (~L205 outer -> gap-6 giua section brief; ~L395 outputs contentClassName -> gap-3). ChallengeViewSkeleton gap-4 (~L26) mirror gap-6.' },
  { k: 'submission', files: [L + '/Challenge/SubmissionResult/index.tsx', L + '/Challenge/ChallengeSubmissionPanel/SubmissionRow/index.tsx'], note: 'SubmissionResult gap-4 (~L163/217) -> gap-3. SubmissionRow h-2/h-3 (~L186/195/217) -> boc flex-col gap-2/gap-3, xoa h-*.' },
  { k: 'flashcards', files: [L + '/Flashcards/index.tsx'], note: 'VERIFY: gap-10 outer (~L68) co dung PageHeader-tier khong (PageHeader dung rieng + content cluster gap-6, KHONG gop). Neu gop nhu loi CourseContents thi tach ra.' },
  { k: 'leaderboard', files: [L + '/Leaderboard/index.tsx'], note: 'VERIFY: gap-10 outer (~L58) PageHeader-tier dung chua (tach header + content cluster gap-6).' },
  { k: 'personal-project', files: [L + '/PersonalProject/PersonalProjectDashboard/index.tsx'], note: 'VERIFY: gap-10 outer (~L183) PageHeader-tier dung chua (header rieng + content cluster gap-6, khong gop).' },
  { k: 'foundation-resource', files: [L + '/Foundations/FoundationResourceLayout/index.tsx', L + '/MilestoneOutline/MilestoneOutlineSkeleton/index.tsx'], note: 'FoundationResourceLayout h-3 (~L116) -> gap. MilestoneOutlineSkeleton h-2 -> gap mirror.' },
]

const RES = { type: 'object', additionalProperties: false, required: ['group', 'changes', 'ok'], properties: { group: { type: 'string' }, changes: { type: 'string' }, ok: { type: 'boolean' } } }

phase('Fix')
const res = await parallel(GROUPS.map((g) => () =>
  agent(
    'Nan GAP rhythm cho nhom "' + g.k + '" (FE). VIET TIENG VIET CO DAU neu comment.\n' +
    'RULE:\n' + RULE + '\n\n' +
    'FILES:\n' + g.files.map((f) => '- ' + f).join('\n') + '\n\n' +
    'VIEC CU THE: ' + g.note + '\n\n' +
    'Lam: Read tung file, ap fix gap (xoa h-* spacer + boc flex-col gap dung muc; gap-4->3/6; verify PageHeader tier). Doc lai dam bao JSX hop le (dong/mo the can). CHI sua spacing.\n' +
    'Tra {group, changes (tom tat file+dong da sua), ok:true neu xong sach}.',
    { label: 'fix:' + g.k, phase: 'Fix', model: 'sonnet', schema: RES },
  )))

phase('Verify')
const verify = await agent(
  'Verify FE sau khi nan gap. Chay (cwd ' + FE + '):\n' +
  'cd "' + FE + '" && npx tsc --noEmit 2>&1 | grep -iE "learn|Challenge|Foundation|Leaderboard|Flashcard|Milestone|Personal" | head -30\n' +
  'va: npx eslint src/components/features/learn 2>&1 | grep -viE "React version not specified" | head -30\n' +
  'Tra ve text tieng Viet: co loi tsc/eslint nao o cac file vua sua khong (liet ke), hay sach.',
  { label: 'verify:tsc-eslint', phase: 'Verify', model: 'sonnet' },
)

return { groups: GROUPS.map((g) => g.k), results: res.filter(Boolean), verify }
