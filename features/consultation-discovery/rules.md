# Business rules · Consultation and project discovery

## BR-01

A saved consultation route accepts only a UUID-shaped conversation id; invalid identifiers resolve as not found.

- Strength: `confirmed`
- Evidence: `EV-002`

## BR-02

The discovery engine asks only applicable unanswered questions and expands module choices from the selected product type.

- Strength: `confirmed`
- Evidence: `EV-008`

## BR-03

An empty message is accepted only when files are attached, in which case the system supplies an attachment-analysis message.

- Strength: `confirmed`
- Evidence: `EV-005`

## BR-04

Human follow-up requires contact identity, a preferred channel and affirmative consent tied to the conversation.

- Strength: `confirmed`
- Evidence: `EV-004`, `EV-007`

## BR-05

Pricing may settle as priced, insufficient-scope or manual-review; manual negotiation intent remains manual-review rather than fabricated automatic pricing.

- Strength: `confirmed`
- Evidence: `EV-006`
