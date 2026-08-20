# Business rules · Hồ sơ học viên và bằng chứng công khai

## BR-01

Profile lookup theo username là public và trả identity, bio, follow counts, lock/open-to-work cùng links nghề nghiệp.

- Strength: `confirmed`
- Evidence: `EV-002`

## BR-02

Follow cùng target là idempotent, unfollow xóa edge, self-follow không ghi row và target deleted/missing bị từ chối.

- Strength: `confirmed`
- Evidence: `EV-004`
