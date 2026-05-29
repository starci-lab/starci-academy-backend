/**
 * Input for {@link PricingPhaseIdFactoryService.generate}.
 */
export interface GeneratePricingPhaseIdParams {
    /** Course that owns the pricing tier row. */
    courseIndex: number
    /** Tier order (e.g. 0 = pioneer, 1 = early bird, 2 = regular). */
    phaseIndex: number
}
