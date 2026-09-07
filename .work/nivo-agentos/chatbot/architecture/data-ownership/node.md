---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.architecture.data-ownership",
  "kind": "architecture",
  "required": true,
  "assertions": [
    "chatbot-data-owners-mapped",
    "chatbot-authority-and-projection-boundaries-reviewed",
    "chatbot-recovery-custody-reviewed"
  ],
  "state": "done",
  "completion": {
    "inputDigest": "4c2fb50e079465f81a037fb134c4c47b7d9c35c6b5c9ccff824ae9c9961a5096",
    "evidence": [
      "nivo.chatbot.architecture.data-ownership.review-20260908"
    ]
  }
}
---
# Data ownership

## Observed architecture
- Core primary persistence owns the AgentOS module installation, Setup context/test receipts, Chatbot installation authority, knowledge versions, authority generations, and projection outboxes under `src/modules/bussiness/agentos-module-studio/`, `src/modules/bussiness/agentos-chatbot/`, and primary migrations.
- The workspace controlplane PostgreSQL owns runtime projections, sealed channel references, OAuth state, conversations, ordered messages, history snapshots, reply/provider outboxes, settlements, and audit outboxes under `apps/agentos-controlplane/src/instance-db/` and `apps/agentos-controlplane/src/chatbot/`.
- `chatbot-setup-registration.service.ts` projects only an exact active Setup target with matching definition/context/generations and complete acceptance receipts; it materializes a knowledge version but sets `enabled` false.
- `chatbot-history-snapshot.service.ts` computes digest-bound ordered snapshots and changes a sequence-gap conversation to human handoff.
- `apps/agentos-cli/src/backup/chatbot-backup.ts` and restore services indicate explicit runtime-history custody code exists; no execution result was used as proof here.

## Candidate decision
Treat Core primary state as installation/authority and accepted-Setup authority, and controlplane PostgreSQL as the canonical operational conversation/history ledger exposed to the browser only through the Core owner gateway. Specify backup/restore, projection replay, deletion, retention, gap recovery, and disaster-recovery ownership without creating a second writable history authority.

## Unknowns
Approved retention, deletion/export obligations, RPO/RTO, projection-lag tolerance, restore authority, and reconciliation after partial failure remain unproven.

## Done when
Every durable record has one canonical writer, every projection has replay/gap rules, and recovery/deletion responsibilities are reviewed against the business NFRs.
