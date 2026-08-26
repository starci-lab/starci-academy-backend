# Acceptance

- [ ] **AC-SD-01** Support Desk is one installed customer-support capability, not a bot template, tab or customer conversation. _Evidence: `EV-SD-006`._
- [ ] **AC-SD-02** Nivo bootstrap knowledge, customer applied context, customer knowledge sources and live operational state remain four distinct layers. _Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`._
- [ ] **AC-SD-03** Opening Setup creates or resumes one private session for the current candidate revision and never exposes it to ordinary operators. _Evidence: `EV-SD-001`, `EV-SD-002`._
- [ ] **AC-SD-04** Each later revision opens a new private Setup session based on the active immutable version. _Evidence: `EV-SD-001`, `EV-SD-002`._
- [ ] **AC-SD-05** No Setup message increments the active context version. _Evidence: `EV-SD-001`, `EV-SD-002`._
- [ ] **AC-SD-06** Setup progress is derived from required gate disposition, provenance and conflicts. _Evidence: `EV-SD-001`, `EV-SD-002`._
- [ ] **AC-SD-07** Every required gate is shown as complete, unresolved, conflicting, unknown or not applicable. _Evidence: `EV-SD-001`, `EV-SD-002`._
- [ ] **AC-SD-08** A sandbox conversation test binds the exact candidate digest and cannot perform live side effects. _Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`._
- [ ] **AC-SD-09** Editing a candidate marks its prior test evidence stale. _Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`._
- [ ] **AC-SD-10** Apply explicitly freezes exactly one next immutable context version and atomically changes the active binding. _Evidence: `EV-SD-001`, `EV-SD-002`._
- [ ] **AC-SD-11** Enable Live is a separate explicit action and cannot succeed until every declared readiness axis is ready. _Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`._
- [ ] **AC-SD-12** Telegram credentials are accepted only through write-only input, encrypted at rest and returned only as masked status. _Evidence: `EV-SD-001`, `EV-SD-004`._
- [ ] **AC-SD-13** Workspace AI readiness is displayed as a prerequisite rather than collected as a module credential. _Evidence: `EV-SD-001`, `EV-SD-004`._
- [ ] **AC-SD-14** Assist is the production default for risky business actions, but policy-safe acknowledgement, clarification, approved informational answers, basic triage and deterministic fallback do not require a human click; broader Autopilot requires explicit mode and eligible-intent policy. _Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`, `EV-SD-007`._
- [ ] **AC-SD-15** A verified inbound customer event creates or resumes a customer conversation and ticket, never an Execute session. _Evidence: `EV-SD-001`, `EV-SD-003`._
- [ ] **AC-SD-16** The language model can propose but cannot directly send customer messages or invoke external side effects. _Evidence: `EV-SD-001`, `EV-SD-003`._
- [ ] **AC-SD-17** Every customer send freshly checks active context, permission, consent, takeover, credential and idempotency. _Evidence: `EV-SD-001`, `EV-SD-003`._
- [ ] **AC-SD-18** Human takeover immediately blocks automatic replies for that customer conversation until authorized resume. _Evidence: `EV-SD-001`, `EV-SD-003`._
- [ ] **AC-SD-19** The right workbench shows the selected queue, customer conversation, customer, ticket, SLA, suggested reply, sources and controls. _Evidence: `EV-SD-001`, `EV-SD-003`._
- [ ] **AC-SD-20** One designated internal operations chat receives attributable proactive notices; customer threads never appear there as chat sessions. _Evidence: `EV-SD-001`, `EV-SD-003`._
- [ ] **AC-SD-21** Each proactive notice states its source, severity, reason, affected identity and recommended next action. _Evidence: `EV-SD-001`, `EV-SD-003`._
- [ ] **AC-SD-22** Future turns bind a newly applied context while prior and already captured in-flight turns retain their recorded version. _Evidence: `EV-SD-001`, `EV-SD-002`._
- [ ] **AC-SD-23** An AI request places the exact deterministic stable prefix before a declared prompt-cache boundary and all live operational data after it. _Evidence: `EV-SD-001`, `EV-SD-005`._
- [ ] **AC-SD-24** The stable prefix is fingerprinted by model, prompt contract, kind contract, tool schemas, Nivo knowledge digest and active immutable context digest. _Evidence: `EV-SD-001`, `EV-SD-005`._
- [ ] **AC-SD-25** Applying a new context or changing any stable-prefix component produces a new fingerprint and cannot accidentally reuse an incompatible cached prefix. _Evidence: `EV-SD-001`, `EV-SD-005`._
- [ ] **AC-SD-26** Current permission, mode, credential readiness, customer, conversation, ticket, consent, takeover, SLA, retrieval result and user message occur after the cache boundary. _Evidence: `EV-SD-001`, `EV-SD-005`._
- [ ] **AC-SD-27** No raw credential, live authorization state, generated reply or sensitive dynamic customer payload is stored as reusable prompt-cache content. _Evidence: `EV-SD-001`, `EV-SD-005`._
- [ ] **AC-SD-28** A cache miss produces the same governed AI request and business outcome as a hit; only cached input-token count, latency and cost may differ. _Evidence: `EV-SD-001`, `EV-SD-005`._
- [ ] **AC-SD-29** A failed readiness axis stops only unsafe automatic actions, emits one deduplicated internal notice and requires explicit current-state recovery. _Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`._
- [ ] **AC-SD-30** Default product wording says Business setup in use and keeps version ordinal, digest and cache identities in diagnostics. _Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`._
- [ ] **AC-SD-31** Every verified accepted inbound event is durably visible in the correct customer conversation before AI evaluation. _Evidence: `EV-SD-007`._
- [ ] **AC-SD-32** An eligible low-risk customer turn receives a policy-safe automatic response; a risky turn preserves a visible draft and approval or handoff path instead of being silently dropped. _Evidence: `EV-SD-007`._
- [ ] **AC-SD-33** If AI or retrieval fails while Telegram remains send-capable, the customer receives a deterministic non-committal fallback and operators receive one deduplicated urgent follow-up item. _Evidence: `EV-SD-007`._
- [ ] **AC-SD-34** If provider send fails, the outbound message shows failed delivery and an internal alert; the system never represents it as delivered. _Evidence: `EV-SD-007`._
- [ ] **AC-SD-35** The Support workbench can select the Telegram customer displayed as starci183 and render the ordered inbound and outbound transcript with context version, sender and delivery evidence. _Evidence: `EV-SD-007`._
- [ ] **AC-SD-36** Important facts link to source messages and repeated messages for one incident update one queue item rather than create duplicates. _Evidence: `EV-SD-007`._
- [ ] **AC-SD-37** Human takeover blocks subsequent automatic sends while retaining full customer history and drafts. _Evidence: `EV-SD-007`._
- [ ] **AC-SD-38** Applying a later context changes future response evaluation only and never rewrites prior customer messages, delivery evidence or queue history. _Evidence: `EV-SD-007`._

## Unresolved owner decisions

- **support-sla-policy:** What service hours, priority definitions and first-response or resolution targets apply? SLA timers and escalations cannot claim production correctness until approved.
- **support-retention-policy:** How long are customer conversations, tickets, attachments, traces and test evidence retained? Production deletion and audit rules remain undecided.
- **proactive-notification-policy:** Which events, recipients, quiet hours, acknowledgement deadlines and escalation ladder govern proactive notices? Only manually observed internal events are safe until approved.
- **nivo-support-bootstrap-v1:** Which exact public-safe documents, taxonomy examples and sandbox fixtures form Nivo Support bootstrap package v1? The package shape is approved, but its concrete content needs a separately reviewable versioned artifact.
