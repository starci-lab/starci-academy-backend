# States

| State | Kind | Meaning | Transitions |
| --- | --- | --- | --- |
| `support-installed` | `ready` | Support Desk is installed | `setup-draft-open` |
| `setup-draft-open` | `pending` | A private Setup revision is open | `setup-interviewing`, `setup-abandoned` |
| `setup-interviewing` | `pending` | AI is resolving business-understanding gates | `setup-review-ready`, `setup-abandoned` |
| `setup-review-ready` | `ready` | Candidate understanding is reviewable | `support-test-ready`, `context-applying`, `setup-abandoned` |
| `setup-abandoned` | `empty` | Candidate Setup revision is abandoned | `setup-draft-open` |
| `support-test-ready` | `ready` | Support test is ready | `support-test-running` |
| `support-test-running` | `pending` | Support test is running | `support-test-reviewed`, `support-test-refused` |
| `support-test-reviewed` | `ready` | Support test evidence is reviewable | `context-applying`, `setup-interviewing` |
| `support-test-refused` | `refused` | Support test was refused | `support-test-ready` |
| `context-applying` | `pending` | Candidate context is applying | `context-active`, `context-apply-refused` |
| `context-active` | `ready` | An immutable business context is active | `setup-draft-open`, `channel-unverified`, `support-live`, `support-paused` |
| `context-apply-refused` | `refused` | Context Apply was refused | `setup-review-ready` |
| `channel-unverified` | `empty` | Live channel is not verified | `channel-verifying` |
| `channel-verifying` | `pending` | Live channel is verifying | `channel-ready`, `channel-refused` |
| `channel-ready` | `ready` | Live channel is ready | `support-live`, `channel-refused` |
| `channel-refused` | `refused` | Live channel verification failed | `channel-verifying` |
| `support-paused` | `empty` | Live support is paused | `support-live` |
| `support-live` | `ready` | Support Desk is accepting live work | `inbound-received`, `support-paused`, `support-degraded` |
| `inbound-received` | `pending` | Inbound customer event is accepted | `ai-evaluating`, `human-takeover` |
| `ai-evaluating` | `pending` | AI is proposing a governed support action | `response-pending`, `human-takeover`, `support-degraded` |
| `response-pending` | `pending` | A response awaits policy or human decision | `response-sent`, `human-takeover`, `support-degraded`, `delivery-failed` |
| `response-sent` | `ready` | A customer response was sent | `ticket-active`, `ticket-resolved`, `delivery-failed` |
| `human-takeover` | `ready` | A human controls the customer conversation | `ticket-active`, `ai-evaluating` |
| `ticket-active` | `ready` | A support ticket is active | `ticket-resolved`, `human-takeover` |
| `ticket-resolved` | `ready` | A support ticket is resolved | `ticket-active` |
| `ops-session-active` | `ready` | Primary internal operations chat is active | `ops-notice-ready` |
| `ops-notice-ready` | `ready` | A proactive internal notice is ready | `ops-session-active` |
| `support-degraded` | `refused` | One support readiness axis is degraded | `support-live`, `support-paused` |
| `delivery-failed` | `refused` | An outbound customer response could not be delivered | `response-pending`, `human-takeover`, `support-degraded` |
