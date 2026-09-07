---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.implementation.frontend",
  "kind": "implementation",
  "required": true,
  "dependsOn": [
    "nivo.chatbot.implementation.backend",
    "nivo.shared.implementation.frontend"
  ],
  "refs": [
    "repo.nivo-frontend",
    "design.chatbot-workbench"
  ],
  "assertions": [
    "chatbot-frontend-contract-implemented",
    "chatbot-workbench-states-implemented",
    "chatbot-frontend-recovery-actions-implemented"
  ],
  "state": "suspended",
  "suspensionReason": "Frontend source exists, but Chatbot workbench visual direction is unapproved, shared frontend completion is unavailable, and the retry action/served UI have no accepted evidence."
}
---
# Frontend implementation

## Observed implementation
- `workspace-controlplane.ts` defines installation-qualified Chatbot channels, conversations, messages, workbench reads, Zalo OAuth start, channel bind, handoff, and delivery reconciliation through the Core endpoint.
- `AgentOSSolutionModulePage/index.tsx` loads the Chatbot workbench and wires Zalo popup, handoff, resolve, and ambiguous-delivery reconciliation actions.
- `ChatbotWorkbenchBlock/index.tsx` renders channels, conversations, ordered transcript rows, delivery labels, handoff controls, Zalo connect, pending and refusal feedback, and manual ambiguous-delivery resolution using shared Grammar components.
- Component/API/query tests exist for installation identity, handoff, ambiguous delivery, empty/refusal states, Telegram beside Zalo connection, and fixed Core routing. These files were inspected, not executed as acceptance proof.

## Known behavior gaps
- Backend/Core supports `retry-reply`, but the frontend operation union, API exports, page actions, and workbench do not expose a failed-reply retry control.
- The visual direction resource is not approved; rendered fidelity, responsive behavior, accessibility, popup completion feedback, refresh timing, and served-build identity remain unverified.
- The workbench has no observed pagination or incremental history-loading UI.

## Candidate code scope
Complete approved Chatbot-specific actions and states inside the mapped frontend paths while reusing the shared Setup/Test and Grammar owners. Keep provider secrets outside browser inputs and show pending, refused, failed, cancelled, and ambiguous states truthfully.

## Done when
The approved design and behavior are implemented in a scoped frontend commit, including the required recovery actions, with focused tests and rendered proof against that commit.
