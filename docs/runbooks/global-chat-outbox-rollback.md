# Global Chat outbox rollback

## Preconditions

- Keep the additive Global Chat tables and backward-readable chat columns in place.
- Stop new Global Chat command traffic with the release feature gate before rollback.
- Do not log message bodies, reporter identities, evidence snapshots or actor ids.

## Drain and prove

1. Confirm the pending outbox count and oldest-row age are no longer increasing.
2. Keep the outbox publisher running until every publishable row has `published_at` set.
3. Retry failed rows after correcting the transient gateway or worker fault.
4. Reconnect one authorized member and prove an authoritative GraphQL refetch matches PostgreSQL state.
5. Confirm command-receipt replay still returns the original result for a previously committed command id.

## Roll back application code

1. Disable new Global Chat mutations.
2. Deploy the previous application release while retaining the expanded schema.
3. Verify founder-DM and legacy community-room reads remain functional.
4. Leave the additive schema intact until a separate approved contract migration is proven.

## Reject rollback when

- Unpublished outbox rows remain without a replay plan.
- A previous reader cannot tolerate rows written by the new command path.
- Reporter confidentiality or moderation evidence would be lost.
- The rollback requires destructive schema or data operations.
