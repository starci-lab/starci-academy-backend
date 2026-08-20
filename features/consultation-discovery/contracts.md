# Contracts · Consultation and project discovery

## Entity · Consultation session (`consultation-session`)

Fields: `conversation id`, `messages`, `attachments`, `created/updated time`

Evidence: `EV-001`, `EV-002`, `EV-005`, `EV-006`

## Entity · Project requirements (`project-requirements`)

Fields: `product type`, `industry`, `business model`, `stage`, `locations`, `languages`, `channels`, `roles`, `modules`, `integrations`, `branding`, `UX/UI`, `delivery`

Evidence: `EV-006`, `EV-008`

## Entity · Consultation lead (`consultation-lead`)

Fields: `name`, `phone`, `email`, `company`, `preferred channel`, `consent`, `conversation id`, `status`

Evidence: `EV-004`, `EV-007`

## Operation · POST /v1/consultations/messages

- Kind/owner: `command` / `backend`
- Inputs: optional conversation id, message or attachments, locale/channel context
- Outputs: answer, conversation id, message id, requirements, quote status, optional documents
- Failures: empty message without files, attachment validation failed, AI or persistence failed
- Evidence: `EV-005`, `EV-006`

## Operation · qualifyConsultationLead

- Kind/owner: `mutation` / `backend`
- Inputs: conversation id, name, phone/email, company, preferred channel, consent
- Outputs: lead id and status
- Failures: conversation missing, contact invalid, consent absent
- Evidence: `EV-007`

No field, failure or operation may appear here without routed source evidence.
