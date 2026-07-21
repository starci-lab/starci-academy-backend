# Rule — JSDoc cấp type VÀ trên TỪNG member (STRICT) + inline `//` gần như từng dòng

**Mọi type/interface/enum export cần JSDoc cấp type + `/** */` trên TỪNG field/property/enum-member (kể cả optional/callback); mọi method body cần `//` giải thích logic gần như từng dòng.**

- Field/enum-member trống không doc = fail review. Callback field phải ghi rõ gọi khi nào, nhận gì (vd `onError?: (error: Error) => void` → doc "Called when the stream errors; receives the normalized error.").
- Inline `//` không diễn lại cú pháp (`// increment i` là noise) — giải thích **why**: branch guard gì, vì sao thứ tự đó, edge case, magic value. Áp cho service/processor/resolver/util, loop/if/early-return/try-catch đều có lead comment.
- Public method non-trivial thêm `@param`/`@returns`/`@example`.

> Đã áp: baseline coding-conventions, ví dụ mẫu `CreateStreamParams<TData>` trong `.cursor` doc; sweep 2026-05-28 sau khi user chỉ `stream-async-iterator/types/create-stream.ts` thiếu doc per-field.
> Nguồn: `.cursor/rules/starci-academy.mdc` §Unified Comment Pattern + §Inline Explanation Rule · memory `feedback-jsdoc-strict.md`.

[[english-only-code-comments]] · [[no-inline-nested-interfaces]]
