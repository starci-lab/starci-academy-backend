# Business rules · AgentOS workspace lifecycle and control center

## BR-01

Wallet is the payment waypoint for the invoice linked to the exact AgentOS order, and completion returns the owner to that same order context.

- Strength: `partial`
- Evidence: `EV-001`, `EV-003`, `EV-004`

## BR-02

The primary journey terminates at /[locale]/agentos/workspaces/[workspaceId] for the exact workspace that fulfilled the order.

- Strength: `partial`
- Evidence: `EV-001`, `EV-003`, `EV-005`, `EV-010`

## BR-03

Module detail and OpenClaw launch are optional branches available only after the exact workspace is ready; neither is a required provisioning stage.

- Strength: `partial`
- Evidence: `EV-001`, `EV-006`, `EV-007`, `EV-009`

## BR-04

Workspace provisioning and OpenClaw launch are independent state axes; a launch transition never changes the workspace lifecycle state.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-008`, `EV-009`, `EV-012`

## BR-05

Workspace lifecycle is reconciled from owner-scoped order, invoice and workspace facts, with the later workspace fact taking precedence.

- Strength: `confirmed`
- Evidence: `EV-002`

## BR-06

OpenClaw access uses short-lived issue, renew and revoke operations and never exposes reusable credentials.

- Strength: `confirmed`
- Evidence: `EV-008`, `EV-012`, `EV-013`

## BR-07

OpenClaw launch requires an active exact workspace, active instance and ready runtime; module post-ready sequencing remains owner intent until an equivalent guard exists.

- Strength: `partial`
- Evidence: `EV-001`, `EV-011`, `EV-012`
