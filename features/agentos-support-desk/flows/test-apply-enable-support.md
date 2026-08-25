# Prove, apply and separately enable Support Desk

- Identity: `test-apply-enable-support`
- Trigger: A Setup candidate is review-ready.
- Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`

## Steps

1. **Run purpose-specific sandbox conversations against the exact candidate digest**
   - Actor: `module-administrator`
   - Surface: `support-test`
   - State: `support-test-running`
   - Result: Evidence records behavior, citations, policy decisions and assertions without contacting a live customer
2. **Review pass, warning and fail evidence**
   - Actor: `module-administrator`
   - Surface: `support-test`
   - State: `support-test-reviewed`
   - Result: Any candidate edit marks prior test evidence stale
3. **Explicitly Apply the exact candidate digest**
   - Actor: `module-administrator`
   - Surface: `support-setup`
   - State: `context-applying`
   - Result: The next immutable business-context version becomes active atomically; no message history is rewritten
4. **Enable Live only after independent knowledge, policy, channel and credential readiness**
   - Actor: `module-administrator`
   - Surface: `support-settings`
   - State: `support-live`
   - Result: Support Desk may accept live events in its selected operating mode

## Outcomes

- Test is evidence, not consent
- Apply and Enable Live remain separate trusted actions
