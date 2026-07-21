# Concept — Surface HỌC/luyện: cơ chế học GROUNDED learning-science + KHỚP loại content; gamify thưởng ĐỘ SÂU/THÓI QUEN, không tốc độ

> Heuristic pedagogy (họ `concepts/*`). Rút từ gamify "Hỏi nhanh" (flashcard quiz) 2026-07-05 — thầy bắt phải research learning-science + đọc content thật TRƯỚC khi chốt cơ chế, KHÔNG phán từ trí nhớ. Bổ trợ [[progress-block-growing-quantity-headline-not-vanity-strip]] · [[fair-monetization-axiom]] · [[single-source-render]].

## Luật (STRICT)
- **Thiết kế surface HỌC/luyện (quiz, flashcard, drill, practice) → cơ chế học PHẢI grounded bằng learning-science CÓ NGUỒN, KHÔNG bịa "cho vui/cho game".** Trước khi chốt cách chấm/cách hỏi: (a) ĐỌC content thật (vài item) để biết nó là loại gì; (b) `WebSearch`/`WebFetch` learning-science cho loại đó; (c) mỗi quyết định cơ chế neo 1 nguồn. "Gamify" không grounded = re-skin dopamine, không tăng học (meta-analysis: gamification tác động **tối thiểu lên competency**).
- **Cơ chế luyện phải KHỚP LOẠI CONTENT + FORMAT ĐÍCH (transfer-appropriate processing, Agarwal 2019):** luyện *fact* không cải thiện *higher-order* & ngược lại. → content **fact-recall đơn** (định nghĩa, 1 đáp án) hợp multiple-choice/tự-chấm nhanh; content **higher-order** (giải thích cơ chế/trade-off, kiểu câu hỏi phỏng vấn) BẮT BUỘC luyện bằng **retrieval higher-order** (gõ/nói ra rồi đối chiếu), KHÔNG ép xuống trắc nghiệm. Đọc content TRƯỚC khi chọn cơ chế — đừng giả định "flashcard = fact".
- **Retrieval phải EFFORTFUL:** bắt nhớ-lại/gõ-ra TRƯỚC khi lật đáp án (testing effect); tự-chấm "nhìn-xong-bấm-Đúng" = lừa mình. Chấm khách quan không-AI khi content có "từ khoá ăn điểm" → string-match coverage ("nhắc 3/6 từ khoá"), thay cảm-giác-chắc-đúng.
- **Gamify thưởng ĐÚNG hành vi học, KHÔNG vanity:** XP/điểm scale theo **độ phủ/độ sâu** (keyword, tầng lý luận) + **thói quen (streak NGÀY = spacing)**, KHÔNG theo **tốc độ tap / combo-trong-phiên**. Vì (a) overjustification: phần thưởng kỳ vọng dời chú ý sang thưởng → GIẾT động lực học; (b) spacing (quay lại nhiều ngày) mới tạo trí nhớ dài hạn, không phải tốc độ trong 1 phiên. Recap theo **MASTERY** ("N thẻ trả lời được không cần gợi ý"), không raw points. Giữ điểm ở "equilibrium" — visible, không phải mục đích.
- **1 engine, không hệ điểm song song:** nuôi lại SRS/XP/streak SẴN CÓ (SM-2 + XP history + streak), đừng đẻ cơ chế điểm mới cho 1 surface ([[single-source-render]] · [[fair-monetization-axiom]] "1 tín hiệu 1 nguồn").

## Cloze (điền chỗ trống) tự sinh KHÔNG-AI
- **Content đã có "từ khoá quan trọng" tác giả đánh dấu (chip `Từ khoá ăn điểm`) → dùng CHÍNH nó làm ô khoét, KHÔNG cần AI/heuristic đoán.** = cách Anki (human-marked `{{c1::…}}`) miễn phí vì data đã có.
- **Chọn CÂU khoét:** ưu tiên câu nhiều từ khoá nhất (section "trả lời thẳng"/lõi). Cap **2–3 ô/câu** (khoét hết = "phô mai lỗ"). Code token (`@Catch`) = ô lý tưởng (1 đáp án đúng).
- **Mồi nhiễu (distractor) = từ khoá của thẻ ANH EM cùng phiên, ƯU TIÊN CÙNG TAG** — KHÔNG random từ điển (= Duolingo word-bank / Quizlet mồi cùng bộ). Cùng-tag = gần nghĩa = buộc PHÂN BIỆT chứ không đoán bừa.
- **Business lens:** với "luyện nhanh mỗi ngày", cloze/word-bank (tap-chọn) thắng free-recall (gõ tự luận) về retention/mobile/conversion (ít ma sát, tất định, thân ngón cái, screenshot-worthy) — playbook Duolingo. Giữ rigor bằng: **luôn lật full lời giải sau khi điền** + mồi cùng-tag.
- **Fallback:** thẻ không có chip từ khoá → không cloze được → dùng lật + tự chấm SM-2 (đừng ép cloze rỗng). Chấm cloze = so khớp chính xác (tất định, công bằng), coverageScore = đúng/tổng ô → feed XP/combo.

## Nguồn
- Agarwal 2019 (transfer-appropriate) · Dunlosky 2013 (practice testing/spacing/interleaving/self-explanation) · Roediger & Karpicke (testing effect) · Zeng 2024 gamification meta (BJET) · Gamification & intrinsic motivation SDT meta 2023 / Overjustification effect · Duolingo/Quizlet distractor-from-same-set · cloze = 3 module (arxiv 2403.10326).

## Liên quan
- [[progress-block-growing-quantity-headline-not-vanity-strip]] (meter có nghĩa > stat-strip) · [[fair-monetization-axiom]] (1 tín hiệu 1 nguồn) · [[single-source-render]] (1 engine) · [[meter-tracks-out-of-box-default-target]] · [[design-for-data-that-exists-coverless-lowvolume]] (đọc data thật).
