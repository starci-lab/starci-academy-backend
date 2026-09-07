---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.uat.two-install-isolation",
  "kind": "uat.ux",
  "required": true
}
---
# Two-install isolation flow

## Candidate journey
Use two explicitly provisioned Chatbot installations and disjoint fixture data. Verify each owner-visible workbench reads only its installation, commands cannot target the other installation, a provider account collision is refused pending an explicit transfer, and one installation's channel, history, handoff, retry, or reconciliation cannot mutate the other.

## Isolation rule
Separate tabs are not isolation. The run needs separate authenticated browser contexts where actors differ and disjoint mutable namespaces even when one owner legitimately controls both installations.

## Done when
The paired UI and UX leaves prove positive isolation and negative cross-install attempts on the current TINO build.
