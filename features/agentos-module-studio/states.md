# States · AgentOS custom module studio

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `module-collection-loading` | pending | Custom module collection is loading | module-collection-empty, module-collection-ready, module-collection-refused | `EV-001` |
| `module-collection-empty` | empty | No custom module exists in the exact workspace | intake-resting | `EV-001` |
| `module-collection-ready` | success | Owned custom modules are available | intake-resting, intake-awaiting-answer, specification-ready, module-active | `EV-001` |
| `module-collection-refused` | error | Custom module collection could not be read | module-collection-loading | `EV-001` |
| `intake-resting` | initial | Opening module question is ready without a persisted draft | intake-submitting | `EV-001` |
| `intake-submitting` | pending | An opening answer, follow-up answer or correction is being persisted | intake-awaiting-answer, intake-incomplete, intake-complete, intake-refused | `EV-001` |
| `intake-awaiting-answer` | partial | The backend-selected current question awaits an answer | intake-submitting, attachment-uploading, secret-saving | `EV-001` |
| `intake-incomplete` | partial | The structured profile remains incomplete | intake-awaiting-answer, attachment-uploading, secret-saving, intake-complete | `EV-001` |
| `intake-complete` | success | Every backend-required module field is resolved | specification-ready | `EV-001` |
| `intake-refused` | error | The interview turn was refused without losing accepted profile data | intake-submitting, intake-awaiting-answer | `EV-001` |
| `attachment-uploading` | pending | A module attachment is uploading to quarantine | attachment-scanning, attachment-refused | `EV-001` |
| `attachment-scanning` | pending | An uploaded module attachment is being scanned | attachment-ready, attachment-refused | `EV-001` |
| `attachment-ready` | success | A scanned module attachment is available to the profile | intake-incomplete, intake-complete | `EV-001` |
| `attachment-refused` | error | An attachment was refused or could not be scanned | attachment-uploading, intake-incomplete | `EV-001` |
| `secret-saving` | pending | A named integration secret is being encrypted and stored | secret-configured, secret-refused | `EV-001` |
| `secret-configured` | success | A named integration secret is configured and masked | intake-incomplete, intake-complete, secret-saving | `EV-001` |
| `secret-refused` | error | A named integration secret was refused without being stored | secret-saving, intake-incomplete | `EV-001` |
| `specification-ready` | success | A complete versioned module specification is ready for review | intake-awaiting-answer, module-publishing | `EV-001` |
| `module-publishing` | pending | The explicitly confirmed module publish is running | module-active, module-publish-refused | `EV-001` |
| `module-active` | success | The custom module has an existing installation identity | terminal | `EV-001`, `EV-002`, `EV-006`, `EV-008` |
| `module-publish-refused` | error | Publishing failed while the reviewable specification remains intact | specification-ready, module-publishing | `EV-001` |
