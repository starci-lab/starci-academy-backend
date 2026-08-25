# Create and apply a later Support Desk context version

- Identity: `revise-active-support-context`
- Trigger: The administrator needs to change business behavior.
- Evidence: `EV-SD-001`, `EV-SD-002`

## Steps

1. **Choose New setup revision**
   - Actor: `module-administrator`
   - Surface: `support-setup`
   - State: `setup-draft-open`
   - Result: A new private Setup session starts from the active immutable version while live operation stays on that version
2. **Resolve gates and safely test the candidate**
   - Actor: `module-administrator`
   - Surface: `support-test`
   - State: `support-test-reviewed`
   - Result: The candidate remains isolated and test evidence stays digest-bound
3. **Explicitly Apply the tested candidate**
   - Actor: `module-administrator`
   - Surface: `support-setup`
   - State: `context-active`
   - Result: Future turns bind the new active version; prior and already captured in-flight turns retain their recorded version

## Outcomes

- No Setup message creates a version
- No previous Execute or customer history is rewritten
