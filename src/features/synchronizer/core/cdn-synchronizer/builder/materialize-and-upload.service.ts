import {
    S3Provider, S3UploadService
} from "@modules/s3"
import {
    Injectable 
} from "@nestjs/common"
import type {
    EntityLike, LocalizedCdnEntity
} from "./types"
import {
    Locale
} from "@modules/databases"
/**
 * Service for materializing and uploading entities to the CDN.
 */
@Injectable()
export class MaterializeAndUploadService {
    constructor(
        private readonly s3UploadService: S3UploadService,
    ) {}

    /**
     * Process the entities and upload them to the CDN.
     * @param localizedRows - The localized entities to process.
     * @param resolveObjectKey - A function to resolve the object key for the entity.
     */
    async process<
        T extends EntityLike,
    >(
        localizedRows: Array<LocalizedCdnEntity<T>>,
        resolveObjectKey: (
            id: string,
            locale: Locale,
        ) => string,
    ): Promise<void> {
        const providers: Array<S3Provider> = [
            //S3Provider.DigitalOcean,
            S3Provider.Minio,
        ]
        // Sequential on purpose: firing every upload at once trips transient S3 `InvalidArgument`
        // errors under the parallel burst. Process one localized row at a time so each upload's
        // result is observed before moving on.
        for (const localized of localizedRows) {
            const {
                entity,
                locale,
            } = localized
            const keyByEntityId = resolveObjectKey(
                entity.id,
                locale,
            )
            // Always upload (no snapshot read / skip-on-match). Body is the entity
            // serialized once by S3UploadService (SuperJSON) — written as text, no envelope.
            // upload the id-keyed object, then the displayId-keyed alias — one at a time
            await this.s3UploadService.json(
                {
                    acl: "private",
                    providers,
                    name: keyByEntityId,
                    payload: entity,
                },
            )
            await this.s3UploadService.json(
                {
                    acl: "private",
                    providers,
                    name: resolveObjectKey(
                        entity.displayId,
                        locale,
                    ),
                    payload: entity,
                },
            )
        }
    }
}