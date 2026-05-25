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
    private entityName(target: EntityTarget<unknown>): string {
        if (typeof target === "function") {
            return target.name
        }
        return String(target)
    }

    /**
     * Upsert rows for a UUID-based entity (extends UuidAbstractEntity).
     *
     * 1. Query existing IDs for the given parent filter.
     * 2. Delete rows whose IDs exist in DB but NOT in seedData.
     * 3. Save (insert-or-update) all seedData rows.
     *
     * @param entityClass - TypeORM entity class
     * @param entities    - Parsed seed rows (must include `.id`)
     * @param where       - Optional parent filter (e.g. `{ course: { id: 'x' } }`)
     */
    async upsertUuid
        <Entity extends UuidAbstractEntity>
    (
        entityClass: EntityTarget<Entity>,
        entities: Array<DeepPartial<Entity>>,
        where?: FindOptionsWhere<Entity>,
    ): Promise<void> {
            try {
            /**
             * Only run the find-and-delete-stale logic when a parent filter
             * is provided. Without a filter, find() would return ALL rows
             * globally, causing unrelated rows to be deleted.
             */
                let existingIds: Set<string> = new Set()
                if (where) {
                /** 1. Get existing IDs scoped to the parent */
                    const existing = await this.entityManager.find<UuidAbstractEntity>(
                        entityClass,
                        {
                            select: {
                                id: true,
                            },
                            where,
                        })
                    existingIds = new Set(existing.map((entity) => entity.id))
                    const ids = new Set(
                        entities
                            .filter((entity) => entity.id != null)
                            .map((entity) => entity.id as string),
                    )

                    // /** 2. Delete stale rows (exist in DB but not in seed) */
                    // const toDelete = [...existingIds].filter((id) => !ids.has(id))
                    // if (toDelete.length > 0) {
                    //     await this.entityManager.delete(entityClass,
                    //         toDelete)
                    //     for (const id of toDelete) {
                    //         this.winstonService.log(
                    //             WinstonLog.DbSynchronizerSyncedSuccessfully,
                    //             {
                    //                 entityKind: this.entityName(entityClass),
                    //                 entityId: id,
                    //                 type: DbSyncType.Deleted,
                    //             },
                    //         )
                    //     }
                    // }
                } else {
                /**
                 * For global upserts (no parent filter), pre-load only IDs that
                 * appear in the incoming seed set so we can log Added vs Updated accurately.
                 */
                    const ids = entities
                        .filter((entity) => entity.id != null)
                        .map((entity) => entity.id as string)
                    if (ids.length > 0) {
                        const existing = await this.entityManager.find<UuidAbstractEntity>(
                            entityClass,
                            {
                                select: {
                                    id: true,
                                },
                                where: {
                                    id: In(ids),
                                } as FindOptionsWhere<Entity>,
                            }
                        )
                        existingIds = new Set(existing.map((entity) => entity.id))
                    }
                }

                /** 3. Save (upsert) each seed row */
                for (const entity of entities) {
                    await this.entityManager.save(entityClass,
                        entity)
                    const entityId = (entity as UuidAbstractEntity).id ?? "unknown"
                    const isNew = !existingIds.has(entityId)
                    this.winstonService.log(
                        WinstonLog.DbSynchronizerSyncedSuccessfully,
                        {
                            entityKind: this.entityName(entityClass),
                            entityId,
                            type: isNew ? DbSyncType.Added : DbSyncType.Updated,
                        },
                    )
                }
            } catch (error) {
                console.error(error)
                throw error
            }
        }

    /**
     * Delete rows for a UUID-based entity whose IDs are NOT in the seed set.
     * Unlike upsertUuid, this does NOT save any entities — it only removes stale rows.
     *
     * @param entityClass - TypeORM entity class
     * @param ids         - Current seed IDs to keep
     * @param where       - Parent filter (e.g. `{ course: { id: 'x' } }`)
     */
    async deleteStaleUuid
        <Entity extends UuidAbstractEntity>
    (
        entityClass: EntityTarget<Entity>,
        ids: Array<string>,
        where: FindOptionsWhere<Entity>,
    ): Promise<void> {
            // deleteStale disabled during init seed — re-enable when mount sync is stable
            return
            // try {
            //     const existing = await this.entityManager.find<UuidAbstractEntity>(
            //         entityClass,
            //         {
            //             select: {
            //                 id: true,
            //             },
            //             where,
            //         })
            //     const existingIds = new Set(existing.map((entity) => entity.id))
            //     const seedIds = new Set(ids)

            //     const toDelete = [...existingIds].filter((id) => !seedIds.has(id))
            //     if (toDelete.length > 0) {
            //         await this.entityManager.delete(entityClass,
            //             toDelete)
            //         for (const id of toDelete) {
            //             this.winstonService.log(
            //                 WinstonLog.DbSynchronizerSyncedSuccessfully,
            //                 {
            //                     entityKind: this.entityName(entityClass),
            //                     entityId: id,
            //                     type: DbSyncType.Deleted,
            //                 },
            //             )
            //         }
            //     }
            // } catch (error) {
            //     console.error(error)
            //     throw error
            // }
        }

    /**
     * Upsert rows for a composite-key translation entity.
     *
     * Since translations have composite PKs (parentId + locale + field),
     * we delete-all for the parent then re-insert.
     *
     * @param entityClass     - TypeORM translation entity class
     * @param entities        - Parsed translation rows
     * @param parentWhere     - Filter to select the parent's translations (e.g. `{ courseId: 'x' }`)
     */
    async upsertTranslation
        <Entity extends AbstractEntity>
    (
        entityClass: EntityTarget<Entity>,
        entities: Array<DeepPartial<Entity>>,
        parentWhere: FindOptionsWhere<Entity>,
    ): Promise<void> {
            try {
            /** 1. Delete all existing translations for the parent */
                const existing = await this.entityManager.find(
                    entityClass,
                    {
                        where: parentWhere,
                    }
                )
                if (existing.length > 0) {
                    await this.entityManager.remove(existing)
                }

                /** 2. Insert all seed translations */
                for (const entity of entities) {
                    await this.entityManager.save(
                        entityClass,
                        entity
                    )
                }
            } catch (error) {
                console.error(error)
                throw error
            }
        }
}
