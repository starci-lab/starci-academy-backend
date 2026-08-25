# Rules · AgentOS module studio and adaptive operating shell

| ID | Rule | Strength | Evidence |
|---|---|---|---|
| `BR-01` | Every custom module, intake session, attachment, configured-secret status and generated specification belongs to one exact authenticated owner and one exact ready AgentOS workspace. | confirmed | `EV-001`, `EV-002`, `EV-003`, `EV-010` |
| `BR-02` | The backend owns required fields, the next follow-up question, structured profile, missing fields, progress and completion; the frontend renders those results and never invents readiness. | confirmed | `EV-001` |
| `BR-03` | Each accepted answer or correction is persisted before the next question is selected, and a changed answer may change every later unresolved question. | confirmed | `EV-001` |
| `BR-04` | A custom-module draft is resumable after navigation, reload or a local operation failure without duplicating the draft or discarding previously accepted information. | confirmed | `EV-001` |
| `BR-05` | Integration key values are write-only, encrypted server-side and never returned, rendered, placed in conversation text or logged; clients receive only masked configuration status. | confirmed | `EV-001` |
| `BR-06` | An image or document attachment contributes to the module profile only after quarantine and successful scanning; uploading, scanning, ready, refused, retry and removal remain explicit states. | confirmed | `EV-001` |
| `BR-07` | Conversation completion generates a reviewable versioned specification but never publishes or installs a module without a separate explicit owner confirmation. | confirmed | `EV-001` |
| `BR-08` | Custom-module drafts and their studio do not replace or mutate the existing immutable solution-module catalogue, catalogue installation operation or installation-detail identity. | confirmed | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`, `EV-010` |
| `BR-09` | Interview, attachment, secret and publish failures are independent block-state axes; a refusal preserves every other previously accepted part of the module profile. | confirmed | `EV-001` |
| `BR-10` | The TEDO page contributes interaction shape only; none of its project content, prices, artifact promises, actors or business rules becomes Nivo product truth. | confirmed | `EV-001` |
| `BR-11` | Every module instance belongs to one exact workspace and has exactly one immutable kind identity for a published version. | confirmed | `EV-011`, `EV-012`, `EV-013`, `EV-014` |
| `BR-12` | Every module kind inherits the same persistent collaborative chat contract. | confirmed | `EV-011`, `EV-012`, `EV-013`, `EV-014` |
| `BR-13` | Every registered module kind resolves to exactly one workbench definition; a missing or incompatible binding is an explicit unavailable state. | confirmed | `EV-011`, `EV-012`, `EV-013`, `EV-014` |
| `BR-14` | A new module kind is added through registry, schema, capabilities and workbench registration without modifying Module Core, Chat Core or the persistent shell. | confirmed | `EV-011`, `EV-012`, `EV-013`, `EV-014` |
| `BR-15` | Chatbot, document, spreadsheet, calendar and similar workbenches are examples, not a closed business enum. | confirmed | `EV-011`, `EV-012`, `EV-013`, `EV-014` |
| `BR-16` | Widgets in chat are typed trusted payloads rendered by registered widget definitions; arbitrary HTML, scripts and undeclared actions are refused. | confirmed | `EV-011`, `EV-012`, `EV-013`, `EV-014` |
| `BR-17` | Module-scoped knowledge and integrations are configured on the exact module; provider credentials, global model readiness and shared knowledge origins remain workspace-owned. | confirmed | `EV-011`, `EV-012`, `EV-013`, `EV-014` |
| `BR-18` | The primary module route is an operating surface with chat and workbench; package metadata and runtime internals are secondary diagnostics. | confirmed | `EV-011`, `EV-012`, `EV-013`, `EV-014` |
| `BR-19` | Conversation, workbench, configuration and diagnostics are independent state axes so one failure does not erase or falsely disable unrelated accepted state. | confirmed | `EV-011`, `EV-012`, `EV-013`, `EV-014` |
| `BR-20` | Responsive presentation may collapse navigation, chat and workbench into drill-down surfaces, but preserves the same module identity and active work context. | confirmed | `EV-011`, `EV-012`, `EV-013`, `EV-014` |
