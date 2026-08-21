# Flow · Navigate the shared console shell

> ID: `console-navigation-journey` · Trigger: Open any authenticated console route

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `account-owner` | `console-shell` | Read the expanded destination rail and activate the visible collapse control | The same rail host becomes compact and the routed body reflows |
| 2 | `account-owner` | `console-shell` | Traverse circular icon destinations or activate the expand control | Navigation remains operable and the expanded rail is restored |
| 3 | `account-owner` | `console-shell` | Open and close the right-edge drawer on a narrow viewport | The complete destination set remains reachable without a bottom tab bar |

## Outcomes

- The account owner keeps one stable way to navigate across every console route and viewport

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
