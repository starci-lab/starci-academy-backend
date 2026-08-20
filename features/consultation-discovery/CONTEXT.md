# Consultation and project discovery

> Business identity: `tedo/consultation-discovery@1ebbaeb373306ccff37781b0c6d257a697cd6430ce8f313127c09d8846b622d9`
>
> Source heads: `fe@8c9f46e075dd`, `be@24b3dc4b0eda`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Prospective buyers start or restore an AI-assisted consultation, exchange messages and attachments, progressively capture project requirements and quote guidance, then provide consented contact details for human follow-up.

**Primary actor.** Prospective buyer

**Primary outcome.** TEDO holds a durable consultation, its current requirements revision and an optional consented follow-up lead

**Never does.** Final commercial approval and signed contract

## Invariants

- `BR-01` — A saved consultation route accepts only a UUID-shaped conversation id; invalid identifiers resolve as not found.
- `BR-02` — The discovery engine asks only applicable unanswered questions and expands module choices from the selected product type.
- `BR-03` — An empty message is accepted only when files are attached, in which case the system supplies an attachment-analysis message.
- `BR-04` — Human follow-up requires contact identity, a preferred channel and affirmative consent tied to the conversation.
- `BR-05` — Pricing may settle as priced, insufficient-scope or manual-review; manual negotiation intent remains manual-review rather than fabricated automatic pricing.

## Primary flow

```text
conversation-pending → discovery-partial → conversation-ready → lead-pending
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `consultation-chat` | `/[locale]/chat` | Turn an initial project prompt into a progressively qualified project scope. | [surface](surfaces/consultation-chat.md) |
| `saved-consultation` | `/[locale]/chat/[conversationId]` | Restore one validated consultation with its current durable state. | [surface](surfaces/saved-consultation.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `POST /v1/consultations/messages` | backend | optional conversation id, message or attachments, locale/channel context | answer, conversation id, message id, requirements, quote status, optional documents |
| `qualifyConsultationLead` | backend | conversation id, name, phone/email, company, preferred channel, consent | lead id and status |

## Explicit unknowns

- `human-handoff-timing` — When exactly does a saved lead receive the first human response on the chosen channel? Impact: Source proves durable lead qualification and channel choice, but not an operational response-time commitment.

## LOADS

| Need | Read |
|---|---|
| Scope, terminology and exclusions | [overview.md](overview.md) |
| Actor permissions and ownership | [actors.md](actors.md) |
| One user journey | `flows/<flow-id>.md` |
| One renderable screen | `surfaces/<surface-id>.md` |
| Business invariants | [rules.md](rules.md) |
| State transitions | [states.md](states.md) |
| Entities, inputs, outputs and failures | [contracts.md](contracts.md) |
| Completion and regression proof | [acceptance.md](acceptance.md) |
| Machine rendering/query | [model.json](model.json) |
| Exact source provenance | [evidence.json](evidence.json) |

## Context rule

Do not load every module by default. `CONTEXT.md` plus the one flow or surface being changed is the normal prompt. `model.json` is authoritative for machines; Markdown files are generated projections. Unknowns remain unknown until routed source or an explicit owner decision resolves them.
