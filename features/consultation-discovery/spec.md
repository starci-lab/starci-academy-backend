# Consultation and project discovery

> Business head: `1ebbaeb373306ccff37781b0c6d257a697cd6430ce8f313127c09d8846b622d9`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Prospective buyers start or restore an AI-assisted consultation, exchange messages and attachments, progressively capture project requirements and quote guidance, then provide consented contact details for human follow-up.

Included:
- New and restored consultation routes
- Prompt suggestions and message submission
- Conversation persistence and attachments
- Progressive requirements discovery
- Indicative or manual-review quote guidance
- Consented lead qualification

Excluded:
- Final commercial approval and signed contract
- Generated proposal documents after requirements confirmation

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/tedo-landingpage.git | `8c9f46e075dd18c99bd749237818ab4e2ebd4152` |
| be | https://github.com/starci-lab/tedo-backend.git | `24b3dc4b0eda44638cff0b70888b8304af7814de` |

## 3. Actors and access

### Prospective buyer

- Describe a project in natural language
- Use a suggested starting prompt
- Resume a saved consultation
- Attach supporting material
- Answer missing-scope questions
- Submit consented contact details

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`

### TEDO platform

- Persist consultation messages and requirements
- Retrieve relevant knowledge
- Extract project scope
- Estimate quote status
- Save a qualified lead

Evidence: `EV-005`, `EV-006`, `EV-007`, `EV-008`

## 4. Entry points and surfaces

### Project consultation

- ID: `consultation-chat`
- Route: `/[locale]/chat`
- Purpose: Turn an initial project prompt into a progressively qualified project scope.
- Regions: `project-prompt`, `consultation-thread`, `follow-up-lead`
- Navigation: none

Evidence: `EV-001`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`

### Saved consultation

- ID: `saved-consultation`
- Route: `/[locale]/chat/[conversationId]`
- Purpose: Restore one validated consultation with its current durable state.
- Regions: `restored-thread`
- Navigation: none

Evidence: `EV-002`

## 5. Business flows

### Consultation and project discovery

Trigger: A buyer submits a project prompt from the landing page or opens the consultation route.

1. **buyer** — Submit a free-text project prompt or a suggestion → A new consultation message is sent
2. **platform** — Extract known scope and ask the next applicable missing questions → The durable requirements revision advances
3. **buyer** — Open a validated saved conversation id → Message history and current requirements are restored
4. **buyer** — Submit contact details, preferred channel and consent → A reachable lead is saved against the conversation

Outcomes:
- TEDO holds a durable consultation, its current requirements revision and an optional consented follow-up lead

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`

## 6. Business rules

### BR-01

A saved consultation route accepts only a UUID-shaped conversation id; invalid identifiers resolve as not found.

Strength: **confirmed** · Evidence: `EV-002`

### BR-02

The discovery engine asks only applicable unanswered questions and expands module choices from the selected product type.

Strength: **confirmed** · Evidence: `EV-008`

### BR-03

An empty message is accepted only when files are attached, in which case the system supplies an attachment-analysis message.

Strength: **confirmed** · Evidence: `EV-005`

### BR-04

Human follow-up requires contact identity, a preferred channel and affirmative consent tied to the conversation.

Strength: **confirmed** · Evidence: `EV-004`, `EV-007`

### BR-05

Pricing may settle as priced, insufficient-scope or manual-review; manual negotiation intent remains manual-review rather than fabricated automatic pricing.

Strength: **confirmed** · Evidence: `EV-006`

## 7. State model

- **Conversation ready** (`conversation-ready`, initial) → conversation-pending, lead-pending, conversation-error — `EV-001`, `EV-002`, `EV-003`
- **Message pending** (`conversation-pending`, pending) → discovery-partial, conversation-ready, conversation-error — `EV-005`, `EV-006`
- **Requirements incomplete** (`discovery-partial`, partial) → conversation-pending, lead-pending — `EV-006`, `EV-008`
- **Lead submission pending** (`lead-pending`, pending) → lead-saved, conversation-error — `EV-004`, `EV-007`
- **Lead saved** (`lead-saved`, success) → terminal — `EV-007`
- **Consultation failed** (`conversation-error`, error) → conversation-ready — `EV-005`, `EV-006`

## 8. Entities and data

- **Consultation session**: conversation id, messages, attachments, created/updated time — `EV-001`, `EV-002`, `EV-005`, `EV-006`
- **Project requirements**: product type, industry, business model, stage, locations, languages, channels, roles, modules, integrations, branding, UX/UI, delivery — `EV-006`, `EV-008`
- **Consultation lead**: name, phone, email, company, preferred channel, consent, conversation id, status — `EV-004`, `EV-007`

## 9. Operations and APIs

- **POST /v1/consultations/messages** (command, backend) — input: optional conversation id, message or attachments, locale/channel context; output: answer, conversation id, message id, requirements, quote status, optional documents; failures: empty message without files, attachment validation failed, AI or persistence failed — `EV-005`, `EV-006`
- **qualifyConsultationLead** (mutation, backend) — input: conversation id, name, phone/email, company, preferred channel, consent; output: lead id and status; failures: conversation missing, contact invalid, consent absent — `EV-007`

## 10. Acceptance conditions

- **AC-01** New and UUID-validated saved chat routes mount the consultation surface without search indexing. — `EV-001`, `EV-002`
- **AC-02** A message or attachment advances one durable conversation and returns requirements plus quote state. — `EV-005`, `EV-006`, `EV-008`
- **AC-03** A consented contact submission is saved against the selected conversation with the preferred channel. — `EV-004`, `EV-007`

## 11. Explicit unknowns

- **When exactly does a saved lead receive the first human response on the chosen channel?** — Source proves durable lead qualification and channel choice, but not an operational response-time commitment.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/app/[locale]/chat/page.tsx:7` | route | The localized no-index consultation route mounts the chat entry point. |
| EV-002 | fe | `src/app/[locale]/chat/[conversationId]/page.tsx:6` | route | The saved consultation route validates a UUID conversation id and restores the chat for that id. |
| EV-003 | fe | `src/components/consultation/lead-prompt.tsx:10` | ui | The landing consultation prompt accepts free text, suggested prompts and validation errors before opening chat. |
| EV-004 | fe | `src/components/consultation/consultation-lead-form.tsx:18` | ui | The lead form captures name, phone, email, company, preferred Zalo/phone/email channel and consent with sending/sent/error handling. |
| EV-005 | be | `src/features/api/http/consultation/ask-consultant/ask-consultant.controller.ts:12` | api | The consultation HTTP boundary accepts messages and attachments, supplies attachment-only text, and exposes attachment download. |
| EV-006 | be | `src/features/api/http/consultation/ask-consultant/ask-consultant.handler.spec.ts:15` | test | Tests prove priced responses, saved proposal document links, persisted requirements merge, manual-review handoff and empty-message refusal. |
| EV-007 | be | `src/features/api/graphql/consultation/qualify-consultation-lead/qualify-consultation-lead.resolver.spec.ts:1` | test | Lead qualification ties name, phone, preferred channel and consent to a conversation and returns lead status. |
| EV-008 | be | `src/modules/requirements/discovery-engine.service.ts:102` | policy | The discovery engine derives applicable questions, product-type module choices, missing fields, completeness and next questions from current requirements. |
