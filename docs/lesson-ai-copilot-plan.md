# Plan — `askContentAi` "Hỏi StarCi AI về nội dung này" + biz freemium (2026-06-18)

> ⚠️ NAMING (thầy chốt): mutation = **`askContentAi`**; dùng **"content"/"nội dung" KHÔNG "lesson/bài"** (§11) cho mọi
> tên mới (FE: `ContentAiCopilot`, không `LessonAiCopilot`).

## QUOTA MODEL — CHỐT CUỐI (thầy 2026-06-18, THAY mọi mục cap-per-content/2-câu cũ bên dưới)
- **AI CHAT = FREE.** Model Economy tiết kiệm, ai tạo acc cũng có → cảm giác hào phóng. Chat (`askContentAi`) **CHỈ**
  chặn bởi **ví toàn cục** (`AiEntitlementService`, ~50/ngày·100/tuần). **KHÔNG** counter-ngày-theo-khóa cho chat
  (bỏ — chat là thứ ChatGPT cũng làm, bóp chat = leaky + gây bực). → chat-free **đã xong** (askContentAi hiện chỉ gate credit pool, không cap khóa).
- **TƯỜNG MUA-KHÓA dời sang lever ĐỘC QUYỀN** (ChatGPT không thay được): **chấm challenge (graded+XP+cert)**, project
  review, AI-Lab, model xịn hơn, memory dài hơn. → AI bán khóa bằng giá trị độc quyền, không bóp chat.
- **CHALLENGES — tạm thời MỞ ÍT:** chỉ được làm/chấm challenge trong **content FREE (non-premium)**; challenge của
  content premium → cần MUA. (Gate `content.isPremium`; bản đầy đủ dùng `isPurchased` của freemium.) Phụ thuộc freemium
  free-enroll → đây là build kế.
- Ví toàn cục: đổi window **5h→ngày** + cap **50/ngày·100/tuần** (config `app.yaml`).

## TECH PATH ĐÃ CHỐT (đồng bộ, reuse — không dựng lại, KHÔNG cần streaming/Qdrant cho v1)
- **Gọi model đồng bộ:** `AiInvokeService.invoke({ messages: [SystemMessage(content body), HumanMessage(question)],
  category: AiModelCategory.Economy })` → `{ text, model, provider }`. (balancer xoay key + fallback + BYOK sẵn.)
- **Credit:** `AiEntitlementService.resolve({userId})` → `creditRemaining5h` (gate) ; `.consume({userId, mode, cost})`
  → trừ pool ; `cost` từ `constants/credit-cost.ts` (`CATEGORY_CREDIT_COST[Economy]`) — hoặc **ép phẳng = 1** (thầy).
- **BYOK:** `.getByokApiKey({userId})` → truyền `byok` vào invoke (StarCi $0).
- **Body bài nhỏ** (~vài nghìn token) → **nhét thẳng vào prompt, KHÔNG cần RAG/Qdrant** cho v1 (đơn giản + đủ).
- → `askContentAi` v1 = sync, 0 socket, 0 Qdrant. Chỉ thiếu: mutation scaffold + counter (2/content) + content fetch.

---



> Product/BE plan (KHÔNG code). Thầy: *"dùng model trong gói AI, mỗi câu tốn 1 token (int) được không. enroll vào
> chỉ được hỏi 2 lần… kiểu vậy làm sao để users xòe tiền."* → AI co-pilot ở rail phải, **flat 1 credit/câu**, gate
> freemium ép convert. Trò tự thiết kế biz + chọn số (int).

## 0. Ý tưởng
Rail phải bài học có ô **"Hỏi StarCi AI về bài này"** — RAG trên body bài đang đọc, trả lời bằng **model trong gói AI**
(Economy free / tốt hơn khi paid). Mỗi câu = **1 credit phẳng** (user thấy số nguyên, StarCi nuốt biến động token bằng
model rẻ + context nhỏ). Gate bằng **2 lớp** để ép xòe tiền.

## 1. Tái dùng (đã có, đừng dựng lại)
- **Gói AI / credit pool** ([[ai-credits-unified-pool]]): `myAiQuota.credit` (free base ~50/5h·500/tuần; paid mở
  Balanced+Premium). → trừ credit ở đây.
- **ai-router + model tier** (free=Economy rẻ) + **BYOK** (power user tự key → StarCi $0).
- **RAG infra** (Qdrant + langchain) — đã có cho AI Lab → index body bài, retrieve chunk.
- **Freemium `isPurchased`** ([[freemium-preview-enrollment-plan]]) — lớp gate khóa-học.

## 2. Biz model (trò thiết kế — 2 lớp gate, đều INT)
**Hằng số (đề xuất, tunable):**
- `LESSON_AI_COST_PER_QUESTION = 1` credit/câu (phẳng, user-facing).
- `FREE_ENROLL_QUESTIONS_PER_LESSON = 2` (free-enroll: tối đa 2 câu / bài).
- FAQ pre-baked = **0 credit** (đọc thoải mái).

