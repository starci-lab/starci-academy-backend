/**
 * Input for {@link ValuePropositionIdFactoryService.generate}.
 */
export interface GenerateValuePropositionIdParams {
    /** Owning course ordinal. */
    courseIndex: number
    /** Zero-based line in the course “Value Propositions” list. */
    valuePropositionIndex: number
}
