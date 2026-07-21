# Concept — FE brainstorm/apply mà ĐỤNG hoặc PHỤ THUỘC backend → BẮT BUỘC check BACKEND thật (query/runtime/log), KHÔNG chỉ tsc FE

> Heuristic engineering/process (họ `concepts/*`). Bổ trợ mọi luồng FE-đụng-BE.

## Luật (STRICT)
- **Khi 1 luồng FE (brainstorm → layout → apply) ĐỤNG backend (đổi resolver/gate/query) HOẶC PHỤ THUỘC backend data/runtime (dropdown model, list từ catalog, gate score, AI job…) → PHẢI CHECK BACKEND THẬT, không dừng ở "tsc FE sạch + build xanh".** Kiểm tối thiểu:
  1. **Query/resolver thật trả gì** — data feed UI có tồn tại không (catalog rỗng? filter loại hết? enum mismatch?). Empty UI thường = BE data/filter, không phải FE.
  2. **Runtime BE log** — feature gọi BE (AI job, balancer, mutation) mà "thất bại/rỗng" → ĐỌC LOG BE (dev server / prod qua [[starci-debug-vps]]) tìm nguyên nhân gốc (thiếu key, provider down, seed thiếu, migration chưa chạy).
  3. **Phân biệt "bug code" vs "config/env/data local"** — vd model dropdown rỗng có thể do local thiếu AI provider key (mọi model health-DOWN) → KHÔNG phải bug FE/BE code. Nói rõ cho user đây là env-local, prod có key thì chạy.
- **Vì sao:** FE build xanh + tsc sạch KHÔNG chứng minh feature CHẠY — chỉ chứng minh compile. Feature phụ thuộc BE data/runtime chỉ "đúng" khi BE trả data thật + job chạy thật. Bỏ bước check BE = ship UI đẹp nhưng rỗng/lỗi runtime.
- **UX phụ khi BE unavailable:** dropdown ẨN HẾT model khi down → user tưởng "hỏng". Nên show model **disabled + "AI tạm không khả dụng"** (`WarningCircleIcon` — disable vs lock) thay vì rỗng câm → user hiểu là config/tạm thời, không phải mất tính năng.

## Liên quan
- [[fe-swr-gate-must-match-be-enroll-guard]] (contract FE↔BE khớp) · [[ai-structured-output-must-match-consumer-shape]] (tsc-sạch ≠ chạy đúng; verify runtime) · [[secrets-env-in-script-out-protocol]] (thiếu AI key = env local).
