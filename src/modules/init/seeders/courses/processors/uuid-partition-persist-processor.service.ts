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
 * Applies a {@link UpsertService.partitionUuidSync} plan: save creates/updates, delete stale rows.
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
                [createEntity.id as string],
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
                [updateEntity.id as string],
                DbSyncType.Updated,
            )
        }
        if (deleteEntities.length > 0) {
            await this.entityManager.delete(
                entityClass,
                deleteEntities,
            )
            this.upsertService.logSync(
                entityClass,
                deleteEntities.map(
                    (entity) => entity.id
                ),
                DbSyncType.Deleted,
            )
        }
    }
}
