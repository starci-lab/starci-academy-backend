import type {
    EntityTarget,
    ObjectLiteral,
} from "typeorm"

/** One entity target the Elasticsearch reconcile pass scans. */
export interface EsReconcileTarget {
    /** TypeORM entity class to read live ids from. */
    entity: EntityTarget<ObjectLiteral>
    /** Entity class name, resolved to a base index via the Elasticsearch config map. */
    entityName: string
}
