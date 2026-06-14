
/** Options for primary MongoDB module. */
export interface PrimaryPostgresqlOptions {
    /**
     * Whether to include locale resolvers.
     */
    withResolvers?: boolean
    /**
     * Whether to include entity hydration loaders (default: registered with primary module).
     * Set `false` only in tests that do not need CDN/ES plain loaders.
     */
    withHydration?: boolean
}