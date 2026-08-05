import type {
    DeepPartial,
    EntityTarget,
    FindOptionsWhere,
} from "typeorm"
import type {
    UuidAbstractEntity,
} from "@modules/databases/postgresql/primary/entities/abstract"

/**
 * Result of {@link UpsertService.partitionUuidSync}: seed rows and DB rows split into
 * create / update / delete buckets (matched by deterministic `id`).
 */
export interface PartitionUuidSyncResult<Entity extends UuidAbstractEntity> {
    /** Seed rows whose `id` is not yet in the DB (under the resolved scope). */
    createEntities: Array<DeepPartial<Entity>>
    /** Seed rows whose `id` already exists in the DB. */
    updateEntities: Array<DeepPartial<Entity>>
    /** DB rows in scope that are absent from the seed payload (stale). */
    deleteEntities: Array<Entity>
}

/**
 * Params for {@link UpsertService.partitionUuidSync}.
 */
export interface PartitionUuidSyncParams<Entity extends UuidAbstractEntity> {
    /** TypeORM entity class. */
    entityClass: EntityTarget<Entity>
    /** Incoming seed rows (each must carry its deterministic `id`). */
    entities: Array<DeepPartial<Entity>>
    /**
     * Optional parent filter scoping stale-row detection (e.g. `{ course: { id: "x" } }`).
     * Omit to compare only against seed ids -- nothing is deleted without a filter.
     */
    where?: FindOptionsWhere<Entity>
}
