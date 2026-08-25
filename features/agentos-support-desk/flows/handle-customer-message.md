# Handle one inbound customer turn safely

- Identity: `handle-customer-message`
- Trigger: A verified enabled channel delivers an inbound event.
- Evidence: `EV-SD-001`, `EV-SD-003`

## Steps

1. **Send a customer message through an enabled channel**
   - Actor: `customer`
   - Surface: `support-operate`
   - State: `inbound-received`
   - Result: The event is verified, normalized, deduplicated and attached to the correct customer conversation
2. **Allow the system to bind active immutable context and fresh operational state**
   - Actor: `support-operator`
   - Surface: `support-operate`
   - State: `ai-evaluating`
   - Result: The deterministic stable prefix contains trusted instructions, kind contract, tool schemas, Nivo bootstrap knowledge and the active immutable business context; fresh customer, ticket, consent, takeover, SLA, retrieved evidence and current message follow the prompt-cache boundary.
3. **Let AI classify intent, urgency, sentiment and risk and propose a grounded response or action**
   - Actor: `support-operator`
   - Surface: `support-operate`
   - State: `response-pending`
   - Result: The model produces a proposal only; policy selects auto-send, approval, clarification, refusal or handoff
4. **Approve when required or allow an eligible constrained auto action**
   - Actor: `support-operator`
   - Surface: `support-operate`
   - State: `response-sent`
   - Result: Immediately before send, trusted code revalidates active version, permission, consent, takeover, credential and idempotency
5. **Continue operational handling**
   - Actor: `support-operator`
   - Surface: `support-operate`
   - State: `ticket-active`
   - Result: Conversation, ticket, SLA, assignment, handoff and evidence are updated without creating an Execute session

## Outcomes

- The customer receives only a policy-eligible attributable response
- The workbench becomes the operational source of truth
