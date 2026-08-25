# Teach Support Desk through a private guided revision

- Identity: `setup-support-business`
- Trigger: The module has no applied context or an administrator chooses New setup revision.
- Evidence: `EV-SD-001`, `EV-SD-002`

## Steps

1. **Open a new private Setup revision based on the currently active context when present**
   - Actor: `module-administrator`
   - Surface: `support-setup`
   - State: `setup-draft-open`
   - Result: One distinct resumable Setup session and one mutable candidate draft are created; the active context remains unchanged
2. **Answer the AI's highest-risk unresolved business question**
   - Actor: `module-administrator`
   - Surface: `support-setup`
   - State: `setup-interviewing`
   - Result: The answer gains provenance and updates gate coverage without creating a context version
3. **Correct conflicts, mark facts unknown or not applicable, and add supporting knowledge**
   - Actor: `module-administrator`
   - Surface: `support-setup`
   - State: `setup-interviewing`
   - Result: Gate coverage reflects evidence quality rather than message count or model confidence
4. **Review the structured understanding, unresolved risks and proposed behavior**
   - Actor: `module-administrator`
   - Surface: `support-setup`
   - State: `setup-review-ready`
   - Result: The draft becomes review-ready only when every required gate has an acceptable disposition

## Outcomes

- One reviewable candidate is bound to its Setup session and digest
- The existing active context and live operation are not mutated
