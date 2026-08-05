/**
 * Input for {@link FoundationCategoryIdFactoryService.generate}.
 */
export interface GenerateFoundationCategoryIdParams {
    /**
     * Zero-based index of the category in the seeded list.
     */
    categoryIndex: number
}

/**
 * Input for {@link FoundationIdFactoryService.generate}.
 */
export interface GenerateFoundationIdParams {
    /**
     * Zero-based category index (same as {@link GenerateFoundationCategoryIdParams.categoryIndex}).
     */
    categoryIndex: number
    /**
     * Zero-based foundation index within that category.
     */
    foundationIndex: number
}

/**
 * Input for {@link FoundationTagIdFactoryService.generate}.
 */
export interface GenerateFoundationTagIdParams {
    /** Parent category ordinal. */
    categoryIndex: number
    /** Parent foundation ordinal. */
    foundationIndex: number
    /** Zero-based tag index within the foundation. */
    tagIndex: number
}
