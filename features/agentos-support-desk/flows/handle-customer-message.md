# Handle one inbound customer turn safely

- Identity: `handle-customer-message`
- Trigger: A verified enabled channel delivers an inbound event.
- Evidence: `EV-SD-001`, `EV-SD-003`, `EV-SD-007`

## Steps

1. **Send a customer message through an enabled channel**
   - Actor: `customer`
   - Surface: `support-operate`
   - State: `inbound-received`
   - Result: Trusted code verifies, normalizes and deduplicates the event, resolves the workspace-controller and provider-scoped customer identity, and durably records the inbound message before AI evaluation
2. **Allow trusted processing to extract evidence-backed operational facts**
   - Actor: `support-operator`
   - Surface: `support-operate`
   - State: `ticket-active`
   - Result: Important facts retain source-message evidence and create or update one deduplicated ticket or queue item only when action is required
3. **Allow the system to bind active immutable context and fresh operational state**
   - Actor: `support-operator`
   - Surface: `support-operate`
   - State: `ai-evaluating`
   - Result: The deterministic stable prefix contains trusted instructions, kind contract, tool schemas, Nivo bootstrap knowledge and the active immutable business context; fresh customer, conversation, message history, ticket, consent, takeover, SLA, retrieved evidence and current message follow the prompt-cache boundary.
4. **Let AI classify intent, urgency, sentiment and risk and propose a grounded response or action**
   - Actor: `support-operator`
   - Surface: `support-operate`
   - State: `response-pending`
   - Result: Trusted policy selects safe automatic response, approval-required draft, human handoff, refusal, or deterministic fallback; no proposal is silently discarded
5. **Approve when required or allow a policy-eligible safe automatic response**
   - Actor: `support-operator`
   - Surface: `support-operate`
   - State: `response-sent`
   - Result: Immediately before send, trusted code revalidates active version, permission, consent, takeover, credential and idempotency, commits an outbox record, sends through the provider and records delivery state
6. **Allow a deterministic response when AI or retrieval cannot complete safely**
   - Actor: `support-operator`
   - Surface: `support-operate`
   - State: `support-degraded`
   - Result: When the channel remains send-capable, the customer receives a non-committal acknowledgement and one urgent internal work item is queued; a provider send failure is recorded and alerted without claiming delivery
7. **Continue operational handling from the preserved customer history**
   - Actor: `support-operator`
   - Surface: `support-operate`
   - State: `ticket-active`
   - Result: Conversation transcript, delivery states, important facts, ticket, SLA, assignment, handoff and evidence are updated without creating an Execute session

## Outcomes

- Every accepted customer turn is visible in durable history and results in a policy-safe response path or explicit delivery failure
- The workbench is the operational source of truth and queue updates are evidence-backed and deduplicated
