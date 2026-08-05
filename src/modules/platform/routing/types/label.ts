import type {
    EntityTarget,
    ObjectLiteral,
} from "typeorm"
import type {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

/**
 * A single entity reference to resolve into a display label.
 */
export interface EntityRef {
    /** Entity class name (e.g. "CourseEntity") -- matched against the entity's `.name`. */
    entityName: string
    /** Primary key (UUID) of the referenced entity. */
    id: string
}

/**
 * Params for `LabelResolverService.resolveLabels`.
 */
export interface ResolveLabelsParams {
    /** Batch of entity references to resolve; duplicates are deduped internally. */
    refs: Array<EntityRef>
    /** Locale used for label localization (currently informational -- v1 reads base columns). */
    locale: Locale
}

/**
 * Per-kind descriptor: which entity to query and which column carries the label.
 * The query aliases `labelColumn` to `label` via the `select` projection.
 */
export interface LabelKind {
    /** TypeORM entity target queried with `WHERE id IN (...)`. */
    entity: EntityTarget<ObjectLiteral>
    /** Entity property name whose value is used as the display label. */
    labelColumn: string
}

/**
 * Minimal row shape read back from a label query: primary key + its label column.
 * The label-bearing column is aliased to `label` by the query `select`.
 */
export interface LabelRow {
    /** Primary key (UUID) of the row, used to map the label back to its global id. */
    id: string
    /** Resolved display label (entity title or username). */
    label: string
}

/**
 * Params for the internal cache-fill pass of `LabelResolverService`.
 */
export interface FillFromCacheParams {
    /** Entity class name being resolved. */
    entityName: string
    /** Candidate ids to look up in the cache. */
    ids: Array<string>
    /** Active locale, part of the cache key. */
    locale: Locale
    /** Output Map mutated with cache hits. */
    labels: Map<string, string>
}

/**
 * Params for the internal database-fill pass of `LabelResolverService`.
 */
export interface FillFromDatabaseParams {
    /** Entity class name being resolved. */
    entityName: string
    /** Ids that missed the cache and must be queried. */
    ids: Array<string>
    /** Active locale, part of the cache key written back. */
    locale: Locale
    /** Descriptor selecting the entity + its label column. */
    kind: LabelKind
    /** Output Map mutated with freshly-read labels. */
    labels: Map<string, string>
}
