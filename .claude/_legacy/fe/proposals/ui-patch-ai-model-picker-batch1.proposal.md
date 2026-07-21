# Proposal — ui-patch AI model picker, batch 1: gộp `LaneModelPicker` → `GradeModelDropdown`

> Nguồn: `ui-patch-ai-model-picker.audit.md` Rule 4. Canon: `LaneModelPicker` (AiLab) là bản trùng `GradeModelDropdown`, cần khai tử — nhưng cần quyết định thêm trước khi build.

## Vì sao chưa tự sửa
`LaneModelPicker` thiếu hẳn search + tier-filter chips + health chip + self-host mark + `isDropdown` field-style so với `GradeModelDropdown` — gộp không chỉ đổi import, mà phải QUYẾT xem AI Lab (`PromptPlayground`, `EvalChallengePanel`) có cần các tính năng đó không (canvas AI Lab compact, nhồi search+filter có thể rườm), và gán `floor`/`task`/`showAutoLane` phù hợp ngữ cảnh nào.

## Call-site cần sửa
- `src/components/features/learn/LessonReader/AiLab/PromptPlayground/index.tsx:284` — dùng `LaneModelPicker`, state `AiLabModelSelection`.
- `src/components/features/learn/LessonReader/AiLab/EvalChallengePanel/index.tsx:268` — dùng `LaneModelPicker`, state `AiLabModelSelection`.
- `src/components/features/learn/LessonReader/AiLab/types/ai-lab.ts:9` — `AiLabModelSelection` (structurally = `GradeModelSelection`, có thể xoá và dùng thẳng type chung).
- `src/components/features/learn/LessonReader/AiLab/LaneModelPicker/` — xoá cả folder sau khi 2 caller migrate xong.

## Câu hỏi cần chốt trước khi build
1. AI Lab picker có cần search + tier-filter chips không, hay giữ compact (ẩn `SearchField`/`FlexWrapButtonRadio` khi model catalog AI Lab nhỏ)?
2. `task={AiModelTask.???}` — AI Lab cần 1 giá trị enum riêng (vd `AiModelTask.AiLab`) để lọc đúng model hỗ trợ, hay dùng `undefined` (hiện mọi model)?
3. `floor` — có cảnh báo model dưới sàn khuyến nghị như grading không, hay AI Lab không cần (đây là chỗ thử nghiệm, không chấm điểm)?

## Fix cơ học đi kèm (không cần chờ quyết định trên)
- Đồng bộ `AiLabModelSelection` → dùng thẳng `GradeModelSelection` (xoá type trùng) trong `types/ai-lab.ts` nếu 2 type thực sự giống hệt — verify lại field trước khi xoá.

## Route
`starci-fe-block-apply` (đổi trong phạm vi 1 block-picker, không đụng shell AiLab) sau khi câu hỏi trên được chốt.

## Verify
- tsc/eslint sạch.
- Preview AI Lab (PromptPlayground + EvalChallengePanel): picker vẫn chọn được Auto/model cụ thể, lock/warning state giữ nguyên hành vi cũ.
