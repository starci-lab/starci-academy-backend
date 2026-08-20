# Business rules · Membership, gói tải đề và thanh toán

## BR-01

Pricing catalog public do server trả membership price/entitlements và exam-download packages.

- Strength: `confirmed`
- Evidence: `EV-002`

## BR-02

Purchase membership chỉ tạo checkout details; quyền membership được cấp khi reconciliation xác nhận paid.

- Strength: `confirmed`
- Evidence: `EV-003`, `EV-004`

## BR-03

Giao dịch paid được settle idempotent; unpaid/expired không cấp membership hoặc download entitlement.

- Strength: `confirmed`
- Evidence: `EV-004`
