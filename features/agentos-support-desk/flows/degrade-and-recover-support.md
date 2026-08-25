# Fail safely and recover one affected support axis

- Identity: `degrade-and-recover-support`
- Trigger: Knowledge, credential, channel, policy or provider readiness fails; an AI prompt-cache miss alone is normal and never degrades the module.
- Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`

## Steps

1. **Observe the readiness failure**
   - Actor: `support-operator`
   - Surface: `support-diagnostics`
   - State: `support-degraded`
   - Result: Only unsafe automatic actions stop; preserved axes remain usable
2. **Receive one deduplicated internal failure notice**
   - Actor: `support-operator`
   - Surface: `support-operate`
   - State: `ops-notice-ready`
   - Result: Operators see cause, scope and safe next action without raw secrets
3. **Repair and explicitly reverify the failed dependency**
   - Actor: `module-administrator`
   - Surface: `support-settings`
   - State: `support-live`
   - Result: The module resumes only after current readiness passes; no blind replay occurs

## Outcomes

- The module fails closed for affected side effects
- Recovery is explicit, current and attributable