| Lớp | Free-enroll (`isPurchased=false`) | Paid (`isPurchased=true`) |
|---|---|---|
| **FAQ pre-baked** (3–5 câu/bài, generate sẵn) | ✅ free, không giới hạn | ✅ free |
| **Hỏi free-form** | ✅ **2 câu/bài** (đếm per user×content) → hết → paywall | ✅ không cap per-bài |
| **Trừ credit** | 1 credit/câu (từ pool free ~50/tuần) | 1 credit/câu (từ pool paid lớn hơn) |
| Hết credit pool | paywall **nâng gói AI** | paywall **nâng gói AI** |

→ **2 đòn xòe tiền:**
1. **Mua KHÓA** (`isPurchased`): hết 2 câu/bài → CTA *"Mở khóa khóa học để hỏi thoải mái bài này"* → mua course (=
   doanh thu khóa, đúng phễu freemium). Sunk-cost: vừa đọc + vừa nếm 2 câu AI → tiếc → mua.
2. **Nâng GÓI AI**: hết credit pool → CTA *"Hết credit — nâng gói AI"* → AI subscription (doanh thu AI).
- FAQ free = mồi (cho thấy AI hữu ích) → kéo hỏi free-form → chạm cap → trả tiền.

**Chống lạm dụng / cháy token:** free-enroll bị CHẶN kép (2/bài **AND** pool free ~50/tuần) → trần cost rõ. Model
Economy + RAG chunk (không cả body) + output ngắn → mỗi câu phần-nghìn-đô; StarCi luôn lời vì credit/câu > cost thật.

## 3. BE cần làm (mới — đừng fake)
1. **Bảng đếm free-question:** `lesson_ai_question_usage` (user_id, content_id, count, window?) hoặc reuse 1 counter —
   để enforce `FREE_ENROLL_QUESTIONS_PER_LESSON`. (CQRS-light, không cần projection.)
2. **Mutation `askLessonAi(contentId, question)`:**
   - check auth + enrollment (free OK) → nếu free-enroll: check counter < 2 (else `OUT_OF_FREE_QUESTIONS`).
   - check + **trừ 1 credit** từ `myAiQuota` (reuse credit service; else `OUT_OF_CREDIT`).
   - RAG: retrieve chunk body bài (Qdrant) → prompt model **tier theo gói** (router) → answer.
   - tăng counter (free-enroll). Trả `{ answer, remainingFreeQuestions, creditLeft }`.
3. **FAQ pre-bake (phase sau, rẻ nhất):** lúc seed/build content → generate 3–5 Q&A/bài (batch 1 lần) → cột
   `content.ai_faq jsonb` → serve free, 0 runtime LLM. (Giảm 80% lượt hỏi → giảm cost.)
4. Config hằng số ở `app.yaml` (cost/free-cap tunable, không hardcode).

## 4. FE (rail phải — feature `LessonAiCopilot` trong `OnThisPage`)
- **Anchor luôn-hiện** dưới TOC (giải quyết red box trống): 
  - **FAQ chips** (3–5 câu gợi ý) → bấm → hiện answer (free).
  - **Ô "Hỏi về bài này…"** (Input) + nút gửi → gọi `askLessonAi`, stream/AsyncContent answer.
  - **Counter**: "Còn 2 lượt hỏi free cho bài này" (free-enroll) / credit còn lại (paid).
  - **Paywall khi hết:** 2/bài hết → CTA *"Mở khóa khóa học"* (primary, course) + *"Nâng gói AI"* (secondary).
- States: loading (typing…) · empty (chưa hỏi → chỉ FAQ) · error (retry) · out-of-quota (paywall, không phải error).
- Mọi write qua `useGraphQLWithToast`; answer KHÔNG toast (đọc).

## 5. Lộ trình ship (rẻ-dần, đo trước khi đào sâu)
1. **P1 — FAQ pre-baked + rail panel** (0 runtime LLM, ít BE): generate FAQ lúc seed + cột jsonb + render chips. Lấp
   red box NGAY + chứng minh người dùng đọc FAQ.
2. **P2 — Hỏi free-form live** (`askLessonAi` + counter + credit trừ + paywall). Bật conversion.
3. **P3 — RAG sâu + stream** (chunk retrieve tốt, citation đoạn bài). Khi #2 có traction.

## 6. Mở (thầy chốt nếu muốn đổi số)
- `FREE_ENROLL_QUESTIONS_PER_LESSON`: 2/bài (đề xuất) | 2 TỔNG/khóa (ép mạnh hơn) | 3/ngày.
- `COST_PER_QUESTION`: 1 (đề xuất) | 2–3 (nếu muốn credit hết nhanh → đẩy nâng gói AI).
- Paywall ưu tiên: course (đề xuất, hợp phễu) | gói AI | cả hai.
- Có cho free-enroll hỏi không (taste) hay **chỉ paid** mới được hỏi free-form (FAQ thì free cho mọi người)?

→ Đề xuất chốt: **P1 trước** (FAQ pre-baked, rẻ, lấp red box) → đo → P2 (live + paywall 2/bài + 1 credit/câu).
Số mặc định: **1 credit/câu · 2 câu free/bài · FAQ free**. Thầy gật là trò tách task build (BE+FE).
