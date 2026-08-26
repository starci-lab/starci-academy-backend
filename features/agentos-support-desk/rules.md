# Business rules

## BR-SD-01

Support Desk is one durable installed business capability with exactly one customer-support kind.

- Strength: `confirmed`
- Evidence: `EV-SD-006`

## BR-SD-02

Nivo bootstrap knowledge is public-safe, versioned and immutable by package digest.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`

## BR-SD-03

Customer business facts and customer-owned knowledge never mutate the Nivo bootstrap package.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`

## BR-SD-04

Each candidate context revision owns one distinct private resumable Setup session.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-002`

## BR-SD-05

A module has at most one open Setup draft at a time.

- Strength: `proposed`
- Evidence: `EV-SD-001`, `EV-SD-002`

## BR-SD-06

Setup messages update one mutable candidate and never create immutable context versions by themselves.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-002`

## BR-SD-07

Setup progress measures required gate disposition, provenance and conflicts, not message count or model confidence.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-002`

## BR-SD-08

Completeness means every required gate has an acceptable disposition; it does not certify business truth.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-002`

## BR-SD-09

The required gates are identity and offers, customer segments, intent taxonomy, permitted answers, prohibited claims, escalation and handoff, hours and SLA, tone and language, privacy and consent, channel behavior, knowledge readiness and operating mode.

- Strength: `proposed`
- Evidence: `EV-SD-001`, `EV-SD-002`

## BR-SD-10

Testing binds an exact draft digest or immutable active version and cannot contact live customers or mutate live state.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`

## BR-SD-11

Any candidate edit makes earlier draft-bound test evidence stale.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`

## BR-SD-12

Only explicit Apply freezes the next immutable context version and changes the module active context atomically.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-002`

## BR-SD-13

Enable Live is separate from Apply and requires active context, knowledge readiness, policy readiness, verified channel and valid credential.

- Strength: `proposed`
- Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`

## BR-SD-14

Telegram is the initial live provider; its bot token is write-only, encrypted and never returned.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-004`

## BR-SD-15

Webhook verification material is Nivo-managed and never exposed to the language model.

- Strength: `proposed`
- Evidence: `EV-SD-001`, `EV-SD-004`

## BR-SD-16

External knowledge, CRM or handoff credentials are required only when their connector is enabled.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-004`

## BR-SD-17

Workspace AI readiness is a prerequisite and not a Support Desk credential.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-004`

## BR-SD-18

The production default is Assist for risky business actions, while trusted policy automatically allows acknowledgement, clarification, approved-knowledge informational answers, basic triage and deterministic fallback that make no prohibited commitment; broader Autopilot still requires explicit enablement and an approved eligible-intent policy.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`, `EV-SD-007`

## BR-SD-19

Human takeover stops automatic customer responses for that conversation until an authorized resume.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-003`

## BR-SD-20

Customer conversations and tickets belong to the Support workbench and are not Execute sessions.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-003`

## BR-SD-21

One designated primary operations Execute session receives proactive notices; optional additional Execute sessions remain collaborative only.

- Strength: `proposed`
- Evidence: `EV-SD-001`, `EV-SD-003`

## BR-SD-22

Proactive internal notices originate only from registered events or approved schedules and include source, severity, reason, affected identity and next action.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-003`

## BR-SD-23

Proactive notices obey recipient, quiet-hour, deduplication, acknowledgement and escalation policy.

- Strength: `proposed`
- Evidence: `EV-SD-001`, `EV-SD-003`

## BR-SD-24

The language model may propose classifications, responses and tool intents but cannot perform external side effects directly.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-003`

## BR-SD-25

Trusted code freshly revalidates active context, permission, consent, takeover, credential and idempotency immediately before every external send.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-003`

## BR-SD-26

AI caching means provider prompt/input-token caching of an exact prompt prefix; it is not response caching, application state caching or authorization caching.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-005`

## BR-SD-27

The cacheable prefix has deterministic order: trusted system policy, Support Desk kind contract, versioned tool and widget schemas, Nivo bootstrap knowledge, then the active immutable business context.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-005`

## BR-SD-28

The dynamic suffix begins after the cache boundary and contains current permission and mode, credential readiness status, customer, conversation, ticket, consent, takeover, SLA, retrieved passages and the current message.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-005`

## BR-SD-29

Nivo computes a logical prompt-prefix fingerprint from model identity, prompt-contract version, kind-contract version, tool-schema versions, Nivo-knowledge digest and active-context digest; provider cache identity remains provider-owned.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-005`

## BR-SD-30

A new model, prompt contract, kind contract, tool schema, Nivo knowledge package or applied context naturally creates a different prefix fingerprint and therefore cannot reuse the old prefix cache entry.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-005`

## BR-SD-31

Setup may cache its stable instructions and append-only unchanged message prefix, but its mutable candidate draft remains after the stable boundary until Apply.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-005`

## BR-SD-32

Raw credentials, authorization state, live customer data and generated outputs never enter the shared stable cacheable prefix; generated replies are never cached or reused.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-005`

## BR-SD-33

Prompt caching is optional optimization: a hit reduces billed or processed input tokens and time-to-first-token, while a miss executes the same semantically correct request and never degrades the module.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-005`

## BR-SD-34

Nivo records provider-reported cached input tokens, uncached input tokens, hit or miss, latency and estimated cost without recording secret prompt content; these metrics do not change the action decision.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-002`

## BR-SD-35

Default UI uses business wording such as Business setup in use; prompt-prefix fingerprint, cache hit or miss, cached-token counts, version ordinals and digests remain progressive diagnostics.

- Strength: `confirmed`
- Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`

## BR-SD-36

A verified inbound event is durably recorded before AI evaluation and is never silently discarded by an Assist or policy gate.

- Strength: `confirmed`
- Evidence: `EV-SD-007`

## BR-SD-37

Safe automatic responses are limited to acknowledgement, clarification, approved-knowledge informational answers, basic triage and deterministic fallback that make no price, discount, schedule, refund, remedy, legal or sensitive-data commitment.

- Strength: `confirmed`
- Evidence: `EV-SD-007`

## BR-SD-38

Pricing or discount decisions, schedule commitments, refunds or remedies, legal positions, sensitive-data disclosure and irreversible external mutations require explicit configured authority or human approval.

- Strength: `confirmed`
- Evidence: `EV-SD-007`

## BR-SD-39

When AI or retrieval fails but the channel remains send-capable, trusted code sends a deterministic non-committal fallback and queues internal follow-up; provider delivery failure is recorded and alerted without a false success claim.

- Strength: `confirmed`
- Evidence: `EV-SD-007`

## BR-SD-40

Every inbound and outbound customer message preserves provider identifiers, direction, content, sender attribution, active context version, policy decision, timestamps and delivery state as immutable conversation history.

- Strength: `confirmed`
- Evidence: `EV-SD-007`

## BR-SD-41

Important facts extracted from customer messages are non-authoritative operational claims with source-message evidence until a trusted actor or connector confirms them.

- Strength: `confirmed`
- Evidence: `EV-SD-007`

## BR-SD-42

Actionable signals create or update one deduplicated queue item per customer incident; repeated messages enrich the incident instead of multiplying tasks.

- Strength: `confirmed`
- Evidence: `EV-SD-007`

## BR-SD-43

A customer channel identity is scoped by workspace controller, provider and external user or chat identifier; a mutable handle such as starci183 is display metadata only.

- Strength: `confirmed`
- Evidence: `EV-SD-007`
