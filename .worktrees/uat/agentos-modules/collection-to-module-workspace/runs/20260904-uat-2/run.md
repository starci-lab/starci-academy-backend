# run 20260904-uat-2

| Field | Value |
| --- | --- |
| Source head | `d6cc196e2b74ee522215d0df390b8ffd6772188f` |
| Served head | `42f29d59dfafed42bdd10111a1ffae5099a78038` |
| Approval | `.stacks/dev/environment.json#sha256:fc15b1d4c0e5e1bbddd6f9433a798c3be5d75b31615cfb5ee0824f476f404e4e` |
| Behavior | pass |
| UI | fail (grammar-gap) |
| Experience | fix-first at mean 3.55 |
| Receipt | `sessions/20260903-104251-nivo-frontend.direction.decide/step-53/parallel-1` |

The same flow as run `20260903-uat-1`, walked again after the tree began asking a capture to name the control behind every scored assertion. The first walk signed in by calling the product’s mutation from page context; this one pressed the form, and pressed every step after it. Nine presses in all, one directory each under `steps/`, with the frames that press produced at both declared viewports.

Four cases and both alternate paths ran at 1440x900 and 390x844, in 37.7s and 35.6s against a 90s budget. Behaviour passes on all of them.

The walk found what typing had hidden: nothing in the product links to this collection. The workspace page carries seven segments, no anchor at all, and never uses the word Modules; the only control anywhere that opens the collection is the breadcrumb inside a module workspace, so a person must already have opened a module to find the list of modules. That drops findability to 2 and takes the step count over budget as well, since opening the collection is one step in `flow.md` and four presses in the product.

Three failures stand beside it: a module the workspace does not own states its refusal and leaves the region with nothing to press; on a phone the one Create module button sits in the upper half of the frame; and on the English surface the four catalogue cards describe themselves in Vietnamese. None of the four belongs to the collection page or its module workspaces — the entry point is the workspace page’s, the refusal is in the module workspace this mission held unchanged, and the catalogue text arrives with the read.

Run `20260903-uat-1` is left exactly as it was. It no longer validates under the current tree, which is correct: it records what was done under the rules of its time, including the mistake that produced this rule.
