# Credit cost system — redesign TOKEN-BASED, fair vs cost, margin ~30% (brainstorm 2026-06-30)

> Thầy: credit phải **scale theo input/output token** (nhiều token → nhiều credit), fair so với GIÁ THẬT của model, trần ×10 cho dễ làm tròn, lợi nhuận ~30%.

## Vấn đề bản cũ (flat per-run)
`credit` = 1 số phẳng/lần chấm (economy 5 · balanced 20 · premium 50 · frontier 80-100). 2 lỗi:
1. **KHÔNG theo token** — chấm bài 2K token vs 20K token cùng tốn 1 số → bài dài lỗ, bài ngắn lãi.
2. **KHÔNG fair vs cost** — frontier credit chỉ ~20× economy, nhưng GIÁ THẬT frontier ~100× economy → frontier bị bán rẻ (lỗ ngầm).

## Nguyên tắc mới: 1 credit = 1 LƯỢNG CHI PHÍ THẬT cố định
**Định nghĩa: `1 credit ≡ C₀ đô-la chi phí token thật` (C₀ = $0.0002).** → mọi thứ suy ra:
- **Rate per model** (credit / 1M token) = `giá_$/1M ÷ C₀`. Tách input & output (output thường đắt 3-5×).
  `creditPerMTokIn = priceIn$/M × 5000` · `creditPerMTokOut = priceOut$/M × 5000` (vì 1/C₀ = 5000).
- **Charge 1 lần chạy** = `ceil((promptTok × creditIn + completionTok × creditOut) / 1e6)`. → token nhiều = credit nhiều (fair).
- **Tự cân bằng margin:** vì credit ≡ C₀ cost, tiêu N credit = **luôn** N×C₀ cost (bất kể model/độ dài). → margin chỉ phụ thuộc **cap vs giá**, không phụ thuộc user xài model nào. Đẹp.

## Rate đề xuất (grounded giá OpenRouter thật, $/1M in/out)
| Tier | model ví dụ | $in / $out | creditIn/M | creditOut/M | 1 lần chấm (8K in·2K out) |
|---|---|---|---|---|---|
| **Free** | qwen7b local · free OR | ~0 / ~0 | 0 | 0 | **0** |
| **Economy** | deepseek-v4-flash 0.09/0.18 · nano 0.10/0.30 | 0.10 / 0.30 | 500 | 1 500 | **~7** |
| **Balanced** | deepseek-v4-pro 0.44/0.87 · qwen3.7+ 0.32/1.28 | 0.50 / 1.50 | 2 500 | 7 500 | **~35** |
| **Premium** | glm-5.2 0.94/3.0 · gemini-3.1-pro ~1.5/6 | 1.50 / 6.0 | 7 500 | 30 000 | **~120** |
| **Frontier** | Opus ~15/75 · gpt-5 ~5/30 · gemini-3-pro ~2/12 | 15 / 75 (Opus) | 75 000 | 375 000 | **~1 350** |

→ Per-run: 0 · 7 · 35 · 120 · ~1000-1350. **Trần ~×10 bản cũ** (frontier 100 → ~1000+), spread = 100× = đúng spread cost thật (FAIR). Rate per-model tinh chỉnh theo giá THẬT từng cái (deepseek-v4-flash rẻ hơn nano → rate thấp hơn).

## Margin 30% = chỉnh CAP (không đổi giá gói)
Đảm bảo **margin ≥30% kể cả khi user xài KỊCH cap** (sàn lợi nhuận; nhẹ tay hơn = lãi cao hơn):
`cap_tuần × C₀ ≤ giá_tuần × 0.70`  (giá_tuần = giá_tháng / 4.33; C₀=$0.0002)
| Gói | giá/tháng | rev tuần | ×0.70 | **cap tuần** (÷C₀) | cap 5h (÷10) | (cũ: tuần/5h) |
|---|---|---|---|---|---|---|
| Plus | 99k ($3.99) | $0.92 | $0.645 | **~3 200** | ~320 | (2500/250) |
| Pro | 199k ($7.99) | $1.85 | $1.29 | **~6 400** | ~640 | (5000/500) |
| Max | 499k ($19.99) | $4.62 | $3.23 | **~16 000** | ~1 600 | (20000/2000) |

Plus/Pro cap tăng nhẹ, Max giảm (vì frontier giờ tính đúng cost → cap cũ 20k cho phép lỗ). User economy-heavy gần như không đổi số lần; frontier-heavy bị siết đúng mức (fair).

## Hệ quả triển khai (đụng gì)
1. **Field model:** thay `credit` phẳng → **`creditPerMTokIn` + `creditPerMTokOut`** (2 cột int, hoặc jsonb). Giữ `credit` làm fallback khi KHÔNG đếm được token.
2. **Token đã CÓ SẴN — chỉ cần capture, KHÔNG đếm tay.** `chatModel.invoke()` trả `AIMessage` có `response.usage_metadata` (`input_tokens`/`output_tokens`) — code hiện vứt đi (chỉ lấy `.content`, [ai-invoke.service.ts:242](src/modules/ai/ai-invoke.service.ts)). Stream đã đọc `chunk.usage_metadata` rồi. → đổi `invokeAction` trả `{text, promptTokens, completionTokens}` (mirror `StreamActionResult`) + `AiInvokeResult` thêm 2 field token. Fallback flat chỉ khi provider không report usage (hiếm).
3. **`AiInvokeService.run` costFor:** flat `creditForModel` → `ceil((pt×rIn + ct×rOut)/1e6)`; fallback flat khi token thiếu (model không report usage).
4. **Markdown 20 model** (rate in/out) + **3 gói** (cap mới) + **migration** + **reseed**.
5. **FE hiển thị:** đổi "N credit/lần" → ước tính theo cỡ bài, hoặc hiện rate (credit/1K token). (UI quota giữ pool 5h+tuần — [[credit-unified-pool-ui]].)

## Mở rộng (sau)
- Caching discount (prompt-cache giảm input cost) → giảm creditIn khi cache hit.
- Per-model trong tier: tinh chỉnh rate theo giá THẬT từng model (đã có data OpenRouter).
- Hiển thị "bài này ~X credit" preview trước khi chấm (đếm token prompt trước).

## Refs
- Giá thật: [OpenRouter models](https://openrouter.ai/models). Margin/cap: anchor C₀=$0.0002, sàn 30% ở max-usage.
