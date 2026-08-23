# Contracts · Course marketplace and checkout

## Entity · Course (`course`)

Fields: `displayId`, `title`, `tagline`, `modules`, `prerequisites`, `reviews`, `offer`

Evidence: `EV-002`, `EV-005`

## Entity · Cart (`cart`)

Fields: `course lines`, `subtotal`, `savings`, `total`

Evidence: `EV-003`, `EV-006`

## Entity · Checkout request (`checkout-request`)

Fields: `course ids`, `payment type`, `redirect URLs`

Evidence: `EV-007`

## Operation · coursesCheckout

- Kind/owner: `mutation` / `backend`
- Inputs: course ids, payment type, redirect URLs
- Outputs: order and provider checkout data
- Failures: authentication rejected, pricing rejected, checkout provider failed
- Evidence: `EV-007`

No field, failure or operation may appear here without routed source evidence.
