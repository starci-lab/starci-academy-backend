---
{
  "schema": "work/node@1",
  "id": "nivo.shared.business.nfr",
  "kind": "business",
  "required": true,
  "refs": [
    "repo.nivo-backend",
    "repo.nivo-frontend"
  ],
  "assertions": [
    "shared-nfr-reviewed"
  ],
  "state": "done",
  "completion": {
    "inputDigest": "d1f44dad89f787585aeddf022b793943e8428ab2b473711b778b4abdfa0b398b",
    "evidence": [
      "nivo.shared.business.nfr.review-20260908"
    ]
  }
}
---
# Non-functional requirements

## Candidate scope
Operations should be idempotent, auditable by stable installation/session identities, fail closed on stale setup/test generations, preserve prior active context on failure, isolate concurrent installations, and show bounded progress/refusal feedback.

## Observed source
The installation entity stores request digests, generations, active context and failure code; frontend setup actions use per-installation locks and pending/refused states. No current source inspection proves production latency, availability or served behavior.

## Done when
Owners approve measurable reliability, concurrency, recovery, accessibility and response-time targets.
