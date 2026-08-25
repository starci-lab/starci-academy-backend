# Flow · Prove one configured module in its kind-specific sandbox

> ID: `test-module-before-operation`

## Trigger

Setup has produced at least one immutable context version and the workspace owner chooses Test for the exact module.

## Steps

| Step | Actor | Action | Result | Surface | State |
|---|---|---|---|---|---|
| `open-kind-test` | `workspace-owner` | Open Test for the exact module and select an immutable candidate or active context version | The shell resolves the versioned test workbench declared by the installed kind without opening or creating an Execute session | `module-test` | `module-test-ready` |
| `configure-test-fixture` | `workspace-owner` | Choose or enter the kind-appropriate sandbox fixture and expected behavior | Customer support accepts a test conversation, accounting accepts fixture documents and expected calculations, scheduling accepts a fake calendar, and document research accepts questions plus expected citation coverage | `module-test` | `module-test-ready` |
| `run-kind-test` | `workspace-owner` | Run the exact test contract against the selected context version | The backend records an isolated test run, refuses live external actions and evaluates declared assertions without changing Setup, active context, Execute history or live workbench state | `module-test` | `module-test-running` |
| `review-trust-result` | `workspace-owner` | Review scenario evidence, warnings, failures, contract version and context binding | The owner sees a pass, warning or fail result and may revise Setup, rerun the test or explicitly apply a tested candidate context; no result applies context automatically | `module-test` | `module-test-passed` |

## Outcomes

- Every initial kind proves behavior through a purpose-specific sandbox rather than a universal chat-only tester
- The owner receives inspectable trust evidence before choosing to apply context or operate the module

Evidence: `EV-017`
