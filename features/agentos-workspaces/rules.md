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

## BR-08

n8n uses the same short-lived app-bound issue, renew and revoke security boundary as OpenClaw and never exposes a reusable credential.

- Strength: `partial`
- Evidence: `EV-019`, `EV-020`, `EV-025`

## BR-09

Update, plan change, backup, restart and rebuild are exact-owner-scoped asynchronous operations with explicit accepted, running, succeeded and refused results.

- Strength: `partial`
- Evidence: `EV-018`, `EV-025`

## BR-10

Restart is the non-destructive recovery action and preserves persistent workspace data; no action labelled Restart may reset or wipe data.

- Strength: `confirmed`
- Evidence: `EV-021`, `EV-025`

## BR-11

A plan change creates an exact adjustment order and linked Wallet invoice and is applied only after that invoice is paid.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-025`

## BR-12

Backup reports success only after verification; rebuild requires explicit confirmation and a fresh verified backup before the release is replaced without deleting persistent volumes.

- Strength: `confirmed`
- Evidence: `EV-021`, `EV-025`

## BR-13

MCP and Qdrant remain internal runtime components; the owner may receive health, document counts by origin, last update and reindex state, but no credential, raw text, point id, admin route or control-plane semantic search.

- Strength: `confirmed`
- Evidence: `EV-022`, `EV-023`, `EV-024`, `EV-025`

## BR-14

Application launch, workspace operation and knowledge reindex transitions are independent block state axes and never redefine workspace lifecycle or page anatomy.

- Strength: `confirmed`
- Evidence: `EV-025`
