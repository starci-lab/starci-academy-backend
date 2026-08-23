# Business rules · Course marketplace and checkout

## BR-01

The catalog distinguishes pending, empty, filtered-empty, failed and populated states, and supports search, view and pagination controls.

- Strength: `confirmed`
- Evidence: `EV-004`

## BR-02

The cart is viewer-owned, hides totals and checkout actions when empty or unreadable, and requires confirmation before clearing all lines.

- Strength: `confirmed`
- Evidence: `EV-003`, `EV-006`

## BR-03

Checkout requires authentication and creates one order with one line per submitted course.

- Strength: `confirmed`
- Evidence: `EV-007`
