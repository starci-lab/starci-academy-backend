export const meta = {
  name: 'audit-vietnamese',
  description: 'Audit + fix tieng Viet (force-translation + calque + dau) cho 1 chunk (chunk i = units[i%10]) theo audit-vietnamese.md',
  phases: [
    { title: 'Review', detail: 'Haiku: fix force-translation + dau, gom calque' },
    { title: 'Rewrite', detail: 'Sonnet: viet lai cau calque (chi unit co co)' },
  ],
}

