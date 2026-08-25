# Global Chat specification

## Member operations

- Enter the room and read history.
- Continue from the last-read point.
- Post a message, reply, react, and mention.
- Edit or remove an owned message.
- Report content or a member.
- Mute room notifications.

## Moderator operations

- Review, dismiss, action, or escalate a report.
- Remove or restore content.
- Mute or ban a member.
- Record a reason for every moderation outcome.

## Failures

- An ineligible member is denied room access or the write action with a clear access state.
- A muted member is denied posting until mute expiry while reading follows the approved policy.
- A banned member is denied Global Chat access until restored.
- A safety-rejected message is not published and receives a policy-category explanation.
- One member action produces at most one visible message.
- A moderation race resolves to the latest valid, auditable decision.

## Launch gates

Production launch requires a named policy owner, documented community policy, moderator coverage, approved retention, severity and escalation rules, report-response targets, and pilot thresholds.
