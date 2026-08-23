# Contracts · Khám phá và mua khóa học

## Entity · Ưu đãi khóa học (`course-offer`)

Fields: `id`, `displayId`, `title`, `coverImageUrl`, `originalPrice`, `currentPhase`, `enrollmentCount`, `isEnrolled`

Evidence: `EV-001`, `EV-002`, `EV-003`

## Entity · Đơn khóa học (`course-order`)

Fields: `courseIds`, `paymentType`, `checkoutUrl`, `referenceId`, `transactionId`

Evidence: `EV-001`, `EV-002`, `EV-003`

## Operation · courses

- Kind/owner: `query` / `frontend`
- Inputs: filters, optional token
- Outputs: count, course rows
- Failures: GraphQL error envelope
- Evidence: `EV-002`, `EV-003`

## Operation · coursesCheckout

- Kind/owner: `mutation` / `frontend`
- Inputs: courseIds, paymentType, returnUrl, cancelUrl
- Outputs: checkoutUrl, referenceId, transactionId
- Failures: No checkout URL, Provider initiation failure
- Evidence: `EV-002`, `EV-003`

No field, failure or operation may appear here without routed source evidence.
