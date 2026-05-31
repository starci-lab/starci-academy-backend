import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    EntityTarget,
    DeepPartial,
    FindOptionsWhere,
    In,
} from "typeorm"
import {
    AbstractEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UuidAbstractEntity,
} from "@modules/databases"
import {
    WinstonLog,
    WinstonService,
    DbSyncType,
} from "@modules/winston"
import _ from "lodash"
import type {
    DbSyncLogEntityShape,
    PartitionUuidSyncParams,
    PartitionUuidSyncResult,
    UpsertManyResult,
} from "./types"
import {
    buildDbSyncLogDisplayFields,
} from "./utils"

/**
 * Generic service for upserting seed data into any entity table.
 * Handles: delete stale rows, insert/update current rows.
 * Logs every added / updated / deleted row via Winston (verbose).
 */
@Injectable()
export class UpsertService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly winstonService: WinstonService,
    ) { }

    /** Extract a human-readable entity name from an EntityTarget. */
    private entityName(
        target: EntityTarget<unknown>,
    ): string {
        if (typeof target === "function") {
            return target.name
        }
        return String(target)
    }

    /** True when the partial row carries fields beyond `id` (safe to `save`). */
    private hasPersistableFields<Entity extends UuidAbstractEntity>(
        entity: DeepPartial<Entity>,
    ): boolean {
        return Object.keys(entity).some((key) => key !== "id")
    }

    /**
     * Emit one verbose sync log per row for the given action.
     *
     * @param target   - TypeORM entity class.
     * @param entities - Rows used to derive `displayId` / `relativeDisplayIds` (partials or loaded).
     * @param type     - Created, updated, or deleted.
     */
    logSync(
        target: EntityTarget<unknown>,
        entities: Array<DeepPartial<UuidAbstractEntity>>,
        type: DbSyncType,
    ): void {
        const entityKind = this.entityName(target)
        for (const entity of entities) {
            const entityId = entity.id as string
            if (!entityId) {
                continue
            }
            const displayFields = buildDbSyncLogDisplayFields(
                entityKind,
                entity as DbSyncLogEntityShape,
            )
            this.winstonService.log(
                WinstonLog.DbSynchronizerSyncedSuccessfully,
                {
                    entityKind,
                    entityId,
                    type,
                    ...displayFields,
                },
            )
        }
    }

    /**
     * Load existing UUID rows used to partition create / update / delete buckets.
     *
     * @param entityClass - TypeORM entity class.
     * @param entities    - Incoming seed rows (used when `where` is omitted).
     * @param where       - Optional parent filter scoping stale-row detection.
     */
    private async findExistingForPartition<Entity extends UuidAbstractEntity>(
        entityClass: EntityTarget<Entity>,
        entities: Array<DeepPartial<Entity>>,
        where?: FindOptionsWhere<Entity>,
    ): Promise<Array<Entity>> {
        if (where) {
            return this.entityManager.find(
                entityClass,
                {
                    where,
                },
            )
        }

        const seedIds = entities
            .map((entity) => (entity as UuidAbstractEntity).id)
            .filter((id): id is string => Boolean(id))
        if (seedIds.length === 0) {
            return []
        }

        return this.entityManager.find(
            entityClass,
            {
                where: {
                    id: In(seedIds),
                } as FindOptionsWhere<Entity>,
            },
        )
    }

    /**
     * Compare the seed payload to the DB and split rows into create / update / delete buckets.
     *
     * Does not mutate the database — use {@link process} to apply the plan.
     *
     * @param params - Entity class, seed rows, and optional parent scope for stale detection.
     * @returns `createEntities`, `updateEntities`, and `deleteEntities` partitioned by `id`.
     */
    async partitionUuidSync<Entity extends UuidAbstractEntity>(
        params: PartitionUuidSyncParams<Entity>,
    ): Promise<PartitionUuidSyncResult<Entity>> {
        const {
            entityClass,
            entities,
            where,
        } = params

        const existingEntities = await this.findExistingForPartition(
            entityClass,
            entities,
            where,
        )

        const createEntities = _.differenceBy(
            entities,
            existingEntities,
            "id",
        ) as Array<DeepPartial<Entity>>
        const updateEntities = _.intersectionBy(
            entities,
            existingEntities,
            "id",
        ) as Array<DeepPartial<Entity>>
        const deleteEntities = _.differenceBy(
            existingEntities,
            entities,
            "id",
        ) as Array<Entity>

        return {
            createEntities,
            updateEntities,
            deleteEntities,
        }
    }

    /**
     * Upsert rows for a UUID-based entity (extends {@link UuidAbstractEntity}).
     *
     * 1. {@link partitionUuidSync} — plan create / update / delete buckets.
     * 2. Delete stale rows, then `save()` seed rows that carry persistable fields.
     *
     * Pass id-only stubs (e.g. `{ id }`) to prune stale rows without overwriting kept rows.
     * Pass an empty `entities` array with `where` to delete every row under that parent.
     *
     * @param entityClass - TypeORM entity class.
     * @param entities    - Parsed seed rows (each must carry its deterministic `id`).
     * @param where       - Optional parent filter (e.g. `{ course: { id: "x" } }`).
     * @returns The ids partitioned into `createIds` / `updateIds` / `deleteIds`.
     */
    async upsertMany<Entity extends UuidAbstractEntity>(
        entityClass: EntityTarget<Entity>,
        entities: Array<DeepPartial<Entity>>,
        where?: FindOptionsWhere<Entity>,
    ): Promise<UpsertManyResult> {
        const {
            createEntities,
            updateEntities,
            deleteEntities,
        } = await this.partitionUuidSync({
            entityClass,
            entities,
            where,
        })

        const createIds = createEntities.map(
            (entity) => (entity as UuidAbstractEntity).id,
        )
        const updateIds = updateEntities.map(
            (entity) => (entity as UuidAbstractEntity).id,
        )
        const deleteIds = deleteEntities.map((entity) => entity.id)

        if (deleteIds.length > 0) {
            await this.entityManager.delete(
                entityClass,
                deleteIds,
            )
        }

        const entitiesToPersist = entities.filter((entity) =>
            this.hasPersistableFields(entity),
        )
        if (entitiesToPersist.length > 0) {
            await this.entityManager.save(
                entityClass,
                entitiesToPersist,
            )
        }

        this.logSync(
            entityClass,
            createEntities,
            DbSyncType.Created,
        )
        this.logSync(
            entityClass,
            updateEntities,
            DbSyncType.Updated,
        )
        this.logSync(
            entityClass,
            deleteEntities,
            DbSyncType.Deleted,
        )

        return {
            createIds,
            updateIds,
            deleteIds,
        }
    }

    /**
     * Upsert rows for a composite-key translation entity.
     *
     * Translations have composite PKs (parentId + locale + field), so we delete every existing
     * row for the parent then re-insert the seed payload.
     *
     * @param entityClass - TypeORM translation entity class.
     * @param entities    - Parsed translation rows.
     * @param parentWhere - Filter selecting the parent's translations (e.g. `{ courseId: "x" }`).
     */
    async upsertTranslationMany<Entity extends AbstractEntity>(
        entityClass: EntityTarget<Entity>,
        entities: Array<DeepPartial<Entity>>,
        parentWhere: FindOptionsWhere<Entity>,
    ): Promise<void> {
        const existing = await this.entityManager.find(
            entityClass,
            {
                where: parentWhere,
            },
        )
        if (existing.length > 0) {
            await this.entityManager.remove(existing)
        }

        if (entities.length > 0) {
            await this.entityManager.save(
                entityClass,
                entities,
            )
        }
    }
}
