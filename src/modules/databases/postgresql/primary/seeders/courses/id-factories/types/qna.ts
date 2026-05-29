/**
 * Input for {@link QnaIdFactoryService.generate}.
 */
export interface GenerateQnaIdParams {
    /** Owning course ordinal. */
    courseIndex: number
    /** Zero-based FAQ entry (`## 1.` → index 0 if ordered contiguously). */
    qnaIndex: number
}
