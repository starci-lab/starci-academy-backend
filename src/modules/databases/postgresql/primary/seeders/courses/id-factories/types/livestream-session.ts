/**
 * Input for {@link LivestreamSessionIdFactoryService.generate}.
 */
export interface GenerateLivestreamSessionIdParams {
    /** Owning course ordinal. */
    courseIndex: number
    /** Session slot index from seed `data.json` (`orderIndex`). */
    sessionIndex: number
}
