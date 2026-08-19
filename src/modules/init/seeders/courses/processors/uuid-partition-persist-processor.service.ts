import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    ObjectLiteral,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "@modules/databases/postgresql/primary/entities/abstract"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    logInitSeederEntitySkipped,
} from "../../shared/log-init-seeder-entity-skipped"
import {
    UpsertService,
} from "../../shared/upsert/upsert.service"
import {
    DbSyncType,
} from "@modules/platform/winston/types/messages/db-synchronizer"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import type {
    PersistUuidPartitionParams,
} from "./types/persist-uuid-partition"

@Injectable()
/**
 * Applies a {@link UpsertService.partitionUuidSync} plan: save root rows (relations stripped), delete stale.
 */
export class UuidPartitionPersistProcessorService {
    constructor(
        private readonly upsertService: UpsertService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly winstonService: WinstonService,
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
            try {
                await this.entityManager.save(
                    entityClass,
                    updateEntity,
                )
                this.upsertService.logSync(
                    entityClass,
                    [updateEntity],
                    DbSyncType.Updated,
                )
            } catch (error) {
                // A single legacy row whose update violates a constraint (e.g. a stale
                // content_body_translations FK on old devops content) must NOT abort the
                // whole seed -- warn and skip it so the rest of the partition still syncs.
                const skippedId = (updateEntity as { id?: unknown }).id
                logInitSeederEntitySkipped(
                    this.winstonService,
                    entityClass as ObjectLiteral,
                    typeof skippedId === "string" ? skippedId : "",
                    error,
                )
            }
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
