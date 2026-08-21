# Business rules · Shared console shell navigation

## BR-01

The destination collection preserves one selected key, keyboard traversal, focus-visible feedback and the same destination order on every console route.

- Strength: `confirmed`
- Evidence: `EV-002`, `EV-003`, `EV-005`, `EV-006`

## BR-02

The desktop rail has exactly two persisted presentations: expanded at 256px and collapsed at 64px, toggled by one visible keyboard-operable control while the adjacent body reflows.

- Strength: `confirmed`
- Evidence: `EV-006`

## BR-03

Collapsed destinations keep stable circular glyphs, accessible labels and target size; visible copy may disappear but destination meaning may not.

- Strength: `confirmed`
- Evidence: `EV-006`

## BR-04

Collapse control and Overview remain pinned while only long destination groups own internal scrolling.

- Strength: `confirmed`
- Evidence: `EV-006`

## BR-05

Below the desktop breakpoint the standing rail and bottom tab bar are absent; one right-edge drawer exposes the complete destination set.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-002`, `EV-004`, `EV-005`, `EV-006`
