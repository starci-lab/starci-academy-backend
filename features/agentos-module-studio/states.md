# States · AgentOS module studio and adaptive operating shell

| ID | Label | Kind | Transitions | Evidence |
|---|---|---|---|---|
| `module-collection-loading` | Custom module collection is loading | pending | `module-collection-empty`, `module-collection-ready`, `module-collection-refused` | `EV-001` |
| `module-collection-empty` | No custom module exists in the exact workspace | empty | `intake-resting` | `EV-001` |
| `module-collection-ready` | Owned custom modules are available | success | `intake-resting`, `intake-awaiting-answer`, `specification-ready`, `module-active` | `EV-001` |
| `module-collection-refused` | Custom module collection could not be read | error | `module-collection-loading` | `EV-001` |
| `intake-resting` | Opening module question is ready without a persisted draft | initial | `intake-submitting` | `EV-001` |
| `intake-submitting` | An opening answer, follow-up answer or correction is being persisted | pending | `intake-awaiting-answer`, `intake-incomplete`, `intake-complete`, `intake-refused` | `EV-001` |
| `intake-awaiting-answer` | The backend-selected current question awaits an answer | partial | `intake-submitting`, `attachment-uploading`, `secret-saving` | `EV-001` |
| `intake-incomplete` | The structured profile remains incomplete | partial | `intake-awaiting-answer`, `attachment-uploading`, `secret-saving`, `intake-complete` | `EV-001` |
| `intake-complete` | Every backend-required module field is resolved | success | `specification-ready` | `EV-001` |
| `intake-refused` | The interview turn was refused without losing accepted profile data | error | `intake-submitting`, `intake-awaiting-answer` | `EV-001` |
| `attachment-uploading` | A module attachment is uploading to quarantine | pending | `attachment-scanning`, `attachment-refused` | `EV-001` |
| `attachment-scanning` | An uploaded module attachment is being scanned | pending | `attachment-ready`, `attachment-refused` | `EV-001` |
| `attachment-ready` | A scanned module attachment is available to the profile | success | `intake-incomplete`, `intake-complete` | `EV-001` |
| `attachment-refused` | An attachment was refused or could not be scanned | error | `attachment-uploading`, `intake-incomplete` | `EV-001` |
| `secret-saving` | A named integration secret is being encrypted and stored | pending | `secret-configured`, `secret-refused` | `EV-001` |
| `secret-configured` | A named integration secret is configured and masked | success | `intake-incomplete`, `intake-complete`, `secret-saving` | `EV-001` |
| `secret-refused` | A named integration secret was refused without being stored | error | `secret-saving`, `intake-incomplete` | `EV-001` |
| `specification-ready` | A complete versioned module specification is ready for review | success | `intake-awaiting-answer`, `module-publishing` | `EV-001` |
| `module-publishing` | The explicitly confirmed module publish is running | pending | `module-active`, `module-publish-refused` | `EV-001` |
| `module-active` | The custom module has an existing installation identity | success | `context-setup-required`, `setup-session-ready`, `module-shell-loading` | `EV-001`, `EV-002`, `EV-006`, `EV-008` |
| `context-setup-required` | The module has no active effective business context | initial | `setup-session-ready` | `EV-015` |
| `setup-session-ready` | The module single private setup session is ready | success | `context-draft`, `context-review-ready`, `context-active` | `EV-015` |
| `context-draft` | Setup contains unapplied business-context changes | partial | `context-draft`, `context-review-ready`, `context-publish-refused` | `EV-015` |
| `context-review-ready` | The exact draft context version is ready for review and explicit apply | success | `context-draft`, `context-publishing` | `EV-015` |
| `context-publishing` | The explicitly confirmed context version is being applied | pending | `context-active`, `context-publish-refused` | `EV-015` |
| `context-active` | One immutable effective context version is active | success | `setup-session-ready`, `module-shell-loading`, `execute-session-empty`, `execute-session-active` | `EV-015` |
| `context-publish-refused` | Context apply failed while the prior active version remains usable | error | `context-draft`, `context-review-ready`, `context-active` | `EV-015` |
| `execute-session-empty` | A new execute chat session is ready for its first message | initial | `chat-sending`, `execute-session-archived` | `EV-015` |
| `execute-session-active` | One execute chat session is selected and active | success | `chat-sending`, `execute-session-empty`, `execute-session-archived` | `EV-015` |
| `execute-session-archived` | An execute chat session is archived without affecting other module state | success | `execute-session-active`, `execute-session-empty` | `EV-015` |
| `module-publish-refused` | Publishing failed while the reviewable specification remains intact | error | `specification-ready`, `module-publishing` | `EV-001` |
| `module-shell-loading` | The module operating shell is loading | pending | `module-shell-ready`, `module-shell-refused` | `EV-011`, `EV-014` |
| `module-shell-ready` | The module frame and selected execute session are ready | success | `chat-sending`, `workbench-loading`, `module-settings-ready`, `module-diagnostics-ready` | `EV-011`, `EV-014` |
| `module-shell-refused` | The module shell could not be loaded | error | `module-shell-loading` | `EV-011`, `EV-014` |
| `chat-sending` | A module conversation turn is being persisted | pending | `module-shell-ready`, `chat-refused` | `EV-011`, `EV-014` |
| `chat-refused` | A conversation turn failed without losing prior history or workbench state | error | `chat-sending`, `module-shell-ready` | `EV-011`, `EV-014` |
| `workbench-loading` | The kind-resolved workbench is loading | pending | `workbench-ready`, `workbench-unavailable` | `EV-011`, `EV-014` |
| `workbench-ready` | The registered workbench is ready | success | `module-shell-ready`, `widget-ready` | `EV-011`, `EV-014` |
| `workbench-unavailable` | The module kind has no usable workbench binding | error | `workbench-loading`, `module-diagnostics-ready` | `EV-011`, `EV-014` |
| `widget-ready` | A trusted typed chat widget is interactive | success | `module-shell-ready`, `widget-refused` | `EV-011`, `EV-014` |
| `widget-refused` | A widget payload or action was refused safely | error | `module-shell-ready` | `EV-011`, `EV-014` |
| `module-settings-ready` | Module-scoped settings are ready | success | `module-settings-saving`, `module-shell-ready` | `EV-011`, `EV-014` |
| `module-settings-saving` | A module-scoped setting is being validated and saved | pending | `module-settings-ready`, `module-settings-refused` | `EV-011`, `EV-014` |
| `module-settings-refused` | A setting failed without changing accepted module state | error | `module-settings-saving`, `module-settings-ready` | `EV-011`, `EV-014` |
| `module-diagnostics-ready` | Advanced package and runtime evidence is available | success | `module-shell-ready` | `EV-011`, `EV-014` |
