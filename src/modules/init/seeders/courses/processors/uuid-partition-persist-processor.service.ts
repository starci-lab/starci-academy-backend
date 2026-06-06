import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UuidAbstractEntity,
} from "@modules/databases"
import {
    UpsertService,
} from "../../shared"
import {
    DbSyncType,
} from "@modules/winston"
import type {
    PersistUuidPartitionParams,
} from "./types"

/**
 * Applies a {@link UpsertService.partitionUuidSync} plan: save root rows (relations stripped), delete stale.
 */
@Injectable()
export class UuidPartitionPersistProcessorService {
    constructor(
        private readonly upsertService: UpsertService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    /**
     * Persists create/update rows and deletes stale entities from a UUID partition.
     *
     * @param params - Entity class and partition buckets.
     */
    async process<Entity extends UuidAbstractEntity>(
        params: PersistUuidPartitionParams<Entity>,
    ): Promise<void> {
        const {
            entityClass,
            partition,
        } = params
        const {
            createEntities,
            updateEntities,
            deleteEntities,
        } = partition
        for (const createEntity of createEntities) {
            await this.entityManager.save(
                entityClass,
                createEntity,
            )
            this.upsertService.logSync(
                entityClass,
                [createEntity],
                DbSyncType.Created,
            )
        }
        for (const updateEntity of updateEntities) {
            await this.entityManager.save(
                entityClass,
                updateEntity,
            )
            this.upsertService.logSync(
                entityClass,
                [updateEntity],
                DbSyncType.Updated,
            )
        }
        if (deleteEntities.length > 0) {
            const deleteIds = deleteEntities
                .map((entity) => entity.id)
                .filter((id): id is string => Boolean(id))
            await this.entityManager.delete(
                entityClass,
                deleteIds,
            )
            this.upsertService.logSync(
                entityClass,
                deleteEntities,
                DbSyncType.Deleted,
            )
        }
    }
}
