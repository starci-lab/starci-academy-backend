/**
 * Log label for skipped AI model catalog mount rows (no backing DB entity).
 *
 * Carries a `name` field so {@link logInitSeederEntitySkipped} can record the
 * entity type, mirroring how a TypeORM entity class exposes `.name`.
 */
export const AI_MODEL_CATALOG_ENTITY = {
    /** Entity type name recorded in the skipped-entity log. */
    name: "AiModelCatalog",
} as const

/**
 * Log label for skipped subscription catalog mount rows (no backing DB entity).
 *
 * Carries a `name` field so {@link logInitSeederEntitySkipped} can record the
 * entity type, mirroring how a TypeORM entity class exposes `.name`.
 */
export const SUBSCRIPTION_CATALOG_ENTITY = {
    /** Entity type name recorded in the skipped-entity log. */
    name: "SubscriptionCatalog",
} as const
