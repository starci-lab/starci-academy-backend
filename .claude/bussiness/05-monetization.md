# 05 — Monetization

## §05.1 Mô hình
- Bán **course** lẻ hoặc theo gói combo.
- Học viên trả tiền 1 lần → enrollment có thời hạn (mặc định lifetime hoặc theo pricing phase).
- Không subscription monthly mặc định (có thể thêm sau).

## §05.2 Pricing phase
- **Pricing phase** = giai đoạn giá của 1 course (vd: early-bird → standard → late).
- Mỗi phase có: tên, giá VND, thời gian áp dụng (from–to), trạng thái active.
- Hết phase → tự rotate sang phase kế tiếp.
- Trong cùng thời điểm, course chỉ có 1 phase active.

## §05.3 Payment gateway
Hai gateway hỗ trợ:
- **PayOS** — thanh toán QR + chuyển khoản tự động (Vietnam).
- **Sepay** — webhook bank transfer matching.
- Gateway có config riêng (key, secret) lưu trong DB.
- Một course có thể accept nhiều gateway.

## §05.4 Transaction
- Mỗi lần checkout tạo 1 **transaction** record.
- State: `pending` → `paid` / `failed` / `cancelled` / `refunded`.
- Có timeout (vd: 15 phút) — quá hạn auto cancel.
- Khi `paid` → tự động tạo enrollment cho user.

## §05.5 Refund chính sách
- Cho phép refund trong **N ngày** đầu sau thanh toán (admin set N, mặc định 7 ngày).
- Điều kiện: user chưa hoàn thành quá X% course (admin set, vd: <30%).
- Refund trigger: enrollment → `refunded`, transaction → `refunded`.
- Không partial refund (full hoặc không).

## §05.6 Voucher / Discount
- Hỗ trợ mã giảm giá apply tại checkout (logic: % off hoặc fixed amount).
- Voucher có usage limit + expiry.
- Voucher chỉ apply cho course nhất định hoặc all.

## §05.7 Combo / Bundle
- Có thể nhóm nhiều course bán chung 1 transaction với giá ưu đãi.
- Combo paid → tạo nhiều enrollment cùng lúc.
- Combo có pricing phase riêng (tách biệt phase từng course con).

## §05.8 Quy tắc kế toán
- Mọi transaction đều log lưu vĩnh viễn (audit trail).
- Không xoá transaction (chỉ archive/soft-delete).
- Refund tạo transaction mới (loại `refund`), không sửa transaction gốc.
- Mọi số tiền hiển thị VND (no multi-currency hiện tại).
