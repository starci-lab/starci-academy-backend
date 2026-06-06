/** Optional tracing context passed into CDN materialize/upload. */
export interface CdnMaterializeContext {
    /** TypeORM entity class name. */
    entityKind: string
    /** Entity primary key. */
    entityId: string
    /** Mount display id when available. */
    displayId?: string
}
