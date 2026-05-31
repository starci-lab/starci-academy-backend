import type {
    EntityTarget,
} from "typeorm"
import type {
    UuidAbstractEntity,
} from "@modules/databases"
import type {
    PartitionUuidSyncResult,
} from "../../../shared/upsert/types"

/** {@link UuidPartitionPersistProcessorService.process} input. */
export interface PersistUuidPartitionParams<Entity extends UuidAbstractEntity> {
    /** TypeORM entity class to persist. */
    entityClass: EntityTarget<Entity>
    /** Create / update / delete buckets from partition sync. */
    partition: PartitionUuidSyncResult<Entity>
}
