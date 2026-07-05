# Draft — FE brainstorm/apply mà ĐỤNG hoặc PHỤ THUỘC backend → BẮT BUỘC check BACKEND thật (query/runtime/log), KHÔNG chỉ tsc FE (2026-07-05)

- File/§ đích khi `/merge`: `concepts/` (process/verify) + skill `starci-fe-ux-apply` · `starci-fe-ux-brainstorm` · `starci-fe-layout-brainstorm` · `starci-fe-critique` + liên quan [[starci-debug-vps]] (đọc log prod) · `disable-vs-lock-and-perrow-autosave` (UX khi BE unavailable).
- Bối cảnh: dựng lại feature CV (FE layout) + sửa BE (gate verified-only). Thầy soi thấy picker model CV "Không có model khớp" + generate lỗi "AI Balancer: all 2 fallback models exhausted after 0 attempts". Thầy: *"fe-ux-brainstorm mà sửa backend phải check backend nhé!"*. → em build FE + tsc sạch nhưng CHƯA verify BE runtime (data/model thật).

## Luật (STRICT)
- **Khi 1 luồng FE (brainstorm → layout → apply) ĐỤNG backend (đổi resolver/gate/query) HOẶC PHỤ THUỘC backend data/runtime (dropdown model, list từ catalog, gate score, AI job…) → PHẢI CHECK BACKEND THẬT, không dừng ở "tsc FE sạch + build xanh".** Kiểm tối thiểu:
  1. **Query/resolver thật trả gì** — data feed UI có tồn tại không (catalog rỗng? filter loại hết? enum mismatch?). Empty UI thường = BE data/filter, không phải FE.
  2. **Runtime BE log** — khi feature gọi BE (AI job, balancer, mutation) mà "thất bại/rỗng" → ĐỌC LOG BE (`preview_logs` server backend / [[starci-debug-vps]] cho prod) tìm nguyên nhân gốc (thiếu key, provider down, seed thiếu, migration chưa chạy).
  3. **Phân biệt "bug code" vs "config/env/data local"** — vd model dropdown rỗng có thể do **local thiếu AI provider key** (mọi model health-DOWN) → KHÔNG phải bug FE/BE code. Nói rõ cho thầy đây là env-local, prod có key thì chạy.
- **Vì sao:** FE build xanh + tsc sạch KHÔNG chứng minh feature CHẠY — nó chỉ chứng minh compile. Feature phụ thuộc BE data/runtime chỉ "đúng" khi BE trả data thật + job chạy thật. Bỏ bước check BE = ship UI đẹp nhưng rỗng/lỗi runtime (thầy bắt tận tay).
- **Đây là mở rộng verify của `starci-fe-ux-apply`:** "Verify bằng mắt (chạy→chụp→soi)" phải gồm **verify BE runtime** khi feature phụ thuộc BE — chạy thử action thật (generate CV, submit…) + đọc log BE, không chỉ chụp UI tĩnh.

## Ví dụ (2026-07-05) — CV generate "không có model"
- **Root cause (từ BE log):** mọi model probe DOWN — `[openai] No eligible key for provider` · `[gemini] API key not valid` · `[anthropic] No eligible key` · `[openrouter] 429`. → **local env thiếu/không hợp lệ AI provider key** → 0 model healthy → balancer "exhausted after 0 attempts" + dropdown "Không có model khớp". KHÔNG phải bug code (prod có key thì chạy). Fix = thầy nhập key vào env local (theo [[secrets-env-in-script-out-protocol]]), không sửa code.
- **UX phụ (cân nhắc):** dropdown ẨN HẾT model khi down → user tưởng "hỏng". Nên show model **disabled + "AI tạm không khả dụng"** (`WarningCircleIcon`, ref `disable-vs-lock-and-perrow-autosave`) thay vì rỗng câm → user hiểu là config/tạm thời, không phải mất tính năng.

## Áp đầu (2026-07-05)
- Sau khi build CV feature (FE) + sửa gate (BE), check BE log → phát hiện AI keys local là gốc "không có model". Ghi rule để lần sau FE-đụng-BE luôn verify BE runtime.
