# Journey · Turn an external or scheduled event into a proactive module task

> ID: `ingest-and-operate-proactive-task`

## Trigger

A configured provider delivers an authenticated event or a module schedule becomes due.

## Steps

1. **Accept routed event** — The workspace controller authenticates provider identity, resolves the exact workspace and module, normalizes the event and enforces idempotency. One durable event is accepted once.
2. **Bind immutable contracts** — The controller binds the event to the active context version, installed kind reply contract and tool schema versions so later changes cannot reinterpret history.
3. **Triage kind task** — The controller leases the durable task and applies the exact kind policy, permissions and stable prompt-cache prefix.
4. **Publish proactive message** — The controller appends sanitized MarkdownComponent content and registered typed widgets to the primary Operations session, linked to the exact task.
5. **Inspect linked Workbench task** — An authorized collaborator focuses the same task from the widget or the kind Workbench and sees consistent status, evidence and allowed actions.
6. **Complete or refuse action** — The collaborator invokes or declines an allowed action; validation, attribution and idempotency update task, message, Workbench and any permitted external delivery exactly once.

## Outcomes

- Accepted events, tasks, messages and actions survive controller restart and remain auditable.
- The owner receives proactive operational value without monitoring a founder-only manual chat.
- External participants receive only kind-policy-safe responses and cannot escalate their own authority.

Evidence: `EV-018`
